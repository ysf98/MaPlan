export type GoogleMapsUrlInput = {
  placeId?: string | null;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function cleanPart(value: string | null | undefined): string | null {
  const cleaned = value?.trim();
  return cleaned || null;
}

function buildQuery(input: GoogleMapsUrlInput): string | null {
  const textQuery = [input.name, input.address, input.city].map(cleanPart).filter((value): value is string => Boolean(value)).join(", ");
  if (textQuery) {
    return textQuery;
  }

  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    return `${input.latitude},${input.longitude}`;
  }

  return null;
}

export function buildGoogleMapsUrl(input: GoogleMapsUrlInput): string | null {
  const query = buildQuery(input);
  if (!query) {
    return null;
  }

  const params = new URLSearchParams({
    api: "1",
    query
  });

  const placeId = cleanPart(input.placeId);
  if (placeId) {
    params.set("query_place_id", placeId);
  }

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function normalizeGoogleMapsUrl(existingUrl: string | null | undefined, input: GoogleMapsUrlInput): string | null {
  const rebuiltUrl = buildGoogleMapsUrl(input);
  const cleanedUrl = cleanPart(existingUrl);
  if (!cleanedUrl) {
    return rebuiltUrl;
  }

  try {
    const parsedUrl = new URL(cleanedUrl);
    const legacyQuery = parsedUrl.searchParams.get("q")?.trim() || "";
    if (parsedUrl.hostname.includes("google.") && legacyQuery.toLowerCase().startsWith("place_id:")) {
      return rebuiltUrl ?? cleanedUrl;
    }
  } catch {
    return rebuiltUrl ?? cleanedUrl;
  }

  return cleanedUrl;
}
