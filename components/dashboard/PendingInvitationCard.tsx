"use client";

import { useActionState } from "react";
import { respondGroupInvitationAction, type RespondGroupInvitationActionState } from "@/app/invitations/actions";
import type { GroupInvitationItem } from "@/lib/groupInvitations";

type PendingInvitationCardProps = {
  invitation: GroupInvitationItem;
};

const initialState: RespondGroupInvitationActionState = {
  error: null,
  success: false
};

export function PendingInvitationCard({ invitation }: PendingInvitationCardProps) {
  const [state, formAction, isPending] = useActionState(respondGroupInvitationAction, initialState);

  return (
    <section className="rounded-[28px] border border-rose-200 bg-white px-5 py-5 shadow-[0_14px_35px_rgba(198,40,58,0.12)]">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-rose-50 text-[#c6283a]">
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path
              d="m5 14 9-9 5 5-9 9H5v-5Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
            <path d="m12 7 5 5M4 6l3 3M3 11h4M10 3v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-800">Invitacion pendiente</h2>
          <p className="mt-3 text-sm font-semibold text-zinc-700">{invitation.groupName || "Grupo privado"}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            @{invitation.invitedByUsername || "sin-username"} quiere que te unas a este grupo.
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-5 grid grid-cols-2 gap-3">
        <input name="invitationId" type="hidden" value={invitation.id} />
        <button
          className="h-12 rounded-2xl bg-[#c6283a] text-sm font-semibold text-white shadow-sm transition hover:bg-[#a91f31] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          name="decision"
          type="submit"
          value="accepted"
        >
          Aceptar
        </button>
        <button
          className="h-12 rounded-2xl bg-rose-100 text-sm font-semibold text-zinc-700 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          name="decision"
          type="submit"
          value="rejected"
        >
          Rechazar
        </button>
      </form>
      {state.error ? <p className="mt-3 text-sm font-medium text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-sm font-medium text-emerald-700">Invitacion actualizada.</p> : null}
    </section>
  );
}
