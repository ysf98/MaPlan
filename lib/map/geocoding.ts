type ReverseGeocodeItem = {
  name?: string;
  name_preferred?: string;
  feature_type?: string;
  place_formatted?: string;
  full_address?: string;
  context?: string;
  address?: string;
  locality?: string;
  place?: string;
  region?: string;
};

type GeocodingFeature = {
  id?: string;
  geometry?: { coordinates?: [number, number] };
  properties?: ReverseGeocodeItem;
};

type GeocodingPayload = {
  features?: GeocodingFeature[];
};

type GeocodingV5Feature = {
  id?: string;
  text?: string;
  place_name?: string;
  center?: [number, number];
};

type GeocodingV5Payload = {
  features?: GeocodingV5Feature[];
};

type SearchBoxFeature = {
  id?: string;
  geometry?: { coordinates?: [number, number] };
  properties?: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    context?: string;
    feature_type?: string;
    coordinates?: { longitude?: number; latitude?: number };
  };
};

type SearchBoxPayload = {
  features?: SearchBoxFeature[];
};

export type GeocodeSearchResult = {
  id: string;
  name: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  city: string;
};

export type MapDraftPlace = {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
};

export type ForwardGeocodeOptions = {
  center?: { lng: number; lat: number } | null;
  signal?: AbortSignal;
};

export function normalizeMapSearchQuery(query: string): string {
  const trimmed = query.trim();
  const normalized = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const genericAliases: Record<string, string> = {
    bar: "bares",
    bares: "bares",
    restaurante: "restaurantes",
    restaurantes: "restaurantes",
    cafe: "cafeterias",
    cafeteria: "cafeterias",
    cafeterias: "cafeterias",
    pub: "pubs",
    discoteca: "discotecas"
  };

  const mapped = genericAliases[normalized];
  if (!mapped) {
    return trimmed;
  }

  const displayMap: Record<string, string> = {
    bares: "bares",
    restaurantes: "restaurantes",
    cafeterias: "cafeterías",
    pubs: "pubs",
    discotecas: "discotecas"
  };

  return displayMap[mapped] || trimmed;
}

function isPoiLikeQuery(query: string): boolean {
  const normalized = query
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const poiTerms = ["bar", "bares", "restaurante", "restaurantes", "cafe", "cafeteria", "cafeterias", "pub", "discoteca", "discotecas"];
  return poiTerms.some((term) => normalized === term || normalized.startsWith(`${term} `) || normalized.includes(` ${term} `));
}

export function pickFirstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const cleaned = value?.trim();
    if (cleaned) {
      return cleaned;
    }
  }
  return "";
}

export function splitAddressParts(rawValue: string | undefined): { street: string; city: string } {
  const raw = (rawValue || "").trim();
  if (!raw) {
    return { street: "", city: "" };
  }

  const parts = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { street: "", city: "" };
  }

  if (parts.length === 1) {
    return { street: parts[0], city: "" };
  }

  return { street: parts[0], city: parts[1] };
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusKm * c;
}

