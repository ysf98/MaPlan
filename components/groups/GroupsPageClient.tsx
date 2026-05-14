"use client";

import Link from "next/link";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROUTES } from "@/utils/constants";
import type { GroupListItem } from "@/lib/groups/types";

type GroupsPageClientProps = {
  groups: GroupListItem[];
};

export function GroupsPageClient({ groups }: GroupsPageClientProps) {
  return (
    <>
      <Card className="rounded-3xl">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tus grupos</h1>
            <p className="mt-1 text-sm text-slate-500">Espacios compartidos para guardar y descubrir planes.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={`${ROUTES.groups}/new`}>
              <Card className="rounded-2xl border-dashed transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-sm font-medium text-slate-900">Crear nuevo grupo</p>
                <p className="mt-1 text-xs text-slate-500">Define nombre, permisos de edicion y tipo de acceso.</p>
              </Card>
            </Link>
            <Link href={`${ROUTES.groups}/join`}>
              <Card className="rounded-2xl border-dashed transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-sm font-medium text-slate-900">Unirse con codigo</p>
                <p className="mt-1 text-xs text-slate-500">Introduce un codigo de 8 caracteres para entrar a un grupo.</p>
              </Card>
            </Link>
          </div>
        </div>
      </Card>

      {groups.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {groups.map((group, index) => (
            <li key={group.id}>
              <Link href={`${ROUTES.groups}/${group.id}`}>
                <Card className="rounded-3xl transition hover:-translate-y-0.5 hover:shadow-md">
                  <CategoryBadge label={group.role === "owner" ? "Admin" : "Member"} tone={index % 2 === 0 ? "plan" : "visit"} />
                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{group.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {group.description || "Ver recomendaciones y mapa colaborativo"}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Aun no tienes grupos"
          description="Crea tu primer grupo para empezar a guardar y compartir recomendaciones."
          action={
            <Link href={`${ROUTES.groups}/new`}>
              <Button type="button" variant="secondary">
              Crear grupo
              </Button>
            </Link>
          }
        />
      )}
    </>
  );
}
