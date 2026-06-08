"use client";

import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { saveExploredPlaceAction, type SaveExploredPlaceActionState } from "@/app/explore/actions";
import { MapSearchBox } from "@/components/map/MapSearchBox";
import { BackButton } from "@/components/navigation/BackButton";
import { UserLocationButton } from "@/components/map/UserLocationButton";
import { resizeMapboxAfterLayout, useMapboxResizeOnVisible } from "@/components/map/useMapboxResize";
import { useUserLocationMarker } from "@/components/map/useUserLocationMarker";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDistance, getDistanceInMeters } from "@/lib/map/distance";
import {
  buildDraftFromRenderedFeature,
  extractFallbackNameFromRenderedFeatures,
  resolvePlaceFromMapClick,
  type MapDraftPlace
} from "@/lib/map/geocoding";
import {
  getGooglePlaceDetails,
  getGooglePlaceNearby,
  getGooglePlaceRecommendations,
  type GoogleNearbyRecommendation,
  type GoogleNearbyRecommendationCategory,
  type GooglePlaceSuggestion
} from "@/lib/map/googlePlaces";
import { inferCategoryFromGoogleSignals } from "@/lib/map/placeClassification";
import type { SaveDestination } from "@/lib/saveDestinations";
import { ROUTES } from "@/utils/constants";

const initialSaveState: SaveExploredPlaceActionState = {
  error: null,
  success: false
};

type ExploreMapProps = {
  destinations: SaveDestination[];
};

const recommendationFilters: Array<{ value: GoogleNearbyRecommendationCategory; label: string }> = [
  { value: "popular", label: "Recomendados" },
  { value: "food", label: "Comer" },
  { value: "coffee", label: "Cafe" },
  { value: "plans", label: "Planes" }
];

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function createRecommendationMarkerElement(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-teal-500 text-white shadow-[0_10px_22px_rgba(13,148,136,0.35)] transition hover:scale-105";
  button.innerHTML =
    '<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>';
  return button;
}

