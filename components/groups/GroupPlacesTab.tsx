"use client";

import { useActionState, useState } from "react";
import { deletePlaceAction, type DeletePlaceActionState } from "@/app/groups/[groupId]/actions";
import { SimplePlacesList } from "@/components/map/SimplePlacesList";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GroupPlace } from "@/lib/places/shared";

type GroupPlacesTabProps = {
  groupId: string;
  places: GroupPlace[];
  canEditPlaces: boolean;
};

const deleteInitialState: DeletePlaceActionState = { error: null, success: false };

export function GroupPlacesTab({ groupId, places, canEditPlaces }: GroupPlacesTabProps) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deletePlaceAction, deleteInitialState);

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
            ) : null}
          </>
        )}
        selectedPlaceId={selectedPlaceId}
        
      />
      {deleteState.error ? <p className="mt-3 text-sm text-rose-600">{deleteState.error}</p> : null}
    </div>
  );
}

