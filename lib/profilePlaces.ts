import { getUserGroups } from "@/lib/groups";
import { normalizeGoogleMapsUrl } from "@/lib/map/googleMapsUrl";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupListItem } from "@/lib/groups/types";
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

type PersonalPlaceRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  category: string | null;
  external_place_id: string | null;
  google_maps_url: string | null;
  image_url: string | null;
  rating?: number | null;
  user_ratings_total?: number | null;
  status: string;
  is_favorite: boolean;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
};

type GroupPlaceRow = {
  id: string;
  group_id: string;
  name: string;
  address: string | null;
  city: string | null;
  category: string | null;
  category_id?: string | null;
  external_place_id: string | null;
  google_maps_url: string | null;
  image_url: string | null;
  rating?: number | null;
  user_ratings_total?: number | null;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
};

type GroupPlaceStateRow = {
  place_id: string;
  status: string;
  is_favorite: boolean;
};

export const PROFILE_PLACE_FILTERS: Array<{ label: string; value: ProfilePlacesFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Favoritos", value: "favorites" },
  { label: "Por visitar", value: "pending" },
  { label: "Historial", value: "visited" }
];

export function getProfilePlacesFilter(value: string | string[] | undefined): ProfilePlacesFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "favorites" || raw === "pending" || raw === "visited") {
    return raw;
  }
  return "all";
}

function isPlaceStatus(value: string): value is PlaceStatus {
  return value === "pending" || value === "visited";
}

export function buildProfilePlaceItems(input: {
  personalPlaces: PersonalPlaceRow[];
  groupPlaces: GroupPlaceRow[];
  groupPlaceStates: GroupPlaceStateRow[];
  groups: Pick<GroupListItem, "id" | "name">[];
}): ProfilePlaceItem[] {
  const groupById = new Map(input.groups.map((group) => [group.id, group]));
  const stateByPlaceId = new Map(input.groupPlaceStates.map((state) => [state.place_id, state]));

  const personalItems: ProfilePlaceItem[] = input.personalPlaces.map((place) => ({
    id: place.id,
    source: "personal",
    groupId: null,
    groupName: null,
    name: place.name,
    address: place.address,
    city: place.city,
    category: place.category,
    imageUrl: place.image_url,
    googleMapsUrl: normalizeGoogleMapsUrl(place.google_maps_url, {
      placeId: place.external_place_id,
      name: place.name,
      address: place.address,
      city: place.city,
      latitude: place.latitude,
      longitude: place.longitude
    }),
    rating: place.rating ?? null,
    userRatingsTotal: place.user_ratings_total ?? null,
    status: isPlaceStatus(place.status) ? place.status : "pending",
    isFavorite: Boolean(place.is_favorite),
    createdAt: place.created_at
  }));

  const groupItems: ProfilePlaceItem[] = input.groupPlaces.flatMap((place) => {
    const group = groupById.get(place.group_id);
    if (!group) {
      return [];
    }

    const state = stateByPlaceId.get(place.id);
    return [
      {
        id: place.id,
        source: "group" as const,
        groupId: place.group_id,
        groupName: group.name,
        name: place.name,
        address: place.address,
        city: place.city,
        category: place.category,
        imageUrl: place.image_url,
        googleMapsUrl: normalizeGoogleMapsUrl(place.google_maps_url, {
          placeId: place.external_place_id,
          name: place.name,
          address: place.address,
          city: place.city,
          latitude: place.latitude,
          longitude: place.longitude
        }),
        rating: place.rating ?? null,
        userRatingsTotal: place.user_ratings_total ?? null,
        status: state && isPlaceStatus(state.status) ? state.status : "pending",
        isFavorite: Boolean(state?.is_favorite),
        createdAt: place.created_at
      }
    ];
  });

  return [...personalItems, ...groupItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function filterProfilePlaces(places: ProfilePlaceItem[], filter: ProfilePlacesFilter): ProfilePlaceItem[] {
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

export function getProfilePlaceStats(places: ProfilePlaceItem[]): ProfilePlaceStats {
  return {
    all: places.length,
    favorites: places.filter((place) => place.isFavorite).length,
    pending: places.filter((place) => place.status === "pending").length,
    visited: places.filter((place) => place.status === "visited").length
  };
}

export async function getProfilePlacesForUser(userId: string, visibleGroups?: GroupListItem[]): Promise<ProfilePlaceItem[]> {
  const supabase = await createSupabaseServerClient();
  const groups = visibleGroups ?? (await getUserGroups(userId));
  const groupIds = groups.map((group) => group.id);

  const [personalPlacesResult, groupPlacesResult] = await Promise.all([
    supabase
      .from("personal_places")
      .select("id, name, address, city, category, external_place_id, google_maps_url, image_url, rating, user_ratings_total, status, is_favorite, created_at, latitude, longitude")
      .eq("user_id", userId),
    groupIds.length > 0
      ? supabase
          .from("places")
          .select("id, group_id, name, address, city, category_id, external_place_id, google_maps_url, image_url, rating, user_ratings_total, created_at, latitude, longitude")
          .in("group_id", groupIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  const rawGroupPlaces = groupPlacesResult.data || [];
  const categoryIds = rawGroupPlaces.map((place) => place.category_id).filter((value): value is string => Boolean(value));
  const categoriesResult =
    categoryIds.length > 0
      ? await supabase.from("categories").select("id, name").in("id", categoryIds)
      : { data: [], error: null };
  const categoryNameById = new Map((categoriesResult.data || []).map((category) => [category.id, category.name]));
  const groupPlaces = rawGroupPlaces.map((place) => ({
    ...place,
    category: place.category_id ? categoryNameById.get(place.category_id) ?? null : null
  }));
  const groupPlaceIds = groupPlaces.map((place) => place.id);
  const groupPlaceStatesResult =
    groupPlaceIds.length > 0
      ? await supabase
          .from("group_place_user_states")
          .select("place_id, status, is_favorite")
          .eq("user_id", userId)
          .in("place_id", groupPlaceIds)
      : { data: [], error: null };

  if (personalPlacesResult.error || groupPlacesResult.error || categoriesResult.error || groupPlaceStatesResult.error) {
    return [];
  }

  return buildProfilePlaceItems({
    personalPlaces: personalPlacesResult.data || [],
    groupPlaces,
    groupPlaceStates: groupPlaceStatesResult.data || [],
    groups
  });
}
