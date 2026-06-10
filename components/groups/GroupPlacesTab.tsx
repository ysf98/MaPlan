"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import {
  updatePlaceFavoriteAction,
  updatePlaceStatusAction,
  type UpdatePlaceFavoriteActionState,
  type UpdatePlaceStatusActionState
} from "@/app/groups/[groupId]/actions";
import { PlacePlanDialog } from "@/components/groups/PlacePlanDialog";
import { SimplePlacesList } from "@/components/map/SimplePlacesList";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GroupPlanItem } from "@/lib/groupPlans";
import type { GroupPlace } from "@/lib/places/shared";

type GroupPlacesTabProps = {
  groupId: string;
  places: GroupPlace[];
  canEditPlaces: boolean;
  plans: GroupPlanItem[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  onViewInMap: (placeId: string) => void;
};

const statusInitialState: UpdatePlaceStatusActionState = { error: null, success: false };
const favoriteInitialState: UpdatePlaceFavoriteActionState = { error: null, success: false };

export function GroupPlacesTab({
  groupId,
  places,
  canEditPlaces,
  plans,
  selectedPlaceId,
  onSelectPlace,
  onViewInMap
}: GroupPlacesTabProps) {
  const [statusState, statusFormAction, isUpdatingStatus] = useActionState(updatePlaceStatusAction, statusInitialState);
  const [favoriteState, favoriteFormAction, isUpdatingFavorite] = useActionState(updatePlaceFavoriteAction, favoriteInitialState);
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
        onTogglePlace={(placeId) => onSelectPlace(selectedPlaceId === placeId ? null : placeId)}
        places={places}
        renderFooter={(place) => (
          <PlacePlanDialog canManagePlans={canEditPlaces} compact groupId={groupId} placeId={place.id} plans={plans} />
        )}
        renderHeaderAccessory={(place) => (
          <button
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 text-xs font-semibold text-[#c6283a] transition hover:-translate-y-0.5 hover:bg-rose-100 active:translate-y-0"
            data-card-control=""
            data-lock-swipe=""
            onClick={(event) => {
              event.stopPropagation();
              onViewInMap(place.id);
            }}
            type="button"
          >
            Ver
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
              <path d="M5 12h10" />
            </svg>
          </button>
        )}
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
              <div data-card-control="" data-lock-swipe="" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
                <button
                  aria-label={displayed.favorite ? "Quitar favorito" : "Marcar favorito"}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 shadow-sm transition hover:scale-105 ${
                    displayed.favorite
                      ? "border-rose-200 text-[#c6283a]"
                      : "border-zinc-200 text-zinc-400"
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
              <div data-card-control="" data-lock-swipe="" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
                <button
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm transition hover:scale-105 ${
                    displayed.visited
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-[#c6283a]"
                  }`}
                  disabled={isUpdatingStatus}
                  onClick={() => {
                    const nextVisited = !displayed.visited;
                    setOptimisticVisitedById((current) => ({ ...current, [place.id]: nextVisited }));
                    sendStatus(nextVisited ? "visited" : "pending");
                  }}
                  type="button"
                >
                  {displayed.visited ? "Visitado" : "Pendiente"}
                </button>
              </div>
            </div>
          );
        }}
        selectedPlaceId={selectedPlaceId}
      />
      {statusState.error ? <p className="mt-3 text-sm text-rose-600">{statusState.error}</p> : null}
      {statusState.success ? <p className="mt-3 text-sm text-emerald-600">Estado actualizado.</p> : null}
      {favoriteState.error ? <p className="mt-3 text-sm text-rose-600">{favoriteState.error}</p> : null}
    </div>
  );
}
