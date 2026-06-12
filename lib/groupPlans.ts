import { canEditPlaces, isGroupMember } from "@/lib/groupPermissions";
import { recordPlanCreatedGroupActivity } from "@/lib/groupActivity";
import { canPlanAcceptNewPlaces, extractPlanDatePart, isPlanDateTodayOrFuture, normalizePlanDateInput } from "@/lib/groupPlansShared";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupPlanVote } from "@/types/supabase";

export { canPlanAcceptNewPlaces } from "@/lib/groupPlansShared";

type CreateGroupPlanInput = {
  userId: string;
  groupId: string;
  title: string;
  description?: string | null;
  plannedDate?: string | null;
  initialPlaceId?: string | null;
  initialPlaceIds?: string[];
  initialPlacePlannedAt?: string | null;
  initialPlaceNote?: string | null;
};

type AddPlaceToGroupPlanInput = {
  userId: string;
  groupId: string;
  planId: string;
  placeId: string;
  plannedAt?: string | null;
  note?: string | null;
};

type AddDraftPlaceToGroupPlanInput = {
  userId: string;
  groupId: string;
  planId: string;
  name: string;
  address: string;
  city?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
  phoneNumber?: string | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  provider?: string | null;
  externalPlaceId?: string | null;
  plannedAt?: string | null;
  note?: string | null;
};

type VoteGroupPlanInput = {
  userId: string;
  groupId: string;
  planId: string;
  vote: GroupPlanVote;
};

type DeleteGroupPlanInput = {
  userId: string;
  groupId: string;
  planId: string;
};

type UpdateGroupPlanDateInput = {
  userId: string;
  groupId: string;
  planId: string;
  plannedDate?: string | null;
};

type UpdateGroupPlanDetailsInput = {
  userId: string;
  groupId: string;
  planId: string;
  title: string;
  plannedDate?: string | null;
};

type RemoveGroupPlanPlaceInput = {
  userId: string;
  groupId: string;
  planId: string;
  planPlaceId: string;
};

type UpdateGroupPlanPlaceTimeInput = {
  userId: string;
  groupId: string;
  planId: string;
  planPlaceId: string;
  plannedAt?: string | null;
};

type GroupPlanRow = {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  planned_date: string | null;
  created_at: string;
  updated_at: string;
};

type GroupPlanPlaceRow = {
  id: string;
  plan_id: string;
  place_id: string | null;
  place_name: string | null;
  place_address: string | null;
  place_city: string | null;
  place_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  phone_number: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  provider: string | null;
  external_place_id: string | null;
  planned_at: string | null;
  note: string | null;
  created_at: string;
};

type GroupPlanVoteRow = {
  plan_id: string;
  user_id: string;
  vote: string;
};

export type GroupPlanPlaceItem = {
  id: string;
  placeId: string | null;
  name: string;
  address: string;
  city: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  phoneNumber: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  plannedAt: string | null;
  note: string | null;
  createdAt: string;
};

export type GroupPlanItem = {
  id: string;
  groupId: string;
  createdBy: string;
  title: string;
  description: string | null;
  plannedDate: string | null;
  createdAt: string;
  updatedAt: string;
  places: GroupPlanPlaceItem[];
  votes: Array<{ userId: string; vote: GroupPlanVote }>;
  attendingCount: number;
  maybeCount: number;
  notAttendingCount: number;
  currentUserVote: GroupPlanVote | null;
  acceptsNewPlaces: boolean;
  isCreator: boolean;
};

