import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { GooglePlaceFeature } from "@/lib/map/googlePlaces";
import { selectNearbyPlaceCandidate, type NearbyFallbackReason, type NearbySelectionInput } from "@/lib/map/googlePlacesNearby";
import { pickCityFromComponents, pickStreetFromComponents, splitAddressParts } from "@/lib/map/addressParsing";
import { buildGoogleMapsUrl } from "@/lib/map/googleMapsUrl";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/security/rateLimit";
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
  rating?: number;
  types?: string[];
  user_ratings_total?: number;
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
  rating?: number;
  user_ratings_total?: number;
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
  rating?: number;
  user_ratings_total?: number;
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
  rating: number | null;
  userRatingsTotal: number | null;
};

function buildPhotoProxyUrl(photoReference: string): string {
  return `/api/places/photo?photoReference=${encodeURIComponent(photoReference)}&maxWidth=800`;
}

type RecommendationCategoryConfig = {
  allowedTypes?: string[];
  categories: string[];
  excludedTypes?: string[];
  keyword?: string;
  queries?: Array<{ keyword?: string; type?: string }>;
  minRating?: number;
  minRatingsTotal?: number;
  type?: string;
};

const uninterestingPopularTypes = [
  "atm",
  "bank",
  "car_dealer",
  "car_repair",
  "finance",
  "gas_station",
  "insurance_agency",
  "lodging",
  "parking",
  "pharmacy",
  "post_office",
  "real_estate_agency",
  "storage"
];

const recommendationCategoryConfig: Record<GooglePlacesNearbyRecommendationsInput["category"], RecommendationCategoryConfig> = {
  popular: {
    categories: ["Recomendado"],
    excludedTypes: uninterestingPopularTypes,
    keyword: "restaurantes cafeterias bares museos parques ocio popular",
    minRating: 3.8,
    minRatingsTotal: 5
  },
  food: { keyword: "restaurantes bares cafeterias comida", type: "restaurant", categories: ["Comida"] },
  coffee: {
    categories: ["Cafeteria"],
    queries: [
      { type: "cafe" },
      { keyword: "cafeteria" },
      { keyword: "cafe" },
      { keyword: "coffee" },
      { keyword: "brunch" },
      { keyword: "panaderia pasteleria" },
      { keyword: "heladeria" }
    ]
  },
  plans: { keyword: "planes parques museos turismo ocio", type: "tourist_attraction", categories: ["Planes"] },
  sports: {
    categories: ["Deporte"],
    keyword: "gimnasio fitness deporte futbol padel tenis piscina polideportivo estadio yoga crossfit"
  }
};

function hasAnyType(result: GoogleNearbyResult, types: string[] | undefined) {
  if (!types || types.length === 0) {
    return true;
  }

  return (result.types || []).some((type) => types.includes(type));
}

function hasNoExcludedType(result: GoogleNearbyResult, types: string[] | undefined) {
  if (!types || types.length === 0) {
    return true;
  }

  return !(result.types || []).some((type) => types.includes(type));
}

function isStrongRecommendationCandidate(result: GoogleNearbyResult, config: RecommendationCategoryConfig) {
  if (!hasAnyType(result, config.allowedTypes) || !hasNoExcludedType(result, config.excludedTypes)) {
    return false;
  }

  const rating = typeof result.rating === "number" ? result.rating : 0;
  const ratingsTotal = typeof result.user_ratings_total === "number" ? result.user_ratings_total : 0;

  if (config.minRating && rating < config.minRating) {
    return false;
  }

  if (config.minRatingsTotal && ratingsTotal < config.minRatingsTotal) {
    return false;
  }

  return true;
}

function getRecommendationScore(result: GoogleNearbyResult) {
  const rating = typeof result.rating === "number" ? result.rating : 0;
  const ratingsTotal = typeof result.user_ratings_total === "number" ? result.user_ratings_total : 0;
  const reviewWeight = Math.min(Math.log10(Math.max(ratingsTotal, 1)) / 3, 1);

  return rating * 20 + reviewWeight * 30;
}

function getSortedRecommendationCandidates(results: GoogleNearbyResult[], config: RecommendationCategoryConfig) {
  const relevantResults = results.filter((result) => hasAnyType(result, config.allowedTypes) && hasNoExcludedType(result, config.excludedTypes));
  const strongResults = relevantResults.filter((result) => isStrongRecommendationCandidate(result, config));
  const candidateResults = strongResults.length > 0 ? strongResults : relevantResults;

  return candidateResults.sort((left, right) => getRecommendationScore(right) - getRecommendationScore(left));
}

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
    rating: typeof result.rating === "number" ? result.rating : null,
    userRatingsTotal: typeof result.user_ratings_total === "number" ? result.user_ratings_total : null,
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
    photoReference: result.photos?.[0]?.photo_reference || null,
    rating: typeof result.rating === "number" ? result.rating : null,
    userRatingsTotal: typeof result.user_ratings_total === "number" ? result.user_ratings_total : null
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
    rating: typeof details.rating === "number" ? details.rating : null,
    userRatingsTotal: typeof details.user_ratings_total === "number" ? details.user_ratings_total : null,
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
    rating: typeof result.rating === "number" ? result.rating : null,
    userRatingsTotal: typeof result.user_ratings_total === "number" ? result.user_ratings_total : null,
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
    rating: record.rating,
    userRatingsTotal: record.userRatingsTotal,
    imageUrl: (selected.photoReference || record.photoReference) ? buildPhotoProxyUrl(selected.photoReference || record.photoReference || "") : null
  };
}

async function fetchGoogleDetails(placeId: string, apiKey: string): Promise<GooglePlaceDetailsResponse | null> {
  const detailsParams = new URLSearchParams({
    place_id: placeId,
    language: "es",
    fields: "place_id,name,formatted_address,address_components,geometry,business_status,formatted_phone_number,international_phone_number,types,photos,rating,user_ratings_total",
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

  const rateLimit = checkRateLimit({ key: `places:nearby:${user.id}`, limit: 40, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
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

  const rateLimit = checkRateLimit({ key: `places:nearby:${user.id}`, limit: 40, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
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
  const buildNearbyParams = (query: { keyword?: string; type?: string } | null) => {
    const params = new URLSearchParams({
      location: `${input.lat},${input.lng}`,
      radius: String(input.radius),
      language: "es",
      region: "es",
      key: apiKey
    });

    if (query?.keyword) {
      params.set("keyword", query.keyword);
    }

    if (query?.type) {
      params.set("type", query.type);
    }

    return params;
  };

  const fetchNearby = async (params: URLSearchParams) => {
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`, {
      method: "GET",
      cache: "no-store"
    }).catch(() => null);

    if (!response || !response.ok) {
      return null;
    }

    return (await response.json()) as GoogleNearbyResponse;
  };

  const queries = config.queries ?? [{ keyword: config.keyword, type: config.type }];
  const nearbyResults: GoogleNearbyResult[] = [];

  for (const query of queries) {
    const nearbyJson = await fetchNearby(buildNearbyParams(query));
    if (nearbyJson?.status && nearbyJson.status !== "OK" && nearbyJson.status !== "ZERO_RESULTS") {
      continue;
    }
    nearbyResults.push(...(nearbyJson?.results || []));
  }

  if (nearbyResults.length === 0 && input.category === "popular") {
    const fallbackJson = await fetchNearby(buildNearbyParams(null));
    nearbyResults.push(...(fallbackJson?.results || []));
  }

  const seenPlaceIds = new Set<string>();
  const categoryLabel = config.categories[0] || "Recomendado";
  const results = getSortedRecommendationCandidates(nearbyResults, config)
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
