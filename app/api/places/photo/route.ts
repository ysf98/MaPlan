import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/security/rateLimit";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const rateLimit = checkRateLimit({ key: `places:photo:${user.id}`, limit: 120, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY no configurada." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const photoReference = (searchParams.get("photoReference") || "").trim();
  const maxWidthRaw = Number(searchParams.get("maxWidth") || "800");
  const maxWidth = Number.isFinite(maxWidthRaw) ? Math.min(Math.max(Math.round(maxWidthRaw), 100), 1600) : 800;

  if (!photoReference) {
    return NextResponse.json({ error: "photoReference obligatorio." }, { status: 400 });
  }

  const params = new URLSearchParams({
    maxwidth: String(maxWidth),
    photo_reference: photoReference,
    key: apiKey
  });

  const googleResponse = await fetch(`https://maps.googleapis.com/maps/api/place/photo?${params.toString()}`, {
    method: "GET",
    redirect: "follow",
    cache: "no-store"
  });

  if (!googleResponse.ok) {
    return NextResponse.json({ error: "No se pudo obtener la imagen del lugar." }, { status: googleResponse.status });
  }

  const contentType = googleResponse.headers.get("content-type") || "image/jpeg";
  const bytes = await googleResponse.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=86400"
    }
  });
}
