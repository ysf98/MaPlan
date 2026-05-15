import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupDetailForUser, getGroupMembersPreviewForUser, getPendingJoinRequestsForOwner } from "@/lib/groups";
import { getGroupInvitationsForGroup, getInvitableFriendsForGroup } from "@/lib/groupInvitations";
import { getFriends } from "@/lib/friends";
import { getGroupPlacesForUser } from "@/lib/places";
import { GroupDetailView } from "@/components/groups/GroupDetailView";
import { notFound, redirect } from "next/navigation";

type GroupDetailPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const { groupId } = await params;
  const group = await getGroupDetailForUser(user.id, groupId);
  const places = await getGroupPlacesForUser(user.id, groupId);
  const membersPreviewResult = await getGroupMembersPreviewForUser(user.id, groupId);

  if (!group) {
    notFound();
  }

  const pendingRequests = group.role === "owner" ? await getPendingJoinRequestsForOwner(user.id, groupId) : [];
  const invitableFriends = group.role === "owner" ? await getInvitableFriendsForGroup(user.id, groupId) : [];
  const groupInvitations = group.role === "owner" ? await getGroupInvitationsForGroup(user.id, groupId) : [];
  const totalFriendsCount = group.role === "owner" ? (await getFriends(user.id)).length : 0;

  return (
    <AppShell>
      <GroupDetailView
        group={group}
        groupId={groupId}
        pendingRequests={pendingRequests}
        places={places}
        membersPreview={membersPreviewResult.members}
        totalMembersCount={membersPreviewResult.total}
        invitableFriends={invitableFriends}
        groupInvitations={groupInvitations}
        totalFriendsCount={totalFriendsCount}
      />
    </AppShell>
  );
}
