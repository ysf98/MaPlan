"use server";

import { revalidatePath } from "next/cache";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import {
  closeGroupPoll,
  convertGroupPollToPlan,
  createGroupPoll,
  deleteGroupPoll,
  respondGroupAvailability,
  voteGroupPoll
} from "@/lib/groupPolls";
import {
  closeGroupPollSchema,
  convertGroupPollToPlanSchema,
  createGroupPollSchema,
  deleteGroupPollSchema,
  respondGroupAvailabilitySchema,
  voteGroupPollSchema
} from "@/lib/validation/schemas";

export type GroupDecisionActionState = {
  error: string | null;
  planId?: string | null;
  pollId?: string | null;
  success: boolean;
};

const initialState: GroupDecisionActionState = {
  error: null,
  success: false
};

function revalidateDecisionRoutes(groupId: string, planId?: string | null) {
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/decisions`);
  revalidatePath(`/groups/${groupId}/chat`);
  if (planId) {
    revalidatePath(`/groups/${groupId}/plans/${planId}`);
  }
}

export async function createGroupPollAction(
  _previousState: GroupDecisionActionState = initialState,
  formData: FormData
): Promise<GroupDecisionActionState> {
  const user = await requireAuthenticatedUser("/groups");
  let options: unknown = [];
  try {
    options = JSON.parse(String(formData.get("options") || "[]"));
  } catch {
    return { error: "Las opciones de la encuesta no son válidas.", success: false };
  }

  const parsedInput = createGroupPollSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    title: String(formData.get("title") || ""),
    kind: String(formData.get("kind") || ""),
    pollType: String(formData.get("pollType") || ""),
    planId: String(formData.get("planId") || ""),
    closesAt: String(formData.get("closesAt") || ""),
    options
  });
  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await createGroupPoll({ userId: user.id, ...parsedInput.data });
  if (result.error) {
    return { error: result.error, pollId: null, success: false };
  }

  revalidateDecisionRoutes(parsedInput.data.groupId);
  return { error: null, pollId: result.pollId, success: true };
}

export async function voteGroupPollAction(
  _previousState: GroupDecisionActionState = initialState,
  formData: FormData
): Promise<GroupDecisionActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const parsedInput = voteGroupPollSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    pollId: String(formData.get("pollId") || ""),
    optionId: String(formData.get("optionId") || "")
  });
  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await voteGroupPoll({ userId: user.id, ...parsedInput.data });
  if (result.error) {
    return { error: result.error, success: false };
  }
  revalidateDecisionRoutes(parsedInput.data.groupId);
  return { error: null, success: true };
}

export async function respondGroupAvailabilityAction(
  _previousState: GroupDecisionActionState = initialState,
  formData: FormData
): Promise<GroupDecisionActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const parsedInput = respondGroupAvailabilitySchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    pollId: String(formData.get("pollId") || ""),
    optionId: String(formData.get("optionId") || ""),
    response: String(formData.get("response") || "")
  });
  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await respondGroupAvailability({ userId: user.id, ...parsedInput.data });
  if (result.error) {
    return { error: result.error, success: false };
  }
  revalidateDecisionRoutes(parsedInput.data.groupId);
  return { error: null, success: true };
}

export async function closeGroupPollAction(
  _previousState: GroupDecisionActionState = initialState,
  formData: FormData
): Promise<GroupDecisionActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const parsedInput = closeGroupPollSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    pollId: String(formData.get("pollId") || "")
  });
  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await closeGroupPoll({ userId: user.id, ...parsedInput.data });
  if (result.error) {
    return { error: result.error, success: false };
  }
  revalidateDecisionRoutes(parsedInput.data.groupId);
  return { error: null, success: true };
}

export async function deleteGroupPollAction(
  _previousState: GroupDecisionActionState = initialState,
  formData: FormData
): Promise<GroupDecisionActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const parsedInput = deleteGroupPollSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    pollId: String(formData.get("pollId") || "")
  });
  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await deleteGroupPoll({ userId: user.id, ...parsedInput.data });
  if (result.error) {
    return { error: result.error, success: false };
  }
  revalidateDecisionRoutes(parsedInput.data.groupId);
  return { error: null, success: true };
}

export async function convertGroupPollToPlanAction(
  _previousState: GroupDecisionActionState = initialState,
  formData: FormData
): Promise<GroupDecisionActionState> {
  const user = await requireAuthenticatedUser("/groups");
  const parsedInput = convertGroupPollToPlanSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    pollId: String(formData.get("pollId") || ""),
    title: String(formData.get("title") || "")
  });
  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await convertGroupPollToPlan({ userId: user.id, ...parsedInput.data });
  if (result.error) {
    return { error: result.error, planId: result.planId, success: false };
  }
  revalidateDecisionRoutes(parsedInput.data.groupId, result.planId);
  return { error: null, planId: result.planId, success: true };
}
