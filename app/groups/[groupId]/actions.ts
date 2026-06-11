"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import {
  addPlaceToGroupPlan,
  addDraftPlaceToGroupPlan,
  createGroupPlan,
  deleteGroupPlan,
  removePlaceFromGroupPlan,
  updateGroupPlanDate,
  updateGroupPlanDetails,
  updateGroupPlanPlaceTime,
  voteGroupPlan
} from "@/lib/groupPlans";
import { createPlace, deletePlace, updatePlaceFavorite, updatePlaceLocation, updatePlaceName, updatePlaceStatus } from "@/lib/places";
import {
  addPlaceToGroupPlanSchema,
  createGroupPlanSchema,
  deleteGroupPlanSchema,
  createPlaceSchema,
  removeGroupMemberSchema,
  removeGroupPlanPlaceSchema,
  reviewJoinRequestSchema,
  updateGroupDetailsSchema,
  updateGroupPlanDateSchema,
  updateGroupPlanDetailsSchema,
  updateGroupPlanPlaceTimeSchema,
  updateGroupSettingsSchema,
  updatePlaceFavoriteSchema,
  updatePlaceLocationSchema,
  updatePlaceStatusSchema,
  voteGroupPlanSchema
} from "@/lib/validation/schemas";
import type { Database, GroupPlanVote, PlaceStatus } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canChangeGroupPrivacy, canEditGroupDetails, canReviewJoinRequests, isGroupOwner } from "@/lib/groupPermissions";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AddPlaceActionState = {
  error: string | null;
  success: boolean;
};

export type UpdatePlaceStatusActionState = {
  error: string | null;
  success: boolean;
};

export type UpdatePlaceFavoriteActionState = {
  error: string | null;
  success: boolean;
};

