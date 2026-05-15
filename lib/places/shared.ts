import type { PlaceStatus } from "@/types/supabase";
import type { PlaceSource } from "@/types/supabase";

export const INITIAL_PLACE_CATEGORIES = [
  "Comer",
  "Cafeteria",
  "Visitar",
  "Fiesta",
  "Naturaleza",
  "Playa",
  "Compras",
  "Otros"
] as const;

export type PlaceCategory = (typeof INITIAL_PLACE_CATEGORIES)[number];

export type GroupPlace = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  notes: string | null;
  originalUrl: string | null;
  source: PlaceSource | null;
  latitude: number | null;
  longitude: number | null;
  status: PlaceStatus;
  category: PlaceCategory;
  createdAt: string;
};

export function hasValidCoordinates(place: Pick<GroupPlace, "latitude" | "longitude">): boolean {
  if (typeof place.latitude !== "number" || typeof place.longitude !== "number") {
    return false;
  }

  return place.latitude >= -90 && place.latitude <= 90 && place.longitude >= -180 && place.longitude <= 180;
}
