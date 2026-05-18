"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { AddPlaceActionState } from "@/app/groups/[groupId]/actions";
import type { MapDraftPlace } from "@/lib/map/geocoding";

type MapSaveDraftCardProps = {
  groupId: string;
  draft: MapDraftPlace;
  state: AddPlaceActionState;
  isPending: boolean;
  formAction: (payload: FormData) => void;
  onCancel: () => void;
};

export function MapSaveDraftCard({ groupId, draft, state, isPending, formAction, onCancel }: MapSaveDraftCardProps) {
  const [name, setName] = useState(draft.name);
  const [address, setAddress] = useState(draft.address);
  const [city, setCity] = useState(draft.city);

  useEffect(() => {
    setName(draft.name);
    setAddress(draft.address);
    setCity(draft.city);
  }, [draft.address, draft.city, draft.latitude, draft.longitude, draft.name]);

  return (
    <Card className="pointer-events-auto rounded-2xl border-slate-300 bg-white/95 shadow-lg backdrop-blur">
      <p className="text-sm font-semibold text-slate-900">Revisa los datos antes de guardar</p>
      <form action={formAction} className="mt-3 space-y-2">
        <input name="groupId" type="hidden" value={groupId} />
        <input name="latitude" type="hidden" value={String(draft.latitude)} />
        <input name="longitude" type="hidden" value={String(draft.longitude)} />
        <input name="source" type="hidden" value={draft.provider === "google_places" ? "google_maps" : "manual"} />
        <input name="provider" type="hidden" value={draft.provider || "manual"} />
        <input name="externalPlaceId" type="hidden" value={draft.externalPlaceId || ""} />
        <input name="googleMapsUrl" type="hidden" value={draft.googleMapsUrl || ""} />
        <input name="businessStatus" type="hidden" value={draft.businessStatus || ""} />
        <input name="category" type="hidden" value={draft.category || "Otros"} />

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">Nombre</span>
          <input
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900"
            maxLength={120}
            name="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">Direccion</span>
          <input
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900"
            maxLength={220}
            name="address"
            onChange={(event) => setAddress(event.target.value)}
            required
            value={address}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">Ciudad / poblacion</span>
          <input
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900"
            maxLength={120}
            name="city"
            onChange={(event) => setCity(event.target.value)}
            value={city}
          />
        </label>

        <p className="text-[11px] text-slate-500">Categoría detectada: {draft.category || "Otros"}</p>

        <p className="text-[11px] text-slate-500">Lat: {draft.latitude} · Lng: {draft.longitude}</p>
        {draft.businessStatus ? <p className="text-[11px] text-slate-500">Estado: {draft.businessStatus}</p> : null}

        <div className="flex gap-2">
          <Button disabled={isPending} size="sm" type="submit">
            {isPending ? "Guardando..." : "Guardar lugar"}
          </Button>
          <Button onClick={onCancel} size="sm" type="button" variant="secondary">
            Cancelar
          </Button>
        </div>
        {state.error ? <p className="mt-1 text-sm text-rose-600">{state.error}</p> : null}
      </form>
    </Card>
  );
}
