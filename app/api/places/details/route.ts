import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { GooglePlaceFeature } from "@/lib/map/googlePlaces";
import { pickCityFromComponents, pickStreetFromComponents, splitAddressParts } from "@/lib/map/addressParsing";
import { buildGoogleMapsUrl } from "@/lib/map/googleMapsUrl";
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
    fields: "place_id,name,formatted_address,address_components,geometry,business_status,formatted_phone_number,international_phone_number,types,photos,rating,user_ratings_total",
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
  const name = (result.name || "").trim() || "Resultado";
  const address = streetFromComponents || "Sin direccion";
  const city = cityFromComponents || parts.city || "";

  const place: GooglePlaceFeature = {
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
    phoneNumber: (result.international_phone_number || result.formatted_phone_number || "").trim() || null,
    primaryType: result.types?.[0] || null,
    rating: typeof result.rating === "number" ? result.rating : null,
    userRatingsTotal: typeof result.user_ratings_total === "number" ? result.user_ratings_total : null,
    imageUrl: result.photos?.[0]?.photo_reference
      ? `/api/places/photo?photoReference=${encodeURIComponent(result.photos[0].photo_reference)}&maxWidth=800`
      : null
  };

  return NextResponse.json({ place });
}