export type UpdatePlaceLocationActionState = {
  error: string | null;
  success: boolean;
};
export type UpdatePlaceNameActionState = {
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

export type UpdateGroupDetailsActionState = {
  error: string | null;
  success: boolean;
};

export type DeletePlaceActionState = {
  error: string | null;
  success: boolean;
};

export type CreateGroupPlanActionState = {
  error: string | null;
  planId?: string | null;
  requestId?: string | null;
  success: boolean;
};

export type AddPlaceToGroupPlanActionState = {
  error: string | null;
  requestId?: string | null;
  success: boolean;
};

export type VoteGroupPlanActionState = {
  error: string | null;
  success: boolean;
};

export type DeleteGroupPlanActionState = {
  error: string | null;
  success: boolean;
};

export type UpdateGroupPlanDateActionState = {
  error: string | null;
  requestId?: string | null;
  success: boolean;
};

export type UpdateGroupPlanDetailsActionState = {
  error: string | null;
  requestId?: string | null;
  success: boolean;
};

export type CreateGroupPlanFromDraftActionState = {
  error: string | null;
  success: boolean;
};

export type AddDraftPlaceToGroupPlanActionState = {
  error: string | null;
  success: boolean;
};

export type RemoveGroupPlanPlaceActionState = {
  error: string | null;
  planPlaceId?: string | null;
  requestId?: string | null;
  success: boolean;
};

export type UpdateGroupPlanPlaceTimeActionState = {
  error: string | null;
  planPlaceId?: string | null;
  requestId?: string | null;
  success: boolean;
};

export type RemoveGroupMemberActionState = {
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

const UPDATE_PLACE_FAVORITE_INITIAL_STATE: UpdatePlaceFavoriteActionState = {
  error: null,
  success: false
};

const UPDATE_PLACE_LOCATION_INITIAL_STATE: UpdatePlaceLocationActionState = {
  error: null,
  success: false
};
const UPDATE_PLACE_NAME_INITIAL_STATE: UpdatePlaceNameActionState = {
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

const UPDATE_GROUP_DETAILS_INITIAL_STATE: UpdateGroupDetailsActionState = {
  error: null,
  success: false
};

const DELETE_PLACE_INITIAL_STATE: DeletePlaceActionState = {
  error: null,
  success: false
};

const CREATE_GROUP_PLAN_INITIAL_STATE: CreateGroupPlanActionState = {
  error: null,
  planId: null,
  requestId: null,
  success: false
};

const ADD_PLACE_TO_GROUP_PLAN_INITIAL_STATE: AddPlaceToGroupPlanActionState = {
  error: null,
  requestId: null,
  success: false
};

const VOTE_GROUP_PLAN_INITIAL_STATE: VoteGroupPlanActionState = {
  error: null,
  success: false
};

const DELETE_GROUP_PLAN_INITIAL_STATE: DeleteGroupPlanActionState = {
  error: null,
  success: false
};

const UPDATE_GROUP_PLAN_DATE_INITIAL_STATE: UpdateGroupPlanDateActionState = {
  error: null,
  requestId: null,
  success: false
};

const UPDATE_GROUP_PLAN_DETAILS_INITIAL_STATE: UpdateGroupPlanDetailsActionState = {
  error: null,
  requestId: null,
  success: false
};

const CREATE_GROUP_PLAN_FROM_DRAFT_INITIAL_STATE: CreateGroupPlanFromDraftActionState = {
  error: null,
  success: false
};

const ADD_DRAFT_PLACE_TO_GROUP_PLAN_INITIAL_STATE: AddDraftPlaceToGroupPlanActionState = {
  error: null,
  success: false
};

const REMOVE_GROUP_PLAN_PLACE_INITIAL_STATE: RemoveGroupPlanPlaceActionState = {
  error: null,
  planPlaceId: null,
  requestId: null,
  success: false
};

const UPDATE_GROUP_PLAN_PLACE_TIME_INITIAL_STATE: UpdateGroupPlanPlaceTimeActionState = {
  error: null,
  planPlaceId: null,
  requestId: null,
  success: false
};

const REMOVE_GROUP_MEMBER_INITIAL_STATE: RemoveGroupMemberActionState = {
  error: null,
  success: false
};
type GroupJoinRequestUpdate = Database["public"]["Tables"]["group_join_requests"]["Update"];

function parsePlaceDraftFormData(formData: FormData) {
  return createPlaceSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    name: String(formData.get("name") || ""),
    address: String(formData.get("address") || ""),
    city: String(formData.get("city") || ""),
    notes: String(formData.get("notes") || ""),
    category: String(formData.get("category") || ""),
    originalUrl: String(formData.get("originalUrl") || ""),
    source: String(formData.get("source") || ""),
    provider: String(formData.get("provider") || ""),
    externalPlaceId: String(formData.get("externalPlaceId") || ""),
    googleMapsUrl: String(formData.get("googleMapsUrl") || ""),
    businessStatus: String(formData.get("businessStatus") || ""),
    phoneNumber: String(formData.get("phoneNumber") || ""),
    rating: formData.get("rating"),
    userRatingsTotal: formData.get("userRatingsTotal"),
    imageUrl: String(formData.get("imageUrl") || ""),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude")
  });
}

function getDraftPlanPlaceInput(placeData: ReturnType<typeof createPlaceSchema.parse>) {
  return {
    name: placeData.name,
    address: placeData.address,
    city: placeData.city || null,
    imageUrl: placeData.imageUrl || null,
    latitude: typeof placeData.latitude === "number" ? placeData.latitude : null,
    longitude: typeof placeData.longitude === "number" ? placeData.longitude : null,
    googleMapsUrl: placeData.googleMapsUrl || null,
    phoneNumber: placeData.phoneNumber || null,
    rating: placeData.rating ?? null,
    userRatingsTotal: placeData.userRatingsTotal ?? null,
    provider: placeData.provider || null,
    externalPlaceId: placeData.externalPlaceId || null
  };
}

export async function addPlaceAction(
  _previousState: AddPlaceActionState = ADD_PLACE_INITIAL_STATE,
  formData: FormData
): Promise<AddPlaceActionState> {
  const parsedInput = parsePlaceDraftFormData(formData);

  if (!parsedInput.success) {
    return {
      error: getValidationErrorMessage(parsedInput.error),
      success: false
    };
  }

  const user = await requireAuthenticatedUser("/groups");

  const {
    groupId,
    name,
    address,
    city,
    notes,
    category,
    originalUrl,
    source,
    provider,
    externalPlaceId,
    googleMapsUrl,
    businessStatus,
    phoneNumber,
    rating,
    userRatingsTotal,
    imageUrl,
    latitude,
    longitude
  } = parsedInput.data;

  const result = await createPlace({
    userId: user.id,
    groupId,
    name,
    address,
    city: city || null,
    notes: notes || null,
    category: category || null,
    originalUrl: originalUrl || null,
    source: source || null,
    provider: provider || null,
    externalPlaceId: externalPlaceId || null,
    googleMapsUrl: googleMapsUrl || null,
    businessStatus: businessStatus || null,
    phoneNumber: phoneNumber || null,
    rating: rating ?? null,
    userRatingsTotal: userRatingsTotal ?? null,
    imageUrl: imageUrl || null,
    latitude: typeof latitude === "number" ? latitude : null,
    longitude: typeof longitude === "number" ? longitude : null
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${groupId}`);
  return { error: null, success: true };
}

export async function createGroupPlanFromDraftAction(
  _previousState: CreateGroupPlanFromDraftActionState = CREATE_GROUP_PLAN_FROM_DRAFT_INITIAL_STATE,
  formData: FormData
): Promise<CreateGroupPlanFromDraftActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const parsedPlace = parsePlaceDraftFormData(formData);
  const parsedPlan = createGroupPlanSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    plannedDate: String(formData.get("plannedDate") || ""),
    initialPlaceId: "",
    initialPlacePlannedAt: String(formData.get("initialPlacePlannedAt") || ""),
    initialPlaceNote: String(formData.get("initialPlaceNote") || "")
  });

  if (!parsedPlace.success) {
    return { error: getValidationErrorMessage(parsedPlace.error), success: false };
  }

  if (!parsedPlan.success) {
    return { error: getValidationErrorMessage(parsedPlan.error), success: false };
  }

  const planResult = await createGroupPlan({
    userId: user.id,
    groupId: parsedPlan.data.groupId,
    title: parsedPlan.data.title,
    description: parsedPlan.data.description,
    plannedDate: parsedPlan.data.plannedDate
  });

  if (planResult.error || !planResult.planId) {
    return { error: planResult.error, success: false };
  }

  const placeResult = await addDraftPlaceToGroupPlan({
    userId: user.id,
    groupId: parsedPlan.data.groupId,
    planId: planResult.planId,
    ...getDraftPlanPlaceInput(parsedPlace.data),
    plannedAt: parsedPlan.data.initialPlacePlannedAt,
    note: parsedPlan.data.initialPlaceNote
  });

  if (placeResult.error) {
    await deleteGroupPlan({
      userId: user.id,
      groupId: parsedPlan.data.groupId,
      planId: planResult.planId
    });
    return { error: placeResult.error, success: false };
  }

  revalidatePath(`/groups/${parsedPlan.data.groupId}`);
  return { error: null, success: true };
}

export async function addDraftPlaceToGroupPlanAction(
  _previousState: AddDraftPlaceToGroupPlanActionState = ADD_DRAFT_PLACE_TO_GROUP_PLAN_INITIAL_STATE,
  formData: FormData
): Promise<AddDraftPlaceToGroupPlanActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const parsedPlace = parsePlaceDraftFormData(formData);
  const parsedPlan = addPlaceToGroupPlanSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    planId: String(formData.get("planId") || ""),
    placeId: "11111111-1111-4111-8111-111111111111",
    plannedAt: String(formData.get("plannedAt") || ""),
    note: String(formData.get("note") || "")
  });

  if (!parsedPlace.success) {
    return { error: getValidationErrorMessage(parsedPlace.error), success: false };
  }

  if (!parsedPlan.success) {
    return { error: getValidationErrorMessage(parsedPlan.error), success: false };
  }

  const result = await addDraftPlaceToGroupPlan({
    userId: user.id,
    groupId: parsedPlan.data.groupId,
    planId: parsedPlan.data.planId,
    ...getDraftPlanPlaceInput(parsedPlace.data),
    plannedAt: parsedPlan.data.plannedAt,
    note: parsedPlan.data.note
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${parsedPlan.data.groupId}`);
  return { error: null, success: true };
}

export async function updatePlaceStatusAction(
  _previousState: UpdatePlaceStatusActionState = UPDATE_PLACE_STATUS_INITIAL_STATE,
  formData: FormData
): Promise<UpdatePlaceStatusActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = updatePlaceStatusSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    placeId: String(formData.get("placeId") || ""),
    status: String(formData.get("status") || "")
  });

  if (!parsedInput.success) {
    return {
      error: getValidationErrorMessage(parsedInput.error),
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

  return { error: null, success: true };
}

export async function updatePlaceFavoriteAction(
  _previousState: UpdatePlaceFavoriteActionState = UPDATE_PLACE_FAVORITE_INITIAL_STATE,
  formData: FormData
): Promise<UpdatePlaceFavoriteActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = updatePlaceFavoriteSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    placeId: String(formData.get("placeId") || ""),
    isFavorite: String(formData.get("isFavorite") || "")
  });

  if (!parsedInput.success) {
    return {
      error: getValidationErrorMessage(parsedInput.error),
      success: false
    };
  }

  const { groupId, placeId, isFavorite } = parsedInput.data;
  const result = await updatePlaceFavorite({
    userId: user.id,
    groupId,
    placeId,
    isFavorite
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  return { error: null, success: true };
}

export async function updatePlaceLocationAction(
  _previousState: UpdatePlaceLocationActionState = UPDATE_PLACE_LOCATION_INITIAL_STATE,
  formData: FormData
): Promise<UpdatePlaceLocationActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = updatePlaceLocationSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    placeId: String(formData.get("placeId") || ""),
    address: String(formData.get("address") || ""),
    city: String(formData.get("city") || ""),
    latitude: String(formData.get("latitude") || ""),
    longitude: String(formData.get("longitude") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const { groupId, placeId, address, city, latitude, longitude } = parsedInput.data;
  const result = await updatePlaceLocation({
    userId: user.id,
    groupId,
    placeId,
    address,
    city: city || null,
    latitude,
    longitude
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${groupId}`);
  return { error: null, success: true };
}

export async function deletePlaceAction(
  _previousState: DeletePlaceActionState = DELETE_PLACE_INITIAL_STATE,
  formData: FormData
): Promise<DeletePlaceActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const groupId = String(formData.get("groupId") || "");
  const placeId = String(formData.get("placeId") || "");
  if (!groupId || !placeId) {
    return { error: "Lugar invalido.", success: false };
  }

  const result = await deletePlace({
    userId: user.id,
    groupId,
    placeId
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function createGroupPlanAction(
  _previousState: CreateGroupPlanActionState = CREATE_GROUP_PLAN_INITIAL_STATE,
  formData: FormData
): Promise<CreateGroupPlanActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const requestId = String(formData.get("requestId") || "");

  const parsedInput = createGroupPlanSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    plannedDate: String(formData.get("plannedDate") || ""),
    initialPlaceId: String(formData.get("initialPlaceId") || ""),
    initialPlacePlannedAt: String(formData.get("initialPlacePlannedAt") || ""),
    initialPlaceNote: String(formData.get("initialPlaceNote") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), planId: null, requestId, success: false };
  }

  const initialPlaceIds = formData
    .getAll("initialPlaceIds")
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (initialPlaceIds.some((placeId) => !UUID_PATTERN.test(placeId))) {
    return { error: "Lugar invalido.", planId: null, requestId, success: false };
  }

  const result = await createGroupPlan({
    userId: user.id,
    groupId: parsedInput.data.groupId,
    title: parsedInput.data.title,
    description: parsedInput.data.description,
    plannedDate: parsedInput.data.plannedDate,
    initialPlaceId: parsedInput.data.initialPlaceId,
    initialPlaceIds,
    initialPlacePlannedAt: parsedInput.data.initialPlacePlannedAt,
    initialPlaceNote: parsedInput.data.initialPlaceNote
  });

  if (result.error) {
    return { error: result.error, planId: null, requestId, success: false };
  }

  revalidatePath(`/groups/${parsedInput.data.groupId}`);
  if (result.planId) {
    revalidatePath(`/groups/${parsedInput.data.groupId}/plans/${result.planId}`);
  }
  return { error: null, planId: result.planId, requestId, success: true };
}

export async function addPlaceToGroupPlanAction(
  _previousState: AddPlaceToGroupPlanActionState = ADD_PLACE_TO_GROUP_PLAN_INITIAL_STATE,
  formData: FormData
): Promise<AddPlaceToGroupPlanActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const requestId = String(formData.get("requestId") || "");

  const parsedInput = addPlaceToGroupPlanSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    planId: String(formData.get("planId") || ""),
    placeId: String(formData.get("placeId") || ""),
    plannedAt: String(formData.get("plannedAt") || ""),
    note: String(formData.get("note") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), requestId, success: false };
  }

  const result = await addPlaceToGroupPlan({
    userId: user.id,
    groupId: parsedInput.data.groupId,
    planId: parsedInput.data.planId,
    placeId: parsedInput.data.placeId,
    plannedAt: parsedInput.data.plannedAt,
    note: parsedInput.data.note
  });

  if (result.error) {
    return { error: result.error, requestId, success: false };
  }

  revalidatePath(`/groups/${parsedInput.data.groupId}`);
  revalidatePath(`/groups/${parsedInput.data.groupId}/plans/${parsedInput.data.planId}`);
  revalidatePath(`/groups/${parsedInput.data.groupId}/plans/${parsedInput.data.planId}`);
  return { error: null, requestId, success: true };
}

export async function voteGroupPlanAction(
  _previousState: VoteGroupPlanActionState = VOTE_GROUP_PLAN_INITIAL_STATE,
  formData: FormData
): Promise<VoteGroupPlanActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = voteGroupPlanSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    planId: String(formData.get("planId") || ""),
    vote: String(formData.get("vote") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await voteGroupPlan({
    userId: user.id,
    groupId: parsedInput.data.groupId,
    planId: parsedInput.data.planId,
    vote: parsedInput.data.vote as GroupPlanVote
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${parsedInput.data.groupId}`);
  return { error: null, success: true };
}

export async function deleteGroupPlanAction(
  _previousState: DeleteGroupPlanActionState = DELETE_GROUP_PLAN_INITIAL_STATE,
  formData: FormData
): Promise<DeleteGroupPlanActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = deleteGroupPlanSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    planId: String(formData.get("planId") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await deleteGroupPlan({
    userId: user.id,
    groupId: parsedInput.data.groupId,
    planId: parsedInput.data.planId
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${parsedInput.data.groupId}`);
  return { error: null, success: true };
}

export async function updateGroupPlanDateAction(
  _previousState: UpdateGroupPlanDateActionState = UPDATE_GROUP_PLAN_DATE_INITIAL_STATE,
  formData: FormData
): Promise<UpdateGroupPlanDateActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const requestId = String(formData.get("requestId") || "");

  const parsedInput = updateGroupPlanDateSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    planId: String(formData.get("planId") || ""),
    plannedDate: String(formData.get("plannedDate") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), requestId, success: false };
  }

  const result = await updateGroupPlanDate({
    userId: user.id,
    groupId: parsedInput.data.groupId,
    planId: parsedInput.data.planId,
    plannedDate: parsedInput.data.plannedDate
  });

  if (result.error) {
    return { error: result.error, requestId, success: false };
  }

  revalidatePath(`/groups/${parsedInput.data.groupId}`);
  return { error: null, requestId, success: true };
}

export async function updateGroupPlanDetailsAction(
  _previousState: UpdateGroupPlanDetailsActionState = UPDATE_GROUP_PLAN_DETAILS_INITIAL_STATE,
  formData: FormData
): Promise<UpdateGroupPlanDetailsActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const requestId = String(formData.get("requestId") || "");

  const parsedInput = updateGroupPlanDetailsSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    planId: String(formData.get("planId") || ""),
    title: String(formData.get("title") || ""),
    plannedDate: String(formData.get("plannedDate") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), requestId, success: false };
  }

  const result = await updateGroupPlanDetails({
    userId: user.id,
    groupId: parsedInput.data.groupId,
    planId: parsedInput.data.planId,
    title: parsedInput.data.title,
    plannedDate: parsedInput.data.plannedDate
  });

  if (result.error) {
    return { error: result.error, requestId, success: false };
  }

  revalidatePath(`/groups/${parsedInput.data.groupId}`);
  return { error: null, requestId, success: true };
}

export async function removeGroupPlanPlaceAction(
  _previousState: RemoveGroupPlanPlaceActionState = REMOVE_GROUP_PLAN_PLACE_INITIAL_STATE,
  formData: FormData
): Promise<RemoveGroupPlanPlaceActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const requestId = String(formData.get("requestId") || "");
  const planPlaceId = String(formData.get("planPlaceId") || "");

  const parsedInput = removeGroupPlanPlaceSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    planId: String(formData.get("planId") || ""),
    planPlaceId
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), planPlaceId, requestId, success: false };
  }

  const result = await removePlaceFromGroupPlan({
    userId: user.id,
    groupId: parsedInput.data.groupId,
    planId: parsedInput.data.planId,
    planPlaceId: parsedInput.data.planPlaceId
  });

  if (result.error) {
    return { error: result.error, planPlaceId, requestId, success: false };
  }

  revalidatePath(`/groups/${parsedInput.data.groupId}`);
  revalidatePath(`/groups/${parsedInput.data.groupId}/plans/${parsedInput.data.planId}`);
  return { error: null, planPlaceId, requestId, success: true };
}

export async function updateGroupPlanPlaceTimeAction(
  _previousState: UpdateGroupPlanPlaceTimeActionState = UPDATE_GROUP_PLAN_PLACE_TIME_INITIAL_STATE,
  formData: FormData
): Promise<UpdateGroupPlanPlaceTimeActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const requestId = String(formData.get("requestId") || "");
  const planPlaceId = String(formData.get("planPlaceId") || "");

  const parsedInput = updateGroupPlanPlaceTimeSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    planId: String(formData.get("planId") || ""),
    planPlaceId,
    plannedAt: String(formData.get("plannedAt") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), planPlaceId, requestId, success: false };
  }

  const result = await updateGroupPlanPlaceTime({
    userId: user.id,
    groupId: parsedInput.data.groupId,
    planId: parsedInput.data.planId,
    planPlaceId: parsedInput.data.planPlaceId,
    plannedAt: parsedInput.data.plannedAt
  });

  if (result.error) {
    return { error: result.error, planPlaceId, requestId, success: false };
  }

  revalidatePath(`/groups/${parsedInput.data.groupId}`);
  revalidatePath(`/groups/${parsedInput.data.groupId}/plans/${parsedInput.data.planId}`);
  return { error: null, planPlaceId, requestId, success: true };
}

export async function updatePlaceNameAction(
  _previousState: UpdatePlaceNameActionState = UPDATE_PLACE_NAME_INITIAL_STATE,
  formData: FormData
): Promise<UpdatePlaceNameActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const groupId = String(formData.get("groupId") || "").trim();
  const placeId = String(formData.get("placeId") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!groupId || !placeId) {
    return { error: "Lugar invalido.", success: false };
  }

  const result = await updatePlaceName({
    userId: user.id,
    groupId,
    placeId,
    name
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${groupId}`);
  return { error: null, success: true };
}

export async function reviewJoinRequestAction(
  _previousState: ReviewJoinRequestActionState = REVIEW_JOIN_REQUEST_INITIAL_STATE,
  formData: FormData
): Promise<ReviewJoinRequestActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = reviewJoinRequestSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    requestId: String(formData.get("requestId") || ""),
    decision: String(formData.get("decision") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
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
    const approveResult = await supabase.rpc("approve_group_join_request", {
      p_group_id: groupId,
      p_request_id: requestId
    });
    if (approveResult.error) {
      return { error: approveResult.error.message, success: false };
    }
  } else {
    const updatePayload: GroupJoinRequestUpdate = {
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    };
    const updateResult = await supabase.from("group_join_requests").update(updatePayload).eq("id", requestId);

    if (updateResult.error) {
      return { error: updateResult.error.message, success: false };
    }
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { error: null, success: true };
}

export async function updateGroupSettingsAction(
  _previousState: UpdateGroupSettingsActionState = UPDATE_GROUP_SETTINGS_INITIAL_STATE,
  formData: FormData
): Promise<UpdateGroupSettingsActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = updateGroupSettingsSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    privacy: String(formData.get("privacy") || ""),
    joinPolicy: String(formData.get("joinPolicy") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const { groupId, privacy, joinPolicy } = parsedInput.data;
  const canChangePrivacy = await canChangeGroupPrivacy(user.id, groupId);

  if (!canChangePrivacy) {
    return { error: "Solo el administrador puede cambiar la privacidad del grupo.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const payload = {
    privacy,
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

export async function updateGroupDetailsAction(
  _previousState: UpdateGroupDetailsActionState = UPDATE_GROUP_DETAILS_INITIAL_STATE,
  formData: FormData
): Promise<UpdateGroupDetailsActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = updateGroupDetailsSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    coverImageUrl: String(formData.get("coverImageUrl") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const { groupId, name, description, coverImageUrl } = parsedInput.data;
  const canEditGroup = await canEditGroupDetails(user.id, groupId);
  if (!canEditGroup) {
    return { error: "No tienes permisos para editar este grupo.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const updateResult = await supabase
    .from("groups")
    .update({
      name,
      description,
      cover_image_url: coverImageUrl
    })
    .eq("id", groupId);

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
  const user = await requireAuthenticatedUser("/groups");

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
  const user = await requireAuthenticatedUser("/groups");

  const groupId = String(formData.get("groupId") || "").trim();
  if (!groupId) {
    return { error: "Grupo invalido.", success: false };
  }

  const owner = await isGroupOwner(user.id, groupId);
  if (!owner) {
    return { error: "Solo el propietario puede eliminar este grupo.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const deleteResult = await supabase.from("groups").delete().eq("id", groupId);

  if (deleteResult.error) {
    return { error: deleteResult.error.message, success: false };
  }

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  redirect("/groups");
}

export async function removeGroupMemberAction(
  _previousState: RemoveGroupMemberActionState = REMOVE_GROUP_MEMBER_INITIAL_STATE,
  formData: FormData
): Promise<RemoveGroupMemberActionState> {
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = removeGroupMemberSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    memberUserId: String(formData.get("memberUserId") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const { groupId, memberUserId } = parsedInput.data;
  const owner = await isGroupOwner(user.id, groupId);

  if (!owner) {
    return { error: "Solo el administrador puede expulsar miembros.", success: false };
  }

  if (memberUserId === user.id) {
    return { error: "No puedes expulsarte a ti mismo.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const kickResult = await supabase.rpc("kick_group_member", {
    p_group_id: groupId,
    p_member_user_id: memberUserId
  });

  if (kickResult.error) {
    return { error: kickResult.error.message, success: false };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}
