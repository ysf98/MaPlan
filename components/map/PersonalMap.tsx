"use client";

import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  addPersonalPlaceAction,
  deletePersonalPlaceAction,
  updatePersonalPlaceFavoriteAction,
  updatePersonalPlaceNameAction,
  updatePersonalPlaceStatusAction,
  type AddPersonalPlaceActionState,
  type DeletePersonalPlaceActionState,
  type UpdatePersonalPlaceFavoriteActionState,
  type UpdatePersonalPlaceNameActionState,
  type UpdatePersonalPlaceStatusActionState
} from "@/app/map/actions";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MapMobileTabs } from "@/components/map/MapMobileTabs";
import { MapPlaceCard } from "@/components/map/MapPlaceCard";
import { MapSaveDraftCard } from "@/components/map/MapSaveDraftCard";
import { MapSearchBox } from "@/components/map/MapSearchBox";
import { UserLocationButton } from "@/components/map/UserLocationButton";
import { resizeMapboxAfterLayout, useMapboxResizeOnVisible } from "@/components/map/useMapboxResize";
import { useUserLocationMarker } from "@/components/map/useUserLocationMarker";
import { formatDistance, getDistanceInMeters } from "@/lib/map/distance";
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
import type { PersonalMapTab } from "@/lib/map/tabs";

const addPersonalPlaceInitialState: AddPersonalPlaceActionState = {
  error: null,
  success: false
};
const deletePersonalPlaceInitialState: DeletePersonalPlaceActionState = {
  error: null,
  success: false
};
const updatePersonalPlaceNameInitialState: UpdatePersonalPlaceNameActionState = {
  error: null,
  success: false
};
const updatePersonalPlaceStatusInitialState: UpdatePersonalPlaceStatusActionState = {
  error: null,
  success: false
};
const updatePersonalPlaceFavoriteInitialState: UpdatePersonalPlaceFavoriteActionState = {
  error: null,
  success: false
};

type PersonalPlaceMapFilter = "all" | "pending" | "visited" | "favorite";

const placeFilterChips: Array<{ label: string; value: PersonalPlaceMapFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Pendientes", value: "pending" },
  { label: "Visitados", value: "visited" },
  { label: "Favoritos", value: "favorite" }
];

function placeMatchesMapFilter(place: PersonalPlace, filter: PersonalPlaceMapFilter): boolean {
  if (filter === "pending") return place.status === "pending";
  if (filter === "visited") return place.status === "visited";
  if (filter === "favorite") return place.isFavorite;
  return true;
}

type PersonalMapProps = {
  places: PersonalPlace[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string | null) => void;
  mobileTabs?: Array<{ label: string; value: PersonalMapTab }>;
  activeMobileTab?: PersonalMapTab;
  onMobileTabChange?: (tab: PersonalMapTab) => void;
};

