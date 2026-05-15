"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { hasValidCoordinates, type GroupPlace } from "@/lib/places/shared";

type GroupMapProps = {
  places: GroupPlace[];
};

function buildPopupHtml(place: GroupPlace) {
  return `
    <div style="min-width: 180px">
      <p style="margin:0 0 4px;font-weight:600;color:#0f172a;">${place.name}</p>
      <p style="margin:0;font-size:12px;color:#64748b;">${place.address}</p>
    </div>
  `;
}

export function GroupMap({ places }: GroupMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const placesWithCoordinates = useMemo(
    () => places.filter((place) => hasValidCoordinates(place)),
    [places]
  );

  const selectedPlace = useMemo(
    () => placesWithCoordinates.find((place) => place.id === selectedPlaceId) ?? null,
    [placesWithCoordinates, selectedPlaceId]
  );

  useEffect(() => {
    if (!mapContainerRef.current || placesWithCoordinates.length === 0 || !token) {
      return;
    }

    mapboxgl.accessToken = token;
    const firstPlace = placesWithCoordinates[0];
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [firstPlace.longitude as number, firstPlace.latitude as number],
      zoom: 11
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const bounds = new mapboxgl.LngLatBounds();

    placesWithCoordinates.forEach((place) => {
      const latitude = place.latitude as number;
      const longitude = place.longitude as number;

      const marker = new mapboxgl.Marker({ color: "#14b8a6" })
        .setLngLat([longitude, latitude])
        .setPopup(new mapboxgl.Popup({ offset: 20 }).setHTML(buildPopupHtml(place)))
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        setSelectedPlaceId(place.id);
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
  }, [placesWithCoordinates, token]);

  useEffect(() => {
    if (!selectedPlace || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [selectedPlace.longitude as number, selectedPlace.latitude as number],
      zoom: Math.max(mapRef.current.getZoom(), 13),
      essential: true
    });
  }, [selectedPlace]);

  if (!token) {
    return (
      <EmptyState
        title="Falta configurar Mapbox"
        description="Define NEXT_PUBLIC_MAPBOX_TOKEN para habilitar el mapa."
      />
    );
  }

  if (placesWithCoordinates.length === 0) {
    return (
      <EmptyState
        title="Aun no hay lugares con coordenadas"
        description="Edita ubicaciones en la lista para poder visualizarlas en el mapa."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200" ref={mapContainerRef} />
      {selectedPlace ? (
        <Card className="rounded-2xl">
          <p className="text-sm font-semibold text-slate-900">{selectedPlace.name}</p>
          <p className="mt-1 text-sm text-slate-500">{selectedPlace.address}</p>
        </Card>
      ) : null}
    </div>
  );
}
