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
    fullName: String(formData.get("fullName") || ""),
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
      full_name: parsed.data.fullName,
      username: parsed.data.username.toLowerCase(),
      avatar_url: parsed.data.avatarUrl
    })
    .eq("id", user.id);

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "Ese @usuario ya esta en uso. Elige otro distinto.", success: false };
    }
    return { error: error.message, success: false };
  }

  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.dashboard);
  return { error: null, success: true };
}
