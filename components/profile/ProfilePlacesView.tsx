import Link from "next/link";
import { PlaceRatingBadge } from "@/components/places/PlaceRatingBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PROFILE_PLACE_FILTERS, type ProfilePlaceItem, type ProfilePlacesFilter } from "@/lib/profilePlaces";
import { ROUTES } from "@/utils/constants";

type ProfilePlacesViewProps = {
  activeFilter: ProfilePlacesFilter;
  places: ProfilePlaceItem[];
  totalCount: number;
};

const emptyCopy: Record<ProfilePlacesFilter, { title: string; description: string }> = {
  all: {
    title: "Todavia no tienes lugares guardados.",
    description: "Guarda sitios en tu mapa personal o en tus grupos para verlos aqui."
  },
  favorites: {
    title: "Todavia no tienes favoritos.",
    description: "Marca sitios como favoritos para tenerlos siempre a mano."
  },
  pending: {
    title: "No tienes lugares pendientes.",
    description: "Cuando guardes sitios por visitar apareceran en esta lista."
  },
  visited: {
    title: "Todavia no tienes lugares visitados.",
    description: "Marca lugares como visitados para crear tu historial."
  }
};

function statusLabel(status: ProfilePlaceItem["status"]): string {
  return status === "visited" ? "Visitado" : "Pendiente";
}

function sourceLabel(place: ProfilePlaceItem): string {
  return place.source === "personal" ? "Mi mapa" : place.groupName ?? "Grupo";
}

export function ProfilePlacesView({ activeFilter, places, totalCount }: ProfilePlacesViewProps) {
  const emptyState = emptyCopy[activeFilter];

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-rose-100 bg-gradient-to-r from-[#2f1318] via-[#7c1f2d] to-[#c6283a] p-5 text-white shadow-[0_14px_35px_rgba(181,35,48,0.16)]">
        <p className="inline-flex rounded-full bg-white/20 px-2 py-1 text-xs font-semibold">Perfil</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Listas</h1>
        <p className="mt-1 text-sm font-semibold text-white/85">{totalCount} lugares en total</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PROFILE_PLACE_FILTERS.map((filter) => (
          <Link
            aria-current={activeFilter === filter.value ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition hover:-translate-y-0.5 ${
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

      {places.length === 0 ? (
        <EmptyState description={emptyState.description} title={emptyState.title} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {places.map((place) => (
            <li key={`${place.source}-${place.id}`}>
              <article className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
                <div className="relative h-36 overflow-hidden bg-zinc-100">
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
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ${place.status === "visited" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-[#c6283a]"}`}>
                      {statusLabel(place.status)}
                    </span>
                  </div>
                  {place.isFavorite ? (
                    <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-rose-100 bg-white/95 text-[#c6283a] shadow-sm">
                      <svg className="h-4 w-4" fill="currentColor" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="m12 21-1.5-1.35C5.4 15.08 2 12 2 8.24A4.24 4.24 0 0 1 6.24 4C8 4 9.7 4.81 10.8 6.09L12 7.5l1.2-1.41A5 5 0 0 1 17.76 4 4.24 4.24 0 0 1 22 8.24c0 3.76-3.4 6.84-8.5 11.41Z" />
                      </svg>
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h2 className="line-clamp-2 text-xl font-bold leading-tight text-zinc-950">{place.name}</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {place.address}
                      {place.city ? ` - ${place.city}` : ""}
                    </p>
                    <PlaceRatingBadge className="mt-2" compact rating={place.rating} userRatingsTotal={place.userRatingsTotal} />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {place.source === "group" && place.groupId ? (
                      <Link
                        className="truncate text-xs font-semibold text-[#c6283a] transition hover:text-[#a91f31]"
                        href={`${ROUTES.groups}/${place.groupId}`}
                      >
                        {place.groupName ?? "Grupo"}
                      </Link>
                    ) : (
                      <Link
                        className="truncate text-xs font-semibold text-[#c6283a] transition hover:text-[#a91f31]"
                        href={ROUTES.map}
                      >
                        Lugar personal
                      </Link>
                    )}
                    {place.googleMapsUrl ? (
                      <a
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-rose-100 bg-rose-50 px-3 text-xs font-bold text-[#c6283a] transition hover:bg-rose-100"
                        href={place.googleMapsUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Ir
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
