import { notFound, redirect } from "next/navigation";
import { GroupChatView } from "@/components/groups/GroupChatView";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupChatMessagesForUser, markGroupChatAsReadForUser } from "@/lib/groupChat";
import { getGroupDetailForUser } from "@/lib/groups";
import { getGroupPlansForUser } from "@/lib/groupPlans";
import { getGroupPlacesForUser } from "@/lib/places";

type GroupChatPageProps = {
  params: Promise<{
    groupId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GroupChatPage({ params, searchParams }: GroupChatPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const [{ groupId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const rawPlanId = resolvedSearchParams?.planId;
  const rawPlaceId = resolvedSearchParams?.placeId;
  const initialSelectedPlanId = Array.isArray(rawPlanId) ? rawPlanId[0] ?? null : rawPlanId ?? null;
  const initialSelectedPlaceId = Array.isArray(rawPlaceId) ? rawPlaceId[0] ?? null : rawPlaceId ?? null;
  const [group, messages, plans, places] = await Promise.all([
    getGroupDetailForUser(user.id, groupId),
    getGroupChatMessagesForUser(user.id, groupId),
    getGroupPlansForUser(user.id, groupId),
    getGroupPlacesForUser(user.id, groupId)
  ]);

  if (!group) {
    notFound();
  }

  await markGroupChatAsReadForUser({
    groupId,
    lastReadAt: messages.at(-1)?.createdAt ?? null,
    userId: user.id
  });

  return (
    <AppShell currentUser={user} fullBleed>
      <GroupChatView
        currentUserId={user.id}
        groupId={groupId}
        groupName={group.name}
        initialSelectedPlaceId={initialSelectedPlaceId}
        initialSelectedPlanId={initialSelectedPlanId}
        messages={messages}
        places={places}
        plans={plans}
      />
    </AppShell>
  );
}
