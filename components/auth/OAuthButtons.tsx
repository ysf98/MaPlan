"use client";

import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { getSafeInternalPath } from "@/lib/navigation/safeRedirect";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ROUTES } from "@/utils/constants";

type OAuthButtonsProps = {
  nextPath?: string;
};

type OAuthProvider = {
  id: Extract<Provider, "google">;
  label: string;
};

const providers: OAuthProvider[] = [
  {
    id: "google",
    label: "Continuar con Google"
  }
];

export function OAuthButtons({ nextPath = ROUTES.dashboard }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider["id"] | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleOAuthSignIn(provider: OAuthProvider["id"]) {
    setErrorMessage("");
    setLoadingProvider(provider);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", getSafeInternalPath(nextPath, ROUTES.dashboard));

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString()
      }
    });

    if (error) {
      setLoadingProvider(null);
      setErrorMessage(error.message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs font-semibold text-zinc-500">o continua con</span>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      <div className="mx-auto w-full max-w-[17rem]">
        {providers.map((provider) => (
          <button
            className="relative flex h-10 w-full items-center justify-center rounded-full bg-[#f1f1f1] px-4 text-sm font-bold text-zinc-800 shadow-sm transition hover:bg-[#e9e9e9] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loadingProvider !== null}
            key={provider.id}
            onClick={() => void handleOAuthSignIn(provider.id)}
            type="button"
          >
            <span className="absolute left-4 inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.509h3.232c1.891-1.741 2.981-4.305 2.981-7.35Z"
                  fill="#4285F4"
                />
                <path
                  d="M12 22c2.7 0 4.964-.895 6.619-2.423l-3.232-2.509c-.895.6-2.041.955-3.387.955-2.605 0-4.81-1.759-5.596-4.123H3.064v2.591A9.996 9.996 0 0 0 12 22Z"
                  fill="#34A853"
                />
                <path
                  d="M6.404 13.9A6.01 6.01 0 0 1 6.091 12c0-.659.113-1.3.313-1.9V7.509H3.064A9.996 9.996 0 0 0 2 12c0 1.614.386 3.141 1.064 4.491l3.34-2.591Z"
                  fill="#FBBC04"
                />
                <path
                  d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.891-2.891C16.959 2.946 14.695 2 12 2A9.996 9.996 0 0 0 3.064 7.509l3.34 2.591C7.19 7.736 9.395 5.977 12 5.977Z"
                  fill="#EA4335"
                />
              </svg>
            </span>
            {loadingProvider === provider.id ? "Conectando..." : provider.label}
          </button>
        ))}
      </div>

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
    </div>
  );
}
