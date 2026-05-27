"use client";

import { useMemo, useState } from "react";

type FriendOption = {
  id: string;
  username: string | null;
};

type GroupFriendsSelectorProps = {
  friends: FriendOption[];
  title?: string;
  mode: "select" | "invite";
  selectedIds?: string[];
  onToggleSelected?: (friendId: string) => void;
  onInvite?: (friendId: string) => void;
  invitingFriendId?: string | null;
  emptyMessage?: string;
};

function getInitial(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "M";
}

function getFriendChipColor(index: number): string {
  return ["#c6283a", "#0f766e", "#7c3aed", "#d97706"][index % 4];
}

export function GroupFriendsSelector({
  friends,
  title = "Anadir Amigos",
  mode,
  selectedIds = [],
  onToggleSelected,
  onInvite,
  invitingFriendId = null,
  emptyMessage
}: GroupFriendsSelectorProps) {
  const [searchValue, setSearchValue] = useState("");

  const filteredFriends = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return friends;
    return friends.filter((friend) => (friend.username || "sin-username").toLowerCase().includes(query));
  }, [friends, searchValue]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-zinc-950">{title}</h3>
        <span className="rounded-full bg-[#ffdce0] px-4 py-1 text-[11px] font-bold text-[#c6283a]">
          {mode === "select" ? `${selectedIds.length} seleccionados` : `${friends.length} disponibles`}
        </span>
      </div>

      <label className="relative block">
        <svg aria-hidden="true" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24">
          <path d="m20 20-4.5-4.5M10.8 17a6.2 6.2 0 1 0 0-12.4 6.2 6.2 0 0 0 0 12.4Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
        <input
          className="h-12 w-full rounded-full border border-transparent bg-white px-11 text-sm text-zinc-950 shadow-sm placeholder:text-zinc-400 focus:border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-100"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Buscar amigos por nombre..."
          type="search"
          value={searchValue}
        />
      </label>

      {friends.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-zinc-500 shadow-[0_8px_20px_rgba(198,40,58,0.08)]">
          {emptyMessage || "Tus amigos apareceran aqui cuando tengas contactos."}
        </p>
      ) : filteredFriends.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-zinc-500 shadow-[0_8px_20px_rgba(198,40,58,0.08)]">No encontramos amigos con ese nombre.</p>
      ) : (
        <ul className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
          {filteredFriends.map((friend, index) => {
            const isSelected = mode === "select" ? selectedIds.includes(friend.id) : false;
            const isInviting = mode === "invite" ? invitingFriendId === friend.id : false;

            return (
              <li className="rounded-2xl bg-white px-3 py-3 shadow-[0_8px_20px_rgba(198,40,58,0.08)]" key={friend.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: getFriendChipColor(index) }}
                    >
                      {getInitial(friend.username)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-950">{friend.username || "Sin username"}</p>
                      <p className="truncate text-xs font-medium text-zinc-500">@{friend.username || "sin-username"}</p>
                    </div>
                  </div>

                  {mode === "select" ? (
                    <button
                      aria-label={isSelected ? "Quitar amigo" : "Seleccionar amigo"}
                      className={
                        isSelected
                          ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c6283a] text-white"
                          : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-[#c6283a]"
                      }
                      onClick={() => onToggleSelected?.(friend.id)}
                      type="button"
                    >
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                        {isSelected ? (
                          <path d="m6 12 4 4 8-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        ) : (
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                        )}
                      </svg>
                    </button>
                  ) : (
                    <button
                      aria-label="Invitar amigo"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-[#c6283a] disabled:opacity-50"
                      disabled={isInviting}
                      onClick={() => onInvite?.(friend.id)}
                      type="button"
                    >
                      {isInviting ? (
                        <span className="text-[10px] font-semibold">...</span>
                      ) : (
                        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
