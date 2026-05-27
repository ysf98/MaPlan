"use client";

import type { ReactNode } from "react";

type BasePlaceItem = {
  id: string;
  name: string;
  address: string | null;
  city?: string | null;
  imageUrl?: string | null;
  googleMapsUrl?: string | null;
  status?: "pending" | "visited" | "favorite";
};

type SimplePlacesListProps<TPlace extends BasePlaceItem> = {
  places: TPlace[];
  selectedPlaceId: string | null;
  onTogglePlace: (placeId: string) => void;
  cardDataAttribute: string;
  title?: string;
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
  function statusLabel(status: BasePlaceItem["status"]): string | null {
    if (status === "visited") return "Visitado";
    if (status === "favorite") return "Favorito";
    if (status === "pending") return "Pendiente";
    return null;
  }

  return (
    <>
      {title ? <h3 className="text-sm font-semibold text-zinc-950">{title}</h3> : null}
      <ul className={`${title ? "mt-3" : "mt-0"} grid gap-3 sm:grid-cols-2`}>
        {places.map((place) => (
          <li key={place.id}>
            <div
              className={`overflow-hidden rounded-2xl border text-left text-sm transition ${
                selectedPlaceId === place.id
                  ? "border-rose-300 bg-rose-50"
                  : "border-zinc-200 bg-white hover:border-rose-200"
              }`}
              {...{ [cardDataAttribute]: "" }}
            >
              <button className="w-full text-left" onClick={() => onTogglePlace(place.id)} type="button">
                <div className="h-40 w-full overflow-hidden bg-zinc-100">
                  {place.imageUrl ? (
                    <img alt={place.name} className="h-full w-full object-cover" src={place.imageUrl} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-500">Sin imagen</div>
                  )}
                </div>
                <div className="bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-2xl font-semibold leading-tight text-zinc-950">{place.name}</p>
                    {statusLabel(place.status) ? (
                      <span className="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-[#c6283a]">
                        {statusLabel(place.status)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {place.address}
                    {place.city ? ` - ${place.city}` : ""}
                  </p>
                </div>
              </button>
              {selectedPlaceId === place.id ? (
                <div className="border-t border-zinc-100 bg-white px-4 py-3">
                  <div className="flex flex-wrap gap-2">{renderActions(place)}</div>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
