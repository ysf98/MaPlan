"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { updateGroupDetailsAction, updateGroupSettingsAction } from "@/app/groups/[groupId]/actions";
import type { UpdateGroupDetailsActionState, UpdateGroupSettingsActionState } from "@/app/groups/[groupId]/actions";
import { Button } from "@/components/ui/Button";
import type { GroupInvitationItem } from "@/lib/groupInvitations";
import type { GroupJoinPolicy, GroupPlaceEditPolicy } from "@/lib/groups/policies";
import type { GroupJoinRequestItem } from "@/lib/groups/types";

type GroupOwnerControlsProps = {
  groupId: string;
  groupName: string;
  groupDescription: string | null;
  groupCoverImageUrl: string | null;
  joinCode: string;
  role: "owner" | "member";
  placeEditPolicy: GroupPlaceEditPolicy;
  joinPolicy: GroupJoinPolicy;
  pendingRequests: GroupJoinRequestItem[];
  invitableFriends: Array<{ id: string; username: string | null }>;
  groupInvitations: GroupInvitationItem[];
  totalFriendsCount: number;
};

const settingsInitialState: UpdateGroupSettingsActionState = { error: null, success: false };
const detailsInitialState: UpdateGroupDetailsActionState = { error: null, success: false };

function getInitial(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "M";
}

