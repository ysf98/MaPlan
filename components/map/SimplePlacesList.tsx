"use client";

import type { ReactNode } from "react";

type BasePlaceItem = {
  id: string;
  name: string;
  address: string | null;
  city?: string | null;
  googleMapsUrl?: string | null;
};

type SimplePlacesListProps<TPlace extends BasePlaceItem> = {
  places: TPlace[];
  selectedPlaceId: string | null;
  onTogglePlace: (placeId: string) => void;
  cardDataAttribute: string;
  title: string;
  renderActions: (place: TPlace) => ReactNode;
};

export function SimplePlacesList<TPlace extends BasePlaceItem>({
  places,
  selectedPlaceId,
  onTogglePlace,
  cardDataAttribute,
  title,
  renderActions
}: SimplePlacesListProps<TPlace>) {
  return (
    <>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {places.map((place) => (
          <li key={place.id}>
            <div
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                selectedPlaceId === place.id
                  ? "border-teal-300 bg-teal-50 text-teal-900"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              }`}
              {...{ [cardDataAttribute]: "" }}
            >
              <button className="w-full text-left" onClick={() => onTogglePlace(place.id)} type="button">
                <p className="font-medium">{place.name}</p>
                <p className="text-xs text-slate-500">
                  {place.address}
                  {place.city ? ` · ${place.city}` : ""}
                </p>
              </button>
              {selectedPlaceId === place.id ? <div className="mt-3 flex flex-wrap gap-2">{renderActions(place)}</div> : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
