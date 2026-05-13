"use client";

import { INITIAL_PLACE_CATEGORIES, type PlaceCategory } from "@/lib/places/shared";
import type { PlaceStatus } from "@/types/supabase";

export type PlaceStatusFilter = PlaceStatus | "all";
export type PlaceCategoryFilter = PlaceCategory | "all";

type PlaceFiltersProps = {
  status: PlaceStatusFilter;
  category: PlaceCategoryFilter;
  onStatusChange: (value: PlaceStatusFilter) => void;
  onCategoryChange: (value: PlaceCategoryFilter) => void;
};

export function PlaceFilters({ status, category, onStatusChange, onCategoryChange }: PlaceFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Filtrar por estado</span>
        <select
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
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
        <span className="text-sm font-medium text-slate-700">Filtrar por categoria</span>
        <select
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
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
    </div>
  );
}
