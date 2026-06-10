"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import {
  addPlaceToGroupPlanAction,
  createGroupPlanAction,
  deleteGroupPlanAction,
  removeGroupPlanPlaceAction,
  voteGroupPlanAction,
  type AddPlaceToGroupPlanActionState,
  type CreateGroupPlanActionState,
  type DeleteGroupPlanActionState,
  type RemoveGroupPlanPlaceActionState,
  type VoteGroupPlanActionState
} from "@/app/groups/[groupId]/actions";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import type { GroupPlanItem } from "@/lib/groupPlans";
import type { GroupPlace } from "@/lib/places/shared";

type GroupPlansTabProps = {
  groupId: string;
  groupName: string;
  plans: GroupPlanItem[];
  places: GroupPlace[];
  canCreatePlans: boolean;
};

const createInitialState: CreateGroupPlanActionState = { error: null, success: false };
const voteInitialState: VoteGroupPlanActionState = { error: null, success: false };
const deleteInitialState: DeleteGroupPlanActionState = { error: null, success: false };
const addPlaceInitialState: AddPlaceToGroupPlanActionState = { error: null, success: false };
const removePlaceInitialState: RemoveGroupPlanPlaceActionState = { error: null, success: false };

function formatPlanDate(date: string | null): string {
  if (!date) {
    return "Sin fecha cerrada";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "Fecha por confirmar";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "full"
  }).format(parsed);
}