function rerankByCenterProximity(
  results: GeocodeSearchResult[],
  center: { lng: number; lat: number } | null | undefined,
  preferNearby: boolean
): GeocodeSearchResult[] {
  if (!center || results.length <= 1) {
    return results;
  }

  const withDistance = results.map((result) => ({
    result,
    distance: distanceKm(center.lat, center.lng, result.latitude, result.longitude)
  }));

  // For POI-like searches, we strongly prefer nearby matches.
  // If we still have nearby candidates, discard very far results.
  let candidates = withDistance;
  if (preferNearby) {
    const nearby = withDistance.filter((item) => item.distance <= 80);
    if (nearby.length > 0) {
      candidates = nearby;
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates.map((item) => item.result).slice(0, 8);
}

function extractCityFromFeature(properties: ReverseGeocodeItem | undefined): string {
  const cityFromStructured = pickFirstNonEmpty(
    properties?.locality,
    properties?.place,
    properties?.name_preferred,
    properties?.name
  );
  if (cityFromStructured) {
    return cityFromStructured;
  }
  const cityFromFormatted = splitAddressParts(
    pickFirstNonEmpty(properties?.full_address, properties?.place_formatted, properties?.context)
  ).city;
  return cityFromFormatted;
}

function byType(features: GeocodingFeature[], types: string[]): ReverseGeocodeItem | undefined {
  return features.find((item) => item.properties?.feature_type && types.includes(item.properties.feature_type))?.properties;
}

export function parseReverseGeocodePayload(payload: GeocodingPayload): Pick<MapDraftPlace, "name" | "address" | "city"> {
  const features = payload.features ?? [];
  const poi = byType(features, ["poi"]);
  const streetFeature = byType(features, ["address", "street", "block"]) ?? features[0]?.properties;
  const localityFeature = byType(features, ["locality", "place", "district", "region"]) ?? streetFeature;

  const name = pickFirstNonEmpty(poi?.name, poi?.name_preferred, "Sitio en mapa");
  const streetFromStructured = pickFirstNonEmpty(
    streetFeature?.address,
    streetFeature?.name_preferred,
    streetFeature?.name
  );
  const streetFromFormatted = splitAddressParts(
    pickFirstNonEmpty(streetFeature?.full_address, streetFeature?.place_formatted)
  ).street;
  const address = pickFirstNonEmpty(streetFromStructured, streetFromFormatted, "Punto en mapa");

  const cityFromStructured = pickFirstNonEmpty(
    localityFeature?.locality,
    localityFeature?.place,
    localityFeature?.name_preferred,
    localityFeature?.name
  );
  const cityFromFormatted = splitAddressParts(
    pickFirstNonEmpty(localityFeature?.place_formatted, localityFeature?.full_address, localityFeature?.context)
  ).city;
  const city = pickFirstNonEmpty(cityFromStructured, cityFromFormatted);

  return { name, address, city };
}

export function extractFallbackNameFromRenderedFeatures(
  features: Array<{ properties?: Record<string, unknown> }>
): string | undefined {
  return features
    .map((feature) => ((feature.properties?.name as string | undefined) || "").trim())
    .find(Boolean);
}

export function buildDraftFromRenderedFeature(
  feature: { properties?: Record<string, unknown> } | undefined,
  latitude: number,
  longitude: number
): MapDraftPlace {
  const featureName = ((feature?.properties?.name as string | undefined) || "").trim();
  const areaLabel = (
    ((feature?.properties?.place_formatted as string | undefined) || "").trim() ||
    ((feature?.properties?.full_address as string | undefined) || "").trim() ||
    ((feature?.properties?.context as string | undefined) || "").trim()
  );
  const parsedArea = splitAddressParts(areaLabel);
  const fallbackAddress =
    ((feature?.properties?.address as string | undefined) || "").trim() ||
    ((feature?.properties?.name_preferred as string | undefined) || "").trim() ||
    "Punto en mapa";
  const fallbackCity =
    ((feature?.properties?.place as string | undefined) || "").trim() ||
    parsedArea.city ||
    "";

  return {
    latitude,
    longitude,
    name: featureName || "Sitio en mapa",
    address: parsedArea.street || fallbackAddress,
    city: fallbackCity
  };
}

export async function reverseGeocodePlace(token: string, latitude: number, longitude: number): Promise<Pick<MapDraftPlace, "name" | "address" | "city">> {
  const params = new URLSearchParams({
    longitude: String(longitude),
    latitude: String(latitude),
    access_token: token
  });

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params.toString()}`);
  if (!response.ok) {
    throw new Error("No se pudo obtener informacion del lugar.");
  }

  const payload = (await response.json()) as GeocodingPayload;
  return parseReverseGeocodePayload(payload);
}

export async function resolvePlaceFromMapClick(
  token: string,
  latitude: number,
  longitude: number,
  fallbackName?: string
): Promise<Pick<MapDraftPlace, "name" | "address" | "city">> {
  const resolved = await reverseGeocodePlace(token, latitude, longitude);
  const safeFallbackName = (fallbackName || "").trim();
  if (resolved.name === "Sitio en mapa" && safeFallbackName) {
    return { ...resolved, name: safeFallbackName };
  }
  return resolved;
}

export async function forwardGeocode(
  token: string,
  query: string,
  options: ForwardGeocodeOptions = {}
): Promise<GeocodeSearchResult[]> {
  const normalizedQuery = normalizeMapSearchQuery(query);
  const preferPoiSearch = isPoiLikeQuery(query) || isPoiLikeQuery(normalizedQuery);
  const buildParams = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams({
      q: normalizedQuery,
      access_token: token,
      limit: "8",
      language: "es",
      autocomplete: "true"
    });
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (options.center && !("proximity" in overrides && overrides.proximity === null)) {
      params.set("proximity", `${options.center.lng},${options.center.lat}`);
    }
    return params;
  };

  const mapFeatures = (payload: GeocodingPayload): GeocodeSearchResult[] =>
    payload.features
      ?.map((feature) => {
        const coordinates = feature.geometry?.coordinates;
        if (!coordinates || coordinates.length < 2) return null;
        const longitude = coordinates[0];
        const latitude = coordinates[1];
        const name = (feature.properties?.name || "").trim();
        const fullAddress = (feature.properties?.full_address || feature.properties?.place_formatted || "").trim();
        const city = extractCityFromFeature(feature.properties);
        return {
          id: feature.id || `${longitude}-${latitude}`,
          name: name || "Resultado",
          fullAddress: fullAddress || "Sin direccion",
          latitude,
          longitude,
          city
        };
      })
      .filter((value): value is GeocodeSearchResult => Boolean(value)) || [];

  const runSearchBoxSuggestRetrieve = async (): Promise<GeocodeSearchResult[]> => {
    const sessionToken = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const params = new URLSearchParams({
      q: normalizedQuery,
      access_token: token,
      limit: "8",
      language: "es",
      country: "ES",
      session_token: sessionToken,
      types: "poi,address,place,locality,street"
    });
    if (options.center) {
      params.set("proximity", `${options.center.lng},${options.center.lat}`);
    }

    const suggestResponse = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${params.toString()}`, {
      signal: options.signal
    });
    if (!suggestResponse.ok) {
      return [];
    }

    const suggestPayload = (await suggestResponse.json()) as SearchBoxPayload;
    const suggestions = suggestPayload.features || [];
    if (suggestions.length === 0) {
      return [];
    }

    const retrieveCandidates = suggestions.slice(0, 5);
    const retrievedResults: GeocodeSearchResult[] = [];

    for (const candidate of retrieveCandidates) {
      const mapboxId = (candidate.properties?.mapbox_id || candidate.id || "").trim();
      if (!mapboxId) {
        continue;
      }

      const retrieveParams = new URLSearchParams({
        access_token: token,
        session_token: sessionToken,
        language: "es"
      });
      const retrieveResponse = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?${retrieveParams.toString()}`,
        { signal: options.signal }
      );
      if (!retrieveResponse.ok) {
        continue;
      }
      const retrievePayload = (await retrieveResponse.json()) as SearchBoxPayload;
      const features = retrievePayload.features || [];

      for (const feature of features) {
        const geometryCoordinates = feature.geometry?.coordinates;
        const coords = feature.properties?.coordinates;
        const longitude = geometryCoordinates?.[0] ?? coords?.longitude;
        const latitude = geometryCoordinates?.[1] ?? coords?.latitude;
        if (typeof longitude !== "number" || typeof latitude !== "number") {
          continue;
        }
        const fullAddress = (
          feature.properties?.full_address ||
          feature.properties?.place_formatted ||
          feature.properties?.context ||
          ""
        ).trim();
        retrievedResults.push({
          id: feature.id || mapboxId || `${longitude}-${latitude}`,
          name: (feature.properties?.name || "").trim() || "Resultado",
          fullAddress: fullAddress || "Sin direccion",
          latitude,
          longitude,
          city: splitAddressParts(fullAddress).city
        });
      }
    }

    const deduped = new Map<string, GeocodeSearchResult>();
    for (const result of retrievedResults) {
      if (!deduped.has(result.id)) {
        deduped.set(result.id, result);
      }
    }
    return rerankByCenterProximity(Array.from(deduped.values()), options.center, true);
  };

  const runV5PoiSearch = async (): Promise<GeocodeSearchResult[]> => {
    const encodedQuery = encodeURIComponent(normalizedQuery);
    const v5Params = new URLSearchParams({
      access_token: token,
      limit: "8",
      language: "es",
      autocomplete: "true",
      country: "ES",
      types: "poi,address,place,locality"
    });
    if (options.center) {
      v5Params.set("proximity", `${options.center.lng},${options.center.lat}`);
    }

    const v5Response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?${v5Params.toString()}`,
      { signal: options.signal }
    );
    if (!v5Response.ok) {
      return [];
    }
    const v5Payload = (await v5Response.json()) as GeocodingV5Payload;
    return (
      v5Payload.features
        ?.map((feature) => {
          const center = feature.center;
          if (!center || center.length < 2) return null;
          const longitude = center[0];
          const latitude = center[1];
          const fullAddress = (feature.place_name || "").trim();
          const city = splitAddressParts(fullAddress).city;
          return {
            id: feature.id || `${longitude}-${latitude}`,
            name: (feature.text || "").trim() || "Resultado",
            fullAddress: fullAddress || "Sin direccion",
            latitude,
            longitude,
            city
          };
        })
        .filter((value): value is GeocodeSearchResult => Boolean(value)) || []
    );
  };

  if (preferPoiSearch) {
    const searchBoxResults = await runSearchBoxSuggestRetrieve();
    if (searchBoxResults.length > 0) {
      return searchBoxResults;
    }

    const poiFirstResults = await runV5PoiSearch();
    if (poiFirstResults.length > 0) {
      return poiFirstResults;
    }
  }

  const attempts: Array<Record<string, string | null>> = [
    { country: "ES", types: "poi,address,place,locality" },
    { country: "ES", types: null },
    { country: null, types: null, proximity: null }
  ];

  for (const attempt of attempts) {
    const params = buildParams(attempt);
    const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`, {
      signal: options.signal
    });
    if (!response.ok) {
      continue;
    }
    const payload = (await response.json()) as GeocodingPayload;
    const results = rerankByCenterProximity(mapFeatures(payload), options.center, preferPoiSearch);
    if (results.length > 0) {
      return results;
    }
  }

  const v5FallbackResults = await runV5PoiSearch();
  if (v5FallbackResults.length > 0) {
    return rerankByCenterProximity(v5FallbackResults, options.center, preferPoiSearch);
  }

  const searchBoxFallbackResults = await runSearchBoxSuggestRetrieve();
  if (searchBoxFallbackResults.length > 0) {
    return searchBoxFallbackResults;
  }

  return [];
}
