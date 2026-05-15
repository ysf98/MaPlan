"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { addPlaceAction } from "@/app/groups/[groupId]/actions";
import type { AddPlaceActionState } from "@/app/groups/[groupId]/actions";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { hasValidCoordinates, type GroupPlace } from "@/lib/places/shared";

type GroupMapProps = {
  groupId: string;
  canEdit: boolean;
  places: GroupPlace[];
};

const addPlaceInitialState: AddPlaceActionState = {
  error: null,
  success: false
};

function buildPopupHtml(place: GroupPlace) {
  return `
    <div style="min-width: 180px">
      <p style="margin:0 0 4px;font-weight:600;color:#0f172a;">${place.name}</p>
      <p style="margin:0;font-size:12px;color:#64748b;">${place.address}</p>
    </div>
  `;
}

function extractAreaLabel(feature: mapboxgl.MapboxGeoJSONFeature | undefined): string {
  if (!feature) {
    return "";
  }

  const placeFormatted = (feature.properties?.["place_formatted"] as string | undefined)?.trim();
  if (placeFormatted) {
    return placeFormatted;
  }

  const fullAddress = (feature.properties?.["full_address"] as string | undefined)?.trim();
  if (fullAddress) {
    return fullAddress;
  }

  const context = (feature.properties?.["context"] as string | undefined)?.trim();
  return context || "";
}

type ReverseGeocodeItem = {
  name?: string;
  name_preferred?: string;
  feature_type?: string;
  place_formatted?: string;
  full_address?: string;
  context?: string;
  address?: string;
  locality?: string;
  place?: string;
  region?: string;
};

function splitAddressParts(rawValue: string | undefined): { street: string; city: string } {
  const raw = (rawValue || "").trim();
  if (!raw) {
    return { street: "", city: "" };
  }

  const parts = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { street: "", city: "" };
  }

  if (parts.length === 1) {
    return { street: parts[0], city: "" };
  }

  return {
    street: parts[0],
    city: parts[1]
  };
}

function pickFirstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const cleaned = value?.trim();
    if (cleaned) {
      return cleaned;
    }
  }
  return "";
}

