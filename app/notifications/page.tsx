import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsPageClient } from "@/components/notifications/NotificationsPageClient";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { markGroupActivitySeenForUser } from "@/lib/groupActivity";
import { getPendingNotificationsForUser } from "@/lib/notifications";
import { ROUTES } from "@/utils/constants";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/notifications");
  }

  const pending = await getPendingNotificationsForUser(user.id);
  const latestGroupActivityAt =
    pending.groupActivities[0]?.kind === "group_activity" ? pending.groupActivities[0].createdAt : null;
  await markGroupActivitySeenForUser(user.id, latestGroupActivityAt);

  return (
    <AppShell backHref={ROUTES.dashboard} currentUser={user}>
      <NotificationsPageClient
        friendRequests={pending.friendRequests}
        groupActivities={pending.groupActivities}
        pendingInvitations={pending.pendingInvitations}
        reviewedInvitations={pending.reviewedInvitations}
        unreadChats={pending.unreadChats}
        total={pending.total}
      />
    </AppShell>
  );
}
