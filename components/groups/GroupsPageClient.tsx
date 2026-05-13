"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/utils/constants";
import type { GroupListItem } from "@/lib/groups/types";
import { createGroupAction, joinGroupAction } from "@/app/groups/actions";
import type { CreateGroupActionState, JoinGroupActionState } from "@/app/groups/actions";

type GroupsPageClientProps = {
  groups: GroupListItem[];
};

const createInitialState: CreateGroupActionState = { error: null, success: false, groupId: null };
const joinInitialState: JoinGroupActionState = { error: null, success: false, groupId: null, mode: null };

export function GroupsPageClient({ groups }: GroupsPageClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(groups.length === 0);
  const [isNavigatingToGroup, setIsNavigatingToGroup] = useState(false);
  const [createState, createFormAction, isCreatePending] = useActionState(createGroupAction, createInitialState);
  const [joinState, joinFormAction, isJoinPending] = useActionState(joinGroupAction, joinInitialState);

  useEffect(() => {
    if (createState.success && createState.groupId) {
      setIsNavigatingToGroup(true);
      setShowForm(false);
      router.push(`${ROUTES.groups}/${createState.groupId}`);
      router.refresh();
    }
  }, [createState.groupId, createState.success, router]);

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
          <form action={createFormAction} className="mt-4 space-y-4">
            <fieldset className="space-y-4" disabled={isCreatePending || isNavigatingToGroup}>
              <Input label="Nombre del grupo" name="name" placeholder="Ej. Planes de Madrid" required />
              <Input label="Descripcion (opcional)" name="description" placeholder="Tipo de planes o notas del grupo" />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Edicion de lugares</span>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  defaultValue="members_can_edit"
                  name="placeEditPolicy"
                >
                  <option value="members_can_edit">Todos los miembros pueden anadir lugares</option>
                  <option value="owner_only">Solo el propietario puede anadir lugares</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Acceso al grupo</span>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  defaultValue="open_by_code"
                  name="joinPolicy"
                >
                  <option value="open_by_code">Cualquiera con codigo entra directamente</option>
                  <option value="request_to_join">Requiere solicitud y aprobacion del propietario</option>
                </select>
              </label>
              {createState.error ? <p className="text-sm text-rose-600">{createState.error}</p> : null}
              {createState.success ? <p className="text-sm text-emerald-600">Grupo creado correctamente.</p> : null}
              {isNavigatingToGroup ? <p className="text-sm text-slate-500">Abriendo el grupo...</p> : null}
              <Button disabled={isCreatePending || isNavigatingToGroup} type="submit">
                {isCreatePending ? "Creando..." : "Crear grupo"}
              </Button>
            </fieldset>
          </form>
        </Card>
      ) : null}

      <Card className="rounded-3xl">
        <h2 className="text-lg font-semibold text-slate-900">Unirse con codigo</h2>
        <form action={joinFormAction} className="mt-4 space-y-4">
          <fieldset className="space-y-4" disabled={isJoinPending}>
            <Input label="Codigo del grupo" name="joinCode" placeholder="Ej. A1B2C3D4" required />
            {joinState.error ? <p className="text-sm text-rose-600">{joinState.error}</p> : null}
            {joinState.success && joinState.mode === "joined" ? (
              <p className="text-sm text-emerald-600">Te uniste al grupo correctamente.</p>
            ) : null}
            {joinState.success && joinState.mode === "requested" ? (
              <p className="text-sm text-amber-700">Solicitud enviada al propietario del grupo.</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={isJoinPending} type="submit" variant="secondary">
                {isJoinPending ? "Uniendote..." : "Unirme"}
              </Button>
              {joinState.success && joinState.groupId && joinState.mode === "joined" ? (
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-teal-500 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600"
                  href={`${ROUTES.groups}/${joinState.groupId}`}
                >
                  Ir al grupo
                </Link>
              ) : null}
            </div>
          </fieldset>
        </form>
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
            <Button onClick={() => setShowForm(true)} type="button" variant="secondary">
              Crear grupo
            </Button>
          }
        />
      )}
    </>
  );
}
