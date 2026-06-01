"use client";

import type { ReactNode } from "react";

type BasePlaceItem = {
  id: string;
  name: string;
  address: string | null;
  city?: string | null;
  imageUrl?: string | null;
  googleMapsUrl?: string | null;
  status?: "pending" | "visited";
};

type SimplePlacesListProps<TPlace extends BasePlaceItem> = {
  places: TPlace[];
  selectedPlaceId: string | null;
  onTogglePlace?: (placeId: string) => void;
  cardDataAttribute: string;
  title?: string;
  renderActions?: (place: TPlace) => ReactNode;
  renderFooter?: (place: TPlace) => ReactNode;
  renderHeaderAccessory?: (place: TPlace) => ReactNode;
  renderImageOverlay?: (place: TPlace) => ReactNode;
};

export function SimplePlacesList<TPlace extends BasePlaceItem>({
  places,
  selectedPlaceId,
  onTogglePlace,
  cardDataAttribute,
  title,
  renderActions,
  renderFooter,
  renderHeaderAccessory,
  renderImageOverlay
}: SimplePlacesListProps<TPlace>) {
  function statusLabel(status: BasePlaceItem["status"]): string | null {
    if (status === "visited") return "Visitado";
    if (status === "pending") return "Pendiente";
    return null;
  }

  return (
    <>
      {title ? <h3 className="text-sm font-semibold text-zinc-950">{title}</h3> : null}
      <ul className={`${title ? "mt-3" : "mt-0"} grid gap-3 sm:grid-cols-2`}>
        {places.map((place) => {
          const isSelected = selectedPlaceId === place.id;
          const canOpenDetails = Boolean(onTogglePlace && renderActions);

          return (
            <li key={place.id}>
              <div
                className={`overflow-hidden rounded-2xl border text-left text-sm transition ${
                  isSelected
                    ? "border-rose-300 bg-rose-50"
                    : "border-zinc-200 bg-white hover:border-rose-200"
                }`}
                {...{ [cardDataAttribute]: "" }}
              >
                <div
                  aria-expanded={isSelected}
                  className={canOpenDetails && !isSelected ? "w-full cursor-pointer" : "w-full"}
                  onClick={
                    !canOpenDetails || isSelected
                      ? undefined
                      : (event) => {
                          const target = event.target as HTMLElement;
                          if (target.closest("a, button, input, select, textarea, form, [data-card-control]")) {
                            return;
                          }
                          onTogglePlace?.(place.id);
                        }
                  }
                  onKeyDown={
                    !canOpenDetails || isSelected
                      ? undefined
                      : (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onTogglePlace?.(place.id);
                          }
                        }
                  }
                  role={canOpenDetails && !isSelected ? "button" : undefined}
                  tabIndex={canOpenDetails && !isSelected ? 0 : undefined}
                >
                  <div className="relative h-40 w-full overflow-hidden bg-zinc-100">
                    {place.imageUrl ? (
                      <img alt={place.name} className="h-full w-full object-cover" src={place.imageUrl} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-500">Sin imagen</div>
                    )}
                    {renderImageOverlay ? (
                      <div
                        className="absolute right-3 top-3 z-10"
                        data-card-control=""
                        data-lock-swipe=""
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        {renderImageOverlay(place)}
                      </div>
                    ) : null}
                  </div>
                  <div className="bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-2xl font-semibold leading-tight text-zinc-950">{place.name}</p>
                      {renderHeaderAccessory ? (
                        <div
                          data-card-control=""
                          onClick={(event) => event.stopPropagation()}
                          onPointerDown={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          {renderHeaderAccessory(place)}
                        </div>
                      ) : statusLabel(place.status) ? (
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
                </div>
                {renderFooter ? (
                  <div className="border-t border-zinc-100 bg-white px-4 py-3">{renderFooter(place)}</div>
                ) : null}
                {isSelected && renderActions ? (
                  <div className="border-t border-zinc-100 bg-white px-4 py-3">
                    <div
                      className="space-y-2"
                      data-card-control=""
                      data-lock-swipe=""
                      onClick={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onTouchStart={(event) => event.stopPropagation()}
                    >
                      {renderActions(place)}
                    </div>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
