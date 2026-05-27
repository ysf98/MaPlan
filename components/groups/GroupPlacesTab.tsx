"use client";

import { useActionState, useState } from "react";
import {
  deletePlaceAction,
  updatePlaceLocationAction,
  updatePlaceStatusAction,
  type DeletePlaceActionState,
  type UpdatePlaceLocationActionState,
  type UpdatePlaceStatusActionState
} from "@/app/groups/[groupId]/actions";
import { SimplePlacesList } from "@/components/map/SimplePlacesList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { hasValidCoordinates, type GroupPlace } from "@/lib/places/shared";

type GroupPlacesTabProps = {
  groupId: string;
  places: GroupPlace[];
  canEditPlaces: boolean;
};

const deleteInitialState: DeletePlaceActionState = { error: null, success: false };
const statusInitialState: UpdatePlaceStatusActionState = { error: null, success: false };
const locationInitialState: UpdatePlaceLocationActionState = { error: null, success: false };

export function GroupPlacesTab({ groupId, places, canEditPlaces }: GroupPlacesTabProps) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deletePlaceAction, deleteInitialState);
  const [statusState, statusFormAction, isUpdatingStatus] = useActionState(updatePlaceStatusAction, statusInitialState);
  const [locationState, locationFormAction, isUpdatingLocation] = useActionState(updatePlaceLocationAction, locationInitialState);

  if (places.length === 0) {
    return (
      <EmptyState
        description={
          canEditPlaces
            ? "Empieza agregando el primer sitio recomendado para el grupo."
            : "Aun no hay lugares. Solo usuarios con permisos pueden anadir lugares."
        }
        title="Todavia no hay lugares"
      />
    );
  }

  return (
    <div>
      <SimplePlacesList
        cardDataAttribute="data-group-place-card"
        onTogglePlace={(placeId) => setSelectedPlaceId((current) => (current === placeId ? null : placeId))}
        places={places}
        renderActions={(place) => (
          <>
            {place.googleMapsUrl ? (
              <a
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-100 px-3 text-xs font-medium text-zinc-700 hover:bg-rose-50 hover:text-[#c6283a]"
                href={place.googleMapsUrl}
                rel="noreferrer"
                target="_blank"
              >
                Ver en Google Maps
              </a>
            ) : null}
            {canEditPlaces ? (
              <>
                <form action={statusFormAction} className="flex items-center gap-2">
                  <input name="groupId" type="hidden" value={groupId} />
                  <input name="placeId" type="hidden" value={place.id} />
                  <label className="sr-only" htmlFor={`status-${place.id}`}>
                    Estado
                  </label>
                  <select
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700"
                    defaultValue={place.status}
                    disabled={isUpdatingStatus}
                    id={`status-${place.id}`}
                    name="status"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="visited">Visitado</option>
                    <option value="favorite">Favorito</option>
                  </select>
                  <Button disabled={isUpdatingStatus} size="sm" type="submit" variant="secondary">
                    {isUpdatingStatus ? "Guardando..." : "Actualizar"}
                  </Button>
                </form>
                {!hasValidCoordinates(place) ? (
                  <form action={locationFormAction} className="grid w-full gap-2 rounded-xl bg-zinc-50 p-3 sm:grid-cols-2">
                    <input name="groupId" type="hidden" value={groupId} />
                    <input name="placeId" type="hidden" value={place.id} />
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-zinc-700">Direccion</span>
                      <input
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-800"
                        defaultValue={place.address}
                        maxLength={220}
                        name="address"
                        required
                      />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-zinc-700">Ciudad / poblacion</span>
                      <input
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-800"
                        defaultValue={place.city ?? ""}
                        maxLength={120}
                        name="city"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-zinc-700">Latitud</span>
                      <input
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-800"
                        defaultValue={place.latitude ?? ""}
                        name="latitude"
                        required
                        step="any"
                        type="number"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-zinc-700">Longitud</span>
                      <input
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-800"
                        defaultValue={place.longitude ?? ""}
                        name="longitude"
                        required
                        step="any"
                        type="number"
                      />
                    </label>
                    <Button className="sm:col-span-2" disabled={isUpdatingLocation} size="sm" type="submit" variant="secondary">
                      {isUpdatingLocation ? "Guardando..." : "Guardar ubicacion"}
                    </Button>
                  </form>
                ) : null}
                <form action={deleteFormAction}>
                  <input name="groupId" type="hidden" value={groupId} />
                  <input name="placeId" type="hidden" value={place.id} />
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    disabled={isDeleting}
                    type="submit"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </form>
              </>
            ) : null}
          </>
        )}
        selectedPlaceId={selectedPlaceId}
      />
      {statusState.error ? <p className="mt-3 text-sm text-rose-600">{statusState.error}</p> : null}
      {statusState.success ? <p className="mt-3 text-sm text-emerald-600">Estado actualizado.</p> : null}
      {locationState.error ? <p className="mt-3 text-sm text-rose-600">{locationState.error}</p> : null}
      {locationState.success ? <p className="mt-3 text-sm text-emerald-600">Ubicacion actualizada.</p> : null}
      {deleteState.error ? <p className="mt-3 text-sm text-rose-600">{deleteState.error}</p> : null}
    </div>
  );
}
