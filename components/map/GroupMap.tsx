"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import { addPlaceAction, deletePlaceAction, updatePlaceFavoriteAction, updatePlaceNameAction } from "@/app/groups/[groupId]/actions";
import type {
  AddPlaceActionState,
  DeletePlaceActionState,
  UpdatePlaceFavoriteActionState,
  UpdatePlaceNameActionState
} from "@/app/groups/[groupId]/actions";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { hasValidCoordinates, type GroupPlace } from "@/lib/places/shared";
import {
  buildDraftFromRenderedFeature,
  extractFallbackNameFromRenderedFeatures,
  resolvePlaceFromMapClick,
  type MapDraftPlace
} from "@/lib/map/geocoding";
import { MapSearchBox } from "@/components/map/MapSearchBox";
import { MapPlaceCard } from "@/components/map/MapPlaceCard";
import { MapSaveDraftCard } from "@/components/map/MapSaveDraftCard";
import { getGooglePlaceDetails, getGooglePlaceNearby, type GooglePlaceSuggestion } from "@/lib/map/googlePlaces";
import { inferCategoryFromGoogleSignals } from "@/lib/map/placeClassification";
import { getPlaceMarkerColorFromPlace } from "@/lib/map/placeMarkerColor";

type GroupMapProps = {
  groupId: string;
  canEdit: boolean;
  places: GroupPlace[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string | null) => void;
};

type PlaceMapFilter = "all" | "pending" | "visited" | "favorite";

const placeFilterChips: Array<{ label: string; value: PlaceMapFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Pendientes", value: "pending" },
  { label: "Visitados", value: "visited" },
  { label: "Favoritos", value: "favorite" }
];

const addPlaceInitialState: AddPlaceActionState = {
  error: null,
  success: false
};
const deletePlaceInitialState: DeletePlaceActionState = {
  error: null,
  success: false
};

const favoritePlaceInitialState: UpdatePlaceFavoriteActionState = {
  error: null,
  success: false
};
const placeNameInitialState: UpdatePlaceNameActionState = {
  error: null,
  success: false
};

