import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GroupPreviewCard } from "@/components/dashboard/GroupPreviewCard";
import { BottomDockNav } from "@/components/navigation/BottomDockNav";
import { PendingInvitationCard } from "@/components/dashboard/PendingInvitationCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getDashboardGroupSummaries, getDashboardPlaceStats } from "@/lib/dashboard";
import { getGroupActivityFeedForUser, summarizeGroupsWithRecentActivity } from "@/lib/groupActivity";
import { getUserGroups } from "@/lib/groups";
import { getPendingNotificationsForUser } from "@/lib/notifications";
import { resolveDisplayName } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/utils/constants";

type DashboardProfileRow = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${ROUTES.login}?next=${ROUTES.dashboard}`);
  }

  const supabase = await createSupabaseServerClient();
  const profileResult = await supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user.id).maybeSingle();
  const profile = profileResult.data as DashboardProfileRow | null;

  const [groups, allRecentActivity, notifications] = await Promise.all([
    getUserGroups(user.id),
    getGroupActivityFeedForUser(user.id, 6, { includeGroupName: true, maxAgeDays: 31 }),
    getPendingNotificationsForUser(user.id)
  ]);

  const activityFeed = allRecentActivity;
  const groupsWithActivity = summarizeGroupsWithRecentActivity(allRecentActivity, 4);
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const groupsOrderedByActivity = groupsWithActivity
    .map((item) => groupById.get(item.groupId))
    .filter((group): group is NonNullable<typeof group> => Boolean(group));
  const remainingGroups = groups.filter((group) => !groupsOrderedByActivity.some((activeGroup) => activeGroup.id === group.id));
  const visibleGroups = [...groupsOrderedByActivity, ...remainingGroups];
  const [groupSummaries, placeStats] = await Promise.all([
    getDashboardGroupSummaries(user.id, visibleGroups, 4),
    getDashboardPlaceStats(groups.map((group) => group.id))
  ]);

  const displayName = resolveDisplayName({
    email: user.email,
    metadataUsername: user.user_metadata?.username,
    profileFullName: profile?.full_name,
    profileUsername: profile?.username
  });
  const pendingInvitation = notifications.pendingInvitations[0]?.kind === "group_invitation" ? notifications.pendingInvitations[0] : null;
  const shortName = displayName.split(" ")[0] || displayName;

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <DashboardHeader
        avatarUrl={profile?.avatar_url || null}
        displayName={displayName}
        hasNotifications={notifications.total > 0}
      />

      <main className="mx-auto w-full max-w-3xl px-5 pb-32 pt-6">
        <section className="space-y-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#c6283a]">Bienvenido de nuevo</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl">Hola, {shortName}!</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-zinc-600">
              Tienes {notifications.pendingInvitations.length} invitaciones pendientes y {placeStats.pendingPlaceCount} lugares pendientes por visitar.
            </p>
          </div>

          {pendingInvitation ? (
            <PendingInvitationCard
              invitation={{
                id: pendingInvitation.invitationId,
                groupId: pendingInvitation.groupId,
                groupName: pendingInvitation.groupName,
                invitedBy: "",
                invitedByUsername: pendingInvitation.invitedByUsername,
                invitedUserId: user.id,
                status: pendingInvitation.status,
                createdAt: pendingInvitation.createdAt,
                updatedAt: pendingInvitation.createdAt
              }}
            />
          ) : (
            <section className="rounded-[28px] border border-zinc-100 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(24,24,27,0.08)]">
              <p className="text-sm font-semibold text-zinc-800">Todo al dia</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                No tienes invitaciones pendientes ahora mismo. Puedes seguir explorando sitios para tus planes.
              </p>
            </section>
          )}

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950">Tus Grupos</h2>
              <Link className="text-xs font-semibold text-[#c6283a] transition hover:text-[#a91f31]" href={ROUTES.groups}>
                Ver todos
              </Link>
            </div>

            {groupSummaries.length > 0 ? (
              <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                {groupSummaries.map((group) => (
                  <div className="snap-start" key={group.id}>
                    <GroupPreviewCard group={group} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-rose-200 bg-white/70 px-5 py-6">
                <p className="text-sm font-semibold text-zinc-800">Todavia no tienes grupos</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">Crea tu primer grupo para empezar a guardar sitios con amigos.</p>
                <Link
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[#c6283a] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a91f31]"
                  href={ROUTES.groups}
                >
                  Crear grupo
                </Link>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-zinc-950">Actividad Reciente</h2>
            <RecentActivityList activityFeed={activityFeed} />
          </section>
        </section>
      </main>

      <BottomDockNav />
    </div>
  );
}
