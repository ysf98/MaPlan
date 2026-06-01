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
    <Card className="pointer-events-auto mx-auto w-full max-w-[380px] rounded-2xl border-zinc-100 bg-white/95 p-1 shadow-xl backdrop-blur">
      <form action={formAction} className="space-y-2">
        <input name={scopeIdName} type="hidden" value={scopeIdValue} />
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
        <input name="address" type="hidden" value={address} />
        <input name="city" type="hidden" value={city} />
        <input name="name" type="hidden" value={name} />

        {mode === "confirm" ? (
          <>
            <div className="-mt-1 flex items-center justify-between">
              <button
                aria-label="Cerrar"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50"
                onClick={onCancel}
                type="button"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
              <button
                aria-label="Guardar lugar"
                className="group flex h-7 w-7 items-center justify-center rounded-full bg-[#c6283a] text-white shadow transition hover:scale-105 hover:bg-[#b32033] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isPending}
                type="submit"
              >
                {isPending ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.8" viewBox="0 0 24 24">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                )}
              </button>
            </div>

            <div className="mt-1.5 flex items-start gap-2.5">
              <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                {draft.imageUrl ? (
                  <img alt={name} className="h-full w-full object-cover" src={draft.imageUrl} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg text-zinc-400">+</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-4 text-zinc-900">{name}</p>
                <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                  {address}
                  {city ? ` · ${city}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-1.5 flex items-center justify-center gap-11 pt-0">
              {draft.googleMapsUrl ? (
                <a
                  className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-600"
                  href={draft.googleMapsUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <svg className="h-[18px] w-[18px] text-[#c6283a]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 11.4 8.2-3.1-3.1 8.2-1.4-3.7z" />
                  </svg>
                  Ir
                </a>
              ) : (
                <button className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-400" disabled type="button">
                  <svg className="h-[18px] w-[18px] text-zinc-300" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 11.4 8.2-3.1-3.1 8.2-1.4-3.7z" />
                  </svg>
                  Ir
                </button>
              )}
              {draft.phoneNumber ? (
                <a className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-600" href={`tel:${draft.phoneNumber}`}>
                  <svg className="h-[18px] w-[18px] text-[#c6283a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 16.92V20a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.08 2h3.09a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.17a16 16 0 0 0 6.83 6.83l.72-1.35a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Llamar
                </a>
              ) : (
                <button className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-400" disabled type="button">
                  <svg className="h-[18px] w-[18px] text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 16.92V20a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.08 2h3.09a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.17a16 16 0 0 0 6.83 6.83l.72-1.35a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Llamar
                </button>
              )}
              <button className="flex flex-col items-center gap-1 text-[10px] font-medium text-zinc-600" onClick={() => setMode("editName")} type="button">
                <svg className="h-[18px] w-[18px] text-[#c6283a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 20h9" />
                  <path d="m16.5 3.5 4 4L7 21H3v-4z" />
                </svg>
                Editar
              </button>
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
