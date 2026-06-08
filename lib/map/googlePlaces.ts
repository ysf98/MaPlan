export type GooglePlacesProvider = "google_places";

export type GooglePlaceSuggestion = {
  externalPlaceId: string;
  provider: GooglePlacesProvider;
  name: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string | null;
  businessStatus: string | null;
  imageUrl: string | null;
  phoneNumber: string | null;
  primaryType: string | null;
};

export type GooglePlaceFeature = {
  externalPlaceId: string;
  provider: GooglePlacesProvider;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string | null;
  businessStatus: string | null;
  imageUrl: string | null;
  phoneNumber: string | null;
  primaryType: string | null;
};

export type GoogleNearbyFallbackReason = "no_candidate" | "too_far" | "google_error";

export type GoogleNearbyPlaceResponse = {
  place: GooglePlaceFeature | null;
  fallbackReason?: GoogleNearbyFallbackReason;
};

export type GoogleNearbyRecommendationCategory = "popular" | "food" | "coffee" | "plans";

export type GoogleNearbyRecommendation = GooglePlaceFeature & {
  category: string | null;
};

export function normalizeSearchQuery(query: string): string {
  const trimmed = query.trim();
  const normalized = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const aliases: Record<string, string> = {
    bar: "bares",
    bares: "bares",
    restaurante: "restaurantes",
    restaurantes: "restaurantes",
    cafe: "cafeterías",
    "café": "cafeterías",
    cafeteria: "cafeterías",
    "cafetería": "cafeterías",
    tienda: "tiendas",
    tiendas: "tiendas",
    comercio: "comercios",
    comercios: "comercios",
    discoteca: "discotecas",
    discotecas: "discotecas"
  };

  return aliases[normalized] ?? trimmed;
}

export async function searchGooglePlaces(params: {
  query: string;
  center?: { lng: number; lat: number } | null;
  signal?: AbortSignal;
}): Promise<GooglePlaceSuggestion[]> {
  const response = await fetch("/api/places/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: params.query,
      center: params.center ?? null
    }),
    signal: params.signal
  });

  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as { results?: GooglePlaceSuggestion[] };
  return payload.results || [];
}

export async function getGooglePlaceDetails(params: {
  externalPlaceId: string;
  signal?: AbortSignal;
}): Promise<GooglePlaceFeature | null> {
  const response = await fetch("/api/places/details", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      externalPlaceId: params.externalPlaceId
    }),
    signal: params.signal
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { place?: GooglePlaceFeature | null };
  return payload.place ?? null;
}

export async function getGooglePlaceNearby(params: {
  lat: number;
  lng: number;
  selectedName?: string | null;
  signal?: AbortSignal;
}): Promise<GoogleNearbyPlaceResponse> {
  const response = await fetch("/api/places/nearby", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: params.lat,
      lng: params.lng,
      selectedName: params.selectedName ?? null
    }),
    signal: params.signal
  });

  if (!response.ok) {
    return {
      place: null,
      fallbackReason: "google_error"
    };
  }

  const payload = (await response.json()) as GoogleNearbyPlaceResponse;
  return {
    place: payload.place ?? null,
    fallbackReason: payload.fallbackReason
  };
}

export async function getGooglePlaceRecommendations(params: {
  lat: number;
  lng: number;
  category: GoogleNearbyRecommendationCategory;
  radius?: number;
  signal?: AbortSignal;
}): Promise<GoogleNearbyRecommendation[]> {
  const query = new URLSearchParams({
    purpose: "recommendations",
    lat: String(params.lat),
    lng: String(params.lng),
    category: params.category,
    radius: String(params.radius ?? 1800)
  });

  const response = await fetch(`/api/places/nearby?${query.toString()}`, {
    method: "GET",
    signal: params.signal
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { results?: GoogleNearbyRecommendation[] };
  return payload.results || [];
}
