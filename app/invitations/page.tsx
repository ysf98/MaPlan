import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { InvitationsPageClient } from "@/components/invitations/InvitationsPageClient";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupInvitationsForUser } from "@/lib/groupInvitations";

export default async function InvitationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/invitations");
  }

  const invitations = (await getGroupInvitationsForUser(user.id)).filter((invitation) => invitation.status === "pending");

  return (
    <AppShell>
      <InvitationsPageClient invitations={invitations} />
    </AppShell>
  );
}

