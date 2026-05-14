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

