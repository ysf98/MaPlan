"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import {
  updatePersonalPlaceFavoriteAction,
  updatePersonalPlaceStatusAction,
  type UpdatePersonalPlaceFavoriteActionState,
  type UpdatePersonalPlaceStatusActionState
} from "@/app/map/actions";
import { PersonalMap } from "@/components/map/PersonalMap";
import { PersonalMapTabs } from "@/components/map/PersonalMapTabs";
import { SimplePlacesList } from "@/components/map/SimplePlacesList";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import type { PersonalMapTab } from "@/lib/map/tabs";
import type { PersonalPlace } from "@/lib/personalPlaces";

type MapPageClientProps = {
  personalPlaces: PersonalPlace[];
  activeTab: PersonalMapTab;
};

const statusInitialState: UpdatePersonalPlaceStatusActionState = { error: null, success: false };
const favoriteInitialState: UpdatePersonalPlaceFavoriteActionState = { error: null, success: false };

const personalMapTabs: Array<{ label: string; value: PersonalMapTab }> = [
  { label: "Lugares", value: "lugares" },
  { label: "Mapa", value: "mapa" }
];

export function MapPageClient({ personalPlaces, activeTab }: MapPageClientProps) {
  const savedPlacesCountLabel = `${personalPlaces.length} ${personalPlaces.length === 1 ? "lugar guardado" : "lugares guardados"}`;
  const tabs = useMemo(() => ["lugares", "mapa"] as const, []);
  const [currentTab, setCurrentTab] = useState<PersonalMapTab>(activeTab);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffsetPct, setDragOffsetPct] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAxis, setDragAxis] = useState<"x" | "y" | null>(null);
  const [lockSwipeGesture, setLockSwipeGesture] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const tabPanelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activePanelHeight, setActivePanelHeight] = useState<number | null>(null);
  const [statusState, statusFormAction, isUpdatingStatus] = useActionState(updatePersonalPlaceStatusAction, statusInitialState);
  const [favoriteState, favoriteFormAction, isUpdatingFavorite] = useActionState(updatePersonalPlaceFavoriteAction, favoriteInitialState);
  const [optimisticFavoriteById, setOptimisticFavoriteById] = useState<Record<string, boolean>>({});
  const [optimisticVisitedById, setOptimisticVisitedById] = useState<Record<string, boolean>>({});

  const displayedById = useMemo(() => {
    const next: Record<string, { favorite: boolean; visited: boolean }> = {};
    for (const place of personalPlaces) {
      next[place.id] = {
        favorite: optimisticFavoriteById[place.id] ?? place.isFavorite,
        visited: optimisticVisitedById[place.id] ?? (place.status === "visited")
      };
    }
    return next;
  }, [optimisticFavoriteById, optimisticVisitedById, personalPlaces]);

  useEffect(() => {
    setOptimisticFavoriteById((current) => {
      const next = { ...current };
      let changed = false;
      for (const place of personalPlaces) {
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
      for (const place of personalPlaces) {
        if (typeof next[place.id] === "boolean" && next[place.id] === (place.status === "visited")) {
          delete next[place.id];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [personalPlaces]);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", currentTab);
    window.history.replaceState(null, "", url.toString());
  }, [currentTab]);

  function handleTouchStart(clientX: number, clientY: number, target: EventTarget | null) {
    const element = target as HTMLElement | null;
    if (element?.closest("[data-lock-swipe]")) {
      setLockSwipeGesture(true);
      return;
    }

    setLockSwipeGesture(false);
    setTouchStartX(clientX);
    setTouchStartY(clientY);
    setIsDragging(true);
    setDragAxis(null);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>, containerWidth: number) {
    if (lockSwipeGesture) return;

    const clientX = event.touches[0]?.clientX ?? 0;
    const clientY = event.touches[0]?.clientY ?? 0;
    if (touchStartX === null || touchStartY === null || containerWidth <= 0) return;

    const deltaX = touchStartX - clientX;
    const deltaY = touchStartY - clientY;

    let axis = dragAxis;
    if (!axis) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
        setDragAxis(axis);
      } else {
        return;
      }
    }

    if (axis === "y") {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const rawPct = (deltaX / containerWidth) * 100;
    const currentIndex = tabs.indexOf(currentTab);
    const draggingLeft = rawPct < 0;
    const draggingRight = rawPct > 0;
    const atFirst = currentIndex === 0;
    const atLast = currentIndex === tabs.length - 1;
    const isOverscrolling = (atFirst && draggingLeft) || (atLast && draggingRight);
    const withResistance = isOverscrolling ? rawPct * 0.35 : rawPct;
    const clampedPct = Math.max(-100, Math.min(100, withResistance));
    setDragOffsetPct(clampedPct);
  }

  function handleTouchEnd() {
    if (lockSwipeGesture) {
      setLockSwipeGesture(false);
      return;
    }

    if (touchStartX === null) return;
    const currentIndex = tabs.indexOf(currentTab);
    const step = dragOffsetPct > 22 ? 1 : dragOffsetPct < -22 ? -1 : 0;
    const nextIndex = Math.max(0, Math.min(tabs.length - 1, currentIndex + step));
    setCurrentTab(tabs[nextIndex]);

    setTouchStartX(null);
    setTouchStartY(null);
    setDragOffsetPct(0);
    setIsDragging(false);
    setDragAxis(null);
    setLockSwipeGesture(false);
  }

  function viewPersonalPlaceInMap(placeId: string) {
    setSelectedPlaceId(placeId);
    setCurrentTab("mapa");
  }

  const tabIndex = tabs.indexOf(currentTab);
  useEffect(() => {
    const activePanel = tabPanelRefs.current[tabIndex];
    if (!activePanel) {
      setActivePanelHeight(null);
      return;
    }

    const updateHeight = () => {
      setActivePanelHeight(activePanel.getBoundingClientRect().height);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(activePanel);

    return () => {
      resizeObserver.disconnect();
    };
  }, [tabIndex]);

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
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Mis Lugares Guardados</h1>
          <p className="absolute bottom-4 left-4 text-sm font-semibold text-white/85">{savedPlacesCountLabel}</p>
        </div>
      </div>

      <div>
        <PersonalMapTabs activeTab={currentTab} onTabChange={setCurrentTab} />
      </div>

      <div
        className="overflow-hidden transition-[height] duration-220 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
        onTouchEnd={() => handleTouchEnd()}
        onTouchMove={(event) => handleTouchMove(event, event.currentTarget.clientWidth)}
        onTouchStart={(event) =>
          handleTouchStart(event.touches[0]?.clientX ?? 0, event.touches[0]?.clientY ?? 0, event.target)
        }
        style={{ height: activePanelHeight === null ? undefined : activePanelHeight }}
      >
        <div
          className={cn(
            "flex items-start",
            !isDragging && "transition-transform duration-220 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
            currentTab === "mapa" && "max-sm:!transform-none"
          )}
          style={{ transform: `translateX(calc(${-tabIndex * 100}% - ${dragOffsetPct}%))` }}
        >
          <div className={cn("w-full shrink-0 px-1.5", currentTab === "mapa" && "max-sm:hidden")} ref={(node) => { tabPanelRefs.current[0] = node; }}>
            {personalPlaces.length > 0 ? (
              <div>
                <SimplePlacesList
                  cardDataAttribute="data-place-card"
                  onTogglePlace={(placeId) => setSelectedPlaceId((current) => (current === placeId ? null : placeId))}
                  places={personalPlaces}
                  renderHeaderAccessory={(place) => (
                    <button
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 text-xs font-semibold text-[#c6283a] transition hover:-translate-y-0.5 hover:bg-rose-100 active:translate-y-0"
                      data-card-control=""
                      data-lock-swipe=""
                      onClick={(event) => {
                        event.stopPropagation();
                        viewPersonalPlaceInMap(place.id);
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
                    const sendStatus = (status: PersonalPlace["status"]) => {
                      const payload = new FormData();
                      payload.set("placeId", place.id);
                      payload.set("status", status);
                      startTransition(() => {
                        statusFormAction(payload);
                      });
                    };
                    const sendFavorite = (isFavorite: boolean) => {
                      const payload = new FormData();
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
            ) : (
              <EmptyState
                description="Busca un sitio en el mapa para crear tu primer lugar personal."
                title="Todavia no tienes lugares personales"
              />
            )}
          </div>

          <div className="w-full shrink-0 px-1.5" ref={(node) => { tabPanelRefs.current[1] = node; }}>
            <div
              className={cn(
                "rounded-[32px] border border-zinc-400/60 bg-zinc-500/35 p-1 backdrop-blur-sm",
                currentTab === "mapa" && "max-sm:fixed max-sm:inset-0 max-sm:z-50 max-sm:overflow-hidden max-sm:rounded-none max-sm:border-0 max-sm:bg-zinc-950 max-sm:p-0"
              )}
            >
              <PersonalMap
                activeMobileTab={currentTab}
                mobileTabs={personalMapTabs}
                onMobileTabChange={setCurrentTab}
                onSelectPlace={setSelectedPlaceId}
                places={personalPlaces}
                selectedPlaceId={selectedPlaceId}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
