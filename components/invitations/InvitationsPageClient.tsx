"use client";

import { useActionState } from "react";
import { respondGroupInvitationAction } from "@/app/invitations/actions";
import type { RespondGroupInvitationActionState } from "@/app/invitations/actions";
import type { GroupInvitationItem } from "@/lib/groupInvitations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type InvitationsPageClientProps = {
  invitations: GroupInvitationItem[];
};

const initialState: RespondGroupInvitationActionState = {
  error: null,
  success: false
};

export function InvitationsPageClient({ invitations }: InvitationsPageClientProps) {
  const [state, formAction, isPending] = useActionState(respondGroupInvitationAction, initialState);

  return (
    <section className="space-y-4">
      <Card className="rounded-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Invitaciones</h1>
        <p className="mt-1 text-sm text-slate-500">Gestiona invitaciones a grupos enviadas por tus amigos.</p>
      </Card>

      {invitations.length === 0 ? (
        <EmptyState title="Sin invitaciones pendientes" description="Cuando te inviten a un grupo aparecera aqui." />
      ) : (
        <Card className="rounded-3xl">
          <h2 className="text-lg font-semibold text-slate-900">Pendientes</h2>
          <ul className="mt-3 space-y-2">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{invitation.groupName || invitation.groupId}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Te invito @{invitation.invitedByUsername || "sin-username"}
                </p>
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
          {state.error ? <p className="mt-2 text-sm text-rose-600">{state.error}</p> : null}
          {state.success ? <p className="mt-2 text-sm text-emerald-600">Invitacion actualizada.</p> : null}
        </Card>
      )}
    </section>
  );
}

