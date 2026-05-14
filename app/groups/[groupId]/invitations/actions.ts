"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { inviteFriendToGroup } from "@/lib/groupInvitations";
import { inviteFriendToGroupSchema } from "@/lib/validation/schemas";

export type InviteFriendActionState = {
  error: string | null;
  success: boolean;
};

const INITIAL_STATE: InviteFriendActionState = {
  error: null,
  success: false
};

export async function inviteFriendToGroupAction(
  _previousState: InviteFriendActionState = INITIAL_STATE,
  formData: FormData
): Promise<InviteFriendActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/groups");
  }

  const parsed = inviteFriendToGroupSchema.safeParse({
    groupId: String(formData.get("groupId") || ""),
    friendUserId: String(formData.get("friendUserId") || "")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos.", success: false };
  }

  const result = await inviteFriendToGroup(user.id, parsed.data.groupId, parsed.data.friendUserId);
  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath(`/groups/${parsed.data.groupId}`);
  revalidatePath("/invitations");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

