import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { normalizeSearchQuery, type GooglePlaceSuggestion } from "@/lib/map/googlePlaces";
import {
  extractCityFromFormattedAddress,
  extractProvinceFromFormattedAddress,
  splitAddressParts,
  stripPostalCodes
} from "@/lib/map/addressParsing";
import { googlePlacesSearchSchema } from "@/lib/validation/schemas";

type GoogleTextSearchPlace = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  business_status?: string;
  types?: string[];
};

type GoogleTextSearchResponse = {
  results?: GoogleTextSearchPlace[];
  status?: string;
};

function buildGoogleMapsUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
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
  const parsedPayload = googlePlacesSearchSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const { query, center } = parsedPayload.data;
  const normalizedQuery = normalizeSearchQuery(query);
  const params = new URLSearchParams({
    query: normalizedQuery,
    language: "es",
    region: "es",
    key: apiKey
  });

  const centerLat = center?.lat;
  const centerLng = center?.lng;
  if (typeof centerLat === "number" && typeof centerLng === "number") {
    params.set("location", `${centerLat},${centerLng}`);
    params.set("radius", "25000");
  }

  const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json({ results: [] satisfies GooglePlaceSuggestion[] });
  }

  const json = (await response.json()) as GoogleTextSearchResponse;
  const places = json.results || [];

  const results: GooglePlaceSuggestion[] = places
    .map((place) => {
      const externalPlaceId = (place.place_id || "").trim();
      const lat = place.geometry?.location?.lat;
      const lng = place.geometry?.location?.lng;
      if (!externalPlaceId || typeof lat !== "number" || typeof lng !== "number") {
        return null;
      }
      const fullAddress = (place.formatted_address || "").trim();
      const parts = splitAddressParts(fullAddress);
      const parsedCity = extractCityFromFormattedAddress(fullAddress);
      const parsedProvince = extractProvinceFromFormattedAddress(fullAddress);
      const cleanAddress = stripPostalCodes(parts.street || fullAddress || "Sin direccion");
      return {
        externalPlaceId,
        provider: "google_places",
        name: (place.name || "").trim() || "Resultado",
        address: cleanAddress,
        city: stripPostalCodes(parsedCity || parts.city || ""),
        province: parsedProvince,
        latitude: lat,
        longitude: lng,
        googleMapsUrl: buildGoogleMapsUrl(externalPlaceId),
        businessStatus: (place.business_status || "").trim() || null,
        primaryType: place.types?.[0] || null
      } satisfies GooglePlaceSuggestion;
    })
    .filter((value): value is GooglePlaceSuggestion => Boolean(value))
    .slice(0, 8);

  return NextResponse.json({ results });
}