export function GroupOwnerControls({
  groupId,
  groupName,
  groupDescription,
  groupCoverImageUrl,
  joinCode,
  role,
  placeEditPolicy,
  joinPolicy,
  invitableFriends,
  totalFriendsCount
}: GroupOwnerControlsProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [coverValue, setCoverValue] = useState(groupCoverImageUrl || "");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(groupCoverImageUrl);

  const [settingsState, settingsAction, isSettingsPending] = useActionState(updateGroupSettingsAction, settingsInitialState);
  const [detailsState, detailsAction, isDetailsPending] = useActionState(updateGroupDetailsAction, detailsInitialState);

  useEffect(() => {
    if (settingsState.success || detailsState.success) {
      router.refresh();
    }
    if (detailsState.success) {
      setIsEditOpen(false);
    }
  }, [detailsState.success, router, settingsState.success]);

  useEffect(() => {
    if (!isEditOpen) {
      setIsSettingsOpen(false);
      setCoverValue(groupCoverImageUrl || "");
      setCoverPreviewUrl(groupCoverImageUrl);
    }
  }, [groupCoverImageUrl, isEditOpen]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!isEditOpen) return;
      const targetNode = event.target as Node;
      if (!dialogRef.current?.contains(targetNode)) {
        setIsEditOpen(false);
      }
      if (isSettingsOpen && !settingsRef.current?.contains(targetNode)) {
        setIsSettingsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsEditOpen(false);
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isEditOpen]);

  useEffect(() => {
    if (!isEditOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEditOpen]);

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setCoverValue(result);
      setCoverPreviewUrl(result || groupCoverImageUrl || null);
    };
    reader.readAsDataURL(file);
  }

  if (role !== "owner") {
    return null;
  }

  return (
    <>
      <button
        aria-expanded={isEditOpen}
        aria-label="Editar grupo"
        className="grid h-10 w-10 place-items-center rounded-full border border-white/45 bg-white/18 text-white shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-white/28"
        onClick={() => setIsEditOpen(true)}
        type="button"
      >
        <svg aria-hidden="true" className="h-5 w-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" fill="none" viewBox="0 0 24 24">
          <path d="m4 20 3.5-.7L18.6 8.2a1.8 1.8 0 0 0 0-2.6l-.2-.2a1.8 1.8 0 0 0-2.6 0L4.7 16.5 4 20Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="m13.9 7.3 2.8 2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      </button>

      {isEditOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4">
          <div ref={dialogRef}>
            <form
              action={detailsAction}
              className="max-h-[calc(100vh-2rem)] w-[min(28rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-zinc-100 bg-white shadow-[0_18px_45px_rgba(24,24,27,0.14)]"
            >
              <input name="groupId" type="hidden" value={groupId} />
              <input name="coverImageUrl" type="hidden" value={coverValue} />

              <div className="flex h-12 items-center gap-3 border-b border-zinc-100 bg-white px-4">
                <button
                  aria-label="Cerrar editar grupo"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#c6283a] transition hover:bg-rose-50"
                  onClick={() => setIsEditOpen(false)}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path d="M15 6 9 12l6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
                <h2 className="text-base font-bold text-[#c6283a]">Editar grupo</h2>
              </div>

              <fieldset className="space-y-5 px-5 py-5" disabled={isDetailsPending}>
                <div className="mx-auto flex w-fit items-start gap-3">
                  <button
                    className="group grid h-[86px] w-[86px] place-items-center overflow-hidden rounded-full border border-zinc-100 bg-rose-50 shadow-[0_8px_20px_rgba(198,40,58,0.1)]"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    {coverPreviewUrl ? (
                      <img alt="" className="h-full w-full object-cover" src={coverPreviewUrl} />
                    ) : (
                      <span className="text-sm font-bold text-[#c6283a]">{getInitial(groupName)}</span>
                    )}
                  </button>
                  <input accept="image/*" className="hidden" onChange={handleCoverChange} ref={fileInputRef} type="file" />

                  <div className="pt-1">
                    <button
                      aria-expanded={isSettingsOpen}
                      aria-label="Ajustes del grupo"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-100 bg-white text-[#c6283a] shadow-[0_8px_20px_rgba(198,40,58,0.12)] transition hover:bg-rose-50"
                      onClick={() => setIsSettingsOpen((value) => !value)}
                      type="button"
                    >
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M19 13.3v-2.6l-2-.4a5.7 5.7 0 0 0-.6-1.4l1.1-1.7-1.8-1.8-1.7 1.1c-.5-.3-.9-.5-1.5-.6L12.1 4H9.5l-.4 1.9c-.5.1-1 .4-1.5.6L6 5.4 4.1 7.2l1.1 1.7c-.3.5-.5.9-.6 1.4l-2 .4v2.6l2 .4c.1.5.4 1 .6 1.4l-1.1 1.7L6 18.6l1.7-1.1c.5.3.9.5 1.5.6l.4 1.9h2.6l.4-1.9c.5-.1 1-.4 1.5-.6l1.7 1.1 1.8-1.8-1.1-1.7c.3-.5.5-.9.6-1.4l2-.4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-center text-[11px] font-medium text-zinc-500">Pulsa la foto para cambiar la portada</p>

                {isSettingsOpen ? (
                  <div className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_18px_45px_rgba(24,24,27,0.14)]" ref={settingsRef}>
                    <input name="settings_groupId" type="hidden" value={groupId} />
                    <label className="block space-y-2">
                      <span className="text-xs font-bold text-zinc-700">Edicion de lugares</span>
                      <select
                        className="h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-xs font-medium text-zinc-800 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                        defaultValue={placeEditPolicy}
                        name="settings_placeEditPolicy"
                      >
                        <option value="members_can_edit">Todos pueden anadir lugares</option>
                        <option value="owner_only">Solo el propietario</option>
                      </select>
                    </label>
                    <label className="block space-y-2">
                      <span className="text-xs font-bold text-zinc-700">Acceso al grupo</span>
                      <select
                        className="h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-xs font-medium text-zinc-800 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                        defaultValue={joinPolicy}
                        name="settings_joinPolicy"
                      >
                        <option value="invite_only">Solo por invitacion</option>
                        <option value="request_to_join">Solicitud con codigo</option>
                        <option value="open_by_code">Abierto con codigo</option>
                      </select>
                    </label>
                    <div className="rounded-xl border border-zinc-100 bg-white p-3">
                      <p className="text-xs font-medium text-zinc-700">Codigo de invitacion</p>
                      <p className="mt-1 text-sm font-semibold tracking-wide text-zinc-950">{joinCode}</p>
                    </div>
                    {settingsState.error ? <p className="text-xs text-rose-600">{settingsState.error}</p> : null}
                    {settingsState.success ? <p className="text-xs text-emerald-600">Configuracion actualizada.</p> : null}
                    <Button
                      disabled={isSettingsPending}
                      formAction={async (formData) => {
                        formData.set("groupId", String(formData.get("settings_groupId") || ""));
                        formData.set("placeEditPolicy", String(formData.get("settings_placeEditPolicy") || ""));
                        formData.set("joinPolicy", String(formData.get("settings_joinPolicy") || ""));
                        await settingsAction(formData);
                      }}
                      size="sm"
                      type="submit"
                    >
                      {isSettingsPending ? "Guardando..." : "Guardar ajustes"}
                    </Button>
                    <Button onClick={() => setIsSettingsOpen(false)} size="sm" type="button" variant="ghost">
                      Cerrar
                    </Button>
                  </div>
                ) : null}

                <label className="block space-y-2">
                  <span className="text-[11px] font-bold text-zinc-800">Nombre del grupo</span>
                  <input
                    className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                    defaultValue={groupName}
                    maxLength={80}
                    name="name"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[11px] font-bold text-zinc-800">Descripcion (opcional)</span>
                  <textarea
                    className="min-h-[86px] w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                    defaultValue={groupDescription || ""}
                    maxLength={300}
                    name="description"
                    placeholder="Cual es el proposito de este grupo?"
                  />
                </label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-zinc-950">Invitar amigos</h3>
                    <span className="rounded-full bg-[#ffdce0] px-4 py-1 text-[11px] font-bold text-[#c6283a]">{invitableFriends.length} disponibles</span>
                  </div>
                  {invitableFriends.length === 0 ? (
                    <p className="rounded-2xl bg-white px-4 py-3 text-sm text-zinc-500 shadow-[0_8px_20px_rgba(198,40,58,0.08)]">
                      {totalFriendsCount === 0
                        ? "Anade amigos primero para poder invitarlos al grupo."
                        : "Todos tus amigos ya estan invitados o ya son miembros de este grupo."}
                    </p>
                  ) : (
                    <ul className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
                      {invitableFriends.map((friend) => (
                        <li className="rounded-2xl bg-white px-3 py-3 shadow-[0_8px_20px_rgba(198,40,58,0.08)]" key={friend.id}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-zinc-950">{friend.username || "Sin username"}</p>
                              <p className="truncate text-xs font-medium text-zinc-500">@{friend.username || "sin-username"}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {detailsState.error ? <p className="text-sm text-rose-600">{detailsState.error}</p> : null}
                {detailsState.success ? <p className="text-sm text-emerald-600">Grupo actualizado.</p> : null}

                <div className="flex items-center justify-end gap-2">
                  <Button onClick={() => setIsEditOpen(false)} size="sm" type="button" variant="ghost">
                    Cancelar
                  </Button>
                  <Button disabled={isDetailsPending} size="sm" type="submit">
                    {isDetailsPending ? "Guardando..." : "Guardar grupo"}
                  </Button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
