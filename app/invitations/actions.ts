"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { respondGroupInvitation } from "@/lib/groupInvitations";
import { respondGroupInvitationSchema } from "@/lib/validation/schemas";

export type RespondGroupInvitationActionState = {
  error: string | null;
  success: boolean;
};

const INITIAL_STATE: RespondGroupInvitationActionState = {
  error: null,
  success: false
};

export async function respondGroupInvitationAction(
  _previousState: RespondGroupInvitationActionState = INITIAL_STATE,
  formData: FormData
): Promise<RespondGroupInvitationActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/invitations");
  }

  const parsed = respondGroupInvitationSchema.safeParse({
    invitationId: String(formData.get("invitationId") || ""),
    decision: String(formData.get("decision") || "")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos.", success: false };
  }

  const result = await respondGroupInvitation(user.id, parsed.data.invitationId, parsed.data.decision);
  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath("/invitations");
  revalidatePath("/dashboard");
  revalidatePath("/groups");
  return { error: null, success: true };
}

