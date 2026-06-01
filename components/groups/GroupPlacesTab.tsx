"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import {
  deletePlaceAction,
  updatePlaceFavoriteAction,
  updatePlaceLocationAction,
  updatePlaceStatusAction,
  type DeletePlaceActionState,
  type UpdatePlaceFavoriteActionState,
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
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  onViewInMap: (placeId: string) => void;
};

const deleteInitialState: DeletePlaceActionState = { error: null, success: false };
const statusInitialState: UpdatePlaceStatusActionState = { error: null, success: false };
const favoriteInitialState: UpdatePlaceFavoriteActionState = { error: null, success: false };
const locationInitialState: UpdatePlaceLocationActionState = { error: null, success: false };

export function GroupPlacesTab({
  groupId,
  places,
  canEditPlaces,
  selectedPlaceId,
  onSelectPlace,
  onViewInMap
}: GroupPlacesTabProps) {
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deletePlaceAction, deleteInitialState);
  const [statusState, statusFormAction, isUpdatingStatus] = useActionState(updatePlaceStatusAction, statusInitialState);
  const [favoriteState, favoriteFormAction, isUpdatingFavorite] = useActionState(updatePlaceFavoriteAction, favoriteInitialState);
  const [locationState, locationFormAction, isUpdatingLocation] = useActionState(updatePlaceLocationAction, locationInitialState);
  const [optimisticFavoriteById, setOptimisticFavoriteById] = useState<Record<string, boolean>>({});
  const [optimisticVisitedById, setOptimisticVisitedById] = useState<Record<string, boolean>>({});

  const displayedById = useMemo(() => {
    const next: Record<string, { favorite: boolean; visited: boolean }> = {};
    for (const place of places) {
      const baseFavorite = place.isFavorite;
      const baseVisited = place.status === "visited";
      next[place.id] = {
        favorite: optimisticFavoriteById[place.id] ?? baseFavorite,
        visited: optimisticVisitedById[place.id] ?? baseVisited
      };
    }
    return next;
  }, [optimisticFavoriteById, optimisticVisitedById, places]);

  useEffect(() => {
    setOptimisticFavoriteById((current) => {
      const next = { ...current };
      let changed = false;
      for (const place of places) {
        if (typeof next[place.id] === "boolean" && next[place.id] === place.isFavorite) {
          delete next[place.id];
          changed = true;
        }
      }
      return changed ? next : current;
    });
    setOptimisticVisitedById((current) => {
      const next = { ...current };
      let changed = false;
      for (const place of places) {
        if (typeof next[place.id] === "boolean" && next[place.id] === (place.status === "visited")) {
          delete next[place.id];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [places]);

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
        onTogglePlace={(placeId) => onSelectPlace(placeId)}
        places={places}
        renderHeaderAccessory={() => null}
        renderImageOverlay={(place) => {
          const displayed = displayedById[place.id];
          const sendStatus = (status: GroupPlace["status"]) => {
            const payload = new FormData();
            payload.set("groupId", groupId);
            payload.set("placeId", place.id);
            payload.set("status", status);
            startTransition(() => {
              statusFormAction(payload);
            });
          };
          const sendFavorite = (isFavorite: boolean) => {
            const payload = new FormData();
            payload.set("groupId", groupId);
            payload.set("placeId", place.id);
            payload.set("isFavorite", String(isFavorite));
            startTransition(() => {
              favoriteFormAction(payload);
            });
          };

          return (
            <div className="flex items-center gap-2">
              {canEditPlaces ? (
                <>
                  <div data-card-control="" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
                    <button
                      aria-label={displayed.favorite ? "Quitar favorito" : "Marcar favorito"}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                        displayed.favorite
                            ? "border-rose-200 bg-rose-50 text-[#c6283a]"
                            : "border-zinc-200 bg-white text-zinc-400"
                      }`}
                      disabled={isUpdatingFavorite}
                      onClick={() => {
                        const nextFavorite = !displayed.favorite;
                        setOptimisticFavoriteById((current) => ({ ...current, [place.id]: nextFavorite }));
                        sendFavorite(nextFavorite);
                      }}
                      type="button"
                    >
                      <svg className="h-4 w-4" fill={displayed.favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="m12 21-1.5-1.35C5.4 15.08 2 12 2 8.24A4.24 4.24 0 0 1 6.24 4C8 4 9.7 4.81 10.8 6.09L12 7.5l1.2-1.41A5 5 0 0 1 17.76 4 4.24 4.24 0 0 1 22 8.24c0 3.76-3.4 6.84-8.5 11.41Z" />
                      </svg>
                    </button>
                  </div>
                  {!displayed.visited ? (
                    <div data-card-control="" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
                      <button
                          className="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-[#c6283a] transition hover:bg-rose-100"
                          disabled={isUpdatingStatus}
                          onClick={() => {
                            setOptimisticVisitedById((current) => ({ ...current, [place.id]: true }));
                            sendStatus("visited");
                          }}
                          type="button"
                        >
                          Pendiente
                      </button>
                    </div>
                  ) : (
                    <div data-card-control="" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
                      <button
                        className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        disabled={isUpdatingStatus}
                        onClick={() => {
                          setOptimisticVisitedById((current) => ({ ...current, [place.id]: false }));
                          sendStatus("pending");
                        }}
                        type="button"
                      >
                        Visitado
                      </button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          );
        }}
        renderActions={(place) => (
          <>
            <div
              className="mb-1 grid w-full grid-cols-5 items-start gap-2"
              data-card-control=""
              data-lock-swipe=""
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
            >
              {place.googleMapsUrl ? (
                <a
                  className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-600 transition-transform duration-150 hover:scale-110 active:scale-95"
                  href={place.googleMapsUrl}
                  onClick={(event) => event.stopPropagation()}
                  rel="noreferrer"
                  target="_blank"
                >
                  <svg className="h-5 w-5 text-[#c6283a]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 11.4 8.2-3.1-3.1 8.2-1.4-3.7z" />
                  </svg>
                  Ir
                </a>
              ) : (
                <button className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-400" disabled type="button">
                  <svg className="h-5 w-5 text-zinc-300" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 11.4 8.2-3.1-3.1 8.2-1.4-3.7z" />
                  </svg>
                  Ir
                </button>
              )}
              <button className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-400" disabled type="button">
                <svg className="h-5 w-5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92V20a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.08 2h3.09a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.17a16 16 0 0 0 6.83 6.83l.72-1.35a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
                </svg>
                Llamar
              </button>
              <button className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-600 transition-transform duration-150 hover:scale-110 active:scale-95" type="button">
                <svg className="h-5 w-5 text-[#c6283a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 20h9" />
                  <path d="m16.5 3.5 4 4L7 21H3v-4z" />
                </svg>
                Editar
              </button>
              <button
                className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-600 transition-transform duration-150 hover:scale-110 active:scale-95"
                onClick={(event) => {
                  event.stopPropagation();
                  onViewInMap(place.id);
                }}
                onMouseDown={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                <svg className="h-5 w-5 text-[#c6283a]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m9 18 6-6-6-6" />
                  <path d="M5 12h10" />
                </svg>
                Ver en mapa
              </button>
              {canEditPlaces ? (
                <form
                  action={deleteFormAction}
                  onSubmit={(event) => {
                    event.stopPropagation();
                    if (!window.confirm("¿Seguro que quieres eliminar este lugar?")) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input name="groupId" type="hidden" value={groupId} />
                  <input name="placeId" type="hidden" value={place.id} />
                  <button
                    className="flex flex-col items-center gap-1 text-xs font-medium text-rose-700 transition-transform duration-150 hover:scale-110 active:scale-95"
                    disabled={isDeleting}
                    type="submit"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </form>
              ) : (
                <span />
              )}
            </div>
            {canEditPlaces ? (
              <>
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
              </>
            ) : null}
          </>
        )}
        selectedPlaceId={selectedPlaceId}
      />
      {statusState.error ? <p className="mt-3 text-sm text-rose-600">{statusState.error}</p> : null}
      {statusState.success ? <p className="mt-3 text-sm text-emerald-600">Estado actualizado.</p> : null}
      {favoriteState.error ? <p className="mt-3 text-sm text-rose-600">{favoriteState.error}</p> : null}
      {locationState.error ? <p className="mt-3 text-sm text-rose-600">{locationState.error}</p> : null}
      {locationState.success ? <p className="mt-3 text-sm text-emerald-600">Ubicacion actualizada.</p> : null}
      {deleteState.error ? <p className="mt-3 text-sm text-rose-600">{deleteState.error}</p> : null}
    </div>
  );
}
