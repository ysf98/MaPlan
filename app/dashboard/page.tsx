import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserGroups } from "@/lib/groups";
import { getGroupActivityFeedForUser, getGroupsWithRecentActivityForUser } from "@/lib/groupActivity";
import { ROUTES } from "@/utils/constants";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const groups = user ? await getUserGroups(user.id) : [];
  const [activityFeed, groupsWithActivity] = user
    ? await Promise.all([getGroupActivityFeedForUser(user.id, 10), getGroupsWithRecentActivityForUser(user.id, 3)])
    : [[], []];

  function formatDate(date: string): string {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(date));
  }

  const groupById = new Map(groups.map((group) => [group.id, group]));
  const highlightedGroups = groupsWithActivity
    .map((item) => {
      const group = groupById.get(item.groupId);
      if (!group) return null;
      return { ...group, latestActivityAt: item.latestActivityAt, recentEventsCount: item.recentEventsCount };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <AppShell>
      <section className="space-y-4">
        <Card className="rounded-3xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Mis grupos</h2>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              href={ROUTES.groups}
            >
              Ver todos
            </Link>
          </div>

          {highlightedGroups.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {highlightedGroups.map((group, index) => (
                <li key={group.id}>
                  <Link href={`${ROUTES.groups}/${group.id}`}>
                    <div className="rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50">
                      <CategoryBadge label={group.role === "owner" ? "Admin" : "Member"} tone={index % 2 === 0 ? "plan" : "visit"} />
                      <p className="mt-2 text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{group.description || "Sin descripcion"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {group.recentEventsCount} novedad(es) · Ultima actividad: {formatDate(group.latestActivityAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : groups.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {groups.slice(0, 3).map((group, index) => (
                <li key={group.id}>
                  <Link href={`${ROUTES.groups}/${group.id}`}>
                    <div className="rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50">
                      <CategoryBadge label={group.role === "owner" ? "Admin" : "Member"} tone={index % 2 === 0 ? "plan" : "visit"} />
                      <p className="mt-2 text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{group.description || "Sin descripcion"}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Todavia no tienes grupos"
                description="Crea tu primer grupo para empezar a organizar recomendaciones con amigos."
                action={
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-teal-500 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600"
                    href={ROUTES.groups}
                  >
                    Crear grupo
                  </Link>
                }
              />
            </div>
          )}
        </Card>

        <Card className="rounded-3xl">
          <h2 className="text-lg font-semibold text-slate-900">Novedades</h2>
          {activityFeed.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {activityFeed.map((event) => (
                <li key={event.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{event.message}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{event.groupName}</span>
                    <span>·</span>
                    <span>{formatDate(event.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
              Aun no hay novedades en tus grupos.
            </p>
          )}
        </Card>

        {groupsWithActivity.length > 0 ? (
          <Card className="rounded-3xl">
            <h2 className="text-lg font-semibold text-slate-900">Grupos con novedades</h2>
            <ul className="mt-4 space-y-3">
              {groupsWithActivity.map((group) => (
                <li key={group.groupId}>
                  <Link href={`${ROUTES.groups}/${group.groupId}`}>
                    <div className="rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50">
                      <p className="text-sm font-semibold text-slate-900">{group.groupName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {group.recentEventsCount} novedad(es) · Ultima actividad: {formatDate(group.latestActivityAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </section>
    </AppShell>
  );
}
