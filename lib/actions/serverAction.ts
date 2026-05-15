import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function requireAuthenticatedUser(loginNextPath: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${loginNextPath}`);
  }
  return user;
}

export function getValidationErrorMessage(error: ZodError, fallback = "Datos invalidos.") {
  return error.issues[0]?.message ?? fallback;
}
