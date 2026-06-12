"use client";

import { useActionState } from "react";
import Link from "next/link";
import { respondFriendRequestAction, type FriendActionState } from "@/app/friends/actions";
import { respondGroupInvitationAction, type RespondGroupInvitationActionState } from "@/app/invitations/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { NotificationItem } from "@/lib/notifications";

type NotificationsPageClientProps = {
  groupActivities: NotificationItem[];
  pendingInvitations: NotificationItem[];
  reviewedInvitations: NotificationItem[];
  friendRequests: NotificationItem[];
  unreadChats: NotificationItem[];
  total: number;
};

const invitationsInitialState: RespondGroupInvitationActionState = {
  error: null,
  success: false
};

const friendRequestsInitialState: FriendActionState = {
  error: null,
  success: false
};

export function NotificationsPageClient({
  groupActivities,
  pendingInvitations,
  reviewedInvitations,
  friendRequests,
  unreadChats,
  total
}: NotificationsPageClientProps) {
  const [invitationState, invitationFormAction, isInvitationPending] = useActionState(
    respondGroupInvitationAction,
    invitationsInitialState
  );
  const [friendState, friendFormAction, isFriendPending] = useActionState(respondFriendRequestAction, friendRequestsInitialState);

  return (
    <section className="space-y-4">
      {total > 0 ? (
        <>
          {unreadChats.length > 0 ? (
            <Card className="rounded-3xl">
              <h2 className="text-lg font-semibold text-zinc-950">Mensajes</h2>
              <ul className="mt-3 space-y-2">
                {unreadChats.map((notification) => {
                  if (notification.kind !== "group_chat_unread") return null;
                  return (
                    <li className="rounded-xl border border-zinc-100 p-3" key={notification.id}>
                      <Link className="block" href={`/groups/${notification.groupId}/chat`}>
                        <p className="text-sm font-semibold text-zinc-950">
                          Tienes mensajes por leer del grupo {notification.groupName}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {notification.unreadCount === 1 ? "1 mensaje nuevo" : `${notification.unreadCount} mensajes nuevos`}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}

          {groupActivities.length > 0 ? (
            <Card className="rounded-3xl">
              <h2 className="text-lg font-semibold text-zinc-950">Actividad de grupos</h2>
              <ul className="mt-3 space-y-2">
                {groupActivities.map((notification) => {
                  if (notification.kind !== "group_activity") return null;
                  const activity = notification.activity;
                  return (
                    <li className="rounded-xl border border-zinc-100 p-3" key={notification.id}>
                      {activity.href ? (
                        <Link className="block text-sm font-medium text-zinc-950" href={activity.href}>
                          {activity.message}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-zinc-950">{activity.message}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}

          {pendingInvitations.length > 0 ? (
            <Card className="rounded-3xl">
              <h2 className="text-lg font-semibold text-zinc-950">Invitaciones a grupos</h2>
              <ul className="mt-3 space-y-2">
                {pendingInvitations.map((notification) => {
                  if (notification.kind !== "group_invitation") return null;
                  return (
                    <li className="rounded-xl border border-zinc-100 p-3" key={notification.id}>
                      <p className="text-sm font-medium text-zinc-950">{notification.groupName || notification.groupId}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Te invita @{notification.invitedByUsername || "sin-username"}
                      </p>
                      <form action={invitationFormAction} className="mt-2 flex gap-2">
                        <input name="invitationId" type="hidden" value={notification.invitationId} />
                        <Button disabled={isInvitationPending} name="decision" size="sm" type="submit" value="accepted">
                          Aceptar
                        </Button>
                        <Button
                          disabled={isInvitationPending}
                          name="decision"
                          size="sm"
                          type="submit"
                          value="rejected"
                          variant="secondary"
                        >
                          Rechazar
                        </Button>
                      </form>
                    </li>
                  );
                })}
              </ul>
              {invitationState.error ? <p className="mt-2 text-sm text-rose-600">{invitationState.error}</p> : null}
            </Card>
          ) : null}

          {reviewedInvitations.length > 0 ? (
            <Card className="rounded-3xl">
              <h2 className="text-lg font-semibold text-zinc-950">Historial de invitaciones</h2>
              <ul className="mt-3 space-y-2">
                {reviewedInvitations.slice(0, 10).map((notification) => {
                  if (notification.kind !== "group_invitation") return null;
                  const message =
                    notification.status === "accepted"
                      ? `Te has unido a ${notification.groupName || notification.groupId}.`
                      : `Has rechazado ${notification.groupName || notification.groupId}.`;
                  return (
                    <li className="rounded-xl border border-zinc-100 p-3" key={`${notification.id}-reviewed`}>
                      <p className="text-sm text-zinc-700">{message}</p>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}

          {friendRequests.length > 0 ? (
            <Card className="rounded-3xl">
              <h2 className="text-lg font-semibold text-zinc-950">Solicitudes de amistad</h2>
              <ul className="mt-3 space-y-2">
                {friendRequests.map((notification) => {
                  if (notification.kind !== "friend_request") return null;
                  return (
                    <li className="rounded-xl border border-zinc-100 p-3" key={notification.id}>
                      <p className="text-sm font-medium text-zinc-950">@{notification.senderUsername || "sin-username"}</p>
                      <form action={friendFormAction} className="mt-2 flex gap-2">
                        <input name="requestId" type="hidden" value={notification.requestId} />
                        <Button disabled={isFriendPending} name="decision" size="sm" type="submit" value="accepted">
                          Aceptar
                        </Button>
                        <Button disabled={isFriendPending} name="decision" size="sm" type="submit" value="rejected" variant="secondary">
                          Rechazar
                        </Button>
                      </form>
                    </li>
                  );
                })}
              </ul>
              {friendState.error ? <p className="mt-2 text-sm text-rose-600">{friendState.error}</p> : null}
            </Card>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
