"use client";

import { useActionState } from "react";
import { removeFriendAction, respondFriendRequestAction, sendFriendRequestAction } from "@/app/friends/actions";
import type { FriendActionState } from "@/app/friends/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FriendItem, FriendRequestItem, UserSearchItem } from "@/lib/friends";

type FriendsPageClientProps = {
  query: string;
  searchResults: UserSearchItem[];
  friends: FriendItem[];
  receivedRequests: FriendRequestItem[];
  sentRequests: FriendRequestItem[];
};

const initialState: FriendActionState = { error: null, success: false };

export function FriendsPageClient({
  query,
  searchResults,
  friends,
  receivedRequests,
  sentRequests
}: FriendsPageClientProps) {
  const [sendState, sendAction, isSending] = useActionState(sendFriendRequestAction, initialState);
  const [respondState, respondAction, isResponding] = useActionState(respondFriendRequestAction, initialState);
  const [removeState, removeAction, isRemoving] = useActionState(removeFriendAction, initialState);

  const hasQuery = query.trim().length >= 2;

  return (
    <section className="space-y-4">
      <Card className="rounded-3xl">
        <form action="/friends" className="flex flex-wrap gap-2">
          <input
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
            defaultValue={query}
            minLength={2}
            name="q"
            placeholder="Buscar por username"
          />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
        {sendState.error ? <p className="mt-2 text-sm text-rose-600">{sendState.error}</p> : null}
      </Card>

      <Card className="rounded-3xl">
        <h2 className="text-lg font-semibold text-slate-900">Resultados</h2>
        {!hasQuery ? (
          <p className="mt-2 text-sm text-slate-500">Escribe al menos 2 caracteres para buscar usuarios.</p>
        ) : searchResults.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No encontramos usuarios para esa busqueda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {searchResults.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">@{user.username || "sin-username"}</p>
                {user.alreadyFriend ? (
                  <span className="text-xs text-emerald-700">Ya sois amigos</span>
                ) : user.hasPendingRequest ? (
                  <span className="text-xs text-amber-700">Solicitud pendiente</span>
                ) : (
                  <form action={sendAction}>
                    <input name="receiverId" type="hidden" value={user.id} />
                    <Button disabled={isSending} size="sm" type="submit" variant="secondary">
                      {isSending ? "Enviando..." : "Anadir"}
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {sendState.success ? <p className="mt-2 text-sm text-emerald-600">Solicitud enviada.</p> : null}
      </Card>

      {receivedRequests.length > 0 ? (
        <Card className="rounded-3xl">
          <h2 className="text-lg font-semibold text-slate-900">Solicitudes recibidas</h2>
          <ul className="mt-3 space-y-2">
            {receivedRequests.map((request) => (
              <li key={request.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">@{request.senderUsername || "sin-username"}</p>
                <p className="mt-1 text-xs text-slate-500">Estado: {request.status}</p>
                {request.status === "pending" ? (
                  <form action={respondAction} className="mt-2 flex gap-2">
                    <input name="requestId" type="hidden" value={request.id} />
                    <Button disabled={isResponding} name="decision" size="sm" type="submit" value="accepted">
                      Aceptar
                    </Button>
                    <Button
                      disabled={isResponding}
                      name="decision"
                      size="sm"
                      type="submit"
                      value="rejected"
                      variant="secondary"
                    >
                      Rechazar
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
          {respondState.error ? <p className="mt-2 text-sm text-rose-600">{respondState.error}</p> : null}
        </Card>
      ) : null}

      {sentRequests.length > 0 ? (
        <Card className="rounded-3xl">
          <h2 className="text-lg font-semibold text-slate-900">Solicitudes enviadas</h2>
          <ul className="mt-3 space-y-2">
            {sentRequests.map((request) => (
              <li key={request.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">@{request.receiverUsername || "sin-username"}</p>
                <p className="mt-1 text-xs text-slate-500">Estado: {request.status}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="rounded-3xl">
        <h2 className="text-lg font-semibold text-slate-900">Mis amigos</h2>
        {friends.length === 0 ? (
          <EmptyState description="Cuando aceptes solicitudes apareceran aqui." title="Aun no tienes amigos" />
        ) : (
          <ul className="mt-3 space-y-2">
            {friends.map((friend) => (
              <li key={friend.userId} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">@{friend.username || "sin-username"}</p>
                  <form
                    action={removeAction}
                    onSubmit={(event) => {
                      if (!window.confirm(`Seguro que quieres eliminar a @${friend.username || "sin-username"} de tus amigos?`)) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input name="friendUserId" type="hidden" value={friend.userId} />
                    <Button disabled={isRemoving} size="sm" type="submit" variant="secondary">
                      {isRemoving ? "Eliminando..." : "Eliminar amigo"}
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        {removeState.error ? <p className="mt-2 text-sm text-rose-600">{removeState.error}</p> : null}
      </Card>
    </section>
  );
}
