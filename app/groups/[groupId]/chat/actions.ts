"use server";

import { revalidatePath } from "next/cache";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import { createGroupChatMessage, deleteGroupChatMessage } from "@/lib/groupChat";
import { createGroupChatMessageSchema, deleteGroupChatMessageSchema } from "@/lib/validation/schemas";
import type { GroupChatMessageKind } from "@/types/supabase";

export type CreateGroupChatMessageActionState = {
  error: string | null;
  success: boolean;
};

export type DeleteGroupChatMessageActionState = {
  error: string | null;
  success: boolean;
};

const CREATE_GROUP_CHAT_MESSAGE_INITIAL_STATE: CreateGroupChatMessageActionState = {
  error: null,
  success: false
};

const DELETE_GROUP_CHAT_MESSAGE_INITIAL_STATE: DeleteGroupChatMessageActionState = {
  error: null,
  success: false
};

export async function createGroupChatMessageAction(
  _previousState: CreateGroupChatMessageActionState = CREATE_GROUP_CHAT_MESSAGE_INITIAL_STATE,
  formData: FormData
): Promise<CreateGroupChatMessageActionState> {
  void _previousState;
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = createGroupChatMessageSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    content: String(formData.get("content") || ""),
    kind: String(formData.get("kind") || ""),
    planId: String(formData.get("planId") || ""),
    placeId: String(formData.get("placeId") || ""),
    planPlaceId: String(formData.get("planPlaceId") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await createGroupChatMessage({
    userId: user.id,
    groupId: parsedInput.data.groupId,
    content: parsedInput.data.content,
    kind: parsedInput.data.kind as GroupChatMessageKind,
    planId: parsedInput.data.planId,
    placeId: parsedInput.data.placeId,
    planPlaceId: parsedInput.data.planPlaceId
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${parsedInput.data.groupId}`);
  revalidatePath(`/groups/${parsedInput.data.groupId}/chat`);
  return { error: null, success: true };
}

export async function deleteGroupChatMessageAction(
  _previousState: DeleteGroupChatMessageActionState = DELETE_GROUP_CHAT_MESSAGE_INITIAL_STATE,
  formData: FormData
): Promise<DeleteGroupChatMessageActionState> {
  void _previousState;
  const user = await requireAuthenticatedUser("/groups");

  const parsedInput = deleteGroupChatMessageSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    messageId: String(formData.get("messageId") || "")
  });

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await deleteGroupChatMessage({
    userId: user.id,
    groupId: parsedInput.data.groupId,
    messageId: parsedInput.data.messageId
  });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${parsedInput.data.groupId}`);
  revalidatePath(`/groups/${parsedInput.data.groupId}/chat`);
  return { error: null, success: true };
}
