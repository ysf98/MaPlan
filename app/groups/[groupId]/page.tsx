import { notFound, redirect } from "next/navigation";
import { GroupDetailView } from "@/components/groups/GroupDetailView";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupActivityFeedForUser } from "@/lib/groupActivity";
import { getFriends } from "@/lib/friends";
import { getInvitableFriendsForGroup } from "@/lib/groupInvitations";
import {
  getGroupDetailForUser,
  getGroupMembersPreviewForUser,
  getPendingJoinRequestsForOwner,
  getReviewedJoinRequestsForOwner
} from "@/lib/groups";
import { getGroupDetailTab } from "@/lib/groups/tabs";
import { getGroupPlacesForUser } from "@/lib/places";
import { ROUTES } from "@/utils/constants";

type GroupDetailPageProps = {
  params: Promise<{
    groupId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GroupDetailPage({ params, searchParams }: GroupDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const [{ groupId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const activeTab = getGroupDetailTab(resolvedSearchParams?.tab);
  const rawPlaceId = resolvedSearchParams?.placeId;
  const initialSelectedPlaceId = Array.isArray(rawPlaceId) ? rawPlaceId[0] ?? null : rawPlaceId ?? null;

  const group = await getGroupDetailForUser(user.id, groupId);

  if (!group) {
    notFound();
  }

  const [places, membersPreviewResult, invitableFriends, friends, activityFeed, pendingJoinRequests, reviewedJoinRequests] =
    await Promise.all([
      getGroupPlacesForUser(user.id, groupId),
      getGroupMembersPreviewForUser(user.id, groupId),
      group.canInviteMembers ? getInvitableFriendsForGroup(user.id, groupId) : Promise.resolve([]),
      group.canInviteMembers ? getFriends(user.id) : Promise.resolve([]),
      getGroupActivityFeedForUser(user.id, 50, { includeGroupName: false }),
      group.role === "owner" ? getPendingJoinRequestsForOwner(user.id, groupId) : Promise.resolve([]),
      group.role === "owner" ? getReviewedJoinRequestsForOwner(user.id, groupId) : Promise.resolve([])
    ]);

  const activityEvents = activityFeed.filter((event) => event.groupId === groupId);

  return (
    <AppShell backHref={ROUTES.groups} currentUser={user}>
      <GroupDetailView
        activeTab={activeTab}
        activityEvents={activityEvents}
        group={group}
        groupId={groupId}
        initialSelectedPlaceId={initialSelectedPlaceId}
        invitableFriends={invitableFriends}
        membersPreview={membersPreviewResult.members}
        pendingJoinRequests={pendingJoinRequests}
        places={places}
        reviewedJoinRequests={reviewedJoinRequests}
        totalFriendsCount={friends.length}
        totalMembersCount={membersPreviewResult.total}
      />
    </AppShell>
  );
}
