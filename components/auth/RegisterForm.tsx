"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { getPasswordRequirementChecks, PASSWORD_REQUIREMENTS, validatePassword } from "@/lib/auth/passwordPolicy";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ROUTES } from "@/utils/constants";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") || "").trim();
    const username = String(formData.get("username") || "");
    const email = String(formData.get("email") || "");
    const formPassword = String(formData.get("password") || "");
    const normalizedUsername = username.trim().toLowerCase();

    if (!fullName) {
      setIsLoading(false);
      setErrorMessage("El nombre completo es obligatorio.");
      return;
    }
    if (!/^[a-z0-9_.-]{3,30}$/i.test(normalizedUsername)) {
      setIsLoading(false);
      setErrorMessage("El @usuario debe tener 3-30 caracteres y solo letras, numeros, punto, guion o guion bajo.");
      return;
    }

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
        data: { username: normalizedUsername, full_name: fullName }
      }
    });

    if (error) {
      setIsLoading(false);
      setErrorMessage(error.message);
      return;
    }

    setIsLoading(false);

    if (data.session) {
      router.replace(ROUTES.dashboard);
      router.refresh();
      return;
    }

    setSuccessMessage("Cuenta creada. Revisa tu email para confirmar tu registro.");
  }

  const checks = getPasswordRequirementChecks(password);
  const requirementStatus = [checks.minLength, checks.hasUppercase, checks.hasLowercase, checks.hasNumber, checks.hasSymbol];

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold text-zinc-600" htmlFor="register-full-name">
          Nombre completo
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            className="h-14 w-full rounded-xl border-2 border-transparent bg-zinc-100 pl-12 pr-4 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[rgb(var(--vc-coral))] focus:bg-white focus:outline-none"
            id="register-full-name"
            name="fullName"
            placeholder="Nombre"
            required
            type="text"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold text-zinc-600" htmlFor="register-username">
          Nombre de usuario
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-zinc-400">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-[15px] font-bold leading-none">
              @
            </span>
          </span>
          <input
            className="h-14 w-full rounded-xl border-2 border-transparent bg-zinc-100 pl-12 pr-4 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[rgb(var(--vc-coral))] focus:bg-white focus:outline-none"
            id="register-username"
            name="username"
            pattern="[A-Za-z0-9_.-]+"
            placeholder="Usuario"
            required
            type="text"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold text-zinc-600" htmlFor="register-email">
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
            className="h-14 w-full rounded-xl border-2 border-transparent bg-zinc-100 pl-12 pr-4 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[rgb(var(--vc-coral))] focus:bg-white focus:outline-none"
            id="register-email"
            name="email"
            placeholder="tu@email.com"
            required
            type="email"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold text-zinc-600" htmlFor="register-password">
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
            className="h-14 w-full rounded-xl border-2 border-transparent bg-zinc-100 pl-12 pr-12 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[rgb(var(--vc-coral))] focus:bg-white focus:outline-none"
            id="register-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
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

      {password.length > 0 ? (
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
      ) : null}

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      <button
        className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--vc-coral))] text-lg font-bold text-white shadow-[0_10px_24px_rgba(255,90,95,0.35)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Creando..." : "Registrarse"}
        <span aria-hidden="true">→</span>
      </button>

      <OAuthButtons />

      <p className="pt-1 text-center text-sm text-zinc-600">
        Ya tienes cuenta?{" "}
        <Link className="font-bold text-[rgb(var(--vc-coral))] hover:underline" href={ROUTES.login}>
          Inicia sesion
        </Link>
      </p>
    </form>
  );
}
