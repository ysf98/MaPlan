import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { searchUsers } from "@/lib/friends";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/security/rateLimit";
import { friendSearchQuerySchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const rateLimit = checkRateLimit({ key: `friends:search:${user.id}`, limit: 60, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
  }

  const url = new URL(request.url);
  const parsedQuery = friendSearchQuerySchema.safeParse({
    q: url.searchParams.get("q") || ""
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const results = await searchUsers(parsedQuery.data.q, user.id);
  return NextResponse.json({ results });
}
