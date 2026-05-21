"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { joinGroupAction } from "@/app/groups/actions";
import type { JoinGroupActionState } from "@/app/groups/actions";
import { ROUTES } from "@/utils/constants";

const joinInitialState: JoinGroupActionState = { error: null, success: false, groupId: null, mode: null };

export function JoinGroupForm() {
  const router = useRouter();
  const [joinState, joinFormAction, isJoinPending] = useActionState(joinGroupAction, joinInitialState);

  return (
    <form action={joinFormAction} className="space-y-4">
      <fieldset className="space-y-4" disabled={isJoinPending}>
        <Input
          label="Codigo del grupo"
          maxLength={8}
          name="joinCode"
          pattern="[A-Za-z0-9]{8}"
          placeholder="Ej. A1B2C3D4"
          required
          title="El codigo debe tener 8 caracteres alfanumericos."
        />
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
          <Button onClick={() => router.push(ROUTES.groups)} type="button" variant="ghost">
            Volver a grupos
          </Button>
          {joinState.success && joinState.groupId && joinState.mode === "joined" ? (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#c6283a] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#a91f31]"
              href={`${ROUTES.groups}/${joinState.groupId}`}
            >
              Ir al grupo
            </Link>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
}
