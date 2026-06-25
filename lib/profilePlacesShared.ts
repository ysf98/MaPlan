import type { PlaceStatus } from "@/types/supabase";

export type ProfilePlacesFilter = "all" | "favorites" | "pending" | "visited";

export type ProfilePlaceItem = {
  id: string;
  source: "personal" | "group";
  groupId: string | null;
  groupName: string | null;
  name: string;
  address: string | null;
  city: string | null;
  category: string | null;
  imageUrl: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  status: PlaceStatus;
  isFavorite: boolean;
  createdAt: string;
};

export type ProfilePlaceStats = {
  all: number;
  favorites: number;
  pending: number;
  visited: number;
};

export const PROFILE_PLACE_FILTERS: Array<{ label: string; value: ProfilePlacesFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Favoritos", value: "favorites" },
  { label: "Por visitar", value: "pending" },
  { label: "Historial", value: "visited" }
];