function ExploreSaveCard({
  destinations,
  distanceLabel,
  draft,
  error,
  isPending,
  onCancel,
  onSubmit,
  success
}: {
  destinations: SaveDestination[];
  distanceLabel: string | null;
  draft: MapDraftPlace;
  error: string | null;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (formData: FormData) => void;
  success: boolean;
}) {
  const [selectedDestinationKey, setSelectedDestinationKey] = useState(`${destinations[0]?.type ?? "personal"}:${destinations[0]?.id ?? "personal"}`);
  const selectedDestination = destinations.find((destination) => `${destination.type}:${destination.id}` === selectedDestinationKey) ?? destinations[0];

  useEffect(() => {
    setSelectedDestinationKey(`${destinations[0]?.type ?? "personal"}:${destinations[0]?.id ?? "personal"}`);
  }, [destinations]);

  return (
    <Card className="pointer-events-auto mx-auto w-full max-w-[430px] rounded-[28px] border-rose-100/80 bg-[#fff8f7]/95 p-3 shadow-[0_-16px_40px_rgba(181,35,48,0.18)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <button
          aria-label="Cerrar"
          className="grid h-8 w-8 place-items-center rounded-full border border-rose-100 bg-white/90 text-zinc-500 shadow-sm transition hover:bg-zinc-50"
          onClick={onCancel}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#c6283a]">Nuevo lugar</span>
      </div>

      <div className="mt-3 flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 shadow-sm">
          {draft.imageUrl ? (
            <img alt={draft.name} className="h-full w-full object-cover" src={draft.imageUrl} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg text-zinc-400">+</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-base font-bold leading-5 text-zinc-950">{draft.name}</p>
          <p className="mt-1 truncate text-xs text-zinc-500">
            {draft.address}
            {draft.city ? ` - ${draft.city}` : ""}
          </p>
          {distanceLabel ? (
            <p className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-[#c6283a]">
              A {distanceLabel} de ti
            </p>
          ) : null}
        </div>
      </div>

      <form
        action={(formData) => {
          if (!selectedDestination) {
            return;
          }
          formData.set("destinationType", selectedDestination.type);
          formData.set("destinationId", selectedDestination.id);
          onSubmit(formData);
        }}
        className="mt-4 space-y-3 border-t border-rose-100/70 pt-3"
      >
        <input name="latitude" type="hidden" value={String(draft.latitude)} />
        <input name="longitude" type="hidden" value={String(draft.longitude)} />
        <input name="source" type="hidden" value={draft.provider === "google_places" ? "google_maps" : "manual"} />
        <input name="provider" type="hidden" value={draft.provider || "manual"} />
        <input name="externalPlaceId" type="hidden" value={draft.externalPlaceId || ""} />
        <input name="googleMapsUrl" type="hidden" value={draft.googleMapsUrl || ""} />
        <input name="businessStatus" type="hidden" value={draft.businessStatus || ""} />
        <input name="phoneNumber" type="hidden" value={draft.phoneNumber || ""} />
        <input name="imageUrl" type="hidden" value={draft.imageUrl || ""} />
        <input name="category" type="hidden" value={draft.category || "Otros"} />
        <input name="address" type="hidden" value={draft.address} />
        <input name="city" type="hidden" value={draft.city} />
        <input name="name" type="hidden" value={draft.name} />

        <label className="block space-y-2">
          <span className="text-xs font-bold text-zinc-700">Guardar en:</span>
          <select
            className="h-11 w-full rounded-2xl border border-rose-100 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm focus:border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-100"
            onChange={(event) => setSelectedDestinationKey(event.target.value)}
            value={selectedDestinationKey}
          >
            {destinations.map((destination) => (
              <option key={`${destination.type}:${destination.id}`} value={`${destination.type}:${destination.id}`}>
                {destination.label}
              </option>
            ))}
          </select>
        </label>

        {selectedDestination ? (
          <p className="text-xs font-medium text-zinc-500">{selectedDestination.description}</p>
        ) : (
          <p className="text-xs font-medium text-zinc-500">No hay destinos disponibles.</p>
        )}
        {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
        {success ? <p className="text-xs font-semibold text-emerald-700">Lugar guardado correctamente.</p> : null}

        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#c6283a] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(198,40,58,0.24)] transition hover:bg-[#b32033] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending || !selectedDestination}
          type="submit"
        >
          {isPending ? <SpinnerIcon /> : null}
          {isPending ? "Guardando..." : "Guardar lugar"}
        </button>
      </form>
    </Card>
  );
}

export function ExploreMap({ destinations }: ExploreMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapStyle = process.env.NEXT_PUBLIC_MAPBOX_STYLE || "mapbox://styles/mapbox/standard";
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedSearchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const recommendationMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const recommendationsAbortRef = useRef<AbortController | null>(null);
  const draftCardRef = useRef<HTMLDivElement | null>(null);
  const skipNextMapClickRef = useRef(false);
  const pendingMapClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [resolveHint, setResolveHint] = useState<string | null>(null);
  const [draftSelection, setDraftSelection] = useState<MapDraftPlace | null>(null);
  const [activeRecommendationFilter, setActiveRecommendationFilter] = useState<GoogleNearbyRecommendationCategory | null>(null);
  const [pendingRecommendationFilter, setPendingRecommendationFilter] = useState<GoogleNearbyRecommendationCategory | null>(null);
  const [recommendations, setRecommendations] = useState<GoogleNearbyRecommendation[]>([]);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [searchCloseSignal, setSearchCloseSignal] = useState(0);
  const [saveState, saveFormAction, isSavePending] = useActionState(saveExploredPlaceAction, initialSaveState);
  const wasSavePendingRef = useRef(false);
  const userLocation = useUserLocationMarker(mapRef);
  useMapboxResizeOnVisible(mapRef, mapContainerRef, true);

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
    if (wasSavePendingRef.current && !isSavePending && saveState.success) {
      setDraftSelection(null);
      selectedSearchMarkerRef.current?.remove();
      selectedSearchMarkerRef.current = null;
      setSearchCloseSignal((value) => value + 1);
    }
    wasSavePendingRef.current = isSavePending;
  }, [isSavePending, saveState.success]);

  useEffect(() => {
    if (!mapContainerRef.current || !token) {
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-3.7038, 40.4168],
      zoom: 5
    });

    mapRef.current = map;
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

    return () => {
      if (pendingMapClickTimeoutRef.current) {
        clearTimeout(pendingMapClickTimeoutRef.current);
        pendingMapClickTimeoutRef.current = null;
      }
      selectedSearchMarkerRef.current?.remove();
      selectedSearchMarkerRef.current = null;
      recommendationMarkersRef.current.forEach((marker) => marker.remove());
      recommendationMarkersRef.current = [];
      recommendationsAbortRef.current?.abort();
      cleanupInitialResize();
      cleanupLoadResize?.();
      map.off("load", handleMapLoad);
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle, token]);

  useEffect(() => {
    return () => {
      recommendationsAbortRef.current?.abort();
      recommendationMarkersRef.current.forEach((marker) => marker.remove());
      recommendationMarkersRef.current = [];
    };
  }, []);

  const loadRecommendations = useCallback(
    async (category: GoogleNearbyRecommendationCategory, location = userLocation.location) => {
      if (!location) {
        setPendingRecommendationFilter(category);
        setRecommendationsError("Activa tu ubicacion para ver recomendaciones cerca.");
        userLocation.requestLocation();
        return;
      }

      recommendationsAbortRef.current?.abort();
      const controller = new AbortController();
      recommendationsAbortRef.current = controller;
      setIsLoadingRecommendations(true);
      setRecommendationsError(null);
      setActiveRecommendationFilter(category);
      setPendingRecommendationFilter(null);

      try {
        const results = await getGooglePlaceRecommendations({
          lat: location.latitude,
          lng: location.longitude,
          category,
          signal: controller.signal
        });

        if (controller.signal.aborted) {
          return;
        }

        setRecommendations(results);
        if (results.length === 0) {
          setRecommendationsError("No encontramos recomendaciones cerca de ti.");
        }
      } catch {
        if (!controller.signal.aborted) {
          setRecommendations([]);
          setRecommendationsError("No se pudo cargar recomendaciones.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingRecommendations(false);
        }
      }
    },
    [userLocation]
  );

  useEffect(() => {
    if (!pendingRecommendationFilter || !userLocation.location) {
      return;
    }

    void loadRecommendations(pendingRecommendationFilter, userLocation.location);
  }, [loadRecommendations, pendingRecommendationFilter, userLocation.location]);

  const selectRecommendation = useCallback((place: GoogleNearbyRecommendation) => {
    const nextDraft: MapDraftPlace = {
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      address: place.address,
      city: place.city,
      category: inferCategoryFromGoogleSignals(place.primaryType, place.name) || place.category || "Otros",
      provider: place.provider,
      externalPlaceId: place.externalPlaceId,
      googleMapsUrl: place.googleMapsUrl,
      businessStatus: place.businessStatus,
      phoneNumber: place.phoneNumber,
      imageUrl: place.imageUrl
    };

    const map = mapRef.current;
    if (!map) {
      setDraftSelection(nextDraft);
      return;
    }

    map.flyTo({
      center: [place.longitude, place.latitude],
      zoom: Math.max(map.getZoom(), 15),
      essential: true
    });
    setDraftSelection(nextDraft);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    recommendationMarkersRef.current.forEach((marker) => marker.remove());
    recommendationMarkersRef.current = recommendations.map((place) => {
      const element = createRecommendationMarkerElement();
      element.setAttribute("aria-label", `Ver ${place.name}`);
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        skipNextMapClickRef.current = true;
        selectRecommendation(place);
      });

      return new mapboxgl.Marker({ element, anchor: "bottom" }).setLngLat([place.longitude, place.latitude]).addTo(map);
    });

    if (recommendations.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      recommendations.forEach((place) => bounds.extend([place.longitude, place.latitude]));
      map.fitBounds(bounds, { padding: 88, maxZoom: 15, duration: 700 });
    } else if (recommendations.length === 1) {
      const [place] = recommendations;
      map.flyTo({ center: [place.longitude, place.latitude], zoom: 15, essential: true });
    }

    return () => {
      recommendationMarkersRef.current.forEach((marker) => marker.remove());
      recommendationMarkersRef.current = [];
    };
  }, [recommendations, selectRecommendation]);

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
      if (draftCardRef.current && target && draftCardRef.current.contains(target)) {
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

  if (!token) {
    return <EmptyState description="Define NEXT_PUBLIC_MAPBOX_TOKEN para habilitar el mapa." title="Falta configurar Mapbox" />;
  }

  if (mapError) {
    return <EmptyState description={mapError} title="Error cargando el mapa" />;
  }

  return (
    <div className="relative h-[100svh] min-h-[100dvh] w-full overflow-hidden rounded-none border-0 bg-zinc-200/30 shadow-none sm:mx-auto sm:my-6 sm:h-[620px] sm:min-h-0 sm:max-w-5xl sm:rounded-[30px] sm:border sm:border-zinc-300/60">
      <div className="h-full w-full" data-lock-swipe ref={mapContainerRef} />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(244,244,245,0.12)_100%)]" />

      <div className="pointer-events-auto absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-zinc-700/24 pt-[env(safe-area-inset-top)] text-white shadow-[0_10px_24px_rgba(24,24,27,0.08)] backdrop-blur-xl">
        <div className="relative flex h-14 items-center px-3">
          <BackButton
            className="relative z-10 bg-transparent text-white hover:bg-white/12 focus-visible:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
            fallbackHref={ROUTES.maps}
          />
          <p className="pointer-events-none absolute inset-x-14 text-center text-sm font-bold tracking-tight text-white">
            Explorar
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-4 top-[calc(env(safe-area-inset-top)+76px)] z-20">
        <div
          className="pointer-events-auto min-w-0"
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
        <div className="pointer-events-auto mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {recommendationFilters.map((filter) => {
            const isActive = activeRecommendationFilter === filter.value;
            const isLoading = isLoadingRecommendations && isActive;
            return (
              <button
                className={
                  isActive
                    ? "inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#c6283a] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(198,40,58,0.22)]"
                    : "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-rose-100 bg-white/92 px-4 text-xs font-bold text-zinc-700 shadow-sm backdrop-blur transition hover:bg-rose-50"
                }
                disabled={isLoadingRecommendations}
                key={filter.value}
                onClick={() => void loadRecommendations(filter.value)}
                type="button"
              >
                {isLoading ? <SpinnerIcon /> : null}
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <UserLocationButton
        className={draftSelection ? "bottom-[calc(env(safe-area-inset-bottom)+17rem)] z-30 sm:bottom-4" : "z-30"}
        error={userLocation.error}
        isLocating={userLocation.isLocating}
        onClick={userLocation.requestLocation}
      />

      {isResolvingLocation ? (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white/92 shadow-sm backdrop-blur">
            <SpinnerIcon />
          </div>
        </div>
      ) : null}

      {resolveHint && !isResolvingLocation ? (
        <div className="pointer-events-none absolute left-4 top-[calc(env(safe-area-inset-top)+136px)] z-10">
          <Card className="rounded-2xl border-zinc-100 bg-white/95 shadow-lg backdrop-blur">
            <p className="text-sm text-zinc-700">{resolveHint}</p>
          </Card>
        </div>
      ) : null}

      {recommendationsError && !draftSelection ? (
        <div className="pointer-events-none absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+174px)] z-10">
          <Card className="rounded-2xl border-rose-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-sm font-medium text-zinc-700">{recommendationsError}</p>
          </Card>
        </div>
      ) : null}

      {draftSelection ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 sm:bottom-4">
          <div className="pointer-events-auto" ref={draftCardRef}>
            <ExploreSaveCard
              destinations={destinations}
              distanceLabel={draftDistanceLabel}
              draft={draftSelection}
              error={saveState.error}
              isPending={isSavePending}
              onCancel={() => {
                setDraftSelection(null);
                setResolveHint(null);
                selectedSearchMarkerRef.current?.remove();
                selectedSearchMarkerRef.current = null;
              }}
              onSubmit={(formData) => {
                startTransition(() => {
                  saveFormAction(formData);
                });
              }}
              success={saveState.success}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
