import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsPageClient } from "@/components/notifications/NotificationsPageClient";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPendingNotificationsForUser } from "@/lib/notifications";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/notifications");
  }

  const pending = await getPendingNotificationsForUser(user.id);

  return (
    <AppShell>
      <NotificationsPageClient friendRequests={pending.friendRequests} invitations={pending.invitations} total={pending.total} />
    </AppShell>
  );
}