export function PersonalMap({
  places,
  selectedPlaceId = null,
  onSelectPlace,
  mobileTabs,
  activeMobileTab,
  onMobileTabChange
}: PersonalMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapStyle = process.env.NEXT_PUBLIC_MAPBOX_STYLE || "mapbox://styles/mapbox/standard";
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedPlaceCardRef = useRef<HTMLDivElement | null>(null);
  const draftCardMobileRef = useRef<HTMLDivElement | null>(null);
  const draftCardDesktopRef = useRef<HTMLDivElement | null>(null);
  const selectedSearchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const markerByPlaceIdRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const skipNextMapClickRef = useRef(false);
  const pendingMapClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [resolveHint, setResolveHint] = useState<string | null>(null);
  const [draftSelection, setDraftSelection] = useState<MapDraftPlace | null>(null);
  const [searchCloseSignal, setSearchCloseSignal] = useState(0);
  const [activePlaceFilter, setActivePlaceFilter] = useState<PersonalPlaceMapFilter>("all");
  const [localSelectedPlaceId, setLocalSelectedPlaceId] = useState<string | null>(null);
  const [isSelectedFavorite, setIsSelectedFavorite] = useState(false);
  const [selectedPlaceStatus, setSelectedPlaceStatus] = useState<"pending" | "visited">("pending");
  const [isEditingSelectedPlace, setIsEditingSelectedPlace] = useState(false);
  const [selectedPlaceEditedName, setSelectedPlaceEditedName] = useState("");
  const [addPlaceState, addPlaceFormAction, isAddPlacePending] = useActionState(addPersonalPlaceAction, addPersonalPlaceInitialState);
  const [deletePlaceState, deletePlaceFormAction, isDeletePlacePending] = useActionState(
    deletePersonalPlaceAction,
    deletePersonalPlaceInitialState
  );
  const [updatePlaceNameState, updatePlaceNameFormAction, isUpdatePlaceNamePending] = useActionState(
    updatePersonalPlaceNameAction,
    updatePersonalPlaceNameInitialState
  );
  const [updateStatusState, updateStatusFormAction, isUpdateStatusPending] = useActionState(
    updatePersonalPlaceStatusAction,
    updatePersonalPlaceStatusInitialState
  );
  const [updateFavoriteState, updateFavoriteFormAction, isUpdateFavoritePending] = useActionState(
    updatePersonalPlaceFavoriteAction,
    updatePersonalPlaceFavoriteInitialState
  );
  const wasAddPlacePendingRef = useRef(false);
  const userLocation = useUserLocationMarker(mapRef);
  const isMapVisible = !activeMobileTab || activeMobileTab === "mapa";
  useMapboxResizeOnVisible(mapRef, mapContainerRef, isMapVisible);

  const filteredPlaces = useMemo(
    () => places.filter((place) => placeMatchesMapFilter(place, activePlaceFilter)),
    [activePlaceFilter, places]
  );
  const effectiveSelectedPlaceId = selectedPlaceId ?? localSelectedPlaceId;
  const selectedPlace = useMemo(() => places.find((place) => place.id === effectiveSelectedPlaceId) ?? null, [places, effectiveSelectedPlaceId]);
  const selectedPlaceDistanceLabel = useMemo(() => {
    if (!userLocation.location || !selectedPlace) {
      return null;
    }

    return formatDistance(
      getDistanceInMeters(userLocation.location, {
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude
      })
    );
  }, [selectedPlace, userLocation.location]);
  const draftDistanceLabel = useMemo(() => {
    if (!userLocation.location || !draftSelection) {
      return null;
    }

    return formatDistance(
      getDistanceInMeters(userLocation.location, {
        latitude: draftSelection.latitude,
        longitude: draftSelection.longitude
      })
    );
  }, [draftSelection, userLocation.location]);

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
    markerByPlaceIdRef.current.clear();
    setMapError(null);
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    const cleanupInitialResize = resizeMapboxAfterLayout(map);
    let cleanupLoadResize: (() => void) | null = null;
    const handleMapLoad = () => {
      cleanupLoadResize = resizeMapboxAfterLayout(map);
    };
    map.once("load", handleMapLoad);
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
            rating: nearby.place.rating,
            userRatingsTotal: nearby.place.userRatingsTotal,
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
      markerByPlaceIdRef.current.set(place.id, marker);

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
      markerByPlaceIdRef.current.clear();
      cleanupInitialResize();
      cleanupLoadResize?.();
      map.off("load", handleMapLoad);
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle, onSelectPlace, places, token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const visiblePlaceIds = new Set(filteredPlaces.map((place) => place.id));
    markerByPlaceIdRef.current.forEach((marker, placeId) => {
      marker.getElement().style.display = visiblePlaceIds.has(placeId) ? "" : "none";
    });

    if (selectedPlace && !visiblePlaceIds.has(selectedPlace.id)) {
      setLocalSelectedPlaceId(null);
      onSelectPlace?.(null);
    }

    if (filteredPlaces.length === 1) {
      const place = filteredPlaces[0];
      map.flyTo({
        center: [place.longitude, place.latitude],
        zoom: Math.max(map.getZoom(), 13),
        essential: true
      });
      return;
    }

    if (filteredPlaces.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredPlaces.forEach((place) => {
        bounds.extend([place.longitude, place.latitude]);
      });
      map.fitBounds(bounds, { padding: 48, maxZoom: 13 });
    }
  }, [filteredPlaces, onSelectPlace, selectedPlace]);

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
    setIsSelectedFavorite(Boolean(selectedPlace?.isFavorite));
  }, [selectedPlace?.id, selectedPlace?.isFavorite]);

  useEffect(() => {
    setSelectedPlaceStatus(selectedPlace?.status ?? "pending");
  }, [selectedPlace?.id, selectedPlace?.status]);

  useEffect(() => {
    setIsEditingSelectedPlace(false);
    setSelectedPlaceEditedName(selectedPlace?.name ?? "");
  }, [selectedPlace?.id, selectedPlace?.name]);

  useEffect(() => {
    if (!updatePlaceNameState.success) return;
    setIsEditingSelectedPlace(false);
  }, [updatePlaceNameState.success]);

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
      const targetElement = event.target as HTMLElement | null;
      if (targetElement?.closest("[data-map-control]")) {
        return;
      }
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
      const targetElement = event.target as HTMLElement | null;
      if (targetElement?.closest("[data-map-control]")) {
        return;
      }
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
      rating: resolved.rating,
      userRatingsTotal: resolved.userRatingsTotal,
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
  if (!token) {
    return <EmptyState description="Define NEXT_PUBLIC_MAPBOX_TOKEN para habilitar el mapa." title="Falta configurar Mapbox" />;
  }

  if (mapError) {
    return <EmptyState description={mapError} title="Error cargando el mapa" />;
  }

  return (
    <div className="space-y-3">
      <div className="relative h-[100svh] min-h-[100dvh] w-full overflow-hidden rounded-none border-0 bg-zinc-200/30 shadow-none sm:h-[500px] sm:min-h-0 sm:rounded-[30px] sm:border sm:border-zinc-300/60">
        <div className="h-full w-full" data-lock-swipe ref={mapContainerRef} />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(244,244,245,0.12)_100%)]" />

        <div className="pointer-events-none absolute inset-x-4 top-[calc(env(safe-area-inset-top)+12px)] z-20">
          {mobileTabs && activeMobileTab && onMobileTabChange ? (
            <MapMobileTabs activeValue={activeMobileTab} onChange={onMobileTabChange} tabs={mobileTabs} />
          ) : null}
          <div
            className="pointer-events-auto mt-2 min-w-0 sm:mt-0"
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
            className="pointer-events-auto mt-2 flex gap-2 overflow-x-auto pb-2 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onPointerDownCapture={(event) => event.stopPropagation()}
            onTouchStartCapture={(event) => event.stopPropagation()}
          >
            {placeFilterChips.map((chip) => (
              <button
                aria-pressed={activePlaceFilter === chip.value}
                key={chip.value}
                onClick={() => {
                  setActivePlaceFilter(chip.value);
                }}
                type="button"
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition hover:-translate-y-0.5 active:translate-y-0 ${
                  activePlaceFilter === chip.value
                    ? "bg-[#c6283a] text-white shadow-[0_6px_14px_rgba(24,24,27,0.12)]"
                    : "border border-zinc-200/80 bg-white/90 text-zinc-600 shadow-[0_6px_14px_rgba(24,24,27,0.10)] backdrop-blur-xl"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <UserLocationButton error={userLocation.error} isLocating={userLocation.isLocating} onClick={userLocation.requestLocation} />

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
          <div className="pointer-events-none absolute left-4 top-44 z-10 sm:top-32">
            <Card className="rounded-2xl border-zinc-100 bg-white/95 shadow-lg backdrop-blur">
              <p className="text-sm text-zinc-700">{resolveHint}</p>
            </Card>
          </div>
        ) : null}

        {selectedPlace ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-30 sm:bottom-4">
            <div className="pointer-events-auto" ref={selectedPlaceCardRef}>
              <MapPlaceCard
                capabilities={{
                  canCall: Boolean(selectedPlace.phoneNumber),
                  canDelete: true,
                  canEditName: true,
                  canFavorite: true,
                  canUpdateStatus: true,
                  canOpenMaps: Boolean(selectedPlace.googleMapsUrl),
                  canSave: false
                }}
                editNameValue={selectedPlaceEditedName}
                error={isEditingSelectedPlace ? updatePlaceNameState.error : deletePlaceState.error || updateStatusState.error || updateFavoriteState.error}
                isDeleting={isDeletePlacePending}
                isEditingPending={isUpdatePlaceNamePending}
                isFavoritePending={isUpdateFavoritePending}
                isStatusPending={isUpdateStatusPending}
                mode={isEditingSelectedPlace ? "edit" : "view"}
                onClose={() => {
                  setLocalSelectedPlaceId(null);
                  onSelectPlace?.(null);
                }}
                onDelete={() => {
                  const confirmed = window.confirm("Estas seguro de que quieres eliminar este lugar?");
                  if (!confirmed) return;
                  const payload = new FormData();
                  payload.set("placeId", selectedPlace.id);
                  startTransition(() => {
                    deletePlaceFormAction(payload);
                  });
                }}
                onEditCancel={() => {
                  setIsEditingSelectedPlace(false);
                  setSelectedPlaceEditedName(selectedPlace.name);
                }}
                onEditNameChange={setSelectedPlaceEditedName}
                onEditSave={() => {
                  const payload = new FormData();
                  payload.set("placeId", selectedPlace.id);
                  payload.set("name", selectedPlaceEditedName);
                  startTransition(() => {
                    updatePlaceNameFormAction(payload);
                  });
                }}
                onEditStart={() => setIsEditingSelectedPlace(true)}
                onToggleFavorite={() => {
                  const nextFavorite = !isSelectedFavorite;
                  setIsSelectedFavorite(nextFavorite);
                  const payload = new FormData();
                  payload.set("placeId", selectedPlace.id);
                  payload.set("isFavorite", String(nextFavorite));
                  startTransition(() => {
                    updateFavoriteFormAction(payload);
                  });
                }}
                onToggleStatus={() => {
                  const nextStatus = selectedPlaceStatus === "visited" ? "pending" : "visited";
                  setSelectedPlaceStatus(nextStatus);
                  const payload = new FormData();
                  payload.set("placeId", selectedPlace.id);
                  payload.set("status", nextStatus);
                  startTransition(() => {
                    updateStatusFormAction(payload);
                  });
                }}
                place={{
                  address: selectedPlace.address,
                  city: selectedPlace.city,
                  googleMapsUrl: selectedPlace.googleMapsUrl,
                  imageUrl: selectedPlace.imageUrl,
                  isFavorite: isSelectedFavorite,
                  name: selectedPlace.name,
                  phoneNumber: selectedPlace.phoneNumber,
                  rating: selectedPlace.rating,
                  userRatingsTotal: selectedPlace.userRatingsTotal,
                  status: selectedPlaceStatus
                }}
                distanceLabel={selectedPlaceDistanceLabel}
                variant="saved"
              />
            </div>
          </div>
        ) : null}
        {draftSelection ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 md:hidden">
            <div className="pointer-events-auto" ref={draftCardMobileRef}>
              <MapSaveDraftCard
                distanceLabel={draftDistanceLabel}
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
            distanceLabel={draftDistanceLabel}
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
