"use server";

import { validatePassword } from "@/lib/auth/passwordPolicy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ResetPasswordActionState = {
  error: string | null;
  success: boolean;
};

export async function resetPasswordAction(
  _previousState: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> {
  void _previousState;
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError, success: false };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      error: "No hemos podido actualizar tu contraseña. Abre de nuevo el enlace de recuperación.",
      success: false
    };
  }

  await supabase.auth.signOut();

  return { error: null, success: true };
}
