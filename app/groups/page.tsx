import { AppShell } from "@/components/layout/AppShell";
import { redirect } from "next/navigation";
import { GroupsPageClient } from "@/components/groups/GroupsPageClient";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getDashboardGroupSummaries } from "@/lib/dashboard";
import { getUserGroups } from "@/lib/groups";

export default async function GroupsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const groups = await getUserGroups(user.id);
  const groupSummaries = await getDashboardGroupSummaries(user.id, groups, groups.length);

  return (
    <AppShell currentUser={user}>
      <section className="space-y-4">
        <GroupsPageClient groups={groupSummaries} />
      </section>
    </AppShell>
  );
}
