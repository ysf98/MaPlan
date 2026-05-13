"use client";

import { useActionState } from "react";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updatePlaceStatusAction } from "@/app/groups/[groupId]/actions";
import type { UpdatePlaceStatusActionState } from "@/app/groups/[groupId]/actions";
import type { GroupPlace } from "@/lib/places/shared";
import type { PlaceStatus } from "@/types/supabase";

type PlaceCardProps = {
  groupId: string;
  place: GroupPlace;
};

const STATUS_OPTIONS: { value: PlaceStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "visited", label: "Visitado" },
  { value: "favorite", label: "Favorito" }
];

const updatePlaceStatusInitialState: UpdatePlaceStatusActionState = {
  error: null,
  success: false
};

function statusLabel(status: PlaceStatus) {
  if (status === "visited") return "Visitado";
  if (status === "favorite") return "Favorito";
  return "Pendiente";
}

export function PlaceCard({ groupId, place }: PlaceCardProps) {
  const [state, formAction, isPending] = useActionState(updatePlaceStatusAction, updatePlaceStatusInitialState);

  return (
    <Card className="rounded-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge label={place.category} tone="plan" />
        <CategoryBadge label={statusLabel(place.status)} tone="visit" />
      </div>

      <h3 className="mt-3 text-lg font-semibold text-slate-900">{place.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{place.address}</p>
      {place.notes ? <p className="mt-2 text-sm text-slate-500">{place.notes}</p> : null}

      <form action={formAction} className="mt-4 flex flex-wrap gap-2">
        <input name="groupId" type="hidden" value={groupId} />
        <input name="placeId" type="hidden" value={place.id} />
        <label className="sr-only" htmlFor={`status-${place.id}`}>
          Estado
        </label>
        <select
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          defaultValue={place.status}
          id={`status-${place.id}`}
          name="status"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button disabled={isPending} size="sm" type="submit" variant="secondary">
          {isPending ? "Guardando..." : "Cambiar estado"}
        </Button>
      </form>
      {state.error ? <p className="mt-2 text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="mt-2 text-sm text-emerald-600">Estado actualizado.</p> : null}
    </Card>
  );
}
