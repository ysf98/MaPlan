import type { PlaceStatus } from "@/types/supabase";

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
  status: PlaceStatus;
  category: PlaceCategory;
  createdAt: string;
};
