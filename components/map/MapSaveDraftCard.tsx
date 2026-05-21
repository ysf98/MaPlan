"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { MapDraftPlace } from "@/lib/map/geocoding";

type SaveDraftActionState = {
  error: string | null;
  success: boolean;
};

type MapSaveDraftCardProps = {
  scopeIdName: string;
  scopeIdValue: string;
  draft: MapDraftPlace;
  state: SaveDraftActionState;
  isPending: boolean;
  formAction: (payload: FormData) => void;
  onCancel: () => void;
};

export function MapSaveDraftCard({ scopeIdName, scopeIdValue, draft, state, isPending, formAction, onCancel }: MapSaveDraftCardProps) {
  const [name, setName] = useState(draft.name);
  const [address, setAddress] = useState(draft.address);
  const [city, setCity] = useState(draft.city);
  const [mode, setMode] = useState<"confirm" | "editName">("confirm");

  useEffect(() => {
    setName(draft.name);
    setAddress(draft.address);
    setCity(draft.city);
    setMode("confirm");
  }, [draft.address, draft.city, draft.latitude, draft.longitude, draft.name]);

  return (
    <Card className="pointer-events-auto rounded-2xl border-zinc-100 bg-white/95 shadow-lg backdrop-blur">
      <form action={formAction} className="space-y-2">
        <input name={scopeIdName} type="hidden" value={scopeIdValue} />
        <input name="latitude" type="hidden" value={String(draft.latitude)} />
        <input name="longitude" type="hidden" value={String(draft.longitude)} />
        <input name="source" type="hidden" value={draft.provider === "google_places" ? "google_maps" : "manual"} />
        <input name="provider" type="hidden" value={draft.provider || "manual"} />
        <input name="externalPlaceId" type="hidden" value={draft.externalPlaceId || ""} />
        <input name="googleMapsUrl" type="hidden" value={draft.googleMapsUrl || ""} />
        <input name="businessStatus" type="hidden" value={draft.businessStatus || ""} />
        <input name="category" type="hidden" value={draft.category || "Otros"} />
        <input name="address" type="hidden" value={address} />
        <input name="city" type="hidden" value={city} />
        <input name="name" type="hidden" value={name} />

        {mode === "confirm" ? (
          <>
            <p className="text-sm font-semibold text-zinc-950">Deseas guardar ese lugar?</p>
            <p className="text-xs text-zinc-500">{name}</p>
            <div className="mt-2 flex gap-2">
              <Button disabled={isPending} size="sm" type="submit">
                {isPending ? "Guardando..." : "Si"}
              </Button>
              <Button onClick={onCancel} size="sm" type="button" variant="secondary">
                Cancelar
              </Button>
              <Button onClick={() => setMode("editName")} size="sm" type="button" variant="secondary">
                Editar nombre
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-zinc-950">Editar nombre antes de guardar</p>
            <label className="mt-2 block space-y-1">
              <span className="text-xs font-medium text-zinc-700">Nombre</span>
              <input
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-950"
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <div className="mt-2 flex gap-2">
              <Button disabled={isPending} size="sm" type="submit">
                {isPending ? "Guardando..." : "Guardar lugar"}
              </Button>
              <Button onClick={() => setMode("confirm")} size="sm" type="button" variant="secondary">
                Volver
              </Button>
              <Button onClick={onCancel} size="sm" type="button" variant="secondary">
                Cancelar
              </Button>
            </div>
          </>
        )}

        {state.error ? <p className="mt-1 text-sm text-rose-600">{state.error}</p> : null}
      </form>
    </Card>
  );
}
