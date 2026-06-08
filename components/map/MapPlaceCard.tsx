"use client";

import { Card } from "@/components/ui/Card";
import { PlaceNameEditor } from "@/components/map/PlaceNameEditor";
import { PlaceRatingBadge } from "@/components/places/PlaceRatingBadge";

export type MapPlaceCardMode = "view" | "edit";
export type MapPlaceCardVariant = "draft" | "saved";

export type MapPlaceCardPlace = {
  name: string;
  address: string | null;
  city?: string | null;
  imageUrl?: string | null;
  googleMapsUrl?: string | null;
  phoneNumber?: string | null;
  status?: "pending" | "visited";
  isFavorite?: boolean;
  rating?: number | null;
  userRatingsTotal?: number | null;
};

export type MapPlaceCardCapabilities = {
  canSave?: boolean;
  canEditName?: boolean;
  canDelete?: boolean;
  canFavorite?: boolean;
  canUpdateStatus?: boolean;
  canCall?: boolean;
  canOpenMaps?: boolean;
};

type MapPlaceCardProps = {
  place: MapPlaceCardPlace;
  mode: MapPlaceCardMode;
  variant: MapPlaceCardVariant;
  capabilities: MapPlaceCardCapabilities;
  distanceLabel?: string | null;
  error?: string | null;
  editNameValue?: string;
  isSaving?: boolean;
  isDeleting?: boolean;
  isFavoritePending?: boolean;
  isStatusPending?: boolean;
  isEditingPending?: boolean;
  onClose?: () => void;
  onSave?: () => void;
  onEditStart?: () => void;
  onEditCancel?: () => void;
  onEditSave?: () => void;
  onEditNameChange?: (value: string) => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onToggleStatus?: () => void;
};

const iconActionClass = "flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[10px] font-medium text-zinc-600 transition duration-150 hover:scale-110 hover:bg-rose-50 active:scale-95";
const disabledIconActionClass = "flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[10px] font-medium text-zinc-400";

