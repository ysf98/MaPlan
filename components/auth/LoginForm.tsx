"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <Input label="Email" name="email" type="email" placeholder="tu@email.com" required />
      <Input label="Contrasena" name="password" type="password" placeholder="********" required />
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
      <Button fullWidth disabled={isLoading} type="submit">
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
