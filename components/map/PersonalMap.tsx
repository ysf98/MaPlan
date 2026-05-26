"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { addPersonalPlaceAction, type AddPersonalPlaceActionState } from "@/app/map/actions";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MapSaveDraftCard } from "@/components/map/MapSaveDraftCard";
import { MapSearchBox } from "@/components/map/MapSearchBox";
import { inferCategoryFromSuggestion } from "@/lib/map/placeClassification";
import {
  buildDraftFromRenderedFeature,
  extractFallbackNameFromRenderedFeatures,
  resolvePlaceFromMapClick,
  type MapDraftPlace
} from "@/lib/map/geocoding";
import { getGooglePlaceDetails, type GooglePlaceSuggestion } from "@/lib/map/googlePlaces";
import type { PersonalPlace } from "@/lib/personalPlaces";

const addPersonalPlaceInitialState: AddPersonalPlaceActionState = {
  error: null,
  success: false
};

type PersonalMapProps = {
  places: PersonalPlace[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
};

function createPopupNode(place: PersonalPlace): HTMLElement {
  const root = document.createElement("div");
  const name = document.createElement("p");
  name.style.margin = "0 0 4px";
  name.style.fontWeight = "600";
  name.style.color = "#0f172a";
  name.textContent = place.name;
  root.appendChild(name);

  const address = document.createElement("p");
  address.style.margin = "0";
  address.style.fontSize = "12px";
  address.style.color = "#64748b";
  address.textContent = place.address;
  root.appendChild(address);
  return root;
}

export function PersonalMap({ places, selectedPlaceId = null, onSelectPlace }: PersonalMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedSearchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [draftSelection, setDraftSelection] = useState<MapDraftPlace | null>(null);
  const [searchCloseSignal, setSearchCloseSignal] = useState(0);
  const [addPlaceState, addPlaceFormAction, isAddPlacePending] = useActionState(addPersonalPlaceAction, addPersonalPlaceInitialState);
  const wasAddPlacePendingRef = useRef(false);

  const selectedPlace = useMemo(() => places.find((place) => place.id === selectedPlaceId) ?? null, [places, selectedPlaceId]);

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
      style: "mapbox://styles/mapbox/streets-v12",
      center: firstPlace ? [firstPlace.longitude, firstPlace.latitude] : [-3.7038, 40.4168],
      zoom: firstPlace ? 11 : 5
    });

    mapRef.current = map;
    setMapError(null);
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("click", async (event) => {
      const renderedFeatures = map.queryRenderedFeatures(event.point) as Array<{ properties?: Record<string, unknown> }>;
      const renderedName = extractFallbackNameFromRenderedFeatures(renderedFeatures);
      const latitude = Number(event.lngLat.lat.toFixed(6));
      const longitude = Number(event.lngLat.lng.toFixed(6));
      setIsResolvingLocation(true);

      try {
        const resolved = await resolvePlaceFromMapClick(token, latitude, longitude, renderedName);
        setDraftSelection({
          latitude,
          longitude,
          name: resolved.name,
          address: resolved.address,
          city: resolved.city,
          category: "Otros"
        });
      } catch {
        const featureWithName = renderedFeatures.find((feature) => {
          const name = ((feature.properties?.name as string | undefined) || "").trim();
          return Boolean(name);
        });
        setDraftSelection(buildDraftFromRenderedFeature(featureWithName, latitude, longitude));
      } finally {
        setIsResolvingLocation(false);
      }
    });
    map.on("error", (event) => {
      const message = event.error?.message || "No se pudo cargar Mapbox.";
      setMapError(message);
    });

    const bounds = new mapboxgl.LngLatBounds();
    places.forEach((place) => {
      const marker = new mapboxgl.Marker({ color: "#0f766e" })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 20 }).setDOMContent(createPopupNode(place)))
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        onSelectPlace?.(place.id);
      });
      bounds.extend([place.longitude, place.latitude]);
    });

    if (places.length > 1) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 13 });
    }

    return () => {
      selectedSearchMarkerRef.current?.remove();
      selectedSearchMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectPlace, places, token]);

  useEffect(() => {
    if (!selectedPlace || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 13),
      essential: true
    });
  }, [selectedPlace]);

  const handleSelectSearchResult = useCallback(async (result: GooglePlaceSuggestion) => {
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
      category: inferCategoryFromSuggestion(result),
      provider: resolved.provider,
      externalPlaceId: resolved.externalPlaceId,
      googleMapsUrl: resolved.googleMapsUrl,
      businessStatus: resolved.businessStatus,
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
      <MapSearchBox
        closeSignal={searchCloseSignal}
        getMapContext={getMapContext}
        onManualCreate={handleManualCreateFromSearch}
        onSelectResult={handleSelectSearchResult}
      />
      <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-zinc-100">
        <div className="h-full w-full" ref={mapContainerRef} />
        {isResolvingLocation ? (
          <div className="pointer-events-none absolute left-3 right-3 top-3 z-10">
            <Card className="rounded-2xl border-zinc-100 bg-white/95 shadow-lg backdrop-blur">
              <p className="text-sm text-zinc-700">Cargando datos del lugar...</p>
            </Card>
          </div>
        ) : null}
        {draftSelection ? (
          <div className="pointer-events-none absolute right-3 top-3 z-10 hidden w-[360px] max-w-[calc(100%-1.5rem)] md:block">
            <MapSaveDraftCard
              draft={draftSelection}
              formAction={addPlaceFormAction}
              isPending={isAddPlacePending}
              onCancel={() => {
                setDraftSelection(null);
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
      {draftSelection ? (
        <div className="md:hidden">
          <MapSaveDraftCard
            draft={draftSelection}
            formAction={addPlaceFormAction}
            isPending={isAddPlacePending}
            onCancel={() => {
              setDraftSelection(null);
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
