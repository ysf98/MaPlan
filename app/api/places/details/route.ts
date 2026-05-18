import { NextResponse } from "next/server";
import type { GooglePlaceFeature } from "@/lib/map/googlePlaces";

type GooglePlaceDetailsResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  business_status?: string;
};

type GooglePlaceDetailsResponse = {
  result?: GooglePlaceDetailsResult;
  status?: string;
};

function splitAddressParts(rawValue: string | undefined): { street: string; city: string } {
  const raw = (rawValue || "").trim();
  if (!raw) return { street: "", city: "" };
  const parts = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) return { street: "", city: "" };
  if (parts.length === 1) return { street: parts[0], city: "" };
  return { street: parts[0], city: parts[1] };
}

function buildGoogleMapsUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY no configurada." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as { externalPlaceId?: string } | null;
  const externalPlaceId = String(payload?.externalPlaceId || "").trim();
  if (!externalPlaceId) {
    return NextResponse.json({ place: null satisfies GooglePlaceFeature | null });
  }

  const params = new URLSearchParams({
    place_id: externalPlaceId,
    language: "es",
    fields: "place_id,name,formatted_address,geometry,business_status",
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

  const place: GooglePlaceFeature = {
    externalPlaceId: placeId,
    provider: "google_places",
    name: (result.name || "").trim() || "Resultado",
    address: parts.street || fullAddress || "Sin dirección",
    city: parts.city || "",
    latitude,
    longitude,
    googleMapsUrl: buildGoogleMapsUrl(placeId),
    businessStatus: (result.business_status || "").trim() || null
  };

  return NextResponse.json({ place });
}
