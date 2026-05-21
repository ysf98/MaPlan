"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getPasswordRequirementChecks, PASSWORD_REQUIREMENTS, validatePassword } from "@/lib/auth/passwordPolicy";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "");
    const email = String(formData.get("email") || "");
    const formPassword = String(formData.get("password") || "");
    const passwordError = validatePassword(formPassword);
    if (passwordError) {
      setIsLoading(false);
      setErrorMessage(passwordError);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: formPassword,
      options: {
        data: { username }
      }
    });

    if (error) {
      setIsLoading(false);
      setErrorMessage(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        username: username || null
      });
    }

    setIsLoading(false);

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setSuccessMessage("Cuenta creada. Revisa tu email para confirmar tu registro.");
  }

  const checks = getPasswordRequirementChecks(password);
  const requirementStatus = [
    checks.minLength,
    checks.hasUppercase,
    checks.hasLowercase,
    checks.hasNumber,
    checks.hasSymbol
  ];

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <Input label="Nombre" name="username" placeholder="Tu nombre" required />
      <Input label="Email" name="email" type="email" placeholder="tu@email.com" required />
      <Input
        label="Contrasena"
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="********"
        required
        type="password"
        value={password}
      />
      <ul className="space-y-1 text-xs text-zinc-600">
        {PASSWORD_REQUIREMENTS.map((requirement, index) => {
          const isMet = requirementStatus[index] ?? false;
          return (
            <li className={isMet ? "text-emerald-700" : "text-zinc-500"} key={requirement}>
              {isMet ? "Cumple" : "Pendiente"}: {requirement}
            </li>
          );
        })}
      </ul>
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
      <Button fullWidth disabled={isLoading} type="submit">
        {isLoading ? "Creando..." : "Registrarme"}
      </Button>
    </form>
  );
}
