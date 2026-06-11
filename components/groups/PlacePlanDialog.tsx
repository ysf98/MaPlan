"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  addPlaceToGroupPlanAction,
  createGroupPlanAction,
  type AddPlaceToGroupPlanActionState,
  type CreateGroupPlanActionState
} from "@/app/groups/[groupId]/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { GroupPlanItem } from "@/lib/groupPlans";
import { extractPlanDatePart, getTodayPlanDatePart, isPlanDateOnOrAfter } from "@/lib/groupPlansShared";
import type { GroupPlace } from "@/lib/places/shared";

type PlacePlanDialogProps = {
  groupId: string;
  placeId: string;
  canManagePlans: boolean;
  plans: GroupPlanItem[];
  places?: GroupPlace[];
  compact?: boolean;
};

const createInitialState: CreateGroupPlanActionState = { error: null, success: false };
const addInitialState: AddPlaceToGroupPlanActionState = { error: null, success: false };

export function PlacePlanDialog({
  groupId,
  placeId,
  canManagePlans,
  plans,
  places = [],
  compact = false
}: PlacePlanDialogProps) {
  const [mode, setMode] = useState<"add" | "create" | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [placePlannedAt, setPlacePlannedAt] = useState("");
  const [placeNote, setPlaceNote] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [routePlaceIds, setRoutePlaceIds] = useState<string[]>([]);
  const [dismissedRecommendationIds, setDismissedRecommendationIds] = useState<Record<string, true>>({});
  const [minPlanDate] = useState(() => getTodayPlanDatePart());
  const [createState, createAction, isCreating] = useActionState(createGroupPlanAction, createInitialState);
  const [addState, addAction, isAdding] = useActionState(addPlaceToGroupPlanAction, addInitialState);

  const availablePlans = useMemo(() => plans.filter((plan) => plan.acceptsNewPlaces), [plans]);
  const triggerClass = compact ? "h-8 rounded-full px-3 text-[11px]" : "h-10 rounded-2xl px-4 text-sm";
  const selectedPlan = useMemo(
    () => availablePlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [availablePlans, selectedPlanId]
  );
  const routePlaces = useMemo(
    () => routePlaceIds.map((id) => places.find((place) => place.id === id)).filter((place): place is GroupPlace => Boolean(place)),
    [places, routePlaceIds]
  );
  const recommendedPlaces = useMemo(
    () =>
      places
        .filter((place) => !routePlaceIds.includes(place.id) && !dismissedRecommendationIds[place.id])
        .slice(0, 6),
    [dismissedRecommendationIds, places, routePlaceIds]
  );

  function buildPlanPlaceDateTime(planDate: string | null, timeValue: string): string {
    if (!planDate || !timeValue) {
      return "";
    }

    const datePart = extractPlanDatePart(planDate);
    if (!datePart) {
      return "";
    }

    return `${datePart}T${timeValue}`;
  }

  function isOptionalPlanDateAllowed(value: string): boolean {
    const trimmed = value.trim();
    return trimmed.length === 0 || isPlanDateOnOrAfter(trimmed, minPlanDate);
  }

  useEffect(() => {
    if (!createState.success && !addState.success) {
      return;
    }

    setMode(null);
    setSelectedPlanId("");
    setPlacePlannedAt("");
    setPlaceNote("");
    setTitle("");
    setDescription("");
    setPlannedDate("");
    setRoutePlaceIds([]);
    setDismissedRecommendationIds({});
  }, [addState.success, createState.success]);

  useEffect(() => {
    if (mode === "create") {
      setRoutePlaceIds([placeId]);
      setDismissedRecommendationIds({});
    }
  }, [mode, placeId]);

  if (!canManagePlans) {
    return null;
  }

  const isCreatePlanDateAllowed = isOptionalPlanDateAllowed(plannedDate);

  const modal = mode ? (
    <div
      className={
        mode === "create"
          ? "fixed inset-0 z-[120] overflow-y-auto bg-[#fff8f7] px-5 py-4"
          : "fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/45 p-4 sm:items-center"
      }
      onClick={() => setMode(null)}
    >
      <div
        className={
          mode === "create"
            ? "mx-auto w-full max-w-xl bg-[#fff8f7]"
            : "w-full max-w-lg rounded-[28px] border border-rose-100 bg-[#fff8f7] p-5 shadow-[0_18px_45px_rgba(24,24,27,0.22)]"
        }
        onClick={(event) => event.stopPropagation()}
      >
        {mode === "create" ? (
          <div className="flex items-center justify-between gap-3">
            <button
              aria-label="Volver"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-white/80 hover:text-[#c6283a]"
              onClick={() => setMode(null)}
              type="button"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="h-9 w-9" aria-hidden="true" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-950">Anadir lugar a un plan</h3>
              <p className="mt-1 text-sm text-zinc-600">Elige un plan abierto del grupo y, si quieres, deja una hora o una nota.</p>
            </div>
            <button
              aria-label="Cerrar"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-white text-zinc-500"
              onClick={() => setMode(null)}
              type="button"
            >
              <span className="text-lg leading-none">x</span>
            </button>
          </div>
        )}

        {mode === "add" ? (
          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Plan abierto</span>
              <select
                className="h-12 w-full rounded-2xl border border-transparent bg-white px-4 text-sm text-zinc-900 outline-none ring-0 focus:border-[#ff5a5f]"
                onChange={(event) => setSelectedPlanId(event.target.value)}
                value={selectedPlanId}
              >
                <option value="">Selecciona un plan</option>
                {availablePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Hora del lugar" onChange={(event) => setPlacePlannedAt(event.target.value)} type="time" value={placePlannedAt} />
            {selectedPlan && !selectedPlan.plannedDate ? (
              <p className="text-xs text-zinc-500">Este plan no tiene fecha cerrada, asi que la hora del lugar es opcional.</p>
            ) : null}
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Nota breve</span>
              <textarea
                className="min-h-[96px] w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                maxLength={280}
                onChange={(event) => setPlaceNote(event.target.value)}
                placeholder="Por ejemplo: mejor llegar sobre las 21:00"
                value={placeNote}
              />
            </label>
            {addState.error ? <p className="text-sm text-rose-600">{addState.error}</p> : null}
            {!availablePlans.length ? (
              <p className="text-sm text-zinc-600">Todavia no hay planes abiertos disponibles.</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setMode(null)} size="sm" type="button" variant="ghost">
                Cancelar
              </Button>
              <Button
                disabled={!selectedPlanId || isAdding || availablePlans.length === 0}
                onClick={() => {
                  const payload = new FormData();
                  payload.set("groupId", groupId);
                  payload.set("planId", selectedPlanId);
                  payload.set("placeId", placeId);
                  payload.set("plannedAt", buildPlanPlaceDateTime(selectedPlan?.plannedDate ?? null, placePlannedAt));
                  payload.set("note", placeNote);
                  startTransition(() => addAction(payload));
                }}
                size="sm"
                type="button"
              >
                {isAdding ? "Guardando..." : "Guardar en plan"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Nombre del Plan</span>
              <Input
                className="bg-[#fdeeee]"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ruta de tapas"
                value={title}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Fecha</span>
              <Input
                className="bg-[#fff1ef]"
                min={minPlanDate}
                onChange={(event) => setPlannedDate(event.target.value)}
                type="date"
                value={plannedDate}
              />
            </label>
            {!isCreatePlanDateAllowed ? (
              <p className="text-sm text-rose-600">La fecha del plan no puede ser anterior a hoy.</p>
            ) : null}
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Descripcion</span>
              <textarea
                className="min-h-[110px] w-full rounded-[22px] border border-transparent bg-[#fff4f3] px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Cuenta de que va el plan"
                value={description}
              />
            </label>
            <div className="pt-2">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-[28px] font-bold text-zinc-950">La Ruta</h4>
                <span className="text-xs font-semibold text-[#c6283a]">{routePlaces.length} Paradas</span>
              </div>
              <div className="relative mt-5 pl-7">
                <div className="absolute left-2 top-2 bottom-8 w-px bg-rose-200" />
                <div className="space-y-4">
                      {routePlaces.map((place) => (
                        <div className="relative" key={place.id}>
                          <div className="absolute left-[-1.65rem] top-7 h-4 w-4 rounded-full border-2 border-[#c6283a] bg-[#fff8f7]" />
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
                              <p className="break-words text-base font-bold leading-5 text-zinc-950">{place.name}</p>
                              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{place.address}{place.city ? `, ${place.city}` : ""}</p>
                            </div>
                            <button
                              aria-label="Quitar parada"
                              className="rounded-full p-2 text-zinc-300 transition hover:text-rose-500"
                              onClick={() => setRoutePlaceIds((current) => current.filter((id) => id !== place.id))}
                              type="button"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      {recommendedPlaces.map((place) => (
                        <div className="relative" key={place.id}>
                          <div className="absolute left-[-1.65rem] top-7 h-4 w-4 rounded-full border-2 border-dashed border-rose-200 bg-[#fff8f7]" />
                          <div className="flex items-center gap-3 rounded-[24px] border border-dashed border-rose-200 bg-[#fff8f7] p-3">
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
                              <p className="break-words text-base font-bold leading-5 text-zinc-950">{place.name}</p>
                              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{place.address}{place.city ? `, ${place.city}` : ""}</p>
                              <span className="mt-2 inline-flex rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-[#c6283a]">
                                Recomendado
                              </span>
                            </div>
                            <div className="flex shrink-0 flex-col gap-2">
                              <button
                                aria-label="Anadir lugar recomendado"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                                onClick={() => setRoutePlaceIds((current) => [...current, place.id])}
                                type="button"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                                  <path d="m5 13 4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                aria-label="Descartar recomendacion"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-500 transition hover:bg-rose-50"
                                onClick={() => setDismissedRecommendationIds((current) => ({ ...current, [place.id]: true }))}
                                type="button"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                  <path d="M18 6 6 18" />
                                  <path d="m6 6 12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            </div>
            {createState.error ? <p className="text-sm text-rose-600">{createState.error}</p> : null}
            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={() => setMode(null)} size="sm" type="button" variant="ghost">
                Cancelar
              </Button>
              <Button
                className="h-12 rounded-[20px] px-6"
                disabled={!title.trim() || !isCreatePlanDateAllowed || isCreating}
                onClick={() => {
                  const payload = new FormData();
                  payload.set("groupId", groupId);
                  payload.set("title", title);
                  payload.set("description", description);
                  payload.set("plannedDate", plannedDate);
                  payload.set("initialPlaceId", routePlaceIds[0] ?? placeId);
                  routePlaceIds.forEach((id) => payload.append("initialPlaceIds", id));
                  payload.set("initialPlacePlannedAt", buildPlanPlaceDateTime(plannedDate, placePlannedAt));
                  payload.set("initialPlaceNote", placeNote);
                  startTransition(() => createAction(payload));
                }}
                size="sm"
                type="button"
              >
                {isCreating ? "Creando..." : "Crear plan"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button className={triggerClass} onClick={() => setMode("add")} size="sm" type="button" variant="secondary">
          Anadir a plan
        </Button>
        <Button className={triggerClass} onClick={() => setMode("create")} size="sm" type="button" variant="primary">
          Crear plan
        </Button>
      </div>
      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
