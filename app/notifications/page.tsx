import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsPageClient } from "@/components/notifications/NotificationsPageClient";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPendingNotificationsForUser } from "@/lib/notifications";
import { ROUTES } from "@/utils/constants";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/notifications");
  }

  const pending = await getPendingNotificationsForUser(user.id);

  return (
    <AppShell backHref={ROUTES.dashboard} currentUser={user}>
      <NotificationsPageClient
        friendRequests={pending.friendRequests}
        pendingInvitations={pending.pendingInvitations}
        reviewedInvitations={pending.reviewedInvitations}
        total={pending.total}
      />
    </AppShell>
  );
}
