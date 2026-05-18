import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canEditPlaces, isGroupMember, isGroupOwner } from "@/lib/groupPermissions";
import { INITIAL_PLACE_CATEGORIES, type GroupPlace, type PlaceCategory } from "@/lib/places/shared";
import type { PlaceProvider, PlaceSource, PlaceStatus } from "@/types/supabase";

type CreatePlaceInput = {
  userId: string;
  groupId: string;
  name: string;
  address: string;
  city?: string | null;
  notes?: string | null;
  category?: string | null;
  originalUrl?: string | null;
  source?: PlaceSource | null;
  provider?: PlaceProvider | null;
  externalPlaceId?: string | null;
  googleMapsUrl?: string | null;
  businessStatus?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type UpdatePlaceStatusInput = {
  userId: string;
  groupId: string;
  placeId: string;
  status: PlaceStatus;
};

type UpdatePlaceLocationInput = {
  userId: string;
  groupId: string;
  placeId: string;
  address: string;
  city?: string | null;
  latitude: number;
  longitude: number;
};

type DeletePlaceInput = {
  userId: string;
  groupId: string;
  placeId: string;
};

function normalizeCategory(category: string | null | undefined): PlaceCategory {
  const cleaned = (category || "").trim();
  if (!cleaned) {
    return "Otros";
  }

  const match = INITIAL_PLACE_CATEGORIES.find((item) => item.toLowerCase() === cleaned.toLowerCase());
  return match ?? "Otros";
}

async function resolveCategoryId(groupId: string, category: PlaceCategory): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: existingCategory, error: getCategoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("group_id", groupId)
    .eq("name", category)
    .maybeSingle();

  if (existingCategory?.id) {
    return existingCategory.id;
  }

  if (getCategoryError) {
    return null;
  }

  const { data: insertedCategory, error: insertCategoryError } = await supabase
    .from("categories")
    .insert({
      group_id: groupId,
      name: category
    })
    .select("id")
    .maybeSingle();

  if (insertCategoryError || !insertedCategory) {
    return null;
  }

  return insertedCategory.id;
}

export async function getGroupPlacesForUser(userId: string, groupId: string): Promise<GroupPlace[]> {
  const hasAccess = await isGroupMember(userId, groupId);
  if (!hasAccess) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: places, error } = await supabase
    .from("places")
    .select("id, name, address, city, notes, status, created_at, category_id, original_url, source, provider, external_place_id, google_maps_url, business_status, latitude, longitude")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error || !places) {
    return [];
  }

  const categoryIds = places.map((place) => place.category_id).filter((value): value is string => Boolean(value));
  const categoryNameById = new Map<string, string>();

  if (categoryIds.length > 0) {
    const { data: categories } = await supabase.from("categories").select("id, name").in("id", categoryIds);

    if (categories) {
      categories.forEach((category) => {
        categoryNameById.set(category.id, category.name);
      });
    }
  }

  return places.map((place) => {
    const categoryName = place.category_id ? categoryNameById.get(place.category_id) : null;

    return {
      id: place.id,
      name: place.name,
      address: place.address,
      city: place.city,
      notes: place.notes,
      originalUrl: place.original_url,
      source: place.source,
      provider: place.provider,
      externalPlaceId: place.external_place_id,
      googleMapsUrl: place.google_maps_url,
      businessStatus: place.business_status,
      latitude: place.latitude,
      longitude: place.longitude,
      status: place.status,
      category: normalizeCategory(categoryName),
      createdAt: place.created_at
    };
  });
}

