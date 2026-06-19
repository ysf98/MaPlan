"use server";

import { revalidatePath } from "next/cache";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import { respondGroupInvitation } from "@/lib/groupInvitations";
import { respondGroupInvitationSchema } from "@/lib/validation/schemas";

export type RespondGroupInvitationActionState = {
  decision: "accepted" | "rejected" | null;
  error: string | null;
  groupId: string | null;
  success: boolean;
};

const INITIAL_STATE: RespondGroupInvitationActionState = {
  decision: null,
  error: null,
  groupId: null,
  success: false
};

export async function respondGroupInvitationAction(
  _previousState: RespondGroupInvitationActionState = INITIAL_STATE,
  formData: FormData
): Promise<RespondGroupInvitationActionState> {
  const user = await requireAuthenticatedUser("/invitations");

  const parsed = respondGroupInvitationSchema.safeParse({
    invitationId: String(formData.get("invitationId") || ""),
    decision: String(formData.get("decision") || "")
  });

  if (!parsed.success) {
    return { decision: null, error: getValidationErrorMessage(parsed.error), groupId: null, success: false };
  }

  const result = await respondGroupInvitation(user.id, parsed.data.invitationId, parsed.data.decision);
  if (result.error) {
    return { decision: null, error: result.error, groupId: null, success: false };
  }

  revalidatePath("/invitations");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/groups");
  return {
    decision: parsed.data.decision,
    error: null,
    groupId: result.groupId,
    success: true
  };
}
