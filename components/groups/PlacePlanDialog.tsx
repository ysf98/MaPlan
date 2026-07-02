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
import { getTodayPlanDatePart, isPlanDateOnOrAfter } from "@/lib/groupPlansShared";

type PlacePlanDialogProps = {
  groupId: string;
  placeId: string;
  canManagePlans: boolean;
  plans: GroupPlanItem[];
  places?: unknown[];
  compact?: boolean;
};

const createInitialState: CreateGroupPlanActionState = { error: null, success: false };
const addInitialState: AddPlaceToGroupPlanActionState = { error: null, success: false };
const CREATE_PLAN_OPTION_VALUE = "__create_plan__";

export function PlacePlanDialog({
  groupId,
  placeId,
  canManagePlans,
  plans,
  compact = false
}: PlacePlanDialogProps) {
  const [mode, setMode] = useState<"create" | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [title, setTitle] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [minPlanDate] = useState(() => getTodayPlanDatePart());
  const [createState, createAction, isCreating] = useActionState(createGroupPlanAction, createInitialState);
  const [addState, addAction, isAdding] = useActionState(addPlaceToGroupPlanAction, addInitialState);

  const availablePlans = useMemo(
    () => plans.filter((plan) => plan.acceptsNewPlaces && !plan.places.some((place) => place.placeId === placeId)),
    [placeId, plans]
  );
  const triggerClass = compact ? "h-8 rounded-full px-3 text-[11px]" : "h-10 rounded-2xl px-4 text-sm";

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
    setTitle("");
    setPlannedDate("");
  }, [addState.success, createState.success]);

  useEffect(() => {
    if (addState.error) {
      setSelectedPlanId("");
    }
  }, [addState.error]);

  if (!canManagePlans) {
    return null;
  }

  const isCreatePlanDateAllowed = isOptionalPlanDateAllowed(plannedDate);

  const modal = mode === "create" ? (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#fff8f7] px-5 py-4" onClick={() => setMode(null)}>
      <div className="mx-auto w-full max-w-xl bg-[#fff8f7]" onClick={(event) => event.stopPropagation()}>
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
          {!isCreatePlanDateAllowed ? <p className="text-sm text-rose-600">La fecha del plan no puede ser anterior a hoy.</p> : null}
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
                payload.set("description", "");
                payload.set("plannedDate", plannedDate);
                payload.set("initialPlaceId", placeId);
                payload.set("initialPlacePlannedAt", "");
                payload.set("initialPlaceNote", "");
                startTransition(() => createAction(payload));
              }}
              size="sm"
              type="button"
            >
              {isCreating ? "Creando..." : "Crear plan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <label className={`relative inline-flex ${isAdding ? "opacity-60" : ""}`}>
          <span
            className={`inline-flex items-center justify-center bg-[#fff0ef] font-semibold text-[#c6283a] transition hover:bg-[#fde2e0] ${triggerClass}`}
          >
            {isAdding ? "Añadiendo..." : "Añadir a plan"}
          </span>
          <select
            aria-label="Añadir lugar a un plan"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={isAdding}
            onChange={(event) => {
              const planId = event.target.value;
              setSelectedPlanId(planId);
              if (planId === CREATE_PLAN_OPTION_VALUE) {
                setMode("create");
                setSelectedPlanId("");
                return;
              }
              if (!planId) return;

              const payload = new FormData();
              payload.set("groupId", groupId);
              payload.set("planId", planId);
              payload.set("placeId", placeId);
              payload.set("plannedAt", "");
              payload.set("note", "");
              startTransition(() => addAction(payload));
            }}
            value={selectedPlanId}
          >
            <option value="">{availablePlans.length ? "Selecciona un plan" : "Elige una opción"}</option>
            {availablePlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title}
              </option>
            ))}
            <option value={CREATE_PLAN_OPTION_VALUE}>+ Crear nuevo plan</option>
          </select>
        </label>
      </div>
      {addState.error ? <p className="mt-1 text-xs font-medium text-rose-600">{addState.error}</p> : null}
      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
