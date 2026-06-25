"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateProfilePlaceFavoriteAction,
  updateProfilePlaceStatusAction
} from "@/app/profile/actions";
import { PlaceRatingBadge } from "@/components/places/PlaceRatingBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PROFILE_PLACE_FILTERS, type ProfilePlaceItem, type ProfilePlacesFilter } from "@/lib/profilePlacesShared";
import { ROUTES } from "@/utils/constants";

type ProfilePlacesViewProps = {
  activeFilter: ProfilePlacesFilter;
  places: ProfilePlaceItem[];
  totalCount: number;
};

const emptyCopy: Record<ProfilePlacesFilter, { title: string; description: string }> = {
  all: {
    title: "Todavía no tienes lugares guardados.",
    description: "Guarda sitios en tu mapa personal o en tus grupos para verlos aqui."
  },
  favorites: {
    title: "Todavía no tienes favoritos.",
    description: "Marca sitios como favoritos para tenerlos siempre a mano."
  },
  pending: {
    title: "No tienes lugares pendientes.",
    description: "Cuando guardes sitios por visitar aparecerán en esta lista."
  },
  visited: {
    title: "Todavía no tienes lugares visitados.",
    description: "Marca lugares como visitados para crear tu historial."
  }
};

function statusLabel(status: ProfilePlaceItem["status"]): string {
  return status === "visited" ? "Visitado" : "Pendiente";
}

function sourceLabel(place: ProfilePlaceItem): string {
  return place.source === "personal" ? "Mi mapa" : place.groupName ?? "Grupo";
}

function getProfilePlaceViewHref(place: ProfilePlaceItem): string {
  if (place.source === "group" && place.groupId) {
    return `${ROUTES.groups}/${place.groupId}?tab=mapa&placeId=${encodeURIComponent(place.id)}`;
  }

  return `${ROUTES.map}?tab=mapa&placeId=${encodeURIComponent(place.id)}`;
}

function filterVisiblePlaces(places: ProfilePlaceItem[], filter: ProfilePlacesFilter): ProfilePlaceItem[] {
  if (filter === "favorites") {
    return places.filter((place) => place.isFavorite);
  }
  if (filter === "pending") {
    return places.filter((place) => place.status === "pending");
  }
  if (filter === "visited") {
    return places.filter((place) => place.status === "visited");
  }
  return places;
}

function getPlaceKey(place: ProfilePlaceItem): string {
  return `${place.source}-${place.id}`;
}

