import { notFound, redirect } from "next/navigation";
import { GroupDecisionsView } from "@/components/groups/GroupDecisionsView";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupPollsForUser } from "@/lib/groupPolls";
import { getGroupDetailForUser } from "@/lib/groups";
import { getGroupPlacesForUser } from "@/lib/places";

type GroupDecisionsPageProps = {
  params: Promise<{ groupId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GroupDecisionsPage({ params, searchParams }: GroupDecisionsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/groups");
  }

  const [{ groupId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const group = await getGroupDetailForUser(user.id, groupId);
  if (!group) {
    notFound();
  }

  const [polls, places] = await Promise.all([
    getGroupPollsForUser(user.id, groupId),
    getGroupPlacesForUser(user.id, groupId)
  ]);
  const rawCreate = resolvedSearchParams?.create;
  const initialCreateOpen = (Array.isArray(rawCreate) ? rawCreate[0] : rawCreate) === "1";

  return (
    <AppShell backHref={`/groups/${groupId}`} currentUser={user}>
      <GroupDecisionsView
        canCreate={group.canEditPlaces}
        currentUserId={user.id}
        groupId={groupId}
        groupName={group.name}
        initialCreateOpen={initialCreateOpen}
        places={places.map((place) => ({ address: place.address, id: place.id, imageUrl: place.imageUrl ?? null, name: place.name }))}
        polls={polls}
      />
    </AppShell>
  );
}
