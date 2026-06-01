import { splitAddressParts } from "@/lib/map/addressParsing";
export { splitAddressParts } from "@/lib/map/addressParsing";

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
  properties?: ReverseGeocodeItem;
};

type GeocodingPayload = {
  features?: GeocodingFeature[];
};

export type MapDraftPlace = {
  name: string;
  address: string;
  city: string;
  category: string;
  latitude: number;
  longitude: number;
  provider?: "manual" | "mapbox" | "google_places" | null;
  externalPlaceId?: string | null;
  googleMapsUrl?: string | null;
  businessStatus?: string | null;
  imageUrl?: string | null;
  phoneNumber?: string | null;
};

export function pickFirstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const cleaned = value?.trim();
    if (cleaned) {
      return cleaned;
    }
  }
  return "";
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
  const streetFromStructured = pickFirstNonEmpty(streetFeature?.address, streetFeature?.name_preferred, streetFeature?.name);
  const streetFromFormatted = splitAddressParts(pickFirstNonEmpty(streetFeature?.full_address, streetFeature?.place_formatted)).street;
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
  const fallbackCity = ((feature?.properties?.place as string | undefined) || "").trim() || parsedArea.city || "";

  return {
    latitude,
    longitude,
    name: featureName || "Sitio en mapa",
    address: parsedArea.street || fallbackAddress,
    city: fallbackCity,
    category: "Otros"
  };
}

export async function reverseGeocodePlace(
  token: string,
  latitude: number,
  longitude: number
): Promise<Pick<MapDraftPlace, "name" | "address" | "city">> {
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
