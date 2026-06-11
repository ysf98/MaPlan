"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeGroupMemberAction, type RemoveGroupMemberActionState } from "@/app/groups/[groupId]/actions";
import type { GroupDetail, GroupMemberPreview } from "@/lib/groups/types";

function getInitial(name: string | null): string {
  const value = (name || "").trim();
  if (!value) return "?";
  return value.charAt(0).toUpperCase();
}

type GroupOverviewHeaderProps = {
  allMembers: GroupMemberPreview[];
  canManageMembers: boolean;
  currentUserId: string;
  group: GroupDetail;
  membersPreview: GroupMemberPreview[];
};

function getRoleLabel(role: GroupMemberPreview["role"]): string {
  return role === "owner" ? "Admin" : "Miembro";
}

export function GroupOverviewHeader({
  allMembers,
  canManageMembers,
  currentUserId,
  group,
  membersPreview
}: GroupOverviewHeaderProps) {
  const router = useRouter();
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [visibleMembers, setVisibleMembers] = useState(allMembers);
  const [pendingRemovalMemberId, setPendingRemovalMemberId] = useState<string | null>(null);
  const [memberActionState, memberAction, isMemberActionPending] = useActionState<RemoveGroupMemberActionState, FormData>(
    removeGroupMemberAction,
    { error: null, success: false }
  );
  const visiblePreviewMembers = visibleMembers.slice(0, membersPreview.length);
  const visibleTotalCount = visibleMembers.length;
  const hiddenMembersCount = Math.max(0, visibleTotalCount - visiblePreviewMembers.length);

  useEffect(() => {
    setVisibleMembers(allMembers);
  }, [allMembers]);

  useEffect(() => {
    if (!memberActionState.success) {
      return;
    }

    if (pendingRemovalMemberId) {
      setVisibleMembers((current) => current.filter((member) => member.userId !== pendingRemovalMemberId));
      setPendingRemovalMemberId(null);
    }

    router.refresh();
  }, [memberActionState.success, pendingRemovalMemberId, router]);

  return (
    <>
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div
            className="relative h-52 bg-zinc-200 bg-cover bg-center"
            style={group.coverImageUrl ? { backgroundImage: `url(\"${group.coverImageUrl}\")` } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
            <div className="absolute inset-x-4 bottom-3 text-white">
              <h1 className="text-[34px] font-extrabold leading-none tracking-tight">{group.name}</h1>
            </div>
          </div>
        </div>

        <p className="max-w-[34rem] text-sm leading-5 text-zinc-700">{group.description || "Sin descripcion"}</p>

        <Link
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#c6283a] px-5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(198,40,58,0.18)] transition hover:bg-[#b32033] sm:w-auto"
          href={`/groups/${group.id}/chat`}
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.1" viewBox="0 0 24 24">
            <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6.2A8 8 0 1 1 21 12Z" />
            <path d="M8 11h8M8 15h5" />
          </svg>
          Abrir chat
        </Link>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-[30px] font-extrabold leading-none text-zinc-950">Miembros</h2>
            <button
              className="inline-flex h-10 items-center justify-center rounded-full border border-rose-200 bg-[#fff8f7] px-4 text-sm font-semibold text-[#c6283a] shadow-[0_8px_18px_rgba(198,40,58,0.10)] transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-[#a61f31] active:translate-y-0"
              onClick={() => setIsMembersOpen(true)}
              type="button"
            >
              Ver todos
            </button>
          </div>
          <div className="mt-3 flex items-center -space-x-2">
            {visiblePreviewMembers.map((member) => (
              <div key={member.userId} className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-rose-50 shadow-sm">
                {member.avatarUrl ? (
                  <img alt={member.username || "Avatar"} className="h-full w-full object-cover" src={member.avatarUrl} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#c6283a]">{getInitial(member.username)}</div>
                )}
              </div>
            ))}
            {hiddenMembersCount > 0 ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-rose-100 text-[10px] font-bold text-[#c6283a] shadow-sm">
                +{hiddenMembersCount}
              </div>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-zinc-500">{visibleTotalCount} participantes en total</p>
        </div>
      </div>

      {isMembersOpen ? (
        <div className="fixed inset-0 z-50 bg-zinc-950/45 p-4" onClick={() => setIsMembersOpen(false)}>
          <div className="flex min-h-full items-center justify-center">
            <div
              className="w-full max-w-md rounded-3xl border border-zinc-100 bg-white p-5 shadow-[0_18px_45px_rgba(24,24,27,0.18)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-zinc-950">Miembros</h3>
                  <p className="mt-1 text-sm text-zinc-500">{visibleTotalCount} participantes en total</p>
                </div>
                <button
                  aria-label="Cerrar"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                  onClick={() => setIsMembersOpen(false)}
                  type="button"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {memberActionState.error ? <p className="text-sm text-rose-600">{memberActionState.error}</p> : null}
                {visibleMembers.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-[#fff8f7] px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-11 w-11 overflow-hidden rounded-full bg-rose-50">
                        {member.avatarUrl ? (
                          <img alt={member.username || "Avatar"} className="h-full w-full object-cover" src={member.avatarUrl} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#c6283a]">{getInitial(member.username)}</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-950">{member.username || "Sin nombre"}</p>
                        <p className="text-xs text-zinc-500">{getRoleLabel(member.role)}</p>
                      </div>
                    </div>
                    {canManageMembers && member.role === "member" && member.userId !== currentUserId ? (
                      <form
                        action={memberAction}
                        onSubmit={(event) => {
                          const confirmed = window.confirm("Estas seguro de que quieres expulsar a este miembro?");
                          if (!confirmed) {
                            event.preventDefault();
                            return;
                          }

                          setPendingRemovalMemberId(member.userId);
                        }}
                      >
                        <input name="groupId" type="hidden" value={group.id} />
                        <input name="memberUserId" type="hidden" value={member.userId} />
                        <button
                          className="shrink-0 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                          disabled={isMemberActionPending}
                          type="submit"
                        >
                          {isMemberActionPending && pendingRemovalMemberId === member.userId ? "Expulsando..." : "Expulsar"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
