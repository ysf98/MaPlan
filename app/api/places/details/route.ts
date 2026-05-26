import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { GooglePlaceFeature } from "@/lib/map/googlePlaces";
import { pickCityFromComponents, pickStreetFromComponents, splitAddressParts } from "@/lib/map/addressParsing";
import { googlePlaceDetailsSchema } from "@/lib/validation/schemas";

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
  photos?: Array<{ photo_reference?: string }>;
};

type GooglePlaceDetailsResponse = {
  result?: GooglePlaceDetailsResult;
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
  const parsedPayload = googlePlaceDetailsSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const { externalPlaceId } = parsedPayload.data;
  const params = new URLSearchParams({
    place_id: externalPlaceId,
    language: "es",
    fields: "place_id,name,formatted_address,address_components,geometry,business_status,photos",
    key: apiKey
  });
  const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json({ place: null satisfies GooglePlaceFeature | null });
  }

  const json = (await response.json()) as GooglePlaceDetailsResponse;
  const result = json.result;
  if (!result) {
    return NextResponse.json({ place: null satisfies GooglePlaceFeature | null });
  }

  const latitude = result.geometry?.location?.lat;
  const longitude = result.geometry?.location?.lng;
  const placeId = (result.place_id || externalPlaceId).trim();
  if (typeof latitude !== "number" || typeof longitude !== "number" || !placeId) {
    return NextResponse.json({ place: null satisfies GooglePlaceFeature | null });
  }

  const fullAddress = (result.formatted_address || "").trim();
  const parts = splitAddressParts(fullAddress);
  const cityFromComponents = pickCityFromComponents(result.address_components);
  const streetFromComponents = pickStreetFromComponents(result.address_components, parts.street || fullAddress);

  const place: GooglePlaceFeature = {
    externalPlaceId: placeId,
    provider: "google_places",
    name: (result.name || "").trim() || "Resultado",
    address: streetFromComponents || "Sin direccion",
    city: cityFromComponents || parts.city || "",
    latitude,
    longitude,
    googleMapsUrl: buildGoogleMapsUrl(placeId),
    businessStatus: (result.business_status || "").trim() || null,
    imageUrl: result.photos?.[0]?.photo_reference
      ? `/api/places/photo?photoReference=${encodeURIComponent(result.photos[0].photo_reference)}&maxWidth=800`
      : null
  };

  return NextResponse.json({ place });
}
