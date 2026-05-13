"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/utils/constants";
import type { GroupListItem } from "@/lib/groups";
import { createGroupAction, createGroupInitialState } from "@/app/groups/actions";

type GroupsPageClientProps = {
  groups: GroupListItem[];
};

export function GroupsPageClient({ groups }: GroupsPageClientProps) {
  const [showForm, setShowForm] = useState(groups.length === 0);
  const [state, formAction, isPending] = useActionState(createGroupAction, createGroupInitialState);

  useEffect(() => {
    if (state.success) {
      setShowForm(false);
    }
  }, [state.success]);

  return (
    <>
      <Card className="rounded-3xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tus grupos</h1>
            <p className="mt-1 text-sm text-slate-500">Espacios compartidos para guardar y descubrir planes.</p>
          </div>
          <Button onClick={() => setShowForm((value) => !value)} type="button" variant="secondary">
            {showForm ? "Cancelar" : "Nuevo grupo"}
          </Button>
        </div>
      </Card>

      {showForm ? (
        <Card className="rounded-3xl">
          <h2 className="text-lg font-semibold text-slate-900">Crear nuevo grupo</h2>
          <form action={formAction} className="mt-4 space-y-4">
            <Input label="Nombre del grupo" name="name" placeholder="Ej. Planes de Madrid" required />
            <Input label="Descripcion (opcional)" name="description" placeholder="Tipo de planes o notas del grupo" />
            {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
            {state.success ? <p className="text-sm text-emerald-600">Grupo creado correctamente.</p> : null}
            <Button disabled={isPending} type="submit">
              {isPending ? "Creando..." : "Crear grupo"}
            </Button>
          </form>
        </Card>
      ) : null}

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
            <Button onClick={() => setShowForm(true)} type="button" variant="secondary">
              Crear grupo
            </Button>
          }
        />
      )}
    </>
  );
}
