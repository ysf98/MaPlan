"use client";

import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  addPersonalPlaceAction,
  deletePersonalPlaceAction,
  type AddPersonalPlaceActionState,
  type DeletePersonalPlaceActionState
} from "@/app/map/actions";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MapSaveDraftCard } from "@/components/map/MapSaveDraftCard";
import { MapSearchBox } from "@/components/map/MapSearchBox";
import { inferCategoryFromGoogleSignals } from "@/lib/map/placeClassification";
import { getPlaceMarkerColorFromPlace } from "@/lib/map/placeMarkerColor";
import {
  buildDraftFromRenderedFeature,
  extractFallbackNameFromRenderedFeatures,
  resolvePlaceFromMapClick,
  type MapDraftPlace
} from "@/lib/map/geocoding";
import { getGooglePlaceDetails, getGooglePlaceNearby, type GooglePlaceSuggestion } from "@/lib/map/googlePlaces";
import type { PersonalPlace } from "@/lib/personalPlaces";

const addPersonalPlaceInitialState: AddPersonalPlaceActionState = {
  error: null,
  success: false
};

const deletePersonalPlaceInitialState: DeletePersonalPlaceActionState = {
  error: null,
  success: false
};

type PersonalMapProps = {
  places: PersonalPlace[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string | null) => void;
};

