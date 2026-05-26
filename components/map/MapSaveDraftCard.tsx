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
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setName(draft.name);
    setAddress(draft.address);
    setCity(draft.city);
    setMode("confirm");
    setIsFavorite(false);
  }, [draft.address, draft.city, draft.latitude, draft.longitude, draft.name]);

  return (
    <Card className="pointer-events-auto rounded-3xl border-zinc-100 bg-white/95 p-3 shadow-xl backdrop-blur">
      <form action={formAction} className="space-y-2">
        <input name={scopeIdName} type="hidden" value={scopeIdValue} />
        <input name="latitude" type="hidden" value={String(draft.latitude)} />
        <input name="longitude" type="hidden" value={String(draft.longitude)} />
        <input name="source" type="hidden" value={draft.provider === "google_places" ? "google_maps" : "manual"} />
        <input name="provider" type="hidden" value={draft.provider || "manual"} />
        <input name="externalPlaceId" type="hidden" value={draft.externalPlaceId || ""} />
        <input name="googleMapsUrl" type="hidden" value={draft.googleMapsUrl || ""} />
        <input name="businessStatus" type="hidden" value={draft.businessStatus || ""} />
        <input name="imageUrl" type="hidden" value={draft.imageUrl || ""} />
        <input name="category" type="hidden" value={draft.category || "Otros"} />
        <input name="address" type="hidden" value={address} />
        <input name="city" type="hidden" value={city} />
        <input name="name" type="hidden" value={name} />

        {mode === "confirm" ? (
          <>
            <div className="flex items-start gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                {draft.imageUrl ? (
                  <img alt={name} className="h-full w-full object-cover" src={draft.imageUrl} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg text-zinc-400">+</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-lg font-semibold leading-5 text-zinc-900">{name}</p>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {address}
                  {city ? ` · ${city}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  aria-label={isFavorite ? "Quitar favorito" : "Marcar favorito"}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                    isFavorite ? "border-rose-200 bg-rose-50 text-[#c6283a]" : "border-zinc-200 bg-white text-zinc-500"
                  }`}
                  onClick={() => setIsFavorite((value) => !value)}
                  type="button"
                >
                  <svg className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="m12 21-1.5-1.35C5.4 15.08 2 12 2 8.24A4.24 4.24 0 0 1 6.24 4C8 4 9.7 4.81 10.8 6.09L12 7.5l1.2-1.41A5 5 0 0 1 17.76 4 4.24 4.24 0 0 1 22 8.24c0 3.76-3.4 6.84-8.5 11.41Z" />
                  </svg>
                </button>
                <button
                  aria-label="Guardar lugar"
                  className="group flex h-12 w-12 items-center justify-center rounded-full bg-[#c6283a] text-white shadow transition hover:scale-105 hover:bg-[#b32033] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? (
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                    </svg>
                  ) : (
                    <span className="text-3xl font-medium leading-none">+</span>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2">
              <button className="flex items-center gap-1 text-xs font-medium text-zinc-600" type="button">
                <svg className="h-4 w-4 text-[#c6283a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 17 4 21V3h16v14H8z" />
                </svg>
                Ir
              </button>
              <button className="flex items-center gap-1 text-xs font-medium text-zinc-600" type="button">
                <svg className="h-4 w-4 text-[#c6283a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92V20a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.08 2h3.09a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.17a16 16 0 0 0 6.83 6.83l.72-1.35a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
                </svg>
                Llamar
              </button>
              <button className="flex items-center gap-1 text-xs font-medium text-zinc-600" onClick={() => setMode("editName")} type="button">
                <svg className="h-4 w-4 text-[#c6283a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 20h9" />
                  <path d="m16.5 3.5 4 4L7 21H3v-4z" />
                </svg>
                Editar
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <Button onClick={onCancel} size="sm" type="button" variant="secondary">
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            {draft.imageUrl ? (
              <div className="mb-2 h-28 w-full overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                <img alt={name} className="h-full w-full object-cover" src={draft.imageUrl} />
              </div>
            ) : null}
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
