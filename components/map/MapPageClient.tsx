"use client";

import { useActionState, useState } from "react";
import { deletePersonalPlaceAction, type DeletePersonalPlaceActionState } from "@/app/map/actions";
import { PersonalMap } from "@/components/map/PersonalMap";
import { SimplePlacesList } from "@/components/map/SimplePlacesList";
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
      className="space-y-5"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-place-card]")) {
          setSelectedPlaceId(null);
        }
      }}
    >
      <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white">
        <div className="relative h-44 bg-gradient-to-r from-[#2f1318] via-[#7c1f2d] to-[#c6283a] px-4 py-4 text-white">
          <p className="inline-flex rounded-full bg-white/20 px-2 py-1 text-xs font-semibold">Mapa personal</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Tus lugares guardados</h1>
          <p className="mt-1 text-sm text-white/85">Explora, guarda y organiza sitios personales con imagen cuando exista.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-100 bg-white p-3">
        <PersonalMap onSelectPlace={setSelectedPlaceId} places={personalPlaces} selectedPlaceId={selectedPlaceId} />
      </div>

      {personalPlaces.length > 0 ? (
        <div>
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
            title="Lugares"
          />
          {deleteState.error ? <p className="mt-3 text-sm text-rose-600">{deleteState.error}</p> : null}
        </div>
      ) : (
        <EmptyState
          description="Busca un sitio en el mapa o toca cualquier punto para crear tu primer lugar."
          title="Todavia no tienes lugares personales"
        />
      )}
    </section>
  );
}
