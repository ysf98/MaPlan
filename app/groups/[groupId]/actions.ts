"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createPlace, updatePlaceStatus } from "@/lib/places";
import { createPlaceSchema, reviewJoinRequestSchema, updatePlaceStatusSchema } from "@/lib/validation/schemas";
import type { PlaceStatus } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canReviewJoinRequests } from "@/lib/groupPermissions";
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
  const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : null;
  let requestResult = await supabase
    .from("group_join_requests")
    .select("id, user_id, group_id, status")
    .eq("id", requestId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (requestResult.error?.code === "42501" && adminClient) {
    requestResult = await adminClient
      .from("group_join_requests")
      .select("id, user_id, group_id, status")
      .eq("id", requestId)
      .eq("group_id", groupId)
      .maybeSingle();
  }

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
    let membershipResult = await supabase.from("group_members").upsert(membershipPayload, { onConflict: "group_id,user_id" });

    if (membershipResult.error?.code === "42501" && adminClient) {
      membershipResult = await adminClient.from("group_members").upsert(membershipPayload, { onConflict: "group_id,user_id" });
    }

    if (membershipResult.error) {
      return { error: membershipResult.error.message, success: false };
    }
  }

  const updatePayload = {
    status: decision,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString()
  };
  let updateResult = await supabase.from("group_join_requests").update(updatePayload).eq("id", requestId);

  if (updateResult.error?.code === "42501" && adminClient) {
    updateResult = await adminClient.from("group_join_requests").update(updatePayload).eq("id", requestId);
  }

  if (updateResult.error) {
    return { error: updateResult.error.message, success: false };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { error: null, success: true };
}