export function ProfilePlacesView({ activeFilter, places, totalCount }: ProfilePlacesViewProps) {
  const router = useRouter();
  const emptyState = emptyCopy[activeFilter];
  const [displayPlaces, setDisplayPlaces] = useState(places);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const visiblePlaces = useMemo(() => filterVisiblePlaces(displayPlaces, activeFilter), [activeFilter, displayPlaces]);

  useEffect(() => {
    setDisplayPlaces(places);
  }, [places]);

  function buildPlaceFormData(place: ProfilePlaceItem) {
    const formData = new FormData();
    formData.set("source", place.source);
    formData.set("placeId", place.id);
    if (place.groupId) {
      formData.set("groupId", place.groupId);
    }
    return formData;
  }

  function patchPlace(place: ProfilePlaceItem, patch: Partial<Pick<ProfilePlaceItem, "isFavorite" | "status">>) {
    setDisplayPlaces((current) => current.map((candidate) => (getPlaceKey(candidate) === getPlaceKey(place) ? { ...candidate, ...patch } : candidate)));
  }

  function toggleStatus(place: ProfilePlaceItem) {
    const nextStatus = place.status === "visited" ? "pending" : "visited";
    const previousStatus = place.status;
    const formData = buildPlaceFormData(place);
    formData.set("status", nextStatus);
    setActionError(null);
    setPendingKey(`${getPlaceKey(place)}-status`);
    patchPlace(place, { status: nextStatus });

    startTransition(async () => {
      const result = await updateProfilePlaceStatusAction({ error: null, success: false }, formData);
      setPendingKey(null);
      if (result.error) {
        patchPlace({ ...place, status: nextStatus }, { status: previousStatus });
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function toggleFavorite(place: ProfilePlaceItem) {
    const nextFavorite = !place.isFavorite;
    const previousFavorite = place.isFavorite;
    const formData = buildPlaceFormData(place);
    formData.set("isFavorite", String(nextFavorite));
    setActionError(null);
    setPendingKey(`${getPlaceKey(place)}-favorite`);
    patchPlace(place, { isFavorite: nextFavorite });

    startTransition(async () => {
      const result = await updateProfilePlaceFavoriteAction({ error: null, success: false }, formData);
      setPendingKey(null);
      if (result.error) {
        patchPlace({ ...place, isFavorite: nextFavorite }, { isFavorite: previousFavorite });
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-rose-100 bg-gradient-to-r from-[#2f1318] via-[#7c1f2d] to-[#c6283a] p-5 text-white shadow-[0_14px_35px_rgba(181,35,48,0.16)]">
        <p className="inline-flex rounded-full bg-white/20 px-2 py-1 text-xs font-semibold">Perfil</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Listas</h1>
        <p className="mt-1 text-sm font-semibold text-white/85">{totalCount} lugares en total</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PROFILE_PLACE_FILTERS.map((filter) => (
          <Link
            aria-current={activeFilter === filter.value ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition hover:scale-[1.02] hover:shadow-[0_8px_18px_rgba(198,40,58,0.12)] ${
              activeFilter === filter.value
                ? "bg-[#c6283a] text-white shadow-[0_6px_14px_rgba(24,24,27,0.12)]"
                : "border border-rose-100 bg-white text-zinc-600 shadow-sm"
            }`}
            href={`${ROUTES.profilePlaces}?filter=${filter.value}`}
            key={filter.value}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {actionError ? <p className="rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm font-semibold text-rose-600">{actionError}</p> : null}

      {visiblePlaces.length === 0 ? (
        <EmptyState description={emptyState.description} title={emptyState.title} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visiblePlaces.map((place) => {
            const placeKey = getPlaceKey(place);
            const isStatusPending = pendingKey === `${placeKey}-status`;
            const isFavoritePending = pendingKey === `${placeKey}-favorite`;
            return (
            <li key={`${place.source}-${place.id}`}>
              <article className="overflow-hidden rounded-[24px] border border-rose-100 bg-white shadow-sm">
                <div className="relative h-28 overflow-hidden bg-zinc-100 sm:h-32">
                  {place.imageUrl ? (
                    <>
                      <img alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover object-center opacity-60 blur-xl" src={place.imageUrl} />
                      <img alt={place.name} className="absolute inset-0 h-full w-full object-cover object-center" src={place.imageUrl} />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-500">Sin imagen</div>
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#c6283a] shadow-sm">
                      {sourceLabel(place)}
                    </span>
                    <button
                      aria-label={place.status === "visited" ? `Marcar ${place.name} como pendiente` : `Marcar ${place.name} como visitado`}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold shadow-sm transition disabled:opacity-60 ${
                        place.status === "visited" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-rose-50 text-[#c6283a] hover:bg-rose-100"
                      }`}
                      disabled={isStatusPending}
                      onClick={() => toggleStatus(place)}
                      type="button"
                    >
                      {statusLabel(place.status)}
                    </button>
                  </div>
                  <button
                    aria-label={place.isFavorite ? `Quitar ${place.name} de favoritos` : `Añadir ${place.name} a favoritos`}
                    className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-rose-100 bg-white/95 shadow-sm transition hover:bg-rose-50 disabled:opacity-60 ${
                      place.isFavorite ? "text-[#c6283a]" : "text-zinc-400"
                    }`}
                    disabled={isFavoritePending}
                    onClick={() => toggleFavorite(place)}
                    type="button"
                  >
                      <svg className="h-4 w-4" fill={place.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="m12 21-1.5-1.35C5.4 15.08 2 12 2 8.24A4.24 4.24 0 0 1 6.24 4C8 4 9.7 4.81 10.8 6.09L12 7.5l1.2-1.41A5 5 0 0 1 17.76 4 4.24 4.24 0 0 1 22 8.24c0 3.76-3.4 6.84-8.5 11.41Z" />
                      </svg>
                  </button>
                </div>

                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-lg font-bold leading-tight text-zinc-950">{place.name}</h2>
                      <p className="mt-1 truncate text-sm text-zinc-500">
                        {place.address}
                        {place.city ? ` - ${place.city}` : ""}
                      </p>
                      <PlaceRatingBadge className="mt-2" compact rating={place.rating} userRatingsTotal={place.userRatingsTotal} />
                    </div>
                    <Link
                      className="mt-0.5 inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-rose-100 bg-rose-50 px-4 text-xs font-bold text-[#c6283a] transition hover:bg-rose-100"
                      href={getProfilePlaceViewHref(place)}
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              </article>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
