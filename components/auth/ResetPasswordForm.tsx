"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { resetPasswordAction, type ResetPasswordActionState } from "@/app/reset-password/actions";
import { getPasswordRequirementChecks, PASSWORD_REQUIREMENTS } from "@/lib/auth/passwordPolicy";
import { ROUTES } from "@/utils/constants";

const initialState: ResetPasswordActionState = {
  error: null,
  success: false
};

export function ResetPasswordForm() {
  const [state, formAction, isLoading] = useActionState(resetPasswordAction, initialState);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const checks = getPasswordRequirementChecks(password);
  const requirementStatus = [checks.minLength, checks.hasUppercase, checks.hasLowercase, checks.hasNumber, checks.hasSymbol];

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold text-zinc-600" htmlFor="reset-password">
          Nueva contraseña
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
            disabled={isLoading || state.success}
            id="reset-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            disabled={isLoading || state.success}
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

      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold text-zinc-600" htmlFor="reset-password-confirm">
          Confirmar contraseña
        </label>
        <input
          className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 placeholder:text-zinc-400 shadow-[0_10px_24px_rgba(181,35,48,0.08)] focus:border-[rgb(var(--vc-coral))] focus:outline-none"
          disabled={isLoading || state.success}
          id="reset-password-confirm"
          name="confirmPassword"
          placeholder="Repite tu contraseña"
          required
          type={showPassword ? "text" : "password"}
        />
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

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
      ) : null}

      <button
        className="mt-1 flex h-14 w-full items-center justify-center rounded-xl bg-[rgb(var(--vc-coral))] text-lg font-bold text-white shadow-[0_10px_24px_rgba(255,90,95,0.35)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
        disabled={isLoading || state.success}
        type="submit"
      >
        {isLoading ? "Guardando..." : "Cambiar contraseña"}
      </button>

      {state.success ? (
        <Link
          className="flex h-12 w-full items-center justify-center rounded-xl border border-[rgb(var(--vc-coral))] bg-white/70 text-sm font-bold text-[rgb(var(--vc-coral))] hover:bg-white"
          href={ROUTES.login}
        >
          Ir a login
        </Link>
      ) : null}
    </form>
  );
}
