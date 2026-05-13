import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isGroupMember } from "@/lib/groupPermissions";
import { INITIAL_PLACE_CATEGORIES, type GroupPlace, type PlaceCategory } from "@/lib/places/shared";
import type { PlaceStatus } from "@/types/supabase";

type CreatePlaceInput = {
  userId: string;
  groupId: string;
  name: string;
  address: string;
  notes?: string | null;
  category?: string | null;
};

type UpdatePlaceStatusInput = {
  userId: string;
  groupId: string;
  placeId: string;
  status: PlaceStatus;
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
    .select("id, name, address, notes, status, created_at, category_id")
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
      notes: place.notes,
      status: place.status,
      category: normalizeCategory(categoryName),
      createdAt: place.created_at
    };
  });
}

export async function createPlace(input: CreatePlaceInput): Promise<{ error: string | null }> {
  const hasAccess = await isGroupMember(input.userId, input.groupId);
  if (!hasAccess) {
    return { error: "No tienes acceso a este grupo." };
  }

  const name = input.name.trim();
  const address = input.address.trim();
  if (!name) {
    return { error: "El nombre del lugar es obligatorio." };
  }
  if (!address) {
    return { error: "La direccion del lugar es obligatoria." };
  }

  const category = normalizeCategory(input.category);
  const categoryId = await resolveCategoryId(input.groupId, category);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("places").insert({
    group_id: input.groupId,
    created_by: input.userId,
    category_id: categoryId,
    name,
    address,
    latitude: 0,
    longitude: 0,
    notes: input.notes?.trim() || null,
    status: "pending"
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function updatePlaceStatus(input: UpdatePlaceStatusInput): Promise<{ error: string | null }> {
  const hasAccess = await isGroupMember(input.userId, input.groupId);
  if (!hasAccess) {
    return { error: "No tienes acceso a este grupo." };
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