function formatPlanTime(date: string | null): string | null {
  if (!date) {
    return null;
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

function shortDate(date: string | null): string {
  if (!date) {
    return "Sin fecha";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short"
  }).format(parsed);
}

function buildPlanPlaceDateTime(planDate: string | null, timeValue: string): string {
  if (!planDate || !timeValue) {
    return "";
  }

  const parsedDate = new Date(planDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${timeValue}`;
}

function voteSummary(plan: GroupPlanItem): string {
  if (plan.attendingCount > 0) {
    return `${plan.attendingCount} confirmados`;
  }

  if (plan.notAttendingCount > 0) {
    return `${plan.notAttendingCount} no van`;
  }

  return "Aun sin votos";
}

function GroupIcon() {
  return (
    <svg className="h-4 w-4 text-[#c6283a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21H3v-4z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  );
}

export function GroupPlansTab({ groupId, groupName, plans, places, canCreatePlans }: GroupPlansTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [planToDelete, setPlanToDelete] = useState<GroupPlanItem | null>(null);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [selectedGroupPlaceId, setSelectedGroupPlaceId] = useState("");
  const [placeTime, setPlaceTime] = useState("");
  const [placeNote, setPlaceNote] = useState("");
  const [planPlaceToDeleteId, setPlanPlaceToDeleteId] = useState<string | null>(null);
  const [createState, createAction, isCreating] = useActionState(createGroupPlanAction, createInitialState);
  const [voteState, voteAction, isVoting] = useActionState(voteGroupPlanAction, voteInitialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteGroupPlanAction, deleteInitialState);
  const [addPlaceState, addPlaceAction, isAddingPlace] = useActionState(addPlaceToGroupPlanAction, addPlaceInitialState);
  const [removePlaceState, removePlaceAction, isRemovingPlace] = useActionState(removeGroupPlanPlaceAction, removePlaceInitialState);

  const sortedPlans = useMemo(
    () =>
      [...plans].sort((a, b) => {
        const aTime = a.plannedDate ? new Date(a.plannedDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.plannedDate ? new Date(b.plannedDate).getTime() : Number.MAX_SAFE_INTEGER;
        if (aTime !== bTime) {
          return aTime - bTime;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [plans]
  );

  const selectedPlan = useMemo(
    () => sortedPlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [selectedPlanId, sortedPlans]
  );

  const availablePlacesForSelectedPlan = useMemo(() => {
    if (!selectedPlan) {
      return [];
    }

    const usedPlaceIds = new Set(selectedPlan.places.map((place) => place.placeId));
    return places.filter((place) => !usedPlaceIds.has(place.id));
  }, [places, selectedPlan]);

  useEffect(() => {
    if (!createState.success) {
      return;
    }

    setTitle("");
    setDescription("");
    setPlannedDate("");
    setIsCreateOpen(false);
  }, [createState.success]);

  useEffect(() => {
    if (!deleteState.success) {
      return;
    }

    setPlanToDelete(null);
    if (selectedPlanId === planToDelete?.id) {
      setSelectedPlanId(null);
    }
  }, [deleteState.success, planToDelete?.id, selectedPlanId]);

  useEffect(() => {
    if (!addPlaceState.success) {
      return;
    }

    setIsAddPlaceOpen(false);
    setSelectedGroupPlaceId("");
    setPlaceTime("");
    setPlaceNote("");
  }, [addPlaceState.success]);

  useEffect(() => {
    if (!removePlaceState.success) {
      return;
    }

    setPlanPlaceToDeleteId(null);
  }, [removePlaceState.success]);

  if (selectedPlan) {
    return (
      <div className="-mx-1.5 min-h-[720px] bg-[#fff8f7] px-5 py-4">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-white/80 hover:text-[#c6283a]"
              onClick={() => setSelectedPlanId(null)}
              type="button"
            >
              <BackIcon />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_8px_18px_rgba(24,24,27,0.08)]">
              <span className="text-sm font-bold text-[#c6283a]">MaP</span>
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-[#c6283a]">
            <GroupIcon />
            {groupName}
          </div>

          <div className="mt-7 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Nombre del Plan</span>
              <div className="flex min-h-14 items-center gap-3 rounded-[22px] bg-[#fdeeee] px-4 py-3 text-zinc-900">
                <PencilIcon />
                <span className="text-[15px] font-semibold leading-5">{selectedPlan.title}</span>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Fecha</span>
              <div className="flex min-h-14 items-center gap-3 rounded-[22px] bg-[#fff1ef] px-4 py-3 text-zinc-900">
                <CalendarIcon />
                <span className="text-[15px] font-semibold leading-5">{formatPlanDate(selectedPlan.plannedDate)}</span>
              </div>
            </label>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[28px] font-bold text-zinc-950">La Ruta</h4>
              <span className="text-xs font-semibold text-[#c6283a]">{selectedPlan.places.length} Paradas</span>
            </div>

            <div className="relative mt-5 pl-7">
              <div className="absolute left-2 top-2 bottom-8 w-px bg-rose-200" />

              <div className="space-y-4">
                {selectedPlan.places.map((place, index) => (
                  <div className="relative" key={place.id}>
                    <div
                      className={`absolute left-[-1.65rem] top-7 h-4 w-4 rounded-full border-2 ${
                        index === selectedPlan.places.length - 1 ? "border-rose-300" : "border-[#c6283a]"
                      } bg-[#fff8f7]`}
                    />
                    <div className="flex items-center gap-3 rounded-[24px] bg-white p-3 shadow-[0_12px_30px_rgba(181,35,48,0.08)]">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-rose-100">
                        {place.imageUrl ? (
                          <img alt={place.name} className="h-full w-full object-cover" src={place.imageUrl} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#c6283a]">
                            {place.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold leading-5 text-zinc-950 break-words">{place.name}</p>
                        <div className="mt-1 flex items-start gap-1.5 text-sm text-zinc-500">
                          <LocationIcon />
                          <span className="line-clamp-2">
                            {place.address}
                            {place.city ? `, ${place.city}` : ""}
                          </span>
                        </div>
                        {place.plannedAt ? (
                          <span className="mt-2 inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-[#ff5a5f]">
                            {formatPlanTime(place.plannedAt)} h
                          </span>
                        ) : null}
                      </div>
                      {selectedPlan.isCreator ? (
                        <button
                          className="rounded-full p-2 text-zinc-300 transition hover:text-rose-500"
                          onClick={() => setPlanPlaceToDeleteId(place.id)}
                          type="button"
                        >
                          <TrashIcon />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                <div className="relative">
                  <div className="absolute left-[-1.65rem] top-6 h-4 w-4 rounded-full border-2 border-rose-200 bg-[#fff8f7]" />
                  <button
                    className="flex h-16 w-full items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-rose-200 bg-transparent text-sm font-semibold text-zinc-600 transition hover:border-[#ff5a5f] hover:text-[#c6283a]"
                    onClick={() => setIsAddPlaceOpen(true)}
                    type="button"
                  >
                    <PlusIcon />
                    Anadir Lugar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-[28px] font-bold text-zinc-950">Asistencia y Votos</h4>
            <div className="mt-4 rounded-[28px] bg-[#fdf0ee] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.max(1, Math.min(selectedPlan.attendingCount, 3)) }).map((_, index) => (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#fff8f7] bg-zinc-800 text-[11px] font-bold text-white"
                      key={index}
                    >
                      {index + 1}
                    </div>
                  ))}
                  {selectedPlan.attendingCount > 3 ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#fff8f7] bg-rose-200 text-[11px] font-bold text-[#c6283a]">
                      +{selectedPlan.attendingCount - 3}
                    </div>
                  ) : null}
                </div>
                <span className="text-xs font-semibold text-emerald-700">{voteSummary(selectedPlan)}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <button
                  className={`rounded-[20px] p-3 text-center transition ${
                    selectedPlan.currentUserVote === "attending" ? "bg-emerald-100 text-emerald-700" : "bg-white/70 text-zinc-500"
                  }`}
                  disabled={isVoting}
                  onClick={() => {
                    const payload = new FormData();
                    payload.set("groupId", groupId);
                    payload.set("planId", selectedPlan.id);
                    payload.set("vote", "attending");
                    startTransition(() => voteAction(payload));
                  }}
                  type="button"
                >
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full">
                    <CheckIcon />
                  </div>
                  <p className="mt-1 text-sm font-semibold">Voy</p>
                </button>
                <button className="rounded-[20px] bg-white/70 p-3 text-center text-zinc-500 transition" disabled type="button">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full">
                    <QuestionIcon />
                  </div>
                  <p className="mt-1 text-sm font-semibold">Quizas</p>
                </button>
                <button
                  className={`rounded-[20px] p-3 text-center transition ${
                    selectedPlan.currentUserVote === "not_attending" ? "bg-rose-100 text-rose-600" : "bg-white/70 text-zinc-500"
                  }`}
                  disabled={isVoting}
                  onClick={() => {
                    const payload = new FormData();
                    payload.set("groupId", groupId);
                    payload.set("planId", selectedPlan.id);
                    payload.set("vote", "not_attending");
                    startTransition(() => voteAction(payload));
                  }}
                  type="button"
                >
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full">
                    <CloseIcon />
                  </div>
                  <p className="mt-1 text-sm font-semibold">No voy</p>
                </button>
              </div>
            </div>
            {voteState.error ? <p className="mt-3 text-sm text-rose-600">{voteState.error}</p> : null}
          </div>

          <div className="pt-8">
            <Button className="h-14 rounded-[22px] text-base" fullWidth type="button">
              {selectedPlan.isCreator ? "Guardar Plan" : "Ver Plan"}
            </Button>
          </div>
        </div>

        <ConfirmDialog
          cancelLabel="Cancelar"
          confirmLabel="Eliminar plan"
          description={planToDelete ? `Se borrara "${planToDelete.title}" para todo el grupo.` : undefined}
          isPending={isDeleting}
          onCancel={() => setPlanToDelete(null)}
          onConfirm={() => {
            if (!planToDelete) {
              return;
            }

            const payload = new FormData();
            payload.set("groupId", groupId);
            payload.set("planId", planToDelete.id);
            startTransition(() => deleteAction(payload));
          }}
          open={Boolean(planToDelete)}
          title="Eliminar plan"
        />

        <ConfirmDialog
          cancelLabel="Cancelar"
          confirmLabel="Eliminar parada"
          description="Se quitara este lugar de la ruta del plan."
          isPending={isRemovingPlace}
          onCancel={() => setPlanPlaceToDeleteId(null)}
          onConfirm={() => {
            if (!planPlaceToDeleteId) {
              return;
            }

            const payload = new FormData();
            payload.set("groupId", groupId);
            payload.set("planId", selectedPlan.id);
            payload.set("planPlaceId", planPlaceToDeleteId);
            startTransition(() => removePlaceAction(payload));
          }}
          open={Boolean(planPlaceToDeleteId)}
          title="Eliminar lugar"
        />

        {deleteState.error ? <p className="mt-3 text-sm text-rose-600">{deleteState.error}</p> : null}
        {removePlaceState.error ? <p className="mt-3 text-sm text-rose-600">{removePlaceState.error}</p> : null}

        {isAddPlaceOpen ? (
          <div className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/45 p-4 sm:items-center" onClick={() => setIsAddPlaceOpen(false)}>
            <div
              className="w-full max-w-lg rounded-[28px] border border-rose-100 bg-[#fff8f7] p-5 shadow-[0_18px_45px_rgba(24,24,27,0.22)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-950">Anadir lugar al plan</h3>
                  <p className="mt-1 text-sm text-zinc-600">Selecciona un lugar ya guardado del grupo y, si quieres, anade hora y nota.</p>
                </div>
                <button
                  aria-label="Cerrar"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-white text-zinc-500"
                  onClick={() => setIsAddPlaceOpen(false)}
                  type="button"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-zinc-700">Lugar del grupo</span>
                  <select
                    className="h-12 w-full rounded-2xl border border-transparent bg-white px-4 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                    onChange={(event) => setSelectedGroupPlaceId(event.target.value)}
                    value={selectedGroupPlaceId}
                  >
                    <option value="">Selecciona un lugar</option>
                    {availablePlacesForSelectedPlan.map((place) => (
                      <option key={place.id} value={place.id}>
                        {place.name}
                      </option>
                    ))}
                  </select>
                </label>

                <Input label="Hora del lugar" onChange={(event) => setPlaceTime(event.target.value)} type="time" value={placeTime} />
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-zinc-700">Nota breve</span>
                  <textarea
                    className="min-h-[96px] w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                    maxLength={280}
                    onChange={(event) => setPlaceNote(event.target.value)}
                    placeholder="Por ejemplo: quedar aqui primero"
                    value={placeNote}
                  />
                </label>
                {addPlaceState.error ? <p className="text-sm text-rose-600">{addPlaceState.error}</p> : null}
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setIsAddPlaceOpen(false)} size="sm" type="button" variant="ghost">
                    Cancelar
                  </Button>
                  <Button
                    disabled={!selectedGroupPlaceId || isAddingPlace || availablePlacesForSelectedPlan.length === 0}
                    onClick={() => {
                      const payload = new FormData();
                      payload.set("groupId", groupId);
                      payload.set("planId", selectedPlan.id);
                      payload.set("placeId", selectedGroupPlaceId);
                      payload.set("plannedAt", buildPlanPlaceDateTime(selectedPlan.plannedDate, placeTime));
                      payload.set("note", placeNote);
                      startTransition(() => addPlaceAction(payload));
                    }}
                    size="sm"
                    type="button"
                  >
                    {isAddingPlace ? "Guardando..." : "Anadir al plan"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-rose-100 bg-[#fff8f7] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-950">Planes del grupo</h3>
            <p className="mt-1 text-sm text-zinc-600">Entra a un plan para ver la ruta, la asistencia y sus lugares.</p>
          </div>
          {canCreatePlans ? (
            <Button onClick={() => setIsCreateOpen((value) => !value)} type="button">
              {isCreateOpen ? "Cerrar formulario" : "Crear plan"}
            </Button>
          ) : (
            <p className="text-sm text-zinc-600">Solo se pueden crear planes en grupos abiertos.</p>
          )}
        </div>

        {isCreateOpen ? (
          <div className="mt-5 grid gap-4 border-t border-rose-100 pt-5">
            <Input label="Nombre del plan" onChange={(event) => setTitle(event.target.value)} value={title} />
            <Input
              label="Fecha del plan"
              onChange={(event) => setPlannedDate(event.target.value)}
              type="datetime-local"
              value={plannedDate}
            />
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Descripcion</span>
              <textarea
                className="min-h-[110px] w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Por ejemplo: cena tranquila y luego copa"
                value={description}
              />
            </label>
            {createState.error ? <p className="text-sm text-rose-600">{createState.error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsCreateOpen(false)} type="button" variant="ghost">
                Cancelar
              </Button>
              <Button
                disabled={!title.trim() || isCreating}
                onClick={() => {
                  const payload = new FormData();
                  payload.set("groupId", groupId);
                  payload.set("title", title);
                  payload.set("description", description);
                  payload.set("plannedDate", plannedDate);
                  startTransition(() => createAction(payload));
                }}
                type="button"
              >
                {isCreating ? "Creando..." : "Guardar plan"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {!sortedPlans.length ? (
        <EmptyState
          description="Todavia no hay planes creados. Prueba a montar la primera salida del grupo."
          title="Sin planes por ahora"
        />
      ) : (
        <div className="space-y-3">
          {sortedPlans.map((plan) => (
            <button className="w-full text-left" key={plan.id} onClick={() => setSelectedPlanId(plan.id)} type="button">
              <div className="rounded-[24px] border border-zinc-100 bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_12px_30px_rgba(181,35,48,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-zinc-950">{plan.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">{shortDate(plan.plannedDate)}</p>
                  </div>
                  <div className="rounded-full bg-[#fff1ef] px-3 py-1 text-xs font-semibold text-[#c6283a]">
                    {plan.places.length} paradas
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
