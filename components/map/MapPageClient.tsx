"use client";

import { useActionState, useState } from "react";
import { deletePersonalPlaceAction, type DeletePersonalPlaceActionState } from "@/app/map/actions";
import { PersonalMap } from "@/components/map/PersonalMap";
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
          <h2 className="text-sm font-semibold text-slate-900">Lugares de mi mapa</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {personalPlaces.map((place) => (
              <li key={place.id}>
                <div
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedPlaceId === place.id
                      ? "border-teal-300 bg-teal-50 text-teal-900"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                  data-place-card
                >
                  <button
                    className="w-full text-left"
                    onClick={() => setSelectedPlaceId((current) => (current === place.id ? null : place.id))}
                    type="button"
                  >
                    <p className="font-medium">{place.name}</p>
                    <p className="text-xs text-slate-500">{place.address}</p>
                  </button>
                  {selectedPlaceId === place.id ? (
                    <div className="mt-3 flex flex-wrap gap-2" data-place-card>
                      {place.googleMapsUrl ? (
                        <a
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
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
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
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
