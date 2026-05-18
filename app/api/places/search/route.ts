import { NextResponse } from "next/server";
import { normalizeSearchQuery, type GooglePlaceSuggestion } from "@/lib/map/googlePlaces";
import {
  extractCityFromFormattedAddress,
  extractProvinceFromFormattedAddress,
  splitAddressParts,
  stripPostalCodes
} from "@/lib/map/addressParsing";

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
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY no configurada." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { query?: string; center?: { lat?: number; lng?: number } | null }
    | null;
  const query = String(payload?.query || "").trim();
  if (query.length < 3) {
    return NextResponse.json({ results: [] satisfies GooglePlaceSuggestion[] });
  }

  const normalizedQuery = normalizeSearchQuery(query);
  const params = new URLSearchParams({
    query: normalizedQuery,
    language: "es",
    region: "es",
    key: apiKey
  });

  const centerLat = payload?.center?.lat;
  const centerLng = payload?.center?.lng;
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
