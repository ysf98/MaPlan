import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserGroups } from "@/lib/groups";
import { ROUTES } from "@/utils/constants";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const groups = user ? await getUserGroups(user.id) : [];
  const previewGroups = groups.slice(0, 3);

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

          {previewGroups.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {previewGroups.map((group, index) => (
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
      </section>
    </AppShell>
  );
}
