import { AppShell } from "@/components/layout/AppShell";
import { redirect } from "next/navigation";
import { GroupsPageClient } from "@/components/groups/GroupsPageClient";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserGroups } from "@/lib/groups";

export default async function GroupsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const groups = await getUserGroups(user.id);

  return (
    <AppShell>
      <section className="space-y-4">
        <GroupsPageClient groups={groups} />
      </section>
    </AppShell>
  );
}
