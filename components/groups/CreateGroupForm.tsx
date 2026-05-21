"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createGroupAction } from "@/app/groups/actions";
import type { CreateGroupActionState } from "@/app/groups/actions";
import { ROUTES } from "@/utils/constants";

const createInitialState: CreateGroupActionState = { error: null, success: false, groupId: null };

export function CreateGroupForm() {
  const router = useRouter();
  const [isNavigatingToGroup, setIsNavigatingToGroup] = useState(false);
  const [createState, createFormAction, isCreatePending] = useActionState(createGroupAction, createInitialState);

  useEffect(() => {
    if (createState.success && createState.groupId) {
      setIsNavigatingToGroup(true);
      router.push(`${ROUTES.groups}/${createState.groupId}`);
      router.refresh();
    }
  }, [createState.groupId, createState.success, router]);

  return (
    <form action={createFormAction} className="space-y-4">
      <fieldset className="space-y-4" disabled={isCreatePending || isNavigatingToGroup}>
        <Input label="Nombre del grupo" name="name" placeholder="Ej. Planes de Madrid" required />
        <Input label="Descripcion (opcional)" name="description" placeholder="Tipo de planes o notas del grupo" />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Edicion de lugares</span>
          <select
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            defaultValue="members_can_edit"
            name="placeEditPolicy"
          >
            <option value="members_can_edit">Todos los miembros pueden anadir lugares</option>
            <option value="owner_only">Solo el propietario puede anadir lugares</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Acceso al grupo</span>
          <select
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            defaultValue="invite_only"
            name="joinPolicy"
          >
            <option value="invite_only">Solo por invitacion</option>
            <option value="request_to_join">Solicitud con codigo</option>
            <option value="open_by_code">Abierto con codigo</option>
          </select>
        </label>
        {createState.error ? <p className="text-sm text-rose-600">{createState.error}</p> : null}
        {createState.success ? <p className="text-sm text-emerald-600">Grupo creado correctamente.</p> : null}
        {isNavigatingToGroup ? <p className="text-sm text-zinc-500">Abriendo el grupo...</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={isCreatePending || isNavigatingToGroup} type="submit">
            {isCreatePending ? "Creando..." : "Crear grupo"}
          </Button>
          <Button onClick={() => router.push(ROUTES.groups)} type="button" variant="ghost">
            Volver a grupos
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