export async function createPlace(input: CreatePlaceInput): Promise<{ error: string | null }> {
  const canEdit = await canEditPlaces(input.userId, input.groupId);
  if (!canEdit) {
    return { error: "No tienes permisos para editar lugares en este grupo." };
  }

  const name = input.name.trim();
  const address = input.address.trim();
  const city = input.city?.trim() || null;
  const provider = input.provider || null;
  const externalPlaceId = input.externalPlaceId?.trim() || null;
  if (!name) {
    return { error: "El nombre del lugar es obligatorio." };
  }
  if (!address) {
    return { error: "La direccion del lugar es obligatoria." };
  }

  const category = normalizeCategory(input.category);
  const categoryId = await resolveCategoryId(input.groupId, category);
  const supabase = await createSupabaseServerClient();

  if (provider && externalPlaceId) {
    const existingByProvider = await supabase
      .from("places")
      .select("id")
      .eq("group_id", input.groupId)
      .eq("provider", provider)
      .eq("external_place_id", externalPlaceId)
      .maybeSingle();

    if (existingByProvider.error) {
      return { error: existingByProvider.error.message };
    }
    if (existingByProvider.data) {
      return { error: "Ese sitio ya esta guardado en este grupo." };
    }
  }

  let existingPlaceQuery = supabase
    .from("places")
    .select("id")
    .eq("group_id", input.groupId)
    .ilike("name", name)
    .ilike("address", address);

  existingPlaceQuery = city ? existingPlaceQuery.ilike("city", city) : existingPlaceQuery.is("city", null);
  const existingPlaceResult = await existingPlaceQuery.maybeSingle();

  if (existingPlaceResult.error) {
    return { error: existingPlaceResult.error.message };
  }

  if (existingPlaceResult.data) {
    return { error: "Ese sitio ya esta guardado en este grupo." };
  }

  const { error } = await supabase.from("places").insert({
    group_id: input.groupId,
    created_by: input.userId,
    category_id: categoryId,
    name,
    address,
    city,
    original_url: input.originalUrl?.trim() || null,
    source: input.source || null,
    provider,
    external_place_id: externalPlaceId,
    google_maps_url: input.googleMapsUrl?.trim() || null,
    business_status: input.businessStatus?.trim() || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    notes: input.notes?.trim() || null,
    status: "pending"
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ese sitio ya esta guardado en este grupo." };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function updatePlaceStatus(input: UpdatePlaceStatusInput): Promise<{ error: string | null }> {
  const canEdit = await canEditPlaces(input.userId, input.groupId);
  if (!canEdit) {
    return { error: "No tienes permisos para editar lugares en este grupo." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: place, error: placeError } = await supabase
    .from("places")
    .select("id")
    .eq("id", input.placeId)
    .eq("group_id", input.groupId)
    .maybeSingle();

  if (placeError || !place) {
    return { error: "No se encontro el lugar." };
  }

  const { error: updateError } = await supabase
    .from("places")
    .update({
      status: input.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.placeId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { error: null };
}

export async function updatePlaceLocation(input: UpdatePlaceLocationInput): Promise<{ error: string | null }> {
  const canEdit = await canEditPlaces(input.userId, input.groupId);
  if (!canEdit) {
    return { error: "No tienes permisos para editar lugares en este grupo." };
  }

  const address = input.address.trim();
  const city = input.city?.trim() || null;
  if (!address) {
    return { error: "La direccion del lugar es obligatoria." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: place, error: placeError } = await supabase
    .from("places")
    .select("id")
    .eq("id", input.placeId)
    .eq("group_id", input.groupId)
    .maybeSingle();

  if (placeError || !place) {
    return { error: "No se encontro el lugar." };
  }

  const { error: updateError } = await supabase
    .from("places")
    .update({
      address,
      city,
      latitude: input.latitude,
      longitude: input.longitude,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.placeId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { error: null };
}

export async function deletePlace(input: DeletePlaceInput): Promise<{ error: string | null }> {
  const isOwner = await isGroupOwner(input.userId, input.groupId);
  if (!isOwner) {
    return { error: "Solo el propietario puede eliminar lugares en este grupo." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: place, error: placeError } = await supabase
    .from("places")
    .select("id")
    .eq("id", input.placeId)
    .eq("group_id", input.groupId)
    .maybeSingle();

  if (placeError || !place) {
    return { error: "No se encontro el lugar." };
  }

  const { error: deleteError } = await supabase.from("places").delete().eq("id", input.placeId);
  if (deleteError) {
    return { error: deleteError.message };
  }

  return { error: null };
}
