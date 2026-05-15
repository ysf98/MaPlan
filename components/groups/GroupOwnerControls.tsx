"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGroupAction, leaveGroupAction, reviewJoinRequestAction, updateGroupSettingsAction } from "@/app/groups/[groupId]/actions";
import { inviteFriendToGroupAction } from "@/app/groups/[groupId]/invitations/actions";
import type { InviteFriendActionState } from "@/app/groups/[groupId]/invitations/actions";
import type {
  DeleteGroupActionState,
  LeaveGroupActionState,
  ReviewJoinRequestActionState,
  UpdateGroupSettingsActionState
} from "@/app/groups/[groupId]/actions";
import { Button } from "@/components/ui/Button";
import type { GroupJoinRequestItem } from "@/lib/groups/types";
import type { GroupJoinPolicy, GroupPlaceEditPolicy } from "@/lib/groups/policies";
import type { GroupInvitationItem } from "@/lib/groupInvitations";

type GroupOwnerControlsProps = {
  groupId: string;
  groupName: string;
  role: "owner" | "member";
  placeEditPolicy: GroupPlaceEditPolicy;
  joinPolicy: GroupJoinPolicy;
  pendingRequests: GroupJoinRequestItem[];
  invitableFriends: Array<{ id: string; username: string | null }>;
  groupInvitations: GroupInvitationItem[];
  totalFriendsCount: number;
};

const settingsInitialState: UpdateGroupSettingsActionState = {
  error: null,
  success: false
};

const reviewInitialState: ReviewJoinRequestActionState = {
  error: null,
  success: false
};

const leaveInitialState: LeaveGroupActionState = {
  error: null,
  success: false
};

const deleteInitialState: DeleteGroupActionState = {
  error: null,
  success: false
};