export function PersonalMap({ places, selectedPlaceId = null, onSelectPlace }: PersonalMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapStyle = process.env.NEXT_PUBLIC_MAPBOX_STYLE || "mapbox://styles/mapbox/standard";
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedPlaceCardRef = useRef<HTMLDivElement | null>(null);
  const draftCardMobileRef = useRef<HTMLDivElement | null>(null);
  const draftCardDesktopRef = useRef<HTMLDivElement | null>(null);
  const selectedSearchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const skipNextMapClickRef = useRef(false);
  const pendingMapClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [resolveHint, setResolveHint] = useState<string | null>(null);
  const [draftSelection, setDraftSelection] = useState<MapDraftPlace | null>(null);
  const [searchCloseSignal, setSearchCloseSignal] = useState(0);
  const [localSelectedPlaceId, setLocalSelectedPlaceId] = useState<string | null>(null);
  const [isSelectedFavorite, setIsSelectedFavorite] = useState(false);
  const [addPlaceState, addPlaceFormAction, isAddPlacePending] = useActionState(addPersonalPlaceAction, addPersonalPlaceInitialState);
  const [deletePlaceState, deletePlaceFormAction, isDeletePlacePending] = useActionState(
    deletePersonalPlaceAction,
    deletePersonalPlaceInitialState
  );
  const wasAddPlacePendingRef = useRef(false);

  const effectiveSelectedPlaceId = selectedPlaceId ?? localSelectedPlaceId;
  const selectedPlace = useMemo(() => places.find((place) => place.id === effectiveSelectedPlaceId) ?? null, [places, effectiveSelectedPlaceId]);

  useEffect(() => {
    if (wasAddPlacePendingRef.current && !isAddPlacePending && addPlaceState.success) {
      setDraftSelection(null);
      selectedSearchMarkerRef.current?.remove();
      selectedSearchMarkerRef.current = null;
      setSearchCloseSignal((value) => value + 1);
    }
    wasAddPlacePendingRef.current = isAddPlacePending;
  }, [addPlaceState.success, isAddPlacePending]);

  useEffect(() => {
    if (!mapContainerRef.current || !token) {
      return;
    }

    mapboxgl.accessToken = token;
    const firstPlace = places[0];
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: firstPlace ? [firstPlace.longitude, firstPlace.latitude] : [-3.7038, 40.4168],
      zoom: firstPlace ? 11 : 5
    });

    mapRef.current = map;
    setMapError(null);
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    const handleMapClick = async (event: mapboxgl.MapMouseEvent) => {
      if (skipNextMapClickRef.current) {
        skipNextMapClickRef.current = false;
        return;
      }

      const renderedFeatures = map.queryRenderedFeatures(event.point) as Array<{ properties?: Record<string, unknown> }>;
      const renderedName = extractFallbackNameFromRenderedFeatures(renderedFeatures);
      const latitude = Number(event.lngLat.lat.toFixed(6));
      const longitude = Number(event.lngLat.lng.toFixed(6));
      setIsResolvingLocation(true);
      setResolveHint(null);

      try {
        const nearby = await getGooglePlaceNearby({ lat: latitude, lng: longitude, selectedName: renderedName || null });
        if (nearby.place) {
          setDraftSelection({
            latitude,
            longitude,
            name: nearby.place.name,
            address: nearby.place.address,
            city: nearby.place.city,
            category: inferCategoryFromGoogleSignals(nearby.place.primaryType, nearby.place.name),
            provider: "google_places",
            externalPlaceId: nearby.place.externalPlaceId,
            googleMapsUrl: nearby.place.googleMapsUrl,
            businessStatus: nearby.place.businessStatus,
            phoneNumber: nearby.place.phoneNumber,
            imageUrl: nearby.place.imageUrl
          });
          return;
        }

        if (nearby.fallbackReason) {
          setResolveHint("No hemos encontrado detalles del lugar, pero puedes guardarlo manualmente.");
        }

        const resolved = await resolvePlaceFromMapClick(token, latitude, longitude, renderedName);
        setDraftSelection({
          latitude,
          longitude,
          name: resolved.name,
          address: resolved.address,
          city: resolved.city,
          category: "Otros",
          provider: "mapbox"
        });
      } catch {
        setResolveHint("No hemos encontrado detalles del lugar, pero puedes guardarlo manualmente.");
        const featureWithName = renderedFeatures.find((feature) => {
          const name = ((feature.properties?.name as string | undefined) || "").trim();
          return Boolean(name);
        });
        setDraftSelection(buildDraftFromRenderedFeature(featureWithName, latitude, longitude));
      } finally {
        setIsResolvingLocation(false);
      }
    };

    map.on("click", (event) => {
      if (pendingMapClickTimeoutRef.current) {
        clearTimeout(pendingMapClickTimeoutRef.current);
      }

      pendingMapClickTimeoutRef.current = setTimeout(() => {
        void handleMapClick(event);
      }, 220);
    });

    map.on("dblclick", () => {
      if (!pendingMapClickTimeoutRef.current) {
        return;
      }
      clearTimeout(pendingMapClickTimeoutRef.current);
      pendingMapClickTimeoutRef.current = null;
    });
    map.on("error", (event) => {
      const message = event.error?.message || "No se pudo cargar Mapbox.";
      setMapError(message);
    });

    const bounds = new mapboxgl.LngLatBounds();
    places.forEach((place) => {
      const marker = new mapboxgl.Marker({ color: getPlaceMarkerColorFromPlace(place) }).setLngLat([place.longitude, place.latitude]).addTo(map);

      marker.getElement().addEventListener("click", (event) => {
        event.stopPropagation();
        skipNextMapClickRef.current = true;
        setDraftSelection(null);
        setResolveHint(null);
        setLocalSelectedPlaceId(place.id);
        onSelectPlace?.(place.id);
      });
      bounds.extend([place.longitude, place.latitude]);
    });

    if (places.length > 1) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 13 });
    }

    return () => {
      if (pendingMapClickTimeoutRef.current) {
        clearTimeout(pendingMapClickTimeoutRef.current);
        pendingMapClickTimeoutRef.current = null;
      }
      selectedSearchMarkerRef.current?.remove();
      selectedSearchMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle, onSelectPlace, places, token]);

  useEffect(() => {
    if (!selectedPlace || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 16),
      essential: true
    });
  }, [selectedPlace]);

  useEffect(() => {
    setIsSelectedFavorite(false);
  }, [selectedPlace?.id]);

  useEffect(() => {
    if (!deletePlaceState.success) return;
    setLocalSelectedPlaceId(null);
    onSelectPlace?.(null);
  }, [deletePlaceState.success, onSelectPlace]);

  useEffect(() => {
    if (!draftSelection) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const isInsideMobile = Boolean(draftCardMobileRef.current && target && draftCardMobileRef.current.contains(target));
      const isInsideDesktop = Boolean(draftCardDesktopRef.current && target && draftCardDesktopRef.current.contains(target));

        if (isInsideMobile || isInsideDesktop) {
          return;
        }

        skipNextMapClickRef.current = true;
        setDraftSelection(null);
        setResolveHint(null);
        selectedSearchMarkerRef.current?.remove();
        selectedSearchMarkerRef.current = null;
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [draftSelection]);

  useEffect(() => {
    if (!selectedPlace) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
        if (selectedPlaceCardRef.current && target && selectedPlaceCardRef.current.contains(target)) {
          return;
        }

        skipNextMapClickRef.current = true;
        setLocalSelectedPlaceId(null);
        onSelectPlace?.(null);
      };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [selectedPlace, onSelectPlace]);

  const handleSelectSearchResult = useCallback(async (result: GooglePlaceSuggestion) => {
    setResolveHint(null);
    const resolved = await getGooglePlaceDetails({ externalPlaceId: result.externalPlaceId });
    if (!resolved) {
      return;
    }

    const nextDraft: MapDraftPlace = {
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      name: resolved.name,
      address: resolved.address,
      city: resolved.city,
      category: inferCategoryFromGoogleSignals(resolved.primaryType ?? result.primaryType, resolved.name),
      provider: resolved.provider,
      externalPlaceId: resolved.externalPlaceId,
      googleMapsUrl: resolved.googleMapsUrl,
      businessStatus: resolved.businessStatus,
      phoneNumber: resolved.phoneNumber,
      imageUrl: resolved.imageUrl
    };

    const map = mapRef.current;
    if (!map) {
      setDraftSelection(nextDraft);
      return;
    }

    setDraftSelection(null);
    map.flyTo({
      center: [resolved.longitude, resolved.latitude],
      zoom: Math.max(map.getZoom(), 14),
      essential: true
    });
    selectedSearchMarkerRef.current?.remove();
    selectedSearchMarkerRef.current = new mapboxgl.Marker({ color: "#f97316" })
      .setLngLat([resolved.longitude, resolved.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 20 }).setText(resolved.name))
      .addTo(map);
    map.once("moveend", () => {
      setDraftSelection(nextDraft);
    });
  }, []);

  const handleManualCreateFromSearch = useCallback((payload: { name: string; address: string; city: string }) => {
    setResolveHint(null);
    const center = mapRef.current?.getCenter();
    const latitude = Number((center?.lat ?? 40.4168).toFixed(6));
    const longitude = Number((center?.lng ?? -3.7038).toFixed(6));
    setDraftSelection({
      name: payload.name || "Sitio en mapa",
      address: payload.address || "Punto en mapa",
      city: payload.city || "",
      category: "Otros",
      latitude,
      longitude,
      provider: "manual",
      externalPlaceId: null,
      googleMapsUrl: null,
      businessStatus: null,
      imageUrl: null
    });
  }, []);

  const getMapContext = useCallback(() => {
    const center = mapRef.current?.getCenter() ?? null;
    return {
      center: center ? { lng: center.lng, lat: center.lat } : null
    };
  }, []);
  const filterChips = ["Todos", "Pendientes", "Visitados", "Favoritos"];

  if (!token) {
    return <EmptyState description="Define NEXT_PUBLIC_MAPBOX_TOKEN para habilitar el mapa." title="Falta configurar Mapbox" />;
  }

  if (mapError) {
    return <EmptyState description={mapError} title="Error cargando el mapa" />;
  }

  return (
    <div className="space-y-3">
      <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-zinc-100">
        <div className="h-full w-full" data-lock-swipe ref={mapContainerRef} />

        <div className="pointer-events-none absolute inset-x-3 top-3 z-20">
          <div
            className="pointer-events-auto"
            onPointerDownCapture={(event) => event.stopPropagation()}
            onTouchStartCapture={(event) => event.stopPropagation()}
          >
            <MapSearchBox
              closeSignal={searchCloseSignal}
              getMapContext={getMapContext}
              onManualCreate={handleManualCreateFromSearch}
              onSelectResult={handleSelectSearchResult}
            />
          </div>
          <div
            className="pointer-events-auto mt-2 flex gap-2 overflow-x-auto pb-1"
            onPointerDownCapture={(event) => event.stopPropagation()}
            onTouchStartCapture={(event) => event.stopPropagation()}
          >
            {filterChips.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                  chip === "Todos" ? "bg-[#c6283a] text-white" : "bg-white/95 text-zinc-600 shadow"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {isResolvingLocation ? (
          <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white/92 shadow-sm backdrop-blur">
              <svg className="h-3.5 w-3.5 animate-spin text-[#c6283a]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
              </svg>
            </div>
          </div>
        ) : null}

        {resolveHint && !isResolvingLocation ? (
          <div className="pointer-events-none absolute left-3 top-24 z-10">
            <Card className="rounded-2xl border-zinc-100 bg-white/95 shadow-lg backdrop-blur">
              <p className="text-sm text-zinc-700">{resolveHint}</p>
            </Card>
          </div>
        ) : null}

        {selectedPlace ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30">
            <div className="pointer-events-auto" ref={selectedPlaceCardRef}>
              <Card className="mx-auto w-full max-w-[380px] rounded-2xl border-zinc-100 bg-white/95 p-1 shadow-xl backdrop-blur">
              <div className="-mt-1 flex items-center justify-between">
                <button
                  aria-label="Cerrar"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-transform duration-150 hover:scale-110 hover:bg-zinc-50 active:scale-95"
                  onClick={() => {
                    setLocalSelectedPlaceId(null);
                    onSelectPlace?.(null);
                  }}
                  type="button"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
                <button
                  aria-label={isSelectedFavorite ? "Quitar favorito" : "Marcar favorito"}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition-transform duration-150 hover:scale-110 active:scale-95 ${
                    isSelectedFavorite ? "border-rose-200 bg-rose-50 text-[#c6283a]" : "border-zinc-200 bg-white text-zinc-500"
                  }`}
                  onClick={() => setIsSelectedFavorite((value) => !value)}
                  type="button"
                >
                  <svg className="h-4 w-4" fill={isSelectedFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="m12 21-1.5-1.35C5.4 15.08 2 12 2 8.24A4.24 4.24 0 0 1 6.24 4C8 4 9.7 4.81 10.8 6.09L12 7.5l1.2-1.41A5 5 0 0 1 17.76 4 4.24 4.24 0 0 1 22 8.24c0 3.76-3.4 6.84-8.5 11.41Z" />
                  </svg>
                </button>
                <button
                  aria-label="Eliminar lugar"
                  title="Eliminar lugar"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-transform duration-150 hover:scale-110 hover:border-rose-200 hover:bg-rose-50 hover:text-[#c6283a] active:scale-95"
                  disabled={isDeletePlacePending}
                  onClick={(event) => {
                    event.preventDefault();
                    const confirmed = window.confirm("Estas seguro de que quieres eliminar este lugar?");
                    if (!confirmed) return;
                    const payload = new FormData();
                    payload.set("placeId", selectedPlace.id);
                    startTransition(() => {
                      deletePlaceFormAction(payload);
                    });
                  }}
                  type="button"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                </button>
              </div>
              {deletePlaceState.error ? <p className="mt-2 text-xs text-rose-600">{deletePlaceState.error}</p> : null}

              <div className="mt-1.5 flex items-start gap-2.5">
                <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  {selectedPlace.imageUrl ? (
                    <img alt={selectedPlace.name} className="h-full w-full object-cover" src={selectedPlace.imageUrl} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg text-zinc-400">+</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-4 text-zinc-900">{selectedPlace.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                    {selectedPlace.address}
                    {selectedPlace.city ? ` Ãƒâ€šÃ‚Â· ${selectedPlace.city}` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-center gap-11 pt-0">
                {selectedPlace.googleMapsUrl ? (
                  <a
                    className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-600 transition-transform duration-150 hover:scale-110 active:scale-95"
                    href={selectedPlace.googleMapsUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <svg className="h-[18px] w-[18px] text-[#c6283a]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <path d="m8 11.4 8.2-3.1-3.1 8.2-1.4-3.7z" />
                    </svg>
                    Ir
                  </a>
                ) : (
                  <button className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-400" disabled type="button">
                    <svg className="h-[18px] w-[18px] text-zinc-300" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <path d="m8 11.4 8.2-3.1-3.1 8.2-1.4-3.7z" />
                    </svg>
                    Ir
                  </button>
                )}
                {selectedPlace.phoneNumber ? (
                  <a
                    className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-600 transition-transform duration-150 hover:scale-110 active:scale-95"
                    href={`tel:${selectedPlace.phoneNumber}`}
                  >
                    <svg className="h-[18px] w-[18px] text-[#c6283a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M22 16.92V20a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.08 2h3.09a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.17a16 16 0 0 0 6.83 6.83l.72-1.35a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Llamar
                  </a>
                ) : (
                  <button className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-400" disabled type="button">
                    <svg className="h-[18px] w-[18px] text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M22 16.92V20a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.08 2h3.09a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.17a16 16 0 0 0 6.83 6.83l.72-1.35a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Llamar
                  </button>
                )}
                <button className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-600 transition-transform duration-150 hover:scale-110 active:scale-95" type="button">
                  <svg className="h-[18px] w-[18px] text-[#c6283a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 20h9" />
                    <path d="m16.5 3.5 4 4L7 21H3v-4z" />
                  </svg>
                  Editar
                </button>
              </div>
              </Card>
            </div>
          </div>
        ) : null}

        {draftSelection ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-40 md:hidden">
            <div className="pointer-events-auto" ref={draftCardMobileRef}>
              <MapSaveDraftCard
                draft={draftSelection}
                formAction={addPlaceFormAction}
                isPending={isAddPlacePending}
                onCancel={() => {
                  setDraftSelection(null);
                  setResolveHint(null);
                  selectedSearchMarkerRef.current?.remove();
                  selectedSearchMarkerRef.current = null;
                }}
                scopeIdName="scope"
                scopeIdValue="personal"
                state={addPlaceState}
              />
            </div>
          </div>
        ) : null}
      </div>

      {draftSelection ? (
        <div className="hidden md:block" ref={draftCardDesktopRef}>
          <MapSaveDraftCard
            draft={draftSelection}
            formAction={addPlaceFormAction}
            isPending={isAddPlacePending}
            onCancel={() => {
              setDraftSelection(null);
              setResolveHint(null);
              selectedSearchMarkerRef.current?.remove();
              selectedSearchMarkerRef.current = null;
            }}
            scopeIdName="scope"
            scopeIdValue="personal"
            state={addPlaceState}
          />
        </div>
      ) : null}
    </div>
  );
}

