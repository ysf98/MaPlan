import Link from "next/link";
import { MaplanMinimalIcon } from "@/components/branding/MaplanMinimalIcon";
import { APP_NAME, ROUTES } from "@/utils/constants";

const HERO_IMAGE = "/landing-hero.png";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen min-h-[100svh] w-full overflow-hidden bg-[#fff8f7] text-zinc-900">
      <main className="relative flex min-h-screen min-h-[100svh] w-full flex-col items-center justify-between pt-2">
        <div className="absolute inset-0 z-0">
          <img alt="Amigos explorando la ciudad" className="h-full w-full object-cover object-center opacity-75" src={HERO_IMAGE} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#fff8f700] via-[#fff8f780] to-[#fff8f7f0]" />
        </div>

        <section className="relative z-10 mt-auto w-full max-w-md px-6 pb-14 text-center sm:pb-12">
          <div className="mb-6 space-y-3">
            <div className="mx-auto">
              <MaplanMinimalIcon size="lg" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">{APP_NAME}</h1>
            <p className="mx-auto max-w-xs text-2xl font-bold leading-8 text-zinc-800">Descubre y comparte tus lugares favoritos con amigos</p>
          </div>

          <div className="space-y-3">
            <Link
              className="flex h-14 w-full items-center justify-center rounded-full bg-[rgb(var(--vc-coral))] text-xl font-bold text-white shadow-[0_10px_24px_rgba(255,90,95,0.35)] transition hover:bg-[rgb(var(--vc-coral-strong))]"
              href={ROUTES.register}
            >
              Crear cuenta
            </Link>
            <Link
              className="flex h-14 w-full items-center justify-center rounded-full border-2 border-[rgb(var(--vc-coral))] bg-white/65 text-xl font-bold text-[rgb(var(--vc-coral))] transition hover:bg-white/90"
              href={ROUTES.login}
            >
              Iniciar sesión
            </Link>
          </div>

        </section>

        <footer className="vc-glass relative z-30 mt-4 w-full shrink-0 border-t border-[rgb(var(--border)/0.6)]">
          <div className="mx-auto w-full max-w-3xl px-[20px] pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 text-center">
            <p className="text-xs font-semibold text-zinc-500">
              Al continuar, aceptas nuestros{" "}
              <Link className="font-bold text-[rgb(var(--vc-coral))] underline underline-offset-2" href={ROUTES.terms}>
                Términos
              </Link>{" "}
              y{" "}
              <Link className="font-bold text-[rgb(var(--vc-coral))] underline underline-offset-2" href={ROUTES.privacy}>
                Política de privacidad
              </Link>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
