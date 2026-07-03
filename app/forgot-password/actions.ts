"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/utils/constants";

export type ForgotPasswordActionState = {
  error: string | null;
  success: boolean;
};

function getResetRedirectUrl(origin: string): string {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", ROUTES.resetPassword);
  return callbackUrl.toString();
}

export async function forgotPasswordAction(
  _previousState: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  void _previousState;
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    return { error: "Introduce tu correo electrónico.", success: false };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (!origin) {
    return { error: "No hemos podido preparar el enlace de recuperación.", success: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getResetRedirectUrl(origin)
  });

  if (error) {
    return { error: "No hemos podido enviar el enlace. Inténtalo de nuevo.", success: false };
  }

  return { error: null, success: true };
}
