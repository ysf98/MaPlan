"use client";

import { useActionState } from "react";
import Link from "next/link";
import { respondGroupInvitationAction } from "@/app/invitations/actions";
import type { RespondGroupInvitationActionState } from "@/app/invitations/actions";
import type { GroupInvitationItem } from "@/lib/groupInvitations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROUTES } from "@/utils/constants";

type InvitationsPageClientProps = {
  invitations: GroupInvitationItem[];
};

const initialState: RespondGroupInvitationActionState = {
  error: null,
  success: false
};

export function InvitationsPageClient({ invitations }: InvitationsPageClientProps) {
  const [state, formAction, isPending] = useActionState(respondGroupInvitationAction, initialState);
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");
  const reviewedInvitations = invitations.filter((invitation) => invitation.status !== "pending");

  return (
    <section className="space-y-4">
      {pendingInvitations.length === 0 && reviewedInvitations.length === 0 ? (
        <EmptyState title="Sin invitaciones pendientes" description="Cuando te inviten a un grupo aparecera aqui." />
      ) : (
        <>
          <Card className="rounded-3xl">
            <h2 className="text-lg font-semibold text-slate-900">Pendientes</h2>
            {pendingInvitations.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No tienes invitaciones pendientes ahora mismo.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {pendingInvitations.map((invitation) => (
                  <li key={invitation.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-900">{invitation.groupName || invitation.groupId}</p>
                    <p className="mt-1 text-xs text-slate-500">Invita: @{invitation.invitedByUsername || "sin-username"}</p>
                    <form action={formAction} className="mt-2 flex gap-2">
                      <input name="invitationId" type="hidden" value={invitation.id} />
                      <Button disabled={isPending} name="decision" size="sm" type="submit" value="accepted">
                        Aceptar
                      </Button>
                      <Button disabled={isPending} name="decision" size="sm" type="submit" value="rejected" variant="secondary">
                        Rechazar
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            {state.error ? <p className="mt-2 text-sm text-rose-600">{state.error}</p> : null}
            {state.success ? <p className="mt-2 text-sm text-emerald-600">Invitacion actualizada.</p> : null}
          </Card>

          {reviewedInvitations.length > 0 ? (
            <Card className="rounded-3xl">
              <h2 className="text-lg font-semibold text-slate-900">Historial reciente</h2>
              <ul className="mt-3 space-y-2">
                {reviewedInvitations.slice(0, 10).map((invitation) => (
                  <li key={invitation.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-900">{invitation.groupName || invitation.groupId}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Estado:{" "}
                      <span className={invitation.status === "accepted" ? "text-emerald-700" : "text-rose-700"}>{invitation.status}</span>
                    </p>
                    {invitation.status === "accepted" ? (
                      <Link
                        className="mt-2 inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        href={`${ROUTES.groups}/${invitation.groupId}`}
                      >
                        Ir al grupo
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}
    </section>
  );
}
