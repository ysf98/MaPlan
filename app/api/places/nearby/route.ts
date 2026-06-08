import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { GooglePlaceFeature } from "@/lib/map/googlePlaces";
import { selectNearbyPlaceCandidate, type NearbyFallbackReason, type NearbySelectionInput } from "@/lib/map/googlePlacesNearby";
import { pickCityFromComponents, pickStreetFromComponents, splitAddressParts } from "@/lib/map/addressParsing";
import { buildGoogleMapsUrl } from "@/lib/map/googleMapsUrl";
import {
  googlePlacesNearbyRecommendationsSchema,
  googlePlacesNearbySchema,
  type GooglePlacesNearbyRecommendationsInput
} from "@/lib/validation/schemas";

type GoogleNearbyResult = {
  place_id?: string;
  name?: string;
  vicinity?: string;
  formatted_address?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  business_status?: string;
  photos?: Array<{ photo_reference?: string }>;
  types?: string[];
};

type GoogleNearbyResponse = {
  results?: GoogleNearbyResult[];
  status?: string;
};

type GoogleTextSearchResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  business_status?: string;
  photos?: Array<{ photo_reference?: string }>;
  types?: string[];
};

type GoogleTextSearchResponse = {
  results?: GoogleTextSearchResult[];
  status?: string;
};

type GooglePlaceDetailsResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  address_components?: Array<{
    long_name?: string;
    short_name?: string;
    types?: string[];
  }>;
  geometry?: { location?: { lat?: number; lng?: number } };
  business_status?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  types?: string[];
  photos?: Array<{ photo_reference?: string }>;
};

type GooglePlaceDetailsResponse = {
  result?: GooglePlaceDetailsResult;
  status?: string;
};

type NearbyPlaceResponse = {
  place: GooglePlaceFeature | null;
  fallbackReason?: NearbyFallbackReason;
};

type NearbyRecommendationsResponse = {
  results: Array<GooglePlaceFeature & { category: string | null }>;
};

type CandidateSourceRecord = {
  placeId: string;
  name: string;
  address: string;
  businessStatus: string | null;
  photoReference: string | null;
};

function buildPhotoProxyUrl(photoReference: string): string {
  return `/api/places/photo?photoReference=${encodeURIComponent(photoReference)}&maxWidth=800`;
}

const recommendationCategoryConfig: Record<
  GooglePlacesNearbyRecommendationsInput["category"],
  { keyword?: string; type?: string; categories: string[] }
> = {
  popular: { categories: ["Sitios cercanos"] },
  food: { keyword: "restaurantes bares cafeterias comida", type: "restaurant", categories: ["Comida"] },
  coffee: { keyword: "cafeterias cafe brunch", type: "cafe", categories: ["Cafeteria"] },
  plans: { keyword: "planes parques museos turismo ocio", type: "tourist_attraction", categories: ["Planes"] }
};

