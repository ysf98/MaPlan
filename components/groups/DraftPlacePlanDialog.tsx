"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import {
  addDraftPlaceToGroupPlanAction,
  createGroupPlanFromDraftAction,
  type AddDraftPlaceToGroupPlanActionState,
  type CreateGroupPlanFromDraftActionState
} from "@/app/groups/[groupId]/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { GroupPlanItem } from "@/lib/groupPlans";
import { extractPlanDatePart, getTodayPlanDatePart, isPlanDateOnOrAfter } from "@/lib/groupPlansShared";
import type { MapDraftPlace } from "@/lib/map/geocoding";

type DraftPlacePlanDialogProps = {
  groupId: string;
  draft: MapDraftPlace;
  canManagePlans: boolean;
  plans: GroupPlanItem[];
};

const createInitialState: CreateGroupPlanFromDraftActionState = { error: null, success: false };
const addInitialState: AddDraftPlaceToGroupPlanActionState = { error: null, success: false };

export function DraftPlacePlanDialog({ groupId, draft, canManagePlans, plans }: DraftPlacePlanDialogProps) {
  const [mode, setMode] = useState<"create" | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [placeTime, setPlaceTime] = useState("");
  const [placeNote, setPlaceNote] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [minPlanDate] = useState(() => getTodayPlanDatePart());
  const [createState, createAction, isCreating] = useActionState(createGroupPlanFromDraftAction, createInitialState);
  const [addState, addAction, isAdding] = useActionState(addDraftPlaceToGroupPlanAction, addInitialState);

  const availablePlans = useMemo(() => plans.filter((plan) => plan.acceptsNewPlaces), [plans]);

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

  function appendDraftFields(payload: FormData) {
    payload.set("groupId", groupId);
    payload.set("name", draft.name);
    payload.set("address", draft.address);
    payload.set("city", draft.city || "");
    payload.set("category", draft.category || "Otros");
    payload.set("source", draft.provider === "google_places" ? "google_maps" : "manual");
    payload.set("provider", draft.provider || "manual");
    payload.set("externalPlaceId", draft.externalPlaceId || "");
    payload.set("googleMapsUrl", draft.googleMapsUrl || "");
    payload.set("businessStatus", draft.businessStatus || "");
    payload.set("phoneNumber", draft.phoneNumber || "");
    payload.set("rating", draft.rating?.toString() ?? "");
    payload.set("userRatingsTotal", draft.userRatingsTotal?.toString() ?? "");
    payload.set("imageUrl", draft.imageUrl || "");
    payload.set("latitude", String(draft.latitude));
    payload.set("longitude", String(draft.longitude));
    payload.set("notes", "");
    payload.set("originalUrl", "");
  }

  useEffect(() => {
    if (!createState.success && !addState.success) {
      return;
    }

    setMode(null);
    setSelectedPlanId("");
    setPlaceTime("");
    setPlaceNote("");
    setTitle("");
    setDescription("");
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

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <label className={`relative inline-flex ${isAdding ? "opacity-60" : ""}`}>
          <span className="inline-flex h-8 items-center justify-center rounded-full bg-[#fff0ef] px-3 text-[11px] font-semibold text-[#c6283a] transition hover:bg-[#fde2e0]">
            {isAdding ? "Añadiendo..." : "Añadir a plan"}
          </span>
          <select
            aria-label="Añadir búsqueda a un plan"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={isAdding || availablePlans.length === 0}
            onChange={(event) => {
              const planId = event.target.value;
              setSelectedPlanId(planId);
              if (!planId) return;

              const payload = new FormData();
              appendDraftFields(payload);
              payload.set("planId", planId);
              payload.set("plannedAt", "");
              payload.set("note", "");
              startTransition(() => addAction(payload));
            }}
            value={selectedPlanId}
          >
            <option value="">{availablePlans.length ? "Selecciona un plan" : "No hay planes disponibles"}</option>
            {availablePlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title}
              </option>
            ))}
          </select>
        </label>
        <Button className="h-8 rounded-full px-3 text-[11px]" onClick={() => setMode("create")} size="sm" type="button" variant="primary">
          Crear plan
        </Button>
      </div>
      {addState.error ? <p className="mt-1 text-xs font-medium text-rose-600">{addState.error}</p> : null}

      {mode ? (
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
                <Input className="bg-[#fdeeee]" onChange={(event) => setTitle(event.target.value)} placeholder="Ruta de tapas" value={title} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-zinc-700">Fecha</span>
                <Input className="bg-[#fff1ef]" min={minPlanDate} onChange={(event) => setPlannedDate(event.target.value)} type="date" value={plannedDate} />
              </label>
              {!isCreatePlanDateAllowed ? <p className="text-sm text-rose-600">La fecha del plan no puede ser anterior a hoy.</p> : null}
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-zinc-700">Descripción</span>
                <textarea
                  className="min-h-[110px] w-full rounded-[22px] border border-transparent bg-[#fff4f3] px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                  maxLength={500}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Cuenta de que va el plan"
                  value={description}
                />
              </label>
              <Input label="Hora del lugar" onChange={(event) => setPlaceTime(event.target.value)} type="time" value={placeTime} />
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-zinc-700">Nota del lugar</span>
                <textarea
                  className="min-h-[96px] w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
                  maxLength={280}
                  onChange={(event) => setPlaceNote(event.target.value)}
                  placeholder="Algo útil para este sitio"
                  value={placeNote}
                />
              </label>
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
                    appendDraftFields(payload);
                    payload.set("title", title);
                    payload.set("description", description);
                    payload.set("plannedDate", plannedDate);
                    payload.set("initialPlacePlannedAt", buildPlanPlaceDateTime(plannedDate, placeTime));
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
          </div>
        </div>
      ) : null}
    </>
  );
}
