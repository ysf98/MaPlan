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

type PlacePlanDialogProps = {
  groupId: string;
  placeId: string;
  canManagePlans: boolean;
  plans: GroupPlanItem[];
  compact?: boolean;
};

const createInitialState: CreateGroupPlanActionState = { error: null, success: false };
const addInitialState: AddPlaceToGroupPlanActionState = { error: null, success: false };

export function PlacePlanDialog({
  groupId,
  placeId,
  canManagePlans,
  plans,
  compact = false
}: PlacePlanDialogProps) {
  const [mode, setMode] = useState<"add" | "create" | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [placePlannedAt, setPlacePlannedAt] = useState("");
  const [placeNote, setPlaceNote] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [minPlanDate] = useState(() => getTodayPlanDatePart());
  const [createState, createAction, isCreating] = useActionState(createGroupPlanAction, createInitialState);
  const [addState, addAction, isAdding] = useActionState(addPlaceToGroupPlanAction, addInitialState);

  const availablePlans = useMemo(() => plans.filter((plan) => plan.acceptsNewPlaces), [plans]);
  const triggerClass = compact ? "h-8 rounded-full px-3 text-[11px]" : "h-10 rounded-2xl px-4 text-sm";
  const selectedPlan = useMemo(
    () => availablePlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [availablePlans, selectedPlanId]
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
  }, [addState.success, createState.success]);

  if (!canManagePlans) {
    return null;
  }

  const isCreatePlanDateAllowed = isOptionalPlanDateAllowed(plannedDate);

  const modal = mode ? (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/45 p-4 sm:items-center" onClick={() => setMode(null)}>
      <div
        className="w-full max-w-lg rounded-[28px] border border-rose-100 bg-[#fff8f7] p-5 shadow-[0_18px_45px_rgba(24,24,27,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-950">
              {mode === "add" ? "Anadir lugar a un plan" : "Crear plan con este lugar"}
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              {mode === "add"
                ? "Elige un plan abierto del grupo y, si quieres, deja una hora o una nota."
                : "El lugar quedara guardado directamente dentro del nuevo plan."}
            </p>
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
          <div className="mt-5 space-y-4">
            <Input label="Nombre del plan" onChange={(event) => setTitle(event.target.value)} value={title} />
            <Input
              label="Fecha del plan"
              hint="Formato dia/mes/ano. Tiene que ser hoy o una fecha futura."
              inputMode="numeric"
              onChange={(event) => setPlannedDate(event.target.value)}
              placeholder="dd/mm/aaaa"
              value={plannedDate}
            />
            {!isCreatePlanDateAllowed ? (
              <p className="text-sm text-rose-600">La fecha del plan no puede ser anterior a hoy.</p>
            ) : null}
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Descripcion</span>
              <textarea
                className="min-h-[96px] w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Cuenta de que va el plan"
                value={description}
              />
            </label>
            <Input
              label="Hora del lugar"
              onChange={(event) => setPlacePlannedAt(event.target.value)}
              type="time"
              value={placePlannedAt}
            />
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Nota del lugar</span>
              <textarea
                className="min-h-[96px] w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                maxLength={280}
                onChange={(event) => setPlaceNote(event.target.value)}
                placeholder="Algo util para este sitio"
                value={placeNote}
              />
            </label>
            {createState.error ? <p className="text-sm text-rose-600">{createState.error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setMode(null)} size="sm" type="button" variant="ghost">
                Cancelar
              </Button>
              <Button
                disabled={!title.trim() || !isCreatePlanDateAllowed || isCreating}
                onClick={() => {
                  const payload = new FormData();
                  payload.set("groupId", groupId);
                  payload.set("title", title);
                  payload.set("description", description);
                  payload.set("plannedDate", plannedDate);
                  payload.set("initialPlaceId", placeId);
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
