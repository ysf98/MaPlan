import { notFound, redirect } from "next/navigation";
import { GroupPlanDetailView } from "@/components/groups/GroupPlanDetailView";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupPlansForUser } from "@/lib/groupPlans";
import { getGroupDetailForUser } from "@/lib/groups";

type GroupPlanDetailPageProps = {
  params: Promise<{
    groupId: string;
    planId: string;
  }>;
};

export default async function GroupPlanDetailPage({ params }: GroupPlanDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const { groupId, planId } = await params;
  const [group, plans] = await Promise.all([getGroupDetailForUser(user.id, groupId), getGroupPlansForUser(user.id, groupId)]);

  if (!group) {
    notFound();
  }

  const plan = plans.find((candidate) => candidate.id === planId);
  if (!plan) {
    notFound();
  }

  return (
    <AppShell currentUser={user} fullBleed>
      <GroupPlanDetailView
        groupId={groupId}
        groupName={group.name}
        mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        plan={plan}
      />
    </AppShell>
  );
}