async function reverseGeocodePlace(token: string, latitude: number, longitude: number): Promise<{
  name: string;
  address: string;
  city: string;
}> {
  const params = new URLSearchParams({
    longitude: String(longitude),
    latitude: String(latitude),
    access_token: token
  });

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params.toString()}`);
  if (!response.ok) {
    throw new Error("No se pudo obtener informacion del lugar.");
  }

  const payload = (await response.json()) as { features?: Array<{ properties?: ReverseGeocodeItem }> };
  const features = payload.features ?? [];
  const byType = (types: string[]) =>
    features.find((item) => item.properties?.feature_type && types.includes(item.properties.feature_type))?.properties;

  const poi = byType(["poi"]);
  const streetFeature = byType(["address", "street", "block"]) ?? features[0]?.properties;
  const localityFeature = byType(["locality", "place", "district", "region"]) ?? streetFeature;

  const name = pickFirstNonEmpty(poi?.name, poi?.name_preferred, "Sitio en mapa");

  const streetFromStructured = pickFirstNonEmpty(
    streetFeature?.address,
    streetFeature?.name_preferred,
    streetFeature?.name
  );
  const streetFromFormatted = splitAddressParts(
    pickFirstNonEmpty(streetFeature?.full_address, streetFeature?.place_formatted)
  ).street;
  const address = pickFirstNonEmpty(streetFromStructured, streetFromFormatted, "Punto en mapa");

  const cityFromStructured = pickFirstNonEmpty(
    localityFeature?.locality,
    localityFeature?.place,
    localityFeature?.name_preferred,
    localityFeature?.name
  );
  const cityFromFormatted = splitAddressParts(
    pickFirstNonEmpty(localityFeature?.place_formatted, localityFeature?.full_address, localityFeature?.context)
  ).city;
  const city = pickFirstNonEmpty(cityFromStructured, cityFromFormatted);

  return { name, address, city };
}

async function resolvePlaceFromMapClick(
  token: string,
  latitude: number,
  longitude: number,
  fallbackName?: string
): Promise<{ name: string; address: string; city: string }> {
  const resolved = await reverseGeocodePlace(token, latitude, longitude);
  const safeFallbackName = (fallbackName || "").trim();

  if (resolved.name === "Sitio en mapa" && safeFallbackName) {
    return {
      ...resolved,
      name: safeFallbackName
    };
  }

  return resolved;
}

export function GroupMap({ groupId, canEdit, places }: GroupMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [draftSelection, setDraftSelection] = useState<{
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    city: string;
  } | null>(null);
  const [addPlaceState, addPlaceFormAction, isAddPlacePending] = useActionState(addPlaceAction, addPlaceInitialState);

  const placesWithCoordinates = useMemo(
    () => places.filter((place) => hasValidCoordinates(place)),
    [places]
  );

  const selectedPlace = useMemo(
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
      const renderedFeatures = map.queryRenderedFeatures(event.point);
      const renderedName = renderedFeatures
        .map((feature) => (feature.properties?.name as string | undefined)?.trim())
        .find((value) => Boolean(value));
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
        const features = renderedFeatures;
        const featureWithName = features.find((feature) => {
          const name = (feature.properties?.name as string | undefined)?.trim();
          return Boolean(name);
        });
        const featureName = (featureWithName?.properties?.name as string | undefined)?.trim();
        const areaLabel = extractAreaLabel(featureWithName);
        const fallbackAddress =
          (featureWithName?.properties?.["address"] as string | undefined)?.trim() ||
          (featureWithName?.properties?.["name_preferred"] as string | undefined)?.trim() ||
          "Punto en mapa";
        const parsedArea = splitAddressParts(areaLabel);
        const fallbackCity =
          (featureWithName?.properties?.["place"] as string | undefined)?.trim() ||
          parsedArea.city ||
          "";

        setDraftSelection({
          latitude,
          longitude,
          name: featureName || "Sitio en mapa",
          address: parsedArea.street || fallbackAddress,
          city: fallbackCity
        });
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
  }, [canEdit, placesWithCoordinates, token]);

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

  if (mapError) {
    return (
      <EmptyState
        title="Error cargando el mapa"
        description={mapError}
      />
    );
  }

  return (
    <div className="space-y-3">
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
            <Card className="pointer-events-auto rounded-2xl border-slate-300 bg-white/95 shadow-lg backdrop-blur">
              <p className="text-sm font-semibold text-slate-900">Quieres guardar este sitio en tu lista?</p>
              <p className="mt-1 text-xs text-slate-600">{draftSelection.name}</p>
              <p className="mt-1 text-xs text-slate-500">{draftSelection.address}</p>
              {draftSelection.city ? <p className="mt-1 text-xs text-slate-500">{draftSelection.city}</p> : null}
              <form action={addPlaceFormAction} className="mt-3">
                <input name="groupId" type="hidden" value={groupId} />
                <input name="latitude" type="hidden" value={String(draftSelection.latitude)} />
                <input name="longitude" type="hidden" value={String(draftSelection.longitude)} />
                <input name="source" type="hidden" value="manual" />
                <input name="name" type="hidden" value={draftSelection.name} />
                <input name="address" type="hidden" value={draftSelection.address} />
                <input name="city" type="hidden" value={draftSelection.city} />
                <div className="flex gap-2">
                  <Button disabled={isAddPlacePending} size="sm" type="submit">
                    {isAddPlacePending ? "Guardando..." : "Si, guardar"}
                  </Button>
                  <Button onClick={() => setDraftSelection(null)} size="sm" type="button" variant="secondary">
                    Cancelar
                  </Button>
                </div>
                {addPlaceState.error ? <p className="mt-2 text-sm text-rose-600">{addPlaceState.error}</p> : null}
              </form>
            </Card>
          </div>
        ) : null}
      </div>
      {placesWithCoordinates.length === 0 ? (
        <Card className="rounded-2xl">
          <p className="text-sm text-slate-600">
            El mapa ya esta activo. Cuando anadas lugares con coordenadas, apareceran marcados aqui.
          </p>
        </Card>
      ) : null}
      {selectedPlace ? (
        <Card className="rounded-2xl">
          <p className="text-sm font-semibold text-slate-900">{selectedPlace.name}</p>
          <p className="mt-1 text-sm text-slate-500">{selectedPlace.address}</p>
        </Card>
      ) : null}
      {/* No success banner here: the floating confirmation is closed after save */}
    </div>
  );
}
