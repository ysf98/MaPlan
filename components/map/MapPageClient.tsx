"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { deletePersonalPlaceAction, type DeletePersonalPlaceActionState } from "@/app/map/actions";
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

const deleteInitialState: DeletePersonalPlaceActionState = {
  error: null,
  success: false
};

export function MapPageClient({ personalPlaces, activeTab }: MapPageClientProps) {
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
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deletePersonalPlaceAction, deleteInitialState);

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
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Tus lugares guardados</h1>
          <p className="mt-1 text-sm text-white/85">Explora, guarda y organiza sitios personales con imagen cuando exista.</p>
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
                        <button
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          disabled={isDeleting}
                          onClick={(event) => {
                            event.preventDefault();
                            const confirmed = window.confirm("Estas seguro de que quieres eliminar este lugar?");
                            if (!confirmed) return;
                            const payload = new FormData();
                            payload.set("placeId", place.id);
                            startTransition(() => {
                              deleteFormAction(payload);
                            });
                          }}
                          type="button"
                        >
                          {isDeleting ? "Eliminando..." : "Eliminar"}
                        </button>
                    </>
                  )}
                  selectedPlaceId={selectedPlaceId}
                />
                {deleteState.error ? <p className="mt-3 text-sm text-rose-600">{deleteState.error}</p> : null}
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
              <PersonalMap onSelectPlace={setSelectedPlaceId} places={personalPlaces} selectedPlaceId={selectedPlaceId} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
