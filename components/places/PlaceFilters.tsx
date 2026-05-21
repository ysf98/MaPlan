"use client";

import { INITIAL_PLACE_CATEGORIES, type PlaceCategory } from "@/lib/places/shared";
import type { PlaceSource, PlaceStatus } from "@/types/supabase";

export type PlaceStatusFilter = PlaceStatus | "all";
export type PlaceCategoryFilter = PlaceCategory | "all";
export type PlaceSourceFilter = PlaceSource | "none" | "all";

type PlaceFiltersProps = {
  status: PlaceStatusFilter;
  category: PlaceCategoryFilter;
  source: PlaceSourceFilter;
  onStatusChange: (value: PlaceStatusFilter) => void;
  onCategoryChange: (value: PlaceCategoryFilter) => void;
  onSourceChange: (value: PlaceSourceFilter) => void;
};

export function PlaceFilters({ status, category, source, onStatusChange, onCategoryChange, onSourceChange }: PlaceFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700">Filtrar por estado</span>
        <select
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
          onChange={(event) => onStatusChange(event.target.value as PlaceStatusFilter)}
          value={status}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="visited">Visitado</option>
          <option value="favorite">Favorito</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700">Filtrar por categoria</span>
        <select
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
          onChange={(event) => onCategoryChange(event.target.value as PlaceCategoryFilter)}
          value={category}
        >
          <option value="all">Todas</option>
          {INITIAL_PLACE_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700">Filtrar por fuente</span>
        <select
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
          onChange={(event) => onSourceChange(event.target.value as PlaceSourceFilter)}
          value={source}
        >
          <option value="all">Todas</option>
          <option value="none">Sin fuente</option>
          <option value="manual">Manual</option>
          <option value="google_maps">Google Maps</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="website">Web</option>
        </select>
      </label>
    </div>
  );
}
