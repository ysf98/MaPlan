"use client";

import { useActionState, useState } from "react";
import { deletePersonalPlaceAction, type DeletePersonalPlaceActionState } from "@/app/map/actions";
import { PersonalMap } from "@/components/map/PersonalMap";
import { SimplePlacesList } from "@/components/map/SimplePlacesList";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PersonalPlace } from "@/lib/personalPlaces";

type MapPageClientProps = {
  personalPlaces: PersonalPlace[];
};

const deleteInitialState: DeletePersonalPlaceActionState = {
  error: null,
  success: false
};

export function MapPageClient({ personalPlaces }: MapPageClientProps) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deletePersonalPlaceAction, deleteInitialState);

  return (
    <section
      className="space-y-4"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-place-card]")) {
          setSelectedPlaceId(null);
        }
      }}
    >
      <Card className="rounded-3xl">
        <PersonalMap onSelectPlace={setSelectedPlaceId} places={personalPlaces} selectedPlaceId={selectedPlaceId} />
      </Card>

      {personalPlaces.length > 0 ? (
        <Card className="rounded-3xl">
          <SimplePlacesList
            cardDataAttribute="data-place-card"
            onTogglePlace={(placeId) => setSelectedPlaceId((current) => (current === placeId ? null : placeId))}
            places={personalPlaces}
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
                <form action={deleteFormAction}>
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
            )}
            selectedPlaceId={selectedPlaceId}
            title="Lugares de mi mapa"
          />
          {deleteState.error ? <p className="mt-3 text-sm text-rose-600">{deleteState.error}</p> : null}
        </Card>
      ) : (
        <EmptyState
          title="Todavia no tienes lugares personales"
          description="Busca un sitio en el mapa o toca cualquier punto para crear tu primer lugar."
        />
      )}
    </section>
  );
}
