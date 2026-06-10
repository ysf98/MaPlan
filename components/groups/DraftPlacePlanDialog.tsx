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
  const [mode, setMode] = useState<"add" | "create" | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [placeTime, setPlaceTime] = useState("");
  const [placeNote, setPlaceNote] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [createState, createAction, isCreating] = useActionState(createGroupPlanFromDraftAction, createInitialState);
  const [addState, addAction, isAdding] = useActionState(addDraftPlaceToGroupPlanAction, addInitialState);

  const availablePlans = useMemo(() => plans.filter((plan) => plan.acceptsNewPlaces), [plans]);
  const selectedPlan = useMemo(
    () => availablePlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [availablePlans, selectedPlanId]
  );

  function buildPlanPlaceDateTime(planDate: string | null, timeValue: string): string {
    if (!planDate || !timeValue) {
      return "";
    }

    const datePartMatch = planDate.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!datePartMatch) {
      return "";
    }

    return `${datePartMatch[1]}T${timeValue}`;
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

  if (!canManagePlans) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button className="h-8 rounded-full px-3 text-[11px]" onClick={() => setMode("add")} size="sm" type="button" variant="secondary">
          Anadir a plan
        </Button>
        <Button className="h-8 rounded-full px-3 text-[11px]" onClick={() => setMode("create")} size="sm" type="button" variant="primary">
          Crear plan
        </Button>
      </div>

      {mode ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/45 p-4 sm:items-center" onClick={() => setMode(null)}>
          <div
            className="w-full max-w-lg rounded-[28px] border border-rose-100 bg-[#fff8f7] p-5 shadow-[0_18px_45px_rgba(24,24,27,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">
                  {mode === "add" ? "Anadir busqueda a un plan" : "Crear plan con esta busqueda"}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  El lugar se guardara primero en el grupo y despues se anadira al plan.
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
                    className="h-12 w-full rounded-2xl border border-transparent bg-white px-4 text-sm text-zinc-900 outline-none focus:border-[#ff5a5f]"
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
                <Input label="Hora del lugar" onChange={(event) => setPlaceTime(event.target.value)} type="time" value={placeTime} />
                {selectedPlan && !selectedPlan.plannedDate ? (
                  <p className="text-xs text-zinc-500">Este plan no tiene fecha cerrada, asi que la hora es opcional.</p>
                ) : null}
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
                {addState.error ? <p className="text-sm text-rose-600">{addState.error}</p> : null}
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setMode(null)} size="sm" type="button" variant="ghost">
                    Cancelar
                  </Button>
                  <Button
                    disabled={!selectedPlanId || isAdding || availablePlans.length === 0}
                    onClick={() => {
                      const payload = new FormData();
                      appendDraftFields(payload);
                      payload.set("planId", selectedPlanId);
                      payload.set("plannedAt", buildPlanPlaceDateTime(selectedPlan?.plannedDate ?? null, placeTime));
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
                <Input label="Fecha del plan" onChange={(event) => setPlannedDate(event.target.value)} type="date" value={plannedDate} />
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
                  onChange={(event) => setPlaceTime(event.target.value)}
                  type="time"
                  value={placeTime}
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
                    disabled={!title.trim() || isCreating}
                    onClick={() => {
                      const payload = new FormData();
                      appendDraftFields(payload);
                      payload.set("title", title);
                      payload.set("description", description);
                      payload.set("plannedDate", plannedDate);
                      payload.set("initialPlacePlannedAt", placeTime);
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
      ) : null}
    </>
  );
}
