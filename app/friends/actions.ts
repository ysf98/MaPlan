"use server";

import { revalidatePath } from "next/cache";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import { removeFriend, respondFriendRequest, sendFriendRequest } from "@/lib/friends";
import { removeFriendSchema, respondFriendRequestSchema, sendFriendRequestSchema } from "@/lib/validation/schemas";

export type FriendActionState = {
  error: string | null;
  success: boolean;
};

const INITIAL_STATE: FriendActionState = {
  error: null,
  success: false
};

export async function sendFriendRequestAction(
  _previousState: FriendActionState = INITIAL_STATE,
  formData: FormData
): Promise<FriendActionState> {
  const user = await requireAuthenticatedUser("/friends");

  const parsed = sendFriendRequestSchema.safeParse({
    receiverId: String(formData.get("receiverId") || "")
  });

  if (!parsed.success) {
    return { error: getValidationErrorMessage(parsed.error), success: false };
  }

  const result = await sendFriendRequest(user.id, parsed.data.receiverId);
  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath("/friends");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function respondFriendRequestAction(
  _previousState: FriendActionState = INITIAL_STATE,
  formData: FormData
): Promise<FriendActionState> {
  const user = await requireAuthenticatedUser("/friends");

  const parsed = respondFriendRequestSchema.safeParse({
    requestId: String(formData.get("requestId") || ""),
    decision: String(formData.get("decision") || "")
  });

  if (!parsed.success) {
    return { error: getValidationErrorMessage(parsed.error), success: false };
  }

  const result = await respondFriendRequest(user.id, parsed.data.requestId, parsed.data.decision);
  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath("/friends");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function removeFriendAction(
  _previousState: FriendActionState = INITIAL_STATE,
  formData: FormData
): Promise<FriendActionState> {
  const user = await requireAuthenticatedUser("/friends");

  const parsed = removeFriendSchema.safeParse({
    friendUserId: String(formData.get("friendUserId") || "")
  });

  if (!parsed.success) {
    return { error: getValidationErrorMessage(parsed.error), success: false };
  }

  const result = await removeFriend(user.id, parsed.data.friendUserId);
  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath("/friends");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}
