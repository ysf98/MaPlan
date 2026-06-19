import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPendingNotificationsCountForUser } from "@/lib/notifications";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/security/rateLimit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const rateLimit = checkRateLimit({
    key: `notifications:count:${user.id}`,
    limit: 120,
    windowMs: 60_000
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
  }

  const count = await getPendingNotificationsCountForUser(user.id);
  return NextResponse.json({ count });
}
