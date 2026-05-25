"use client";

import { useActionState, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GroupCoverPicker } from "@/components/groups/GroupCoverPicker";
import { GroupFriendsSelector } from "@/components/groups/GroupFriendsSelector";
import { createGroupAction } from "@/app/groups/actions";
import type { CreateGroupActionState } from "@/app/groups/actions";
import type { FriendItem } from "@/lib/friends";
import type { GroupJoinPolicy, GroupPlaceEditPolicy } from "@/lib/groups/policies";
import { ROUTES } from "@/utils/constants";

const createInitialState: CreateGroupActionState = { error: null, success: false, groupId: null };

type CreateGroupFormProps = {
  friends: FriendItem[];
};

export function CreateGroupForm({ friends }: CreateGroupFormProps) {
  const router = useRouter();
  const [isNavigatingToGroup, setIsNavigatingToGroup] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [placeEditPolicy, setPlaceEditPolicy] = useState<GroupPlaceEditPolicy>("members_can_edit");
  const [joinPolicy, setJoinPolicy] = useState<GroupJoinPolicy>("invite_only");
  const [createState, createFormAction, isCreatePending] = useActionState(createGroupAction, createInitialState);

  useEffect(() => {
    if (createState.success && createState.groupId) {
      setIsNavigatingToGroup(true);
      router.push(`${ROUTES.groups}/${createState.groupId}`);
      router.refresh();
    }
  }, [createState.groupId, createState.success, router]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    setCoverPreviewUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return nextUrl;
    });
  }

  function toggleFriend(friendId: string) {
    setSelectedFriendIds((currentIds) =>
      currentIds.includes(friendId) ? currentIds.filter((id) => id !== friendId) : [...currentIds, friendId]
    );
  }

  return (
    <form action={createFormAction} className="bg-[#fff8f8]">
      <div className="flex h-12 items-center gap-3 border-b border-rose-100 bg-white px-4">
        <button
          aria-label="Volver a grupos"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#c6283a] transition hover:bg-rose-50"
          onClick={() => router.push(ROUTES.groups)}
          type="button"
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path d="M15 6 9 12l6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-[#c6283a]">Crear nuevo grupo</h1>
      </div>

      <fieldset className="space-y-5 px-5 py-5" disabled={isCreatePending || isNavigatingToGroup}>
        {selectedFriendIds.map((friendId) => (
          <input key={friendId} name="selectedFriendIds" type="hidden" value={friendId} />
        ))}

        <div className="relative mx-auto w-fit">
          <GroupCoverPicker
            actionSlot={
              <button
                aria-expanded={isSettingsOpen}
                aria-label="Ajustes del grupo"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-white text-[#c6283a] shadow-sm transition hover:bg-rose-50"
                onClick={() => setIsSettingsOpen((isOpen) => !isOpen)}
                type="button"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M19 13.3v-2.6l-2-.4a5.7 5.7 0 0 0-.6-1.4l1.1-1.7-1.8-1.8-1.7 1.1c-.5-.3-.9-.5-1.5-.6L12.1 4H9.5l-.4 1.9c-.5.1-1 .4-1.5.6L6 5.4 4.1 7.2l1.1 1.7c-.3.5-.5.9-.6 1.4l-2 .4v2.6l2 .4c.1.5.4 1 .6 1.4l-1.1 1.7L6 18.6l1.7-1.1c.5.3.9.5 1.5.6l.4 1.9h2.6l.4-1.9c.5-.1 1-.4 1.5-.6l1.7 1.1 1.8-1.8-1.1-1.7c.3-.5.5-.9.6-1.4l2-.4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
                </svg>
              </button>
            }
            helperText="Anadir foto de grupo"
            inputName="coverImage"
            onFileChange={handleCoverChange}
            placeholder={
              <svg aria-hidden="true" className="h-8 w-8 text-[#c6283a]/70" fill="none" viewBox="0 0 24 24">
                <path d="M4 17.5V8a2 2 0 0 1 2-2h2l1.4-2h5.2L16 6h2a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
                <path d="M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            }
            previewUrl={coverPreviewUrl}
          />

          {isSettingsOpen ? (
            <div className="absolute left-1/2 top-full z-10 mt-3 w-[270px] -translate-x-1/2 space-y-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-[0_18px_45px_rgba(24,24,27,0.14)]">
              <label className="block space-y-2">
                <span className="text-xs font-bold text-zinc-700">Edicion de lugares</span>
                <select
                  className="h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-xs font-medium text-zinc-800 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  name="placeEditPolicy"
                  onChange={(event) => setPlaceEditPolicy(event.target.value as GroupPlaceEditPolicy)}
                  value={placeEditPolicy}
                >
                  <option value="members_can_edit">Todos pueden anadir lugares</option>
                  <option value="owner_only">Solo el propietario</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold text-zinc-700">Acceso al grupo</span>
                <select
                  className="h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-xs font-medium text-zinc-800 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  name="joinPolicy"
                  onChange={(event) => setJoinPolicy(event.target.value as GroupJoinPolicy)}
                  value={joinPolicy}
                >
                  <option value="invite_only">Solo por invitacion</option>
                  <option value="request_to_join">Solicitud con codigo</option>
                  <option value="open_by_code">Abierto con codigo</option>
                </select>
              </label>
            </div>
          ) : (
            <>
              <input name="placeEditPolicy" type="hidden" value={placeEditPolicy} />
              <input name="joinPolicy" type="hidden" value={joinPolicy} />
            </>
          )}
        </div>
        <label className="block space-y-2">
          <span className="text-[11px] font-bold text-zinc-800">Nombre del grupo</span>
          <input
            className="h-12 w-full rounded-xl border border-rose-200 bg-white px-4 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            name="name"
            placeholder="Ej. Los Foodies de Madrid"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-bold text-zinc-800">Descripcion (opcional)</span>
          <textarea
            className="min-h-[86px] w-full resize-none rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            maxLength={300}
            name="description"
            placeholder="Cual es el proposito de este grupo?"
          />
        </label>

        <GroupFriendsSelector
          friends={friends.map((friend) => ({ id: friend.userId, username: friend.username }))}
          mode="select"
          onToggleSelected={toggleFriend}
          selectedIds={selectedFriendIds}
          title="Anadir Amigos"
        />

        {createState.error ? <p className="text-sm text-rose-600">{createState.error}</p> : null}
        {createState.success ? <p className="text-sm text-emerald-600">Grupo creado correctamente.</p> : null}
        {isNavigatingToGroup ? <p className="text-sm text-zinc-500">Abriendo el grupo...</p> : null}
        <Button className="h-12 w-full rounded-xl text-base font-bold" disabled={isCreatePending || isNavigatingToGroup} type="submit">
          {isCreatePending ? "Creando..." : "Crear Grupo"}
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3.5 19c.5-3 2.2-5 4.5-5s4 2 4.5 5M14 18h6M17 15v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </Button>
      </fieldset>
    </form>
  );
}
