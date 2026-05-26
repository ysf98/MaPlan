import { notFound, redirect } from "next/navigation";
import { GroupDetailView } from "@/components/groups/GroupDetailView";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupActivityFeedForUser } from "@/lib/groupActivity";
import { getFriends } from "@/lib/friends";
import { getInvitableFriendsForGroup } from "@/lib/groupInvitations";
import { getGroupDetailForUser, getGroupMembersPreviewForUser } from "@/lib/groups";
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

  const group = await getGroupDetailForUser(user.id, groupId);
  const places = await getGroupPlacesForUser(user.id, groupId);
  const membersPreviewResult = await getGroupMembersPreviewForUser(user.id, groupId);

  if (!group) {
    notFound();
  }

  const invitableFriends = group.canInviteMembers ? await getInvitableFriendsForGroup(user.id, groupId) : [];
  const totalFriendsCount = group.canInviteMembers ? (await getFriends(user.id)).length : 0;

  const activityEvents = (await getGroupActivityFeedForUser(user.id, 50)).filter((event) => event.groupId === groupId);

  return (
    <AppShell backHref={ROUTES.groups} currentUser={user}>
      <GroupDetailView
        activeTab={activeTab}
        activityEvents={activityEvents}
        group={group}
        groupId={groupId}
        invitableFriends={invitableFriends}
        membersPreview={membersPreviewResult.members}
        places={places}
        totalFriendsCount={totalFriendsCount}
        totalMembersCount={membersPreviewResult.total}
      />
    </AppShell>
  );
}