function normalizeNearbyCandidate(result: GoogleNearbyResult): NearbySelectionInput | null {
  const placeId = (result.place_id || "").trim();
  const name = (result.name || "").trim();
  const latitude = result.geometry?.location?.lat;
  const longitude = result.geometry?.location?.lng;

  if (!placeId || !name || typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return {
    placeId,
    name,
    latitude,
    longitude,
    types: result.types || [],
    photoReference: result.photos?.[0]?.photo_reference || null
  };
}

function normalizeRecommendationFromNearby(
  result: GoogleNearbyResult,
  categoryLabel: string
): (GooglePlaceFeature & { category: string | null }) | null {
  const placeId = (result.place_id || "").trim();
  const name = (result.name || "").trim();
  const latitude = result.geometry?.location?.lat;
  const longitude = result.geometry?.location?.lng;

  if (!placeId || !name || typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  const rawAddress = (result.formatted_address || result.vicinity || "").trim();
  const parts = splitAddressParts(rawAddress);
  const address = parts.street || rawAddress || "Sin direccion";
  const city = parts.city || "";
  const primaryType = result.types?.[0] || null;
  const photoReference = result.photos?.[0]?.photo_reference || null;

  return {
    externalPlaceId: placeId,
    provider: "google_places",
    name,
    address,
    city,
    latitude,
    longitude,
    googleMapsUrl: buildGoogleMapsUrl({
      placeId,
      name,
      address,
      city,
      latitude,
      longitude
    }),
    businessStatus: (result.business_status || "").trim() || null,
    phoneNumber: null,
    primaryType,
    imageUrl: photoReference ? buildPhotoProxyUrl(photoReference) : null,
    category: categoryLabel
  };
}

function normalizeTextSearchCandidate(result: GoogleTextSearchResult): NearbySelectionInput | null {
  const placeId = (result.place_id || "").trim();
  const name = (result.name || "").trim();
  const latitude = result.geometry?.location?.lat;
  const longitude = result.geometry?.location?.lng;

  if (!placeId || !name || typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return {
    placeId,
    name,
    latitude,
    longitude,
    types: result.types || [],
    photoReference: result.photos?.[0]?.photo_reference || null
  };
}

function normalizeRecordFromNearby(result: GoogleNearbyResult): CandidateSourceRecord | null {
  const placeId = (result.place_id || "").trim();
  const name = (result.name || "").trim();
  if (!placeId || !name) {
    return null;
  }
  return {
    placeId,
    name,
    address: (result.formatted_address || result.vicinity || "").trim(),
    businessStatus: (result.business_status || "").trim() || null,
    photoReference: result.photos?.[0]?.photo_reference || null
  };
}

function normalizeRecordFromTextSearch(result: GoogleTextSearchResult): CandidateSourceRecord | null {
  const placeId = (result.place_id || "").trim();
  const name = (result.name || "").trim();
  if (!placeId || !name) {
    return null;
  }
  return {
    placeId,
    name,
    address: (result.formatted_address || "").trim(),
    businessStatus: (result.business_status || "").trim() || null,
    photoReference: result.photos?.[0]?.photo_reference || null
  };
}

function normalizePlaceFromDetails(
  details: GooglePlaceDetailsResult,
  selected: NearbySelectionInput
): GooglePlaceFeature | null {
  const latitude = details.geometry?.location?.lat ?? selected.latitude;
  const longitude = details.geometry?.location?.lng ?? selected.longitude;
  const placeId = (details.place_id || selected.placeId).trim();
  if (typeof latitude !== "number" || typeof longitude !== "number" || !placeId) {
    return null;
  }

  const fullAddress = (details.formatted_address || "").trim();
  const parts = splitAddressParts(fullAddress);
  const cityFromComponents = pickCityFromComponents(details.address_components);
  const streetFromComponents = pickStreetFromComponents(details.address_components, parts.street || fullAddress);
  const photoReference = details.photos?.[0]?.photo_reference || selected.photoReference;
  const name = (details.name || "").trim() || "Resultado";
  const address = streetFromComponents || "Sin direccion";
  const city = cityFromComponents || parts.city || "";

  return {
    externalPlaceId: placeId,
    provider: "google_places",
    name,
    address,
    city,
    latitude,
    longitude,
    googleMapsUrl: buildGoogleMapsUrl({
      placeId,
      name,
      address,
      city,
      latitude,
      longitude
    }),
    businessStatus: (details.business_status || "").trim() || null,
    phoneNumber: (details.international_phone_number || details.formatted_phone_number || "").trim() || null,
    primaryType: details.types?.[0] || selected.types[0] || null,
    imageUrl: photoReference ? buildPhotoProxyUrl(photoReference) : null
  };
}

function normalizePlaceFromNearby(result: GoogleNearbyResult, selected: NearbySelectionInput): GooglePlaceFeature {
  const rawAddress = (result.formatted_address || result.vicinity || "").trim();
  const parts = splitAddressParts(rawAddress);
  const name = (result.name || "").trim() || "Resultado";
  const address = parts.street || rawAddress || "Sin direccion";
  const city = parts.city || "";
  return {
    externalPlaceId: selected.placeId,
    provider: "google_places",
    name,
    address,
    city,
    latitude: selected.latitude,
    longitude: selected.longitude,
    googleMapsUrl: buildGoogleMapsUrl({
      placeId: selected.placeId,
      name,
      address,
      city,
      latitude: selected.latitude,
      longitude: selected.longitude
    }),
    businessStatus: (result.business_status || "").trim() || null,
    phoneNumber: null,
    primaryType: selected.types[0] || null,
    imageUrl: selected.photoReference ? buildPhotoProxyUrl(selected.photoReference) : null
  };
}

function normalizePlaceFromRecord(record: CandidateSourceRecord, selected: NearbySelectionInput): GooglePlaceFeature {
  const rawAddress = record.address;
  const parts = splitAddressParts(rawAddress);
  const name = record.name || "Resultado";
  const address = parts.street || rawAddress || "Sin direccion";
  const city = parts.city || "";
  return {
    externalPlaceId: selected.placeId,
    provider: "google_places",
    name,
    address,
    city,
    latitude: selected.latitude,
    longitude: selected.longitude,
    googleMapsUrl: buildGoogleMapsUrl({
      placeId: selected.placeId,
      name,
      address,
      city,
      latitude: selected.latitude,
      longitude: selected.longitude
    }),
    businessStatus: record.businessStatus,
    phoneNumber: null,
    primaryType: selected.types[0] || null,
    imageUrl: (selected.photoReference || record.photoReference) ? buildPhotoProxyUrl(selected.photoReference || record.photoReference || "") : null
  };
}

async function fetchGoogleDetails(placeId: string, apiKey: string): Promise<GooglePlaceDetailsResponse | null> {
  const detailsParams = new URLSearchParams({
    place_id: placeId,
    language: "es",
    fields: "place_id,name,formatted_address,address_components,geometry,business_status,formatted_phone_number,international_phone_number,types,photos",
    key: apiKey
  });

  const detailsResponse = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${detailsParams.toString()}`, {
    method: "GET",
    cache: "no-store"
  }).catch(() => null);

  if (!detailsResponse || !detailsResponse.ok) {
    return null;
  }

  const detailsJson = (await detailsResponse.json()) as GooglePlaceDetailsResponse;
  if (detailsJson.status && detailsJson.status !== "OK") {
    return null;
  }
  return detailsJson;
}

function maybeOverrideWithSelectedName(place: GooglePlaceFeature, selectedName: string | null): GooglePlaceFeature {
  const safeName = (selectedName || "").trim();
  if (!safeName) {
    return place;
  }
  return {
    ...place,
    name: safeName
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY no configurada." }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);
  const parsedPayload = googlePlacesNearbySchema.safeParse(payload);
  if (!parsedPayload.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  return resolveNearbyFromCoordinates(parsedPayload.data.lat, parsedPayload.data.lng, parsedPayload.data.selectedName, apiKey);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY no configurada." }, { status: 500 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("purpose") === "recommendations") {
    const parsedRecommendationsPayload = googlePlacesNearbyRecommendationsSchema.safeParse({
      lat: url.searchParams.get("lat"),
      lng: url.searchParams.get("lng"),
      category: url.searchParams.get("category"),
      radius: url.searchParams.get("radius")
    });

    if (!parsedRecommendationsPayload.success) {
      return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
    }

    return resolveNearbyRecommendations(parsedRecommendationsPayload.data, apiKey);
  }

  const parsedPayload = googlePlacesNearbySchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
    selectedName: url.searchParams.get("selectedName")
  });
  if (!parsedPayload.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  return resolveNearbyFromCoordinates(parsedPayload.data.lat, parsedPayload.data.lng, parsedPayload.data.selectedName, apiKey);
}

async function resolveNearbyRecommendations(input: GooglePlacesNearbyRecommendationsInput, apiKey: string) {
  const config = recommendationCategoryConfig[input.category];
  const nearbyParams = new URLSearchParams({
    location: `${input.lat},${input.lng}`,
    radius: String(input.radius),
    language: "es",
    region: "es",
    key: apiKey
  });

  if (config.keyword) {
    nearbyParams.set("keyword", config.keyword);
  }

  if (config.type) {
    nearbyParams.set("type", config.type);
  }

  const nearbyResponse = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${nearbyParams.toString()}`, {
    method: "GET",
    cache: "no-store"
  }).catch(() => null);

  if (!nearbyResponse || !nearbyResponse.ok) {
    return NextResponse.json({ results: [] } satisfies NearbyRecommendationsResponse);
  }

  const nearbyJson = (await nearbyResponse.json()) as GoogleNearbyResponse;
  if (nearbyJson.status && nearbyJson.status !== "OK" && nearbyJson.status !== "ZERO_RESULTS") {
    return NextResponse.json({ results: [] } satisfies NearbyRecommendationsResponse);
  }

  const seenPlaceIds = new Set<string>();
  const categoryLabel = config.categories[0] || "Recomendado";
  const results = (nearbyJson.results || [])
    .map((result) => normalizeRecommendationFromNearby(result, categoryLabel))
    .filter((result): result is GooglePlaceFeature & { category: string | null } => {
      if (!result || seenPlaceIds.has(result.externalPlaceId)) {
        return false;
      }
      seenPlaceIds.add(result.externalPlaceId);
      return true;
    })
    .slice(0, 20);

  return NextResponse.json({ results } satisfies NearbyRecommendationsResponse);
}

async function resolveNearbyFromCoordinates(lat: number, lng: number, selectedName: string | null, apiKey: string) {
  const cleanSelectedName = (selectedName || "").trim();

  if (cleanSelectedName) {
    const textParams = new URLSearchParams({
      query: cleanSelectedName,
      location: `${lat},${lng}`,
      radius: "180",
      language: "es",
      region: "es",
      key: apiKey
    });

    const textResponse = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${textParams.toString()}`, {
      method: "GET",
      cache: "no-store"
    }).catch(() => null);

    if (textResponse?.ok) {
      const textJson = (await textResponse.json()) as GoogleTextSearchResponse;
      if (!textJson.status || textJson.status === "OK" || textJson.status === "ZERO_RESULTS") {
        const textCandidates = (textJson.results || [])
          .map((result) => normalizeTextSearchCandidate(result))
          .filter((result): result is NearbySelectionInput => Boolean(result));

        const selectedByName = selectNearbyPlaceCandidate({
          click: { lat, lng },
          candidates: textCandidates,
          selectedName: cleanSelectedName,
          maxDistanceMeters: 120,
          minNameSimilarityScore: 0.45
        });

        if (selectedByName.candidate) {
          const selectedCandidate = selectedByName.candidate;
          const textRecords = (textJson.results || [])
            .map((result) => normalizeRecordFromTextSearch(result))
            .filter((result): result is CandidateSourceRecord => Boolean(result));
          const selectedRecord = textRecords.find((result) => result.placeId === selectedCandidate.placeId) ?? null;

          const detailsJson = await fetchGoogleDetails(selectedCandidate.placeId, apiKey);
          if (detailsJson?.result) {
            const normalized = normalizePlaceFromDetails(detailsJson.result, selectedCandidate);
            if (normalized) {
              return NextResponse.json({
                place: maybeOverrideWithSelectedName(normalized, cleanSelectedName)
              } satisfies NearbyPlaceResponse);
            }
          }

          if (selectedRecord) {
            return NextResponse.json({
              place: maybeOverrideWithSelectedName(normalizePlaceFromRecord(selectedRecord, selectedCandidate), cleanSelectedName)
            } satisfies NearbyPlaceResponse);
          }
        }
      }
    }
  }

  const nearbyParams = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: "120",
    language: "es",
    region: "es",
    key: apiKey
  });

  const nearbyResponse = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${nearbyParams.toString()}`, {
    method: "GET",
    cache: "no-store"
  }).catch(() => null);

  if (!nearbyResponse || !nearbyResponse.ok) {
    return NextResponse.json({
      place: null,
      fallbackReason: "google_error"
    } satisfies NearbyPlaceResponse);
  }

  const nearbyJson = (await nearbyResponse.json()) as GoogleNearbyResponse;
  if (nearbyJson.status && nearbyJson.status !== "OK" && nearbyJson.status !== "ZERO_RESULTS") {
    return NextResponse.json({
      place: null,
      fallbackReason: "google_error"
    } satisfies NearbyPlaceResponse);
  }

  const nearbyCandidates = (nearbyJson.results || [])
    .map((result) => normalizeNearbyCandidate(result))
    .filter((result): result is NearbySelectionInput => Boolean(result));

  const selectedNearby = selectNearbyPlaceCandidate({
    click: { lat, lng },
    candidates: nearbyCandidates,
    selectedName: cleanSelectedName || null,
    maxDistanceMeters: 75,
    minNameSimilarityScore: cleanSelectedName ? 0.2 : 0
  });

  if (!selectedNearby.candidate) {
    return NextResponse.json({
      place: null,
      fallbackReason: selectedNearby.reason
    } satisfies NearbyPlaceResponse);
  }

  const selectedCandidate = selectedNearby.candidate;
  const selectedNearbyResult = (nearbyJson.results || []).find((result) => (result.place_id || "").trim() === selectedCandidate.placeId);
  if (!selectedNearbyResult) {
    return NextResponse.json({
      place: null,
      fallbackReason: "no_candidate"
    } satisfies NearbyPlaceResponse);
  }

  const detailsJson = await fetchGoogleDetails(selectedCandidate.placeId, apiKey);
  if (detailsJson?.result) {
    const normalized = normalizePlaceFromDetails(detailsJson.result, selectedCandidate);
    if (normalized) {
      return NextResponse.json({
        place: normalized
      } satisfies NearbyPlaceResponse);
    }
  }

  return NextResponse.json({
    place: normalizePlaceFromNearby(selectedNearbyResult, selectedCandidate)
  } satisfies NearbyPlaceResponse);
}
