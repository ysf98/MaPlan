"use client";

import { useActionState } from "react";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { deletePlaceAction, updatePlaceLocationAction, updatePlaceStatusAction } from "@/app/groups/[groupId]/actions";
import type {
  DeletePlaceActionState,
  UpdatePlaceLocationActionState,
  UpdatePlaceStatusActionState
} from "@/app/groups/[groupId]/actions";
import { hasValidCoordinates, type GroupPlace } from "@/lib/places/shared";
import type { PlaceStatus } from "@/types/supabase";

type PlaceCardProps = {
  groupId: string;
  place: GroupPlace;
  canEdit: boolean;
  canDelete: boolean;
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

const updatePlaceLocationInitialState: UpdatePlaceLocationActionState = {
  error: null,
  success: false
};

const deletePlaceInitialState: DeletePlaceActionState = {
  error: null,
  success: false
};

function statusLabel(status: PlaceStatus) {
  if (status === "visited") return "Visitado";
  if (status === "favorite") return "Favorito";
  return "Pendiente";
}

export function PlaceCard({ groupId, place, canEdit, canDelete }: PlaceCardProps) {
  const [statusState, statusFormAction, isStatusPending] = useActionState(updatePlaceStatusAction, updatePlaceStatusInitialState);
  const [locationState, locationFormAction, isLocationPending] = useActionState(updatePlaceLocationAction, updatePlaceLocationInitialState);
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(deletePlaceAction, deletePlaceInitialState);
  const hasCoords = hasValidCoordinates(place);

  return (
    <Card className="rounded-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge label={place.category} tone="plan" />
        <CategoryBadge label={statusLabel(place.status)} tone="visit" />
        <CategoryBadge label={hasCoords ? "Con coordenadas" : "Sin coordenadas"} tone={hasCoords ? "coffee" : "food"} />
      </div>

      <h3 className="mt-3 text-lg font-semibold text-slate-900">{place.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{place.address}</p>
      {place.city ? <p className="mt-1 text-sm text-slate-500">{place.city}</p> : null}
      {place.notes ? <p className="mt-2 text-sm text-slate-500">{place.notes}</p> : null}
      {place.originalUrl ? (
        <a
          className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href={place.originalUrl}
          rel="noreferrer noopener"
          target="_blank"
        >
          Abrir enlace
        </a>
      ) : null}

      {canEdit ? (
        <form action={statusFormAction} className="mt-4">
          <fieldset className="flex flex-wrap gap-2" disabled={isStatusPending}>
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
            <Button disabled={isStatusPending} size="sm" type="submit" variant="secondary">
              {isStatusPending ? "Guardando..." : "Cambiar estado"}
            </Button>
          </fieldset>
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Solo el propietario puede editar lugares en este grupo.</p>
      )}
      {statusState.error ? <p className="mt-2 text-sm text-rose-600">{statusState.error}</p> : null}
      {statusState.success ? <p className="mt-2 text-sm text-emerald-600">Estado actualizado.</p> : null}

      {canEdit && !hasCoords ? (
        <form action={locationFormAction} className="mt-4 rounded-2xl border border-slate-200 p-3">
          <input name="groupId" type="hidden" value={groupId} />
          <input name="placeId" type="hidden" value={place.id} />
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="space-y-1 sm:col-span-3">
              <span className="text-xs font-medium text-slate-700">Direccion</span>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                defaultValue={place.address}
                maxLength={220}
                name="address"
                required
              />
            </label>
            <label className="space-y-1 sm:col-span-3">
              <span className="text-xs font-medium text-slate-700">Ciudad / poblacion</span>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                defaultValue={place.city ?? ""}
                maxLength={120}
                name="city"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">Latitud</span>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                defaultValue={place.latitude ?? ""}
                name="latitude"
                required
                step="any"
                type="number"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">Longitud</span>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                defaultValue={place.longitude ?? ""}
                name="longitude"
                required
                step="any"
                type="number"
              />
            </label>
            <div className="flex items-end">
              <Button disabled={isLocationPending} size="sm" type="submit" variant="secondary">
                {isLocationPending ? "Guardando..." : "Guardar ubicacion"}
              </Button>
            </div>
          </div>
          {locationState.error ? <p className="mt-2 text-sm text-rose-600">{locationState.error}</p> : null}
          {locationState.success ? <p className="mt-2 text-sm text-emerald-600">Ubicacion actualizada.</p> : null}
        </form>
      ) : null}
      {canDelete ? (
        <form
          action={deleteFormAction}
          className="mt-4"
          onSubmit={(event) => {
            const confirmed = window.confirm(`Estas seguro de que quieres eliminar "${place.name}"?`);
            if (!confirmed) {
              event.preventDefault();
            }
          }}
        >
          <input name="groupId" type="hidden" value={groupId} />
          <input name="placeId" type="hidden" value={place.id} />
          <Button disabled={isDeletePending} size="sm" type="submit" variant="danger">
            {isDeletePending ? "Eliminando..." : "Eliminar lugar"}
          </Button>
          {deleteState.error ? <p className="mt-2 text-sm text-rose-600">{deleteState.error}</p> : null}
        </form>
      ) : null}
    </Card>
  );
}
