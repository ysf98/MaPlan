"use client";

import { useMemo, useState } from "react";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceFilters, type PlaceCategoryFilter, type PlaceStatusFilter } from "@/components/places/PlaceFilters";
import type { GroupPlace } from "@/lib/places/shared";

type PlacesListProps = {
  groupId: string;
  places: GroupPlace[];
  canEdit: boolean;
};

export function PlacesList({ groupId, places, canEdit }: PlacesListProps) {
  const [statusFilter, setStatusFilter] = useState<PlaceStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<PlaceCategoryFilter>("all");

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesStatus = statusFilter === "all" || place.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || place.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });
  }, [categoryFilter, places, statusFilter]);

  return (
    <section className="space-y-4">
      <PlaceFilters
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
        status={statusFilter}
      />

      {filteredPlaces.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filteredPlaces.map((place) => (
            <li key={place.id}>
              <PlaceCard canEdit={canEdit} groupId={groupId} place={place} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
          No hay lugares con los filtros seleccionados.
        </p>
      )}
    </section>
  );
}
