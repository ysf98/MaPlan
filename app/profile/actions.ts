"use server";

import { revalidatePath } from "next/cache";
import { getValidationErrorMessage, requireAuthenticatedUser } from "@/lib/actions/serverAction";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validation/schemas";
import { ROUTES } from "@/utils/constants";

export type UpdateProfileActionState = {
  error: string | null;
  success: boolean;
};

export async function updateProfileAction(
  _previousState: UpdateProfileActionState,
  formData: FormData
): Promise<UpdateProfileActionState> {
  const user = await requireAuthenticatedUser(ROUTES.profile);
  const parsed = updateProfileSchema.safeParse({
    username: String(formData.get("username") || ""),
    avatarUrl: String(formData.get("avatarUrl") || "")
  });

  if (!parsed.success) {
    return { error: getValidationErrorMessage(parsed.error), success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      avatar_url: parsed.data.avatarUrl,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.dashboard);
  return { error: null, success: true };
}
