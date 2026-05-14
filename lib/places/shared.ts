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
  notes: string | null;
  originalUrl: string | null;
  source: PlaceSource | null;
  latitude: number | null;
  longitude: number | null;
  status: PlaceStatus;
  category: PlaceCategory;
  createdAt: string;
};