function isGroupPlanVote(value: string): value is GroupPlanVote {
  return value === "attending" || value === "maybe" || value === "not_attending";
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

async function getPlanForGroup(groupId: string, planId: string): Promise<GroupPlanRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_plans")
    .select("id, group_id, created_by, title, description, planned_date, created_at, updated_at")
    .eq("group_id", groupId)
    .eq("id", planId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function validatePlaceBelongsToGroup(groupId: string, placeId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("places")
    .select("id")
    .eq("group_id", groupId)
    .eq("id", placeId)
    .maybeSingle();

  return !error && Boolean(data);
}

async function getGroupPlaceSnapshot(groupId: string, placeId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("places")
    .select("id, name, address, city, image_url, latitude, longitude, google_maps_url, phone_number, rating, user_ratings_total, provider, external_place_id")
    .eq("group_id", groupId)
    .eq("id", placeId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    place_name: data.name,
    place_address: data.address,
    place_city: data.city,
    place_image_url: data.image_url,
    latitude: data.latitude,
    longitude: data.longitude,
    google_maps_url: data.google_maps_url,
    phone_number: data.phone_number,
    rating: data.rating,
    user_ratings_total: data.user_ratings_total,
    provider: data.provider,
    external_place_id: data.external_place_id
  };
}

async function insertPlaceIntoPlan(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  input: AddPlaceToGroupPlanInput
): Promise<{ error: string | null }> {
  const snapshot = await getGroupPlaceSnapshot(input.groupId, input.placeId);
  if (!snapshot) {
    return { error: "No se encontro el lugar del grupo." };
  }

  const { error } = await supabase.from("group_plan_places").insert({
    plan_id: input.planId,
    place_id: input.placeId,
    added_by: input.userId,
    ...snapshot,
    planned_at: input.plannedAt || null,
    note: normalizeOptionalText(input.note)
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ese lugar ya esta anadido al plan." };
    }

    return { error: error.message };
  }

  return { error: null };
}

export async function getGroupPlansForUser(userId: string, groupId: string): Promise<GroupPlanItem[]> {
  const hasAccess = await isGroupMember(userId, groupId);
  if (!hasAccess) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const plansResult = await supabase
    .from("group_plans")
    .select("id, group_id, created_by, title, description, planned_date, created_at, updated_at")
    .eq("group_id", groupId)
    .order("planned_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const plans = (plansResult.data ?? []) as GroupPlanRow[];
  if (plansResult.error || plans.length === 0) {
    return [];
  }

  const planIds = plans.map((plan) => plan.id);
  const [planPlacesResult, votesResult] = await Promise.all([
    supabase
      .from("group_plan_places")
      .select(
        "id, plan_id, place_id, place_name, place_address, place_city, place_image_url, latitude, longitude, google_maps_url, phone_number, rating, user_ratings_total, provider, external_place_id, planned_at, note, created_at"
      )
      .in("plan_id", planIds)
      .order("created_at", { ascending: true }),
    supabase.from("group_plan_votes").select("plan_id, user_id, vote").in("plan_id", planIds)
  ]);

  const planPlaces = (planPlacesResult.data ?? []) as GroupPlanPlaceRow[];
  const placeIds = planPlaces.map((item) => item.place_id).filter((placeId): placeId is string => Boolean(placeId));
  const placeDetailsResult =
    placeIds.length > 0
      ? await supabase
          .from("places")
          .select("id, name, address, city, image_url, latitude, longitude, google_maps_url, phone_number, rating, user_ratings_total")
          .in("id", placeIds)
      : { data: [], error: null };

  const placeById = new Map(
    (placeDetailsResult.data ?? []).map((place) => [
      place.id,
      {
        id: place.id,
        name: place.name,
        address: place.address,
        city: place.city,
        imageUrl: place.image_url,
        latitude: place.latitude,
        longitude: place.longitude,
        googleMapsUrl: place.google_maps_url,
        phoneNumber: place.phone_number,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total
      }
    ])
  );

  const placesByPlanId = new Map<string, GroupPlanPlaceItem[]>();
  planPlaces.forEach((item) => {
    const place = item.place_id ? placeById.get(item.place_id) : null;
    const name = place?.name ?? item.place_name;
    const address = place?.address ?? item.place_address;
    if (!name || !address) {
      return;
    }

    const nextPlace: GroupPlanPlaceItem = {
      id: item.id,
      placeId: item.place_id,
      name,
      address,
      city: place?.city ?? item.place_city,
      imageUrl: place?.imageUrl ?? item.place_image_url,
      latitude: place?.latitude ?? item.latitude,
      longitude: place?.longitude ?? item.longitude,
      googleMapsUrl: place?.googleMapsUrl ?? item.google_maps_url,
      phoneNumber: place?.phoneNumber ?? item.phone_number,
      rating: place?.rating ?? item.rating,
      userRatingsTotal: place?.userRatingsTotal ?? item.user_ratings_total,
      plannedAt: item.planned_at,
      note: item.note,
      createdAt: item.created_at
    };

    const current = placesByPlanId.get(item.plan_id) ?? [];
    current.push(nextPlace);
    placesByPlanId.set(item.plan_id, current);
  });

  const votesByPlanId = new Map<string, Array<{ userId: string; vote: GroupPlanVote }>>();
  ((votesResult.data ?? []) as GroupPlanVoteRow[]).forEach((voteRow) => {
    if (!isGroupPlanVote(voteRow.vote)) {
      return;
    }

    const current = votesByPlanId.get(voteRow.plan_id) ?? [];
    current.push({ userId: voteRow.user_id, vote: voteRow.vote });
    votesByPlanId.set(voteRow.plan_id, current);
  });

  return plans.map((plan) => {
    const votes = votesByPlanId.get(plan.id) ?? [];
    return {
      id: plan.id,
      groupId: plan.group_id,
      createdBy: plan.created_by,
      title: plan.title,
      description: plan.description,
      plannedDate: plan.planned_date,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
      places: placesByPlanId.get(plan.id) ?? [],
      votes,
      attendingCount: votes.filter((vote) => vote.vote === "attending").length,
      maybeCount: votes.filter((vote) => vote.vote === "maybe").length,
      notAttendingCount: votes.filter((vote) => vote.vote === "not_attending").length,
      currentUserVote: votes.find((vote) => vote.userId === userId)?.vote ?? null,
      acceptsNewPlaces: canPlanAcceptNewPlaces(plan.planned_date),
      isCreator: plan.created_by === userId
    };
  });
}

export async function createGroupPlan(input: CreateGroupPlanInput): Promise<{ error: string | null; planId: string | null }> {
  const canCreate = await canEditPlaces(input.userId, input.groupId);
  if (!canCreate) {
    return { error: "No tienes permisos para crear planes en este grupo.", planId: null };
  }

  const title = input.title.trim();
  if (!title) {
    return { error: "El nombre del plan es obligatorio.", planId: null };
  }

  if (input.plannedDate) {
    if (!extractPlanDatePart(input.plannedDate)) {
      return { error: "Fecha invalida.", planId: null };
    }

    if (!isPlanDateTodayOrFuture(input.plannedDate)) {
      return { error: "La fecha del plan no puede ser anterior a hoy.", planId: null };
    }
  }

  const initialPlaceIds = Array.from(new Set([...(input.initialPlaceIds ?? []), input.initialPlaceId].filter(Boolean) as string[]));

  for (const placeId of initialPlaceIds) {
    const placeExists = await validatePlaceBelongsToGroup(input.groupId, placeId);
    if (!placeExists) {
      return { error: "No se encontro el lugar del grupo.", planId: null };
    }
  }

  const supabase = await createSupabaseServerClient();
  const insertResult = await supabase
    .from("group_plans")
    .insert({
      group_id: input.groupId,
      created_by: input.userId,
      title,
      description: normalizeOptionalText(input.description),
      planned_date: normalizePlanDateInput(input.plannedDate)
    })
    .select("id")
    .maybeSingle();

  if (insertResult.error || !insertResult.data) {
    return { error: insertResult.error?.message ?? "No se pudo crear el plan.", planId: null };
  }

  for (const placeId of initialPlaceIds) {
    const addPlaceResult = await insertPlaceIntoPlan(supabase, {
      userId: input.userId,
      groupId: input.groupId,
      planId: insertResult.data.id,
      placeId,
      plannedAt: placeId === input.initialPlaceId ? input.initialPlacePlannedAt || null : null,
      note: placeId === input.initialPlaceId ? input.initialPlaceNote || null : null
    });

    if (addPlaceResult.error) {
      await supabase.from("group_plans").delete().eq("id", insertResult.data.id);
      return { error: addPlaceResult.error, planId: null };
    }
  }

  await recordPlanCreatedGroupActivity({
    actorUserId: input.userId,
    groupId: input.groupId,
    planId: insertResult.data.id,
    planTitle: title
  });

  return { error: null, planId: insertResult.data.id };
}

export async function addPlaceToGroupPlan(input: AddPlaceToGroupPlanInput): Promise<{ error: string | null }> {
  const canEdit = await canEditPlaces(input.userId, input.groupId);
  if (!canEdit) {
    return { error: "No tienes permisos para anadir lugares a planes en este grupo." };
  }

  const plan = await getPlanForGroup(input.groupId, input.planId);
  if (!plan) {
    return { error: "No se encontro el plan." };
  }

  if (!canPlanAcceptNewPlaces(plan.planned_date)) {
    return { error: "Este plan ya ha pasado y no admite nuevos lugares." };
  }

  const supabase = await createSupabaseServerClient();
  return insertPlaceIntoPlan(supabase, input);
}

export async function addDraftPlaceToGroupPlan(input: AddDraftPlaceToGroupPlanInput): Promise<{ error: string | null }> {
  const canEdit = await canEditPlaces(input.userId, input.groupId);
  if (!canEdit) {
    return { error: "No tienes permisos para anadir lugares a planes en este grupo." };
  }

  const plan = await getPlanForGroup(input.groupId, input.planId);
  if (!plan) {
    return { error: "No se encontro el plan." };
  }

  if (!canPlanAcceptNewPlaces(plan.planned_date)) {
    return { error: "Este plan ya ha pasado y no admite nuevos lugares." };
  }

  const name = input.name.trim();
  const address = input.address.trim();
  if (!name || !address) {
    return { error: "El lugar necesita nombre y direccion." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("group_plan_places").insert({
    plan_id: input.planId,
    place_id: null,
    added_by: input.userId,
    place_name: name,
    place_address: address,
    place_city: normalizeOptionalText(input.city),
    place_image_url: normalizeOptionalText(input.imageUrl),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    google_maps_url: normalizeOptionalText(input.googleMapsUrl),
    phone_number: normalizeOptionalText(input.phoneNumber),
    rating: input.rating ?? null,
    user_ratings_total: input.userRatingsTotal ?? null,
    provider: normalizeOptionalText(input.provider),
    external_place_id: normalizeOptionalText(input.externalPlaceId),
    planned_at: input.plannedAt || null,
    note: normalizeOptionalText(input.note)
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function voteGroupPlan(input: VoteGroupPlanInput): Promise<{ error: string | null }> {
  const hasAccess = await isGroupMember(input.userId, input.groupId);
  if (!hasAccess) {
    return { error: "No tienes permisos para votar en este plan." };
  }

  const plan = await getPlanForGroup(input.groupId, input.planId);
  if (!plan) {
    return { error: "No se encontro el plan." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("group_plan_votes").upsert(
    {
      plan_id: input.planId,
      user_id: input.userId,
      vote: input.vote
    },
    { onConflict: "plan_id,user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function deleteGroupPlan(input: DeleteGroupPlanInput): Promise<{ error: string | null }> {
  const plan = await getPlanForGroup(input.groupId, input.planId);
  if (!plan) {
    return { error: "No se encontro el plan." };
  }

  if (plan.created_by !== input.userId) {
    return { error: "Solo la persona creadora puede eliminar este plan." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("group_plans").delete().eq("id", input.planId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function updateGroupPlanDate(input: UpdateGroupPlanDateInput): Promise<{ error: string | null }> {
  const plan = await getPlanForGroup(input.groupId, input.planId);
  if (!plan) {
    return { error: "No se encontro el plan." };
  }

  if (plan.created_by !== input.userId) {
    return { error: "Solo la persona creadora puede cambiar la fecha de este plan." };
  }

  if (input.plannedDate) {
    if (!extractPlanDatePart(input.plannedDate)) {
      return { error: "Fecha invalida." };
    }

    if (!isPlanDateTodayOrFuture(input.plannedDate)) {
      return { error: "La fecha del plan no puede ser anterior a hoy." };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_plans")
    .update({
      planned_date: normalizePlanDateInput(input.plannedDate),
      updated_at: new Date().toISOString()
    })
    .eq("id", input.planId)
    .eq("group_id", input.groupId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "No se pudo actualizar la fecha del plan." };
  }

  return { error: null };
}

export async function updateGroupPlanDetails(input: UpdateGroupPlanDetailsInput): Promise<{ error: string | null }> {
  const plan = await getPlanForGroup(input.groupId, input.planId);
  if (!plan) {
    return { error: "No se encontro el plan." };
  }

  if (plan.created_by !== input.userId) {
    return { error: "Solo la persona creadora puede editar este plan." };
  }

  const title = input.title.trim();
  if (!title) {
    return { error: "El nombre del plan es obligatorio." };
  }

  if (input.plannedDate) {
    if (!extractPlanDatePart(input.plannedDate)) {
      return { error: "Fecha invalida." };
    }

    if (!isPlanDateTodayOrFuture(input.plannedDate)) {
      return { error: "La fecha del plan no puede ser anterior a hoy." };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_plans")
    .update({
      title,
      planned_date: normalizePlanDateInput(input.plannedDate),
      updated_at: new Date().toISOString()
    })
    .eq("id", input.planId)
    .eq("group_id", input.groupId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "No se pudo actualizar el plan." };
  }

  return { error: null };
}

export async function removePlaceFromGroupPlan(input: RemoveGroupPlanPlaceInput): Promise<{ error: string | null }> {
  const plan = await getPlanForGroup(input.groupId, input.planId);
  if (!plan) {
    return { error: "No se encontro el plan." };
  }

  if (plan.created_by !== input.userId) {
    return { error: "Solo la persona creadora puede eliminar lugares de este plan." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: planPlace, error: planPlaceError } = await supabase
    .from("group_plan_places")
    .select("id")
    .eq("id", input.planPlaceId)
    .eq("plan_id", input.planId)
    .maybeSingle();

  if (planPlaceError || !planPlace) {
    return { error: "No se encontro la parada del plan." };
  }

  const { error } = await supabase.from("group_plan_places").delete().eq("id", input.planPlaceId);
  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function updateGroupPlanPlaceTime(input: UpdateGroupPlanPlaceTimeInput): Promise<{ error: string | null }> {
  const plan = await getPlanForGroup(input.groupId, input.planId);
  if (!plan) {
    return { error: "No se encontro el plan." };
  }

  if (plan.created_by !== input.userId) {
    return { error: "Solo la persona creadora puede cambiar la hora de esta parada." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: planPlace, error: planPlaceError } = await supabase
    .from("group_plan_places")
    .select("id")
    .eq("id", input.planPlaceId)
    .eq("plan_id", input.planId)
    .maybeSingle();

  if (planPlaceError || !planPlace) {
    return { error: "No se encontro la parada del plan." };
  }

  const { error } = await supabase
    .from("group_plan_places")
    .update({ planned_at: input.plannedAt || null })
    .eq("id", input.planPlaceId)
    .eq("plan_id", input.planId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
