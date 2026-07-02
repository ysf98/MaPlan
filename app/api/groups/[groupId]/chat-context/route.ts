import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupPlansForUser } from "@/lib/groupPlans";
import { getGroupPollsForUser } from "@/lib/groupPolls";
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

  const [plans, places, polls] = await Promise.all([
    getGroupPlansForUser(user.id, groupId),
    getGroupPlacesForUser(user.id, groupId),
    getGroupPollsForUser(user.id, groupId)
  ]);

  return NextResponse.json({
    places: places.map((place) => ({
      id: place.id,
      imageUrl: place.imageUrl ?? null,
      kind: "place",
      rating: place.rating,
      subtitle: place.address,
      title: place.name,
      userRatingsTotal: place.userRatingsTotal
    })),
    plans: plans.map((plan) => ({
      id: plan.id,
      kind: "plan",
      places: plan.places.slice(0, 4).map((place) => ({
        address: place.address,
        city: place.city,
        imageUrl: place.imageUrl,
        name: place.name
      })),
      plannedDate: plan.plannedDate,
      placeCount: plan.places.length,
      subtitle: plan.plannedDate,
      title: plan.title
    })),
    polls: polls.map((poll) => ({
      id: poll.id,
      kind: "poll",
      poll,
      subtitle: poll.status === "open" ? "Abierta" : "Cerrada",
      title: poll.title
    }))
  });
}
