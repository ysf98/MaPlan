"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { removeFriendAction, respondFriendRequestAction, sendFriendRequestAction } from "@/app/friends/actions";
import type { FriendActionState } from "@/app/friends/actions";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FriendItem, FriendRequestItem, UserSearchItem } from "@/lib/friends";
import type { GroupInvitationItem } from "@/lib/groupInvitations";
import { ROUTES } from "@/utils/constants";

type FriendsPageClientProps = {
  query: string;
  searchResults: UserSearchItem[];
  friends: FriendItem[];
  receivedRequests: FriendRequestItem[];
  sentRequests: FriendRequestItem[];
  groupInvitations?: GroupInvitationItem[];
};

const initialState: FriendActionState = { error: null, success: false };

function getInitial(username: string | null): string {
  const normalized = (username || "").trim();
  return normalized ? normalized.charAt(0).toUpperCase() : "?";
}

export function FriendsPageClient({
  query,
  searchResults: initialSearchResults,
  friends,
  receivedRequests,
  sentRequests,
  groupInvitations = []
}: FriendsPageClientProps) {
  const [sendState, sendAction, isSending] = useActionState(sendFriendRequestAction, initialState);
  const [respondState, respondAction, isResponding] = useActionState(respondFriendRequestAction, initialState);
  const [removeState, removeAction, isRemoving] = useActionState(removeFriendAction, initialState);
  const [searchValue, setSearchValue] = useState(query);
  const [liveResults, setLiveResults] = useState<UserSearchItem[]>(initialSearchResults);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const hasQuery = searchValue.trim().length >= 2;
  const normalizedQuery = useMemo(() => searchValue.trim(), [searchValue]);
  const showSearchPanel = hasQuery && isSearchFocused;

  useEffect(() => {
    const term = normalizedQuery;
    if (term.length < 2) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/friends/search?q=${encodeURIComponent(term)}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store"
        });

        if (!response.ok) {
          setLiveResults([]);
          return;
        }

        const payload = (await response.json().catch(() => null)) as { results?: UserSearchItem[] } | null;
        setLiveResults(payload?.results || []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setLiveResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [normalizedQuery]);

  const pendingGroupInvitation = groupInvitations[0] || null;

  return (
    <section className="space-y-5">
      <div className="relative z-20">
        <label className="sr-only" htmlFor="friends-search">Buscar amigos</label>
        <input
          id="friends-search"
          autoComplete="off"
          className="h-12 w-full rounded-2xl border border-rose-100 bg-rose-50/70 px-4 pr-11 text-sm font-semibold text-zinc-950 placeholder:text-zinc-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
          minLength={2}
          name="q"
          onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
          onChange={(event) => setSearchValue(event.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          placeholder="Buscar amigos o @usuario"
          value={searchValue}
        />
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#c6283a]">
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </div>

        {showSearchPanel ? (
          <div className="absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-[22px] border border-rose-100 bg-white shadow-[0_18px_42px_rgba(38,24,23,0.14)]">
            {isSearching ? (
              <p className="px-4 py-3 text-sm font-semibold text-zinc-500">Buscando usuarios...</p>
            ) : liveResults.length === 0 ? (
              <p className="px-4 py-3 text-sm font-semibold text-zinc-500">No encontramos usuarios para esa busqueda.</p>
            ) : (
              <ul className="max-h-72 overflow-y-auto py-2">
                {liveResults.map((user) => (
                  <li className="flex items-center justify-between gap-3 px-3 py-2 transition hover:bg-[#fff4f3]" key={user.id}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fde2e0] text-sm font-extrabold text-[#c6283a]">
                        {getInitial(user.username)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-zinc-950">@{user.username || "sin-username"}</p>
                        <p className="text-xs font-medium text-zinc-500">
                          {user.alreadyFriend ? "Ya sois amigos" : user.hasPendingRequest ? "Solicitud pendiente" : "Disponible para anadir"}
                        </p>
                      </div>
                    </div>
                    {user.alreadyFriend ? (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Amigo</span>
                    ) : user.hasPendingRequest ? (
                      <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Pendiente</span>
                    ) : (
                      <form action={sendAction} className="shrink-0">
                        <input name="receiverId" type="hidden" value={user.id} />
                        <Button disabled={isSending} size="sm" type="submit" variant="secondary">
                          {isSending ? "..." : "Anadir"}
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-950">Invitaciones a Grupos</h2>
        {pendingGroupInvitation ? (
          <Link className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm" href={ROUTES.invitations}>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200" />
              <div>
                <p className="text-sm font-bold text-rose-700">{pendingGroupInvitation.groupName || "Grupo"}</p>
                <p className="text-xs text-zinc-500">Te han invitado a un nuevo grupo.</p>
              </div>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#c6283a] text-white">›</div>
          </Link>
        ) : (
          <p className="text-sm text-zinc-500">No tienes invitaciones de grupo pendientes.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-950">Solicitudes</h2>
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-[#c6283a]">{receivedRequests.length} pendiente{receivedRequests.length === 1 ? "" : "s"}</span>
        </div>

        {receivedRequests.length > 0 ? (
          <ul className="space-y-2">
            {receivedRequests.map((request) => (
              <li className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-3" key={request.id}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-200">
                    {request.senderAvatarUrl ? (
                      <img alt={request.senderUsername || "Avatar"} className="h-full w-full object-cover" src={request.senderAvatarUrl} />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-sm font-bold text-zinc-700">
                        {getInitial(request.senderUsername)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">{request.senderUsername || "sin-username"}</p>
                    <p className="text-xs text-zinc-500">@{request.senderUsername || "usuario"}</p>
                  </div>
                </div>
                <form action={respondAction} className="flex gap-2">
                  <input name="requestId" type="hidden" value={request.id} />
                  <Button disabled={isResponding} name="decision" size="sm" type="submit" value="rejected" variant="secondary">✕</Button>
                  <Button disabled={isResponding} name="decision" size="sm" type="submit" value="accepted">✓</Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No tienes solicitudes pendientes.</p>
        )}
        {respondState.error ? <p className="text-sm text-rose-600">{respondState.error}</p> : null}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-950">Tus Amigos</h2>
        {friends.length === 0 ? (
          <EmptyState description="Cuando aceptes solicitudes apareceran aqui." title="Aun no tienes amigos" />
        ) : (
          <ul className="space-y-2">
            {friends.map((friend) => (
              <li className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-3" key={friend.userId}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-200">
                    {friend.avatarUrl ? (
                      <img alt={friend.username || "Avatar"} className="h-full w-full object-cover" src={friend.avatarUrl} />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-sm font-bold text-zinc-700">
                        {getInitial(friend.username)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">{friend.username || "sin-username"}</p>
                    <p className="text-xs text-zinc-500">@{friend.username || "usuario"}</p>
                  </div>
                </div>
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
                    {isRemoving ? "..." : "Eliminar"}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {removeState.error ? <p className="text-sm text-rose-600">{removeState.error}</p> : null}
      </div>

      <div className="rounded-3xl bg-[#c6283a] p-4 text-center text-white shadow-[0_10px_22px_rgba(198,40,58,0.22)]">
        <div className="inline-flex h-8 w-8 items-center justify-center">
          <svg aria-hidden="true" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24">
            <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3.8 18.2c0-2.4 2.2-4.2 5.2-4.2s5.2 1.8 5.2 4.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            <path d="M16.8 8.2h4.4M19 6v4.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </div>
        <h3 className="mt-2 text-xl font-bold leading-tight">Encuentra mas exploradores</h3>
        <p className="mt-2 text-sm text-white/90">Sincroniza tus contactos para ver quien mas esta planificando su proxima aventura en MaPlan.</p>
        <button className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#c6283a]" type="button">Sincronizar contactos</button>
      </div>

      {sendState.error ? <p className="text-sm text-rose-600">{sendState.error}</p> : null}
      {sendState.success ? <p className="text-sm text-emerald-600">Solicitud enviada.</p> : null}
      {sentRequests.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-700">Solicitudes enviadas</h3>
          <ul className="space-y-2">
            {sentRequests.map((request) => (
              <li className="rounded-xl border border-zinc-100 bg-white p-3" key={request.id}>
                <p className="text-sm text-zinc-700">@{request.receiverUsername || "sin-username"}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
