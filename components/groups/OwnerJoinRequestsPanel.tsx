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
  reviewedRequests: GroupJoinRequestItem[];
};

const reviewInitialState: ReviewJoinRequestActionState = {
  error: null,
  success: false
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

export function OwnerJoinRequestsPanel({ groupId, requests, reviewedRequests }: OwnerJoinRequestsPanelProps) {
  const [state, formAction, isPending] = useActionState(reviewJoinRequestAction, reviewInitialState);

  if (requests.length === 0) {
    return (
      <Card className="rounded-3xl">
        <h2 className="text-lg font-semibold text-zinc-950">Solicitudes de union</h2>
        <p className="mt-2 text-sm text-zinc-500">No hay solicitudes pendientes.</p>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl">
      <h2 className="text-lg font-semibold text-zinc-950">Solicitudes de union</h2>
      <ul className="mt-4 space-y-3">
        {requests.map((request) => (
          <li key={request.id} className="rounded-2xl border border-zinc-100 p-4">
            <p className="text-sm font-semibold text-zinc-950">{request.username || "Usuario sin nombre"}</p>
            <p className="mt-1 text-xs text-zinc-500">Ultimo intento: {formatDate(request.updatedAt)}</p>
            {request.message ? <p className="mt-1 text-sm text-zinc-500">{request.message}</p> : null}
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

      {reviewedRequests.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-950">Historial reciente</h3>
          <ul className="mt-2 space-y-2">
            {reviewedRequests.map((request) => (
              <li key={request.id} className="rounded-xl border border-zinc-100 px-3 py-2">
                <p className="text-sm text-zinc-950">
                  {request.username || "Usuario sin nombre"} -{" "}
                  <span className={request.status === "approved" ? "text-emerald-700" : "text-rose-700"}>
                    {request.status === "approved" ? "Aprobada" : "Rechazada"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Revisada: {formatDate(request.reviewedAt)} por {request.reviewedByUsername || "propietario"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
