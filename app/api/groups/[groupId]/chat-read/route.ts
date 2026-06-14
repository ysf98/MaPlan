import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { markGroupChatAsReadForUser } from "@/lib/groupChat";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/security/rateLimit";

type ChatReadRouteProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function POST(request: Request, { params }: ChatReadRouteProps) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { groupId } = await params;
  const rateLimit = checkRateLimit({ key: `groups:chat-read:${user.id}:${groupId}`, limit: 60, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
  }

  const payload = (await request.json().catch(() => null)) as { lastReadAt?: unknown } | null;
  const lastReadAt = typeof payload?.lastReadAt === "string" ? payload.lastReadAt : null;
  const result = await markGroupChatAsReadForUser({
    groupId,
    lastReadAt,
    userId: user.id
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
