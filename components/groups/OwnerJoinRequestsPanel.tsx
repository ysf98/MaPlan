"use client";

import { useActionState } from "react";
import { reviewJoinRequestAction } from "@/app/groups/[groupId]/actions";
import type { ReviewJoinRequestActionState } from "@/app/groups/[groupId]/actions";
import type { GroupJoinRequestItem } from "@/lib/groups/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type OwnerJoinRequestsPanelProps = {
  groupId: string;
  requests: GroupJoinRequestItem[];
};

const reviewInitialState: ReviewJoinRequestActionState = {
  error: null,
  success: false
};

export function OwnerJoinRequestsPanel({ groupId, requests }: OwnerJoinRequestsPanelProps) {
  const [state, formAction, isPending] = useActionState(reviewJoinRequestAction, reviewInitialState);

  if (requests.length === 0) {
    return (
      <Card className="rounded-3xl">
        <h2 className="text-lg font-semibold text-slate-900">Solicitudes de union</h2>
        <p className="mt-2 text-sm text-slate-500">No hay solicitudes pendientes.</p>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl">
      <h2 className="text-lg font-semibold text-slate-900">Solicitudes de union</h2>
      <ul className="mt-4 space-y-3">
        {requests.map((request) => (
          <li key={request.id} className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{request.username || "Usuario sin nombre"}</p>
            {request.message ? <p className="mt-1 text-sm text-slate-500">{request.message}</p> : null}
            <form action={formAction} className="mt-3 flex flex-wrap gap-2">
              <input name="groupId" type="hidden" value={groupId} />
              <input name="requestId" type="hidden" value={request.id} />
              <Button disabled={isPending} name="decision" size="sm" type="submit" value="approved">
                Aprobar
              </Button>
              <Button disabled={isPending} name="decision" size="sm" type="submit" value="rejected" variant="secondary">
                Rechazar
              </Button>
            </form>
          </li>
        ))}
      </ul>
      {state.error ? <p className="mt-3 text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-sm text-emerald-600">Solicitud actualizada correctamente.</p> : null}
    </Card>
  );
}