function DirectionsIcon({ disabled = false }: { disabled?: boolean }) {
  return (
    <svg
      className={`h-[18px] w-[18px] ${disabled ? "text-zinc-300" : "text-[#c6283a]"}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.1"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 11.4 8.2-3.1-3.1 8.2-1.4-3.7z" />
    </svg>
  );
}

function PhoneIcon({ disabled = false }: { disabled?: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${disabled ? "text-zinc-300" : "text-[#c6283a]"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92V20a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.08 2h3.09a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.17a16 16 0 0 0 6.83 6.83l.72-1.35a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-[18px] w-[18px] text-[#c6283a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21H3v-4z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

export function MapPlaceCard({
  place,
  mode,
  variant,
  capabilities,
  distanceLabel,
  error,
  editNameValue,
  isSaving = false,
  isDeleting = false,
  isFavoritePending = false,
  isStatusPending = false,
  isEditingPending = false,
  onClose,
  onSave,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditNameChange,
  onDelete,
  onToggleFavorite,
  onToggleStatus
}: MapPlaceCardProps) {
  const canOpenMaps = Boolean(capabilities.canOpenMaps && place.googleMapsUrl);
  const canCall = Boolean(capabilities.canCall && place.phoneNumber);
  const statusLabel = place.status === "visited" ? "Visitado" : "Pendiente";

  return (
    <Card className="pointer-events-auto mx-auto w-full max-w-[430px] rounded-[28px] border-rose-100/80 bg-[#fff8f7]/95 p-3 shadow-[0_-16px_40px_rgba(181,35,48,0.18)] backdrop-blur-xl sm:max-w-[380px] sm:rounded-2xl sm:p-1 sm:shadow-xl">
      {mode === "edit" ? (
        <PlaceNameEditor
          error={error}
          imageAlt={place.name}
          imageUrl={place.imageUrl}
          isPending={isEditingPending || isSaving}
          nameValue={editNameValue ?? place.name}
          onCancel={onEditCancel ?? onClose ?? (() => undefined)}
          onNameChange={onEditNameChange ?? (() => undefined)}
          onSave={onEditSave ?? (() => undefined)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 sm:-mt-1">
            {onClose ? (
              <button
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-100 bg-white/90 text-zinc-500 shadow-sm transition-transform duration-150 hover:scale-110 hover:bg-zinc-50 active:scale-95 sm:h-6 sm:w-6"
                onClick={onClose}
                type="button"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            ) : (
              <span className="h-8 w-8 sm:h-6 sm:w-6" />
            )}

            {variant === "draft" && capabilities.canSave ? (
              <button
                aria-label="Guardar lugar"
                className="group flex h-8 items-center justify-center rounded-full bg-[#c6283a] px-4 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(198,40,58,0.24)] transition hover:scale-105 hover:bg-[#b32033] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:h-7 sm:px-3"
                disabled={isSaving}
                onClick={onSave}
                type="button"
              >
                {isSaving ? (
                  <SpinnerIcon />
                ) : (
                  "Guardar"
                )}
              </button>
            ) : null}

            {variant === "saved" && capabilities.canFavorite ? (
              <button
                aria-label={place.isFavorite ? "Quitar favorito" : "Marcar favorito"}
                className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-transform duration-150 hover:scale-110 active:scale-95 sm:h-7 sm:w-7 ${
                  place.isFavorite ? "border-rose-200 bg-rose-50 text-[#c6283a]" : "border-zinc-200 bg-white text-zinc-500"
                }`}
                disabled={isFavoritePending}
                onClick={onToggleFavorite}
                type="button"
              >
                <svg className="h-4 w-4" fill={place.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m12 21-1.5-1.35C5.4 15.08 2 12 2 8.24A4.24 4.24 0 0 1 6.24 4C8 4 9.7 4.81 10.8 6.09L12 7.5l1.2-1.41A5 5 0 0 1 17.76 4 4.24 4.24 0 0 1 22 8.24c0 3.76-3.4 6.84-8.5 11.41Z" />
                </svg>
              </button>
            ) : null}

            {variant === "saved" && capabilities.canUpdateStatus ? (
              <button
                className={`flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:h-7 sm:px-2.5 ${
                  place.status === "visited" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-[#c6283a]"
                }`}
                disabled={isStatusPending}
                onClick={onToggleStatus}
                type="button"
              >
                {statusLabel}
              </button>
            ) : null}

            {variant === "saved" && capabilities.canDelete ? (
              <button
                aria-label="Eliminar lugar"
                className="flex h-8 items-center justify-center rounded-full border border-zinc-200 bg-white/90 px-4 text-xs font-semibold text-zinc-500 shadow-sm transition-transform duration-150 hover:scale-105 hover:border-rose-200 hover:bg-rose-50 hover:text-[#c6283a] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:h-7 sm:px-3"
                disabled={isDeleting}
                onClick={onDelete}
                title="Eliminar lugar"
                type="button"
              >
                Eliminar
              </button>
            ) : null}
          </div>

          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

          <div className="mt-3 flex items-start gap-3 sm:mt-1.5 sm:gap-2.5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 shadow-sm sm:h-[52px] sm:w-[52px] sm:rounded-xl sm:shadow-none">
              {place.imageUrl ? (
                <img alt={place.name} className="h-full w-full object-cover" src={place.imageUrl} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg text-zinc-400">+</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-base font-bold leading-5 text-zinc-950 sm:text-sm sm:font-semibold sm:leading-4">{place.name}</p>
              <p className="mt-1 truncate text-xs text-zinc-500 sm:mt-0.5 sm:text-[11px]">
                {place.address}
                {place.city ? ` - ${place.city}` : ""}
              </p>
              <PlaceRatingBadge
                className={distanceLabel ? "mt-1" : "mt-1.5"}
                compact
                rating={place.rating}
                userRatingsTotal={place.userRatingsTotal}
              />
              {distanceLabel ? (
                <p className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-[#c6283a]">
                  A {distanceLabel} de ti
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-10 border-t border-rose-100/70 pt-2 sm:mt-1.5 sm:gap-11 sm:border-t-0 sm:pt-0">
            {canOpenMaps ? (
              <a className={iconActionClass} href={place.googleMapsUrl ?? "#"} rel="noreferrer" target="_blank">
                <DirectionsIcon />
                Ir
              </a>
            ) : (
              <button className={disabledIconActionClass} disabled type="button">
                <DirectionsIcon disabled />
                Ir
              </button>
            )}

            {canCall ? (
              <a className={iconActionClass} href={`tel:${place.phoneNumber}`}>
                <PhoneIcon />
                Llamar
              </a>
            ) : (
              <button className={disabledIconActionClass} disabled type="button">
                <PhoneIcon disabled />
                Llamar
              </button>
            )}

            {capabilities.canEditName ? (
              <button className={iconActionClass} onClick={onEditStart} type="button">
                <EditIcon />
                Editar
              </button>
            ) : null}
          </div>
        </>
      )}
    </Card>
  );
}
