"use server";

import { revalidatePath } from "next/cache";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import { actionFailure, actionSuccess, INITIAL_ACTION_STATE, type ActionState } from "@/lib/actions/actionState";
import { removeFriend, respondFriendRequest, sendFriendRequest } from "@/lib/friends";
import { removeFriendSchema, respondFriendRequestSchema, sendFriendRequestSchema } from "@/lib/validation/schemas";

export type FriendActionState = ActionState;

export async function sendFriendRequestAction(
  _previousState: FriendActionState = INITIAL_ACTION_STATE,
  formData: FormData
): Promise<FriendActionState> {
  const user = await requireAuthenticatedUser("/friends");

  const parsed = sendFriendRequestSchema.safeParse({
    receiverId: String(formData.get("receiverId") || "")
  });

  if (!parsed.success) {
    return actionFailure(getValidationErrorMessage(parsed.error));
  }

  const result = await sendFriendRequest(user.id, parsed.data.receiverId);
  if (result.error) {
    return actionFailure(result.error);
  }

  revalidatePath("/friends");
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function respondFriendRequestAction(
  _previousState: FriendActionState = INITIAL_ACTION_STATE,
  formData: FormData
): Promise<FriendActionState> {
  const user = await requireAuthenticatedUser("/friends");

  const parsed = respondFriendRequestSchema.safeParse({
    requestId: String(formData.get("requestId") || ""),
    decision: String(formData.get("decision") || "")
  });

  if (!parsed.success) {
    return actionFailure(getValidationErrorMessage(parsed.error));
  }

  const result = await respondFriendRequest(user.id, parsed.data.requestId, parsed.data.decision);
  if (result.error) {
    return actionFailure(result.error);
  }

  revalidatePath("/friends");
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function removeFriendAction(
  _previousState: FriendActionState = INITIAL_ACTION_STATE,
  formData: FormData
): Promise<FriendActionState> {
  const user = await requireAuthenticatedUser("/friends");

  const parsed = removeFriendSchema.safeParse({
    friendUserId: String(formData.get("friendUserId") || "")
  });

  if (!parsed.success) {
    return actionFailure(getValidationErrorMessage(parsed.error));
  }

  const result = await removeFriend(user.id, parsed.data.friendUserId);
  if (result.error) {
    return actionFailure(result.error);
  }

  revalidatePath("/friends");
  revalidatePath("/dashboard");
  return actionSuccess();
}
