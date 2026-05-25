import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, PlaceProvider, PlaceSource } from "@/types/supabase";

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
  latitude: number;
  longitude: number;
};

type UpdatePersonalPlaceInput = {
  userId: string;
  placeId: string;
  name?: string;
  address?: string;
  city?: string | null;
  notes?: string | null;
  category?: string | null;
};

type DeletePersonalPlaceInput = {
  userId: string;
  placeId: string;
};

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
      "id, user_id, name, address, city, notes, category, source, provider, external_place_id, google_maps_url, business_status, latitude, longitude, created_at, updated_at"
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
    googleMapsUrl: item.google_maps_url,
    businessStatus: item.business_status,
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

export async function updatePersonalPlace(input: UpdatePersonalPlaceInput): Promise<{ error: string | null }> {
  const updates: Database["public"]["Tables"]["personal_places"]["Update"] = {};
  if (typeof input.name === "string") updates.name = input.name.trim();
  if (typeof input.address === "string") updates.address = input.address.trim();
  if (input.city !== undefined) updates.city = input.city?.trim() || null;
  if (input.notes !== undefined) updates.notes = input.notes?.trim() || null;
  if (input.category !== undefined) updates.category = input.category?.trim() || null;

  if (updates.name !== undefined && !updates.name) {
    return { error: "El nombre del lugar es obligatorio." };
  }
  if (updates.address !== undefined && !updates.address) {
    return { error: "La direccion del lugar es obligatoria." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("personal_places")
    .update(updates)
    .eq("id", input.placeId)
    .eq("user_id", input.userId);

  if (error) {
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
