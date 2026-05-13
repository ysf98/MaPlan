import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupDetailForUser } from "@/lib/groups";
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

  if (!group) {
    notFound();
  }

  return (
    <AppShell>
      <GroupDetailView group={group} groupId={groupId} places={places} />
    </AppShell>
  );
}