const inviteInitialState: InviteFriendActionState = {
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

export function GroupOwnerControls({
  groupId,
  groupName,
  role,
  placeEditPolicy,
  joinPolicy,
  pendingRequests,
  invitableFriends,
  groupInvitations,
  totalFriendsCount
}: GroupOwnerControlsProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"leave" | "delete" | null>(null);

  const [settingsState, settingsAction, isSettingsPending] = useActionState(updateGroupSettingsAction, settingsInitialState);
  const [reviewState, reviewAction, isReviewPending] = useActionState(reviewJoinRequestAction, reviewInitialState);
  const [leaveState, leaveAction, isLeaving] = useActionState(leaveGroupAction, leaveInitialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteGroupAction, deleteInitialState);
  const [inviteState, inviteAction, isInviting] = useActionState(inviteFriendToGroupAction, inviteInitialState);

  useEffect(() => {
    if (settingsState.success || reviewState.success) {
      router.refresh();
    }
  }, [reviewState.success, router, settingsState.success]);

  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:max-w-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Gestion del grupo</h2>
        <Button onClick={() => setExpanded((value) => !value)} size="sm" type="button" variant="secondary">
          {expanded ? "Ocultar" : "Desplegar"}
        </Button>
      </div>

      {role === "owner" ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-900">Solicitudes</p>
            <span className="inline-flex min-w-7 justify-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
              {pendingRequests.length}
            </span>
          </div>
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-4 space-y-4">
          {role === "owner" ? (
            <form action={settingsAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
              <input name="groupId" type="hidden" value={groupId} />
              <label className="block space-y-2">
                <span className="text-xs font-medium text-slate-700">Edicion de lugares</span>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  defaultValue={placeEditPolicy}
                  name="placeEditPolicy"
                >
                  <option value="members_can_edit">Todos los miembros pueden anadir</option>
                  <option value="owner_only">Solo propietario</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-medium text-slate-700">Acceso al grupo</span>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  defaultValue={joinPolicy}
                  name="joinPolicy"
                >
                  <option value="invite_only">Solo por invitacion</option>
                  <option value="request_to_join">Solicitud con codigo</option>
                  <option value="open_by_code">Abierto con codigo</option>
                </select>
              </label>
              {settingsState.error ? <p className="text-xs text-rose-600">{settingsState.error}</p> : null}
              {settingsState.success ? <p className="text-xs text-emerald-600">Configuracion actualizada.</p> : null}
              <Button disabled={isSettingsPending} size="sm" type="submit">
                {isSettingsPending ? "Guardando..." : "Guardar configuracion"}
              </Button>
            </form>
          ) : null}

          {role === "owner" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-900">Solicitudes pendientes</h3>
              {pendingRequests.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No hay solicitudes pendientes.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {pendingRequests.map((request) => (
                    <li key={request.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-medium text-slate-900">{request.username || "Usuario sin nombre"}</p>
                      <p className="mt-1 text-xs text-slate-500">Ultimo intento: {formatDate(request.updatedAt)}</p>
                      <form action={reviewAction} className="mt-2 flex flex-wrap gap-2">
                        <input name="groupId" type="hidden" value={groupId} />
                        <input name="requestId" type="hidden" value={request.id} />
                        <Button disabled={isReviewPending} name="decision" size="sm" type="submit" value="approved">
                          Aceptar
                        </Button>
                        <Button disabled={isReviewPending} name="decision" size="sm" type="submit" value="rejected" variant="secondary">
                          Rechazar
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              {reviewState.error ? <p className="mt-2 text-xs text-rose-600">{reviewState.error}</p> : null}
              {reviewState.success ? <p className="mt-2 text-xs text-emerald-600">Solicitud actualizada.</p> : null}
            </div>
          ) : null}

          {role === "owner" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-900">Invitar amigos</h3>
              {invitableFriends.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  {totalFriendsCount === 0
                    ? "Anade amigos primero para poder invitarlos al grupo."
                    : "Todos tus amigos ya estan invitados o ya son miembros de este grupo."}
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {invitableFriends.map((friend) => (
                    <li key={friend.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2">
                      <p className="text-xs font-medium text-slate-900">@{friend.username || "sin-username"}</p>
                      <form action={inviteAction}>
                        <input name="groupId" type="hidden" value={groupId} />
                        <input name="friendUserId" type="hidden" value={friend.id} />
                        <Button disabled={isInviting} size="sm" type="submit" variant="secondary">
                          {isInviting ? "Enviando..." : "Invitar"}
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              {inviteState.error ? <p className="mt-2 text-xs text-rose-600">{inviteState.error}</p> : null}
              {inviteState.success ? <p className="mt-2 text-xs text-emerald-600">Invitacion enviada.</p> : null}

              {groupInvitations.length > 0 ? (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <h4 className="text-xs font-semibold text-slate-900">Invitaciones del grupo</h4>
                  <ul className="mt-2 space-y-2">
                    {groupInvitations.slice(0, 8).map((invitation) => (
                      <li key={invitation.id} className="rounded-lg border border-slate-200 p-2">
                        <p className="text-xs text-slate-900">
                          @{invitation.invitedUsername || "sin-username"} -{" "}
                          <span
                            className={
                              invitation.status === "pending"
                                ? "text-amber-700"
                                : invitation.status === "accepted"
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                            }
                          >
                            {invitation.status}
                          </span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            {role === "owner" ? (
              <>
                {confirmMode !== "delete" ? (
                  <Button onClick={() => setConfirmMode("delete")} size="sm" type="button" variant="danger">
                    Eliminar grupo
                  </Button>
                ) : (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center">
                    <p className="text-xs text-rose-800">Estas seguro que quieres eliminar ({groupName})?</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      <form action={deleteAction}>
                        <input name="groupId" type="hidden" value={groupId} />
                        <Button disabled={isDeleting} size="sm" type="submit" variant="danger">
                          {isDeleting ? "Eliminando..." : "Si, eliminar"}
                        </Button>
                      </form>
                      <Button onClick={() => setConfirmMode(null)} size="sm" type="button" variant="ghost">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                {deleteState.error ? <p className="mt-2 text-xs text-rose-600">{deleteState.error}</p> : null}
              </>
            ) : (
              <>
                {confirmMode !== "leave" ? (
                  <Button onClick={() => setConfirmMode("leave")} size="sm" type="button" variant="secondary">
                    Salir del grupo
                  </Button>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-xs text-amber-800">Estas seguro que quieres salir de ({groupName})?</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      <form action={leaveAction}>
                        <input name="groupId" type="hidden" value={groupId} />
                        <Button disabled={isLeaving} size="sm" type="submit" variant="secondary">
                          {isLeaving ? "Saliendo..." : "Si, salir"}
                        </Button>
                      </form>
                      <Button onClick={() => setConfirmMode(null)} size="sm" type="button" variant="ghost">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                {leaveState.error ? <p className="mt-2 text-xs text-rose-600">{leaveState.error}</p> : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
