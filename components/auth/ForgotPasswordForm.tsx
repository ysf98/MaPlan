"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type ForgotPasswordActionState } from "@/app/forgot-password/actions";
import { ROUTES } from "@/utils/constants";

const initialState: ForgotPasswordActionState = {
  error: null,
  success: false
};

export function ForgotPasswordForm() {
  const [state, formAction, isLoading] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold text-zinc-600" htmlFor="forgot-password-email">
          Correo electrónico
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
            disabled={isLoading || state.success}
            id="forgot-password-email"
            name="email"
            placeholder="tu@correo.com"
            required
            type="email"
          />
        </div>
      </div>

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Si existe una cuenta con ese correo, te hemos enviado un enlace para cambiar la contraseña.
        </p>
      ) : null}

      <button
        className="mt-1 flex h-14 w-full items-center justify-center rounded-xl bg-[rgb(var(--vc-coral))] text-lg font-bold text-white shadow-[0_10px_24px_rgba(255,90,95,0.35)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
        disabled={isLoading || state.success}
        type="submit"
      >
        {isLoading ? "Enviando..." : "Enviar enlace"}
      </button>

      <p className="pt-2 text-center text-sm text-zinc-600">
        ¿Ya la recuerdas?{" "}
        <Link className="font-bold text-[rgb(var(--vc-coral))] hover:underline" href={ROUTES.login}>
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
