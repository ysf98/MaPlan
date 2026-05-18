"use client";

import { useActionState, useEffect, useMemo, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import { addPlaceAction } from "@/app/groups/[groupId]/actions";
import type { AddPlaceActionState } from "@/app/groups/[groupId]/actions";
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
import { MapSaveDraftCard } from "@/components/map/MapSaveDraftCard";
import { getGooglePlaceDetails, type GooglePlaceSuggestion } from "@/lib/map/googlePlaces";

type GroupMapProps = {
  groupId: string;
  canEdit: boolean;
  places: GroupPlace[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
};

const addPlaceInitialState: AddPlaceActionState = {
  error: null,
  success: false
};

function createPopupNode(place: GroupPlace): HTMLElement {
  const root = document.createElement("div");
  root.style.minWidth = "180px";

  const name = document.createElement("p");
  name.style.margin = "0 0 4px";
  name.style.fontWeight = "600";
  name.style.color = "#0f172a";
  name.textContent = place.name;

  const address = document.createElement("p");
  address.style.margin = "0";
  address.style.fontSize = "12px";
  address.style.color = "#64748b";
  address.textContent = place.address;

  root.appendChild(name);
  root.appendChild(address);
  if (place.city) {
    const city = document.createElement("p");
    city.style.margin = "2px 0 0";
    city.style.fontSize = "12px";
    city.style.color = "#64748b";
    city.textContent = place.city;
    root.appendChild(city);
  }
  if (place.category) {
    const category = document.createElement("p");
    category.style.margin = "2px 0 0";
    category.style.fontSize = "11px";
    category.style.color = "#94a3b8";
    category.textContent = place.category;
    root.appendChild(category);
  }

  return root;
}

export function GroupMap({ groupId, canEdit, places, selectedPlaceId = null, onSelectPlace }: GroupMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [draftSelection, setDraftSelection] = useState<MapDraftPlace | null>(null);
  const [addPlaceState, addPlaceFormAction, isAddPlacePending] = useActionState(addPlaceAction, addPlaceInitialState);

  const placesWithCoordinates = useMemo(() => places.filter((place) => hasValidCoordinates(place)), [places]);
  const internalSelectedPlace = useMemo(
    () => placesWithCoordinates.find((place) => place.id === selectedPlaceId) ?? null,
    [placesWithCoordinates, selectedPlaceId]
  );

  useEffect(() => {
    if (addPlaceState.success) {
      setDraftSelection(null);
    }
  }, [addPlaceState.success]);

  useEffect(() => {
    if (!mapContainerRef.current || !token) {
      return;
    }

    mapboxgl.accessToken = token;
    const firstPlace = placesWithCoordinates[0];
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: firstPlace ? [firstPlace.longitude as number, firstPlace.latitude as number] : [-3.7038, 40.4168],
      zoom: firstPlace ? 11 : 5
    });

    mapRef.current = map;
    setMapError(null);
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("click", async (event) => {
      if (!canEdit) {
        return;
      }

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
          city: resolved.city
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
    placesWithCoordinates.forEach((place) => {
      const latitude = place.latitude as number;
      const longitude = place.longitude as number;
      const marker = new mapboxgl.Marker({ color: "#14b8a6" })
        .setLngLat([longitude, latitude])
        .setPopup(new mapboxgl.Popup({ offset: 20 }).setDOMContent(createPopupNode(place)))
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        onSelectPlace?.(place.id);
      });
      bounds.extend([longitude, latitude]);
    });

    if (placesWithCoordinates.length > 1) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 13 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [canEdit, onSelectPlace, placesWithCoordinates, token]);

  useEffect(() => {
    if (!internalSelectedPlace || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [internalSelectedPlace.longitude as number, internalSelectedPlace.latitude as number],
      zoom: Math.max(mapRef.current.getZoom(), 13),
      essential: true
    });
  }, [internalSelectedPlace]);

  const handleSelectSearchResult = useCallback(async (result: GooglePlaceSuggestion) => {
    const resolved = await getGooglePlaceDetails({ externalPlaceId: result.externalPlaceId });
    if (!resolved) {
      return;
    }

    mapRef.current?.flyTo({
      center: [resolved.longitude, resolved.latitude],
      zoom: Math.max(mapRef.current?.getZoom() || 0, 14),
      essential: true
    });

    setDraftSelection({
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      name: resolved.name,
      address: resolved.address,
      city: resolved.city,
      provider: resolved.provider,
      externalPlaceId: resolved.externalPlaceId,
      googleMapsUrl: resolved.googleMapsUrl,
      businessStatus: resolved.businessStatus
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
      <MapSearchBox getMapContext={getMapContext} onSelectResult={handleSelectSearchResult} />
      <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200">
        <div className="h-full w-full" ref={mapContainerRef} />
        {canEdit && isResolvingLocation ? (
          <div className="pointer-events-none absolute left-3 right-3 top-3 z-10">
            <Card className="rounded-2xl border-slate-300 bg-white/95 shadow-lg backdrop-blur">
              <p className="text-sm text-slate-700">Cargando datos del lugar...</p>
            </Card>
          </div>
        ) : null}
        {canEdit && draftSelection ? (
          <div className="pointer-events-none absolute left-3 right-3 top-3 z-10">
            <MapSaveDraftCard
              draft={draftSelection}
              formAction={addPlaceFormAction}
              groupId={groupId}
              isPending={isAddPlacePending}
              onCancel={() => setDraftSelection(null)}
              state={addPlaceState}
            />
          </div>
        ) : null}
      </div>
      {placesWithCoordinates.length === 0 ? (
        <Card className="rounded-2xl">
          <p className="text-sm text-slate-600">El mapa ya esta activo. Cuando anadas lugares con coordenadas, apareceran marcados aqui.</p>
        </Card>
      ) : null}
    </div>
  );
}
