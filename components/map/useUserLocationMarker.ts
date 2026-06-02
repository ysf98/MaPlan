"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import mapboxgl from "mapbox-gl";
import type { MapCoordinate } from "@/lib/map/distance";

type UseUserLocationMarkerResult = {
  error: string | null;
  isLocating: boolean;
  location: MapCoordinate | null;
  requestLocation: () => void;
};

function createUserLocationElement(): HTMLDivElement {
  const outer = document.createElement("div");
  outer.className = "relative flex h-7 w-7 items-center justify-center";

  const pulse = document.createElement("span");
  pulse.className = "absolute h-7 w-7 rounded-full bg-[#ff5a5f]/25";
  outer.appendChild(pulse);

  const dot = document.createElement("span");
  dot.className = "relative h-4 w-4 rounded-full border-2 border-white bg-[#ff5a5f] shadow-[0_0_0_2px_rgba(198,40,58,0.25)]";
  outer.appendChild(dot);

  return outer;
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return "No podemos mostrar tu ubicacion sin permiso del navegador.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "No se pudo obtener tu ubicacion actual.";
  }

  if (error.code === error.TIMEOUT) {
    return "La ubicacion esta tardando demasiado. Intentalo otra vez.";
  }

  return "No se pudo obtener tu ubicacion.";
}

export function useUserLocationMarker(mapRef: RefObject<mapboxgl.Map | null>): UseUserLocationMarkerResult {
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [location, setLocation] = useState<MapCoordinate | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  const requestLocation = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      setError("El mapa aun no esta listo.");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Tu navegador no permite obtener la ubicacion.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        setLocation(nextLocation);
        markerRef.current?.remove();
        markerRef.current = new mapboxgl.Marker({ element: createUserLocationElement(), anchor: "center" })
          .setLngLat([nextLocation.longitude, nextLocation.latitude])
          .addTo(map);

        map.flyTo({
          center: [nextLocation.longitude, nextLocation.latitude],
          zoom: Math.max(map.getZoom(), 15),
          essential: true
        });
        setIsLocating(false);
      },
      (geoError) => {
        setError(getGeolocationErrorMessage(geoError));
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000
      }
    );
  }, [mapRef]);

  return { error, isLocating, location, requestLocation };
}
