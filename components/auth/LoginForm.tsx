"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ROUTES } from "@/utils/constants";

type LoginFormProps = {
  nextPath?: string;
};

function SpinnerIcon() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

export function LoginForm({ nextPath = ROUTES.dashboard }: LoginFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold text-zinc-600" htmlFor="login-email">
          Correo electronico
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16v12H4z" />
              <path d="m4 8 8 6 8-6" />
            </svg>
          </span>
          <input
            className="h-14 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-950 placeholder:text-zinc-400 shadow-[0_10px_24px_rgba(181,35,48,0.08)] focus:border-[rgb(var(--vc-coral))] focus:outline-none"
            disabled={isLoading}
            id="login-email"
            name="email"
            placeholder="tu@correo.com"
            required
            type="email"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold text-zinc-600" htmlFor="login-password">
          Contrasena
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="10" rx="2" width="14" x="5" y="11" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" />
            </svg>
          </span>
          <input
            className="h-14 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-12 text-sm text-zinc-950 placeholder:text-zinc-400 shadow-[0_10px_24px_rgba(181,35,48,0.08)] focus:border-[rgb(var(--vc-coral))] focus:outline-none"
            disabled={isLoading}
            id="login-password"
            name="password"
            placeholder="••••••••"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            disabled={isLoading}
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <a className="text-xs font-semibold text-[rgb(var(--vc-coral))] hover:underline" href="#">
          Olvide mi contrasena
        </a>
      </div>

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      <button
        className="mt-1 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--vc-coral))] text-lg font-bold text-white shadow-[0_10px_24px_rgba(255,90,95,0.35)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? <SpinnerIcon /> : null}
        {isLoading ? "Entrando..." : "Entrar"}
        {!isLoading ? <span aria-hidden="true">→</span> : null}
      </button>

      <OAuthButtons nextPath={nextPath} />

      <p className="pt-8 text-center text-sm text-zinc-600">
        No tienes cuenta?{" "}
        <Link className="font-bold text-[rgb(var(--vc-coral))] hover:underline" href={ROUTES.register}>
          Registrate
        </Link>
      </p>
    </form>
  );
}
