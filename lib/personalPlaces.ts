import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeGoogleMapsUrl } from "@/lib/map/googleMapsUrl";
import type { PlaceProvider, PlaceSource, PlaceStatus } from "@/types/supabase";

export type PersonalPlace = {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string | null;
  notes: string | null;
  category: string | null;
  source: PlaceSource | null;
  provider: PlaceProvider | null;
  externalPlaceId: string | null;
  googleMapsUrl: string | null;
  businessStatus: string | null;
  phoneNumber: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  imageUrl?: string | null;
  status: PlaceStatus;
  isFavorite: boolean;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
};

type CreatePersonalPlaceInput = {
  userId: string;
  name: string;
  address: string;
  city?: string | null;
  notes?: string | null;
  category?: string | null;
  source?: PlaceSource | null;
  provider?: PlaceProvider | null;
  externalPlaceId?: string | null;
  googleMapsUrl?: string | null;
  businessStatus?: string | null;
  phoneNumber?: string | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
};

type DeletePersonalPlaceInput = {
  userId: string;
  placeId: string;
};

type UpdatePersonalPlaceNameInput = {
  userId: string;
  placeId: string;
  name: string;
};

type UpdatePersonalPlaceStatusInput = {
  userId: string;
  placeId: string;
  status: PlaceStatus;
};

type UpdatePersonalPlaceFavoriteInput = {
  userId: string;
  placeId: string;
  isFavorite: boolean;
};

function isPlaceStatus(value: string): value is PlaceStatus {
  return value === "pending" || value === "visited";
}

function isPlaceSource(value: string): value is PlaceSource {
  return value === "manual" || value === "google_maps" || value === "tiktok" || value === "instagram" || value === "website";
}

function isPlaceProvider(value: string): value is PlaceProvider {
  return value === "manual" || value === "mapbox" || value === "google_places";
}

export async function getPersonalPlacesForUser(userId: string): Promise<PersonalPlace[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("personal_places")
    .select(
      "id, user_id, name, address, city, notes, category, source, provider, external_place_id, google_maps_url, business_status, phone_number, rating, user_ratings_total, image_url, status, is_favorite, latitude, longitude, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    userId: item.user_id,
    name: item.name,
    address: item.address || "",
    city: item.city,
    notes: item.notes,
    category: item.category,
    source: item.source && isPlaceSource(item.source) ? item.source : null,
    provider: item.provider && isPlaceProvider(item.provider) ? item.provider : null,
    externalPlaceId: item.external_place_id,
    googleMapsUrl: normalizeGoogleMapsUrl(item.google_maps_url, {
      placeId: item.external_place_id,
      name: item.name,
      address: item.address,
      city: item.city,
      latitude: item.latitude,
      longitude: item.longitude
    }),
    businessStatus: item.business_status,
    phoneNumber: item.phone_number,
    rating: item.rating,
    userRatingsTotal: item.user_ratings_total,
    imageUrl: item.image_url,
    status: isPlaceStatus(item.status) ? item.status : "pending",
    isFavorite: Boolean(item.is_favorite),
    latitude: item.latitude,
    longitude: item.longitude,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
}

export async function createPersonalPlace(input: CreatePersonalPlaceInput): Promise<{ error: string | null }> {
  const name = input.name.trim();
  const address = input.address.trim();
  if (!name) {
    return { error: "El nombre del lugar es obligatorio." };
  }
  if (!address) {
    return { error: "La direccion del lugar es obligatoria." };
  }

  const supabase = await createSupabaseServerClient();
  const provider = input.provider || null;
  const externalPlaceId = input.externalPlaceId?.trim() || null;

  if (provider && externalPlaceId) {
    const { data: existingByProvider, error: existingByProviderError } = await supabase
      .from("personal_places")
      .select("id")
      .eq("user_id", input.userId)
      .eq("provider", provider)
      .eq("external_place_id", externalPlaceId)
      .maybeSingle();

    if (existingByProviderError) {
      return { error: existingByProviderError.message };
    }
    if (existingByProvider) {
      return { error: "Ese sitio ya esta guardado en tu mapa." };
    }
  }

  const { data: existingByNameAddress, error: existingByNameAddressError } = await supabase
    .from("personal_places")
    .select("id")
    .eq("user_id", input.userId)
    .ilike("name", name)
    .ilike("address", address)
    .maybeSingle();

  if (existingByNameAddressError) {
    return { error: existingByNameAddressError.message };
  }
  if (existingByNameAddress) {
    return { error: "Ese sitio ya esta guardado en tu mapa." };
  }

  const { error } = await supabase.from("personal_places").insert({
    user_id: input.userId,
    name,
    address,
    city: input.city?.trim() || null,
    notes: input.notes?.trim() || null,
    category: input.category?.trim() || null,
    source: input.source || null,
    provider,
    external_place_id: externalPlaceId,
    google_maps_url: input.googleMapsUrl?.trim() || null,
    business_status: input.businessStatus?.trim() || null,
    phone_number: input.phoneNumber?.trim() || null,
    rating: input.rating ?? null,
    user_ratings_total: input.userRatingsTotal ?? null,
    image_url: input.imageUrl?.trim() || null,
    status: "pending",
    is_favorite: false,
    latitude: input.latitude,
    longitude: input.longitude
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ese sitio ya esta guardado en tu mapa." };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function deletePersonalPlace(input: DeletePersonalPlaceInput): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("personal_places").delete().eq("id", input.placeId).eq("user_id", input.userId);
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function updatePersonalPlaceName(input: UpdatePersonalPlaceNameInput): Promise<{ error: string | null }> {
  const name = input.name.trim();
  if (!name) {
    return { error: "El nombre del lugar es obligatorio." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("personal_places")
    .update({
      name,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.placeId)
    .eq("user_id", input.userId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function updatePersonalPlaceStatus(input: UpdatePersonalPlaceStatusInput): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("personal_places")
    .update({
      status: input.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.placeId)
    .eq("user_id", input.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: "No se encontro el lugar." };
  }

  return { error: null };
}

export async function updatePersonalPlaceFavorite(input: UpdatePersonalPlaceFavoriteInput): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("personal_places")
    .update({
      is_favorite: input.isFavorite,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.placeId)
    .eq("user_id", input.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: "No se encontro el lugar." };
  }

  return { error: null };
}
