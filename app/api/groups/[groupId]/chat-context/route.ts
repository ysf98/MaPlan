import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupPlansForUser } from "@/lib/groupPlans";
import { getGroupPlacesForUser } from "@/lib/places";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/security/rateLimit";

type ChatContextRouteProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function GET(_request: Request, { params }: ChatContextRouteProps) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { groupId } = await params;
  const rateLimit = checkRateLimit({ key: `groups:chat-context:${user.id}:${groupId}`, limit: 30, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
  }

  const [plans, places] = await Promise.all([getGroupPlansForUser(user.id, groupId), getGroupPlacesForUser(user.id, groupId)]);

  return NextResponse.json({
    places: places.map((place) => ({
      id: place.id,
      kind: "place",
      subtitle: place.address,
      title: place.name
    })),
    plans: plans.map((plan) => ({
      id: plan.id,
      kind: "plan",
      subtitle: plan.plannedDate,
      title: plan.title
    }))
  });
}
