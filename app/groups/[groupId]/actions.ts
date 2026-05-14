"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createPlace, updatePlaceStatus } from "@/lib/places";
import { createPlaceSchema, reviewJoinRequestSchema, updateGroupSettingsSchema, updatePlaceStatusSchema } from "@/lib/validation/schemas";
import type { PlaceStatus } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canReviewJoinRequests, isGroupOwner } from "@/lib/groupPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AddPlaceActionState = {
  error: string | null;
  success: boolean;
};

export type UpdatePlaceStatusActionState = {
  error: string | null;
  success: boolean;
};

export type ReviewJoinRequestActionState = {
  error: string | null;
  success: boolean;
};

export type LeaveGroupActionState = {
  error: string | null;
  success: boolean;
};

export type DeleteGroupActionState = {
  error: string | null;
  success: boolean;
};

export type UpdateGroupSettingsActionState = {
  error: string | null;
  success: boolean;
};

const ADD_PLACE_INITIAL_STATE: AddPlaceActionState = {
  error: null,
  success: false
};

const UPDATE_PLACE_STATUS_INITIAL_STATE: UpdatePlaceStatusActionState = {
  error: null,
  success: false
};

const REVIEW_JOIN_REQUEST_INITIAL_STATE: ReviewJoinRequestActionState = {
  error: null,
  success: false
};

const LEAVE_GROUP_INITIAL_STATE: LeaveGroupActionState = {
  error: null,
  success: false
};

const DELETE_GROUP_INITIAL_STATE: DeleteGroupActionState = {
  error: null,
  success: false
};

const UPDATE_GROUP_SETTINGS_INITIAL_STATE: UpdateGroupSettingsActionState = {
  error: null,
  success: false
};

export async function addPlaceAction(
  _previousState: AddPlaceActionState = ADD_PLACE_INITIAL_STATE,
  formData: FormData
): Promise<AddPlaceActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const parsedInput = createPlaceSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    name: String(formData.get("name") || ""),
    address: String(formData.get("address") || ""),
    notes: String(formData.get("notes") || ""),
    category: String(formData.get("category") || "")
  });

  if (!parsedInput.success) {
    return {
      error: parsedInput.error.issues[0]?.message ?? "Datos invalidos.",
      success: false
    };
  }

  const { groupId, name, address, notes, category } = parsedInput.data;

  const result = await createPlace({
    userId: user.id,
    groupId,
    name,
    address,
    notes: notes || null,
    category: category || null
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${groupId}`);
  return { error: null, success: true };
}

export async function updatePlaceStatusAction(
  _previousState: UpdatePlaceStatusActionState = UPDATE_PLACE_STATUS_INITIAL_STATE,
  formData: FormData
): Promise<UpdatePlaceStatusActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const parsedInput = updatePlaceStatusSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    placeId: String(formData.get("placeId") || ""),
    status: String(formData.get("status") || "")
  });

  if (!parsedInput.success) {
    return {
      error: parsedInput.error.issues[0]?.message ?? "Datos invalidos.",
      success: false
    };
  }

  const { groupId, placeId } = parsedInput.data;
  const status = parsedInput.data.status as PlaceStatus;

  const result = await updatePlaceStatus({
    userId: user.id,
    groupId,
    placeId,
    status
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function reviewJoinRequestAction(
  _previousState: ReviewJoinRequestActionState = REVIEW_JOIN_REQUEST_INITIAL_STATE,
  formData: FormData
): Promise<ReviewJoinRequestActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const parsedInput = reviewJoinRequestSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    requestId: String(formData.get("requestId") || ""),
    decision: String(formData.get("decision") || "")
  });

  if (!parsedInput.success) {
    return { error: parsedInput.error.issues[0]?.message ?? "Datos invalidos.", success: false };
  }

  const { groupId, requestId, decision } = parsedInput.data;
  const canReview = await canReviewJoinRequests(user.id, groupId);

  if (!canReview) {
    return { error: "No tienes permisos para gestionar solicitudes de este grupo.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const requestResult = await supabase
    .from("group_join_requests")
    .select("id, user_id, group_id, status")
    .eq("id", requestId)
    .eq("group_id", groupId)
    .maybeSingle();

  const { data: request, error: requestError } = requestResult;
  if (requestError || !request) {
    return { error: "No se encontro la solicitud.", success: false };
  }

  if (decision === "approved") {
    const membershipPayload = {
      group_id: groupId,
      user_id: request.user_id,
      role: "member" as const
    };
    const membershipResult = await supabase.from("group_members").upsert(membershipPayload, { onConflict: "group_id,user_id" });

    if (membershipResult.error) {
      return { error: membershipResult.error.message, success: false };
    }
  }

  const updatePayload = {
    status: decision,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString()
  };
  const updateResult = await supabase.from("group_join_requests").update(updatePayload).eq("id", requestId);

  if (updateResult.error) {
    return { error: updateResult.error.message, success: false };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { error: null, success: true };
}

export async function updateGroupSettingsAction(
  _previousState: UpdateGroupSettingsActionState = UPDATE_GROUP_SETTINGS_INITIAL_STATE,
  formData: FormData
): Promise<UpdateGroupSettingsActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const parsedInput = updateGroupSettingsSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    placeEditPolicy: String(formData.get("placeEditPolicy") || ""),
    joinPolicy: String(formData.get("joinPolicy") || "")
  });

  if (!parsedInput.success) {
    return { error: parsedInput.error.issues[0]?.message ?? "Datos invalidos.", success: false };
  }

  const { groupId, placeEditPolicy, joinPolicy } = parsedInput.data;
  const owner = await isGroupOwner(user.id, groupId);

  if (!owner) {
    return { error: "Solo el propietario puede cambiar la configuracion del grupo.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const payload = {
    place_edit_policy: placeEditPolicy,
    join_policy: joinPolicy
  };

  const updateResult = await supabase.from("groups").update(payload).eq("id", groupId);

  if (updateResult.error) {
    return { error: updateResult.error.message, success: false };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function leaveGroupAction(
  _previousState: LeaveGroupActionState = LEAVE_GROUP_INITIAL_STATE,
  formData: FormData
): Promise<LeaveGroupActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const groupId = String(formData.get("groupId") || "").trim();
  if (!groupId) {
    return { error: "Grupo invalido.", success: false };
  }

  const owner = await isGroupOwner(user.id, groupId);
  if (owner) {
    return { error: "Como propietario, elimina el grupo para cerrarlo para todos.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const deleteResult = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);

  if (deleteResult.error) {
    return { error: deleteResult.error.message, success: false };
  }

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  revalidatePath(`/groups/${groupId}`);
  redirect("/groups");
}

export async function deleteGroupAction(
  _previousState: DeleteGroupActionState = DELETE_GROUP_INITIAL_STATE,
  formData: FormData
): Promise<DeleteGroupActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const groupId = String(formData.get("groupId") || "").trim();
  if (!groupId) {
    return { error: "Grupo invalido.", success: false };
  }

  const owner = await isGroupOwner(user.id, groupId);
  if (!owner) {
    return { error: "Solo el propietario puede eliminar este grupo.", success: false };
  }

  // Strictly required privileged operation:
  // deleting a group must cascade across all memberships/places/requests,
  // and we do not expose broad DELETE policies for groups to regular users.
  const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : null;
  if (!adminClient) {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY para eliminar grupos de forma segura.", success: false };
  }

  const deleteResult = await adminClient.from("groups").delete().eq("id", groupId);

  if (deleteResult.error) {
    return { error: deleteResult.error.message, success: false };
  }

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  redirect("/groups");
}