function normalizePlaceMatchValue(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function getDistanceInMeters(first: { latitude: number; longitude: number }, second: { latitude: number; longitude: number }): number {
  const earthRadiusInMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(second.latitude - first.latitude);
  const deltaLng = toRadians(second.longitude - first.longitude);
  const firstLat = toRadians(first.latitude);
  const secondLat = toRadians(second.latitude);
  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusInMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function placeMatchesMapFilter(place: GroupPlace, filter: PlaceMapFilter): boolean {
  if (filter === "pending") return place.status === "pending";
  if (filter === "visited") return place.status === "visited";
  if (filter === "favorite") return place.isFavorite;
  return true;
}

export function GroupMap({ groupId, canEdit, places, selectedPlaceId = null, onSelectPlace }: GroupMapProps) {
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
  const [activePlaceFilter, setActivePlaceFilter] = useState<PlaceMapFilter>("all");
  const [localSelectedPlaceId, setLocalSelectedPlaceId] = useState<string | null>(null);
  const [isSelectedFavorite, setIsSelectedFavorite] = useState(false);
  const [isEditingSelectedPlace, setIsEditingSelectedPlace] = useState(false);
  const [selectedPlaceEditedName, setSelectedPlaceEditedName] = useState("");
  const [addPlaceState, addPlaceFormAction, isAddPlacePending] = useActionState(addPlaceAction, addPlaceInitialState);
  const [deletePlaceState, deletePlaceFormAction, isDeletePlacePending] = useActionState(deletePlaceAction, deletePlaceInitialState);
  const [favoritePlaceState, favoritePlaceFormAction, isFavoritePlacePending] = useActionState(
    updatePlaceFavoriteAction,
    favoritePlaceInitialState
  );
  const [placeNameState, placeNameFormAction, isPlaceNamePending] = useActionState(updatePlaceNameAction, placeNameInitialState);
  const wasAddPlacePendingRef = useRef(false);

  const placesWithCoordinates = useMemo(() => places.filter((place) => hasValidCoordinates(place)), [places]);
  const filteredPlacesWithCoordinates = useMemo(
    () => placesWithCoordinates.filter((place) => placeMatchesMapFilter(place, activePlaceFilter)),
    [activePlaceFilter, placesWithCoordinates]
  );
  const effectiveSelectedPlaceId = selectedPlaceId ?? localSelectedPlaceId;
  const internalSelectedPlace = useMemo(
    () => placesWithCoordinates.find((place) => place.id === effectiveSelectedPlaceId) ?? null,
    [placesWithCoordinates, effectiveSelectedPlaceId]
  );
  const findSavedPlaceFromGoogleResult = useCallback(
    (result: Pick<GooglePlaceSuggestion, "externalPlaceId" | "name" | "address" | "latitude" | "longitude">) => {
      const byExternalId = placesWithCoordinates.find(
        (place) => place.provider === "google_places" && place.externalPlaceId === result.externalPlaceId
      );

      if (byExternalId) {
        return byExternalId;
      }

      const normalizedResultName = normalizePlaceMatchValue(result.name);
      const normalizedResultAddress = normalizePlaceMatchValue(result.address);

      return (
        placesWithCoordinates.find((place) => {
          const latitude = place.latitude as number;
          const longitude = place.longitude as number;
          const distance = getDistanceInMeters(
            { latitude, longitude },
            { latitude: result.latitude, longitude: result.longitude }
          );
          if (distance > 80) {
            return false;
          }

          const normalizedPlaceName = normalizePlaceMatchValue(place.name);
          const normalizedPlaceAddress = normalizePlaceMatchValue(place.address);
          const hasSameName = normalizedPlaceName === normalizedResultName;
          const hasSameAddress = Boolean(
            normalizedPlaceAddress &&
              normalizedResultAddress &&
              (normalizedPlaceAddress.includes(normalizedResultAddress) ||
                normalizedResultAddress.includes(normalizedPlaceAddress))
          );

          return hasSameName || hasSameAddress;
        }) ?? null
      );
    },
    [placesWithCoordinates]
  );

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
    const firstPlace = placesWithCoordinates[0];
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: firstPlace ? [firstPlace.longitude as number, firstPlace.latitude as number] : [-3.7038, 40.4168],
      zoom: firstPlace ? 11 : 5
    });

    mapRef.current = map;
    markerByPlaceIdRef.current.clear();
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
    placesWithCoordinates.forEach((place) => {
      const latitude = place.latitude as number;
      const longitude = place.longitude as number;
      const marker = new mapboxgl.Marker({ color: getPlaceMarkerColorFromPlace(place) }).setLngLat([longitude, latitude]).addTo(map);
      markerByPlaceIdRef.current.set(place.id, marker);

      marker.getElement().addEventListener("click", (event) => {
        event.stopPropagation();
        skipNextMapClickRef.current = true;
        setDraftSelection(null);
        setResolveHint(null);
        setLocalSelectedPlaceId(place.id);
        onSelectPlace?.(place.id);
      });
      bounds.extend([longitude, latitude]);
    });

    if (placesWithCoordinates.length > 1) {
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
      map.remove();
      mapRef.current = null;
    };
  }, [canEdit, mapStyle, onSelectPlace, placesWithCoordinates, token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const visiblePlaceIds = new Set(filteredPlacesWithCoordinates.map((place) => place.id));
    markerByPlaceIdRef.current.forEach((marker, placeId) => {
      marker.getElement().style.display = visiblePlaceIds.has(placeId) ? "" : "none";
    });

    if (internalSelectedPlace && !visiblePlaceIds.has(internalSelectedPlace.id)) {
      setLocalSelectedPlaceId(null);
      onSelectPlace?.(null);
    }

    if (filteredPlacesWithCoordinates.length === 1) {
      const place = filteredPlacesWithCoordinates[0];
      map.flyTo({
        center: [place.longitude as number, place.latitude as number],
        zoom: Math.max(map.getZoom(), 13),
        essential: true
      });
      return;
    }

    if (filteredPlacesWithCoordinates.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredPlacesWithCoordinates.forEach((place) => {
        bounds.extend([place.longitude as number, place.latitude as number]);
      });
      map.fitBounds(bounds, { padding: 48, maxZoom: 13 });
    }
  }, [activePlaceFilter, filteredPlacesWithCoordinates, internalSelectedPlace, onSelectPlace]);

  useEffect(() => {
    if (!internalSelectedPlace || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [internalSelectedPlace.longitude as number, internalSelectedPlace.latitude as number],
      zoom: Math.max(mapRef.current.getZoom(), 16),
      essential: true
    });
  }, [internalSelectedPlace]);

  useEffect(() => {
    setIsSelectedFavorite(Boolean(internalSelectedPlace?.isFavorite));
  }, [internalSelectedPlace?.id, internalSelectedPlace?.isFavorite]);

  useEffect(() => {
    setIsEditingSelectedPlace(false);
    setSelectedPlaceEditedName(internalSelectedPlace?.name ?? "");
  }, [internalSelectedPlace?.id, internalSelectedPlace?.name]);

  useEffect(() => {
    if (!placeNameState.success) return;
    setIsEditingSelectedPlace(false);
  }, [placeNameState.success]);

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
    if (!internalSelectedPlace) {
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
  }, [internalSelectedPlace, onSelectPlace]);

  const handleSelectSearchResult = useCallback(async (result: GooglePlaceSuggestion) => {
    setResolveHint(null);
    const savedPlaceFromResult = findSavedPlaceFromGoogleResult(result);
    if (savedPlaceFromResult) {
      setDraftSelection(null);
      selectedSearchMarkerRef.current?.remove();
      selectedSearchMarkerRef.current = null;
      setLocalSelectedPlaceId(savedPlaceFromResult.id);
      onSelectPlace?.(savedPlaceFromResult.id);
      return;
    }

    const resolved = await getGooglePlaceDetails({ externalPlaceId: result.externalPlaceId });
    if (!resolved) {
      return;
    }

    const savedPlaceFromDetails = findSavedPlaceFromGoogleResult({
      externalPlaceId: resolved.externalPlaceId,
      name: resolved.name,
      address: resolved.address,
      latitude: resolved.latitude,
      longitude: resolved.longitude
    });
    if (savedPlaceFromDetails) {
      setDraftSelection(null);
      selectedSearchMarkerRef.current?.remove();
      selectedSearchMarkerRef.current = null;
      setLocalSelectedPlaceId(savedPlaceFromDetails.id);
      onSelectPlace?.(savedPlaceFromDetails.id);
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
  }, [findSavedPlaceFromGoogleResult, onSelectPlace]);

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
            {placeFilterChips.map((chip) => (
              <button
                aria-pressed={activePlaceFilter === chip.value}
                key={chip.value}
                onClick={() => {
                  setActivePlaceFilter(chip.value);
                }}
                type="button"
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                  activePlaceFilter === chip.value ? "bg-[#c6283a] text-white" : "bg-white/95 text-zinc-600 shadow"
                }`}
              >
                {chip.label}
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

        {internalSelectedPlace ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30">
            <div className="pointer-events-auto" ref={selectedPlaceCardRef}>
              <MapPlaceCard
                capabilities={{
                  canCall: Boolean(internalSelectedPlace.phoneNumber),
                  canDelete: canEdit,
                  canEditName: canEdit,
                  canFavorite: canEdit,
                  canOpenMaps: Boolean(internalSelectedPlace.googleMapsUrl),
                  canSave: false
                }}
                editNameValue={selectedPlaceEditedName}
                error={isEditingSelectedPlace ? placeNameState.error : deletePlaceState.error || favoritePlaceState.error}
                isDeleting={isDeletePlacePending}
                isEditingPending={isPlaceNamePending}
                isFavoritePending={isFavoritePlacePending}
                mode={isEditingSelectedPlace ? "edit" : "view"}
                onClose={() => {
                  setLocalSelectedPlaceId(null);
                  onSelectPlace?.(null);
                }}
                onDelete={() => {
                  const confirmed = window.confirm("Estas seguro de que quieres eliminar este lugar?");
                  if (!confirmed) return;
                  const payload = new FormData();
                  payload.set("groupId", groupId);
                  payload.set("placeId", internalSelectedPlace.id);
                  startTransition(() => {
                    deletePlaceFormAction(payload);
                  });
                }}
                onEditCancel={() => {
                  setIsEditingSelectedPlace(false);
                  setSelectedPlaceEditedName(internalSelectedPlace.name);
                }}
                onEditNameChange={setSelectedPlaceEditedName}
                onEditSave={() => {
                  const payload = new FormData();
                  payload.set("groupId", groupId);
                  payload.set("placeId", internalSelectedPlace.id);
                  payload.set("name", selectedPlaceEditedName);
                  startTransition(() => {
                    placeNameFormAction(payload);
                  });
                }}
                onEditStart={() => setIsEditingSelectedPlace(true)}
                onToggleFavorite={() => {
                  const nextFavorite = !isSelectedFavorite;
                  setIsSelectedFavorite(nextFavorite);
                  const payload = new FormData();
                  payload.set("groupId", groupId);
                  payload.set("placeId", internalSelectedPlace.id);
                  payload.set("isFavorite", String(nextFavorite));
                  startTransition(() => {
                    favoritePlaceFormAction(payload);
                  });
                }}
                place={{
                  address: internalSelectedPlace.address,
                  city: internalSelectedPlace.city,
                  googleMapsUrl: internalSelectedPlace.googleMapsUrl,
                  imageUrl: internalSelectedPlace.imageUrl,
                  isFavorite: isSelectedFavorite,
                  name: internalSelectedPlace.name,
                  phoneNumber: internalSelectedPlace.phoneNumber
                }}
                variant="saved"
              />
            </div>
          </div>
        ) : null}
        {draftSelection ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-40">
            <div className="pointer-events-auto" ref={draftCardMobileRef}>
              <MapSaveDraftCard
                canSave={canEdit}
                draft={draftSelection}
                formAction={addPlaceFormAction}
                scopeIdName="groupId"
                scopeIdValue={groupId}
                isPending={isAddPlacePending}
                onCancel={() => {
                  setDraftSelection(null);
                  setResolveHint(null);
                  selectedSearchMarkerRef.current?.remove();
                  selectedSearchMarkerRef.current = null;
                }}
                state={addPlaceState}
              />
            </div>
          </div>
        ) : null}
      </div>

      {draftSelection ? <div className="hidden" ref={draftCardDesktopRef} /> : null}
    </div>
  );
}
