"use server";

import { redirect } from "next/navigation";
import { getSafeInternalPath } from "@/lib/navigation/safeRedirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/utils/constants";

export type LoginActionState = {
  error: string | null;
};

export async function loginAction(_previousState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  void _previousState;
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const nextPath = getSafeInternalPath(String(formData.get("nextPath") || ""), ROUTES.dashboard);

  if (!email || !password) {
    return { error: "Introduce tu correo y contraseña." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(nextPath);
}
