"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
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

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <Input label="Nombre" name="username" placeholder="Tu nombre" required />
      <Input label="Email" name="email" type="email" placeholder="tu@email.com" required />
      <Input label="Contrasena" name="password" type="password" placeholder="********" required />
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
      <Button fullWidth disabled={isLoading} type="submit">
        {isLoading ? "Creando..." : "Registrarme"}
      </Button>
    </form>
  );
}
