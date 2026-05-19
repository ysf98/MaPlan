"use client";

import { useActionState, useMemo, useState } from "react";
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
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(personalPlaces[0]?.id || null);
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deletePersonalPlaceAction, deleteInitialState);
  const selectedPlace = useMemo(
    () => personalPlaces.find((place) => place.id === selectedPlaceId) ?? null,
    [personalPlaces, selectedPlaceId]
  );

  return (
    <section className="space-y-4">
      <Card className="rounded-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mapa</h1>
        <p className="mt-2 text-sm text-slate-500">Guarda y organiza tus lugares personales.</p>
      </Card>
      <Card className="rounded-3xl">
        <PersonalMap onSelectPlace={setSelectedPlaceId} places={personalPlaces} selectedPlaceId={selectedPlaceId} />
      </Card>

      {personalPlaces.length > 0 ? (
        <Card className="rounded-3xl">
          <h2 className="text-sm font-semibold text-slate-900">Lugares de mi mapa</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {personalPlaces.map((place) => (
              <li key={place.id}>
                <button
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedPlaceId === place.id
                      ? "border-teal-300 bg-teal-50 text-teal-900"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                  onClick={() => setSelectedPlaceId(place.id)}
                  type="button"
                >
                  <p className="font-medium">{place.name}</p>
                  <p className="text-xs text-slate-500">{place.address}</p>
                </button>
              </li>
            ))}
          </ul>

          {selectedPlace ? (
            <form action={deleteFormAction} className="mt-4">
              <input name="placeId" type="hidden" value={selectedPlace.id} />
              <button
                className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                disabled={isDeleting}
                type="submit"
              >
                {isDeleting ? "Eliminando..." : `Eliminar "${selectedPlace.name}"`}
              </button>
              {deleteState.error ? <p className="mt-2 text-sm text-rose-600">{deleteState.error}</p> : null}
            </form>
          ) : null}
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
