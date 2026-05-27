import Link from "next/link";
import { MaplanMinimalIcon } from "@/components/branding/MaplanMinimalIcon";
import { APP_NAME, ROUTES } from "@/utils/constants";

const HERO_IMAGE = "/landing-hero.png";

const avatars = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDtrCtFLmIC_pOz4ixy6FLAY_S_Alqy6r6NROmmozZ0w4JoT7h2C4XN__tfuH9K2W4LjYKd2ou7RjU7qX9kGIKVflqtUyBifhgiWt6mTYl_Fa-U6EdozzEbO2nyDoB883p9kpVGUeJ8PTrZ1olb-xnpZNCZU2kQ78GMcljcYH6JKCU5uQfU5XG1Aerfv1vd2EyiDWEXDyo6VWU-LcrJatrpH8JWmyV_UdAyXhv3JGfBrr9p4HfdUhVQyJJ1g9hfBVsPo8rMjztvNwo",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBCiRiHWQCFwnckIaJlgWif3L2_n7_8xmAaRYcJuCFRVGfmOFKPOm3rm2-_SPrpkBhaQWLxqh8V_I94On4ZMDavG7JY8Oj62fO5aQ-GjxlWY5VpUH8BtyMClC8WMhbKFad34WffQ3cq7hnXK1NA3Sk17wK9kOP04yP4OZ2Y42zcSDKk36BQ_MHIwGO022YotTJCDrj1Dv74YDZQTCOewt5f9jKJkQJmdVLUgFq8mIC8_CAOsQ-G6EE1QApc4PqzXyTSsIxL60whlxc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAz80EaqKoNxfH8bnXeS4lZaT8ZL_5fYjsz_rn7nBipVow8hs9WjUUVan-h1T7GseyxE7n7G2C1qOtyk9jvwlo92emrX15Y7oRst8nxTujDWUVd5F7MNqeEWVNXcn3McVIlWivtAd-69NpuQwVO7a1mckSlO-jeuIw46wdC4AUWQgJ69tYGJey4FyOGuMNZjR6C1RKn7DsnbM6l77FuIq1QE7Z0X193HyuKMqtlb7r3t3YDr2qUGD1Aod6pEgro8MMfjfHtJIx1Dww"
];

export default function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#fff8f7] text-zinc-900">
      <main className="relative flex min-h-[100dvh] flex-col items-center justify-between pt-2">
        <div className="absolute inset-0 z-0">
          <img alt="Amigos explorando la ciudad" className="h-full w-full object-cover object-center opacity-75" src={HERO_IMAGE} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#fff8f700] via-[#fff8f780] to-[#fff8f7f0]" />
        </div>

        <section className="relative z-10 mt-auto w-full max-w-md px-6 pb-8 text-center">
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

          <div className="mt-7">
            <p className="text-sm font-semibold text-zinc-500">Únete a +10k exploradores locales</p>
            <div className="mt-3 flex justify-center -space-x-2">
              {avatars.map((avatar) => (
                <img alt="Avatar" className="h-8 w-8 rounded-full border-2 border-[#fff8f7] object-cover" key={avatar} src={avatar} />
              ))}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#fff8f7] bg-zinc-100 text-[10px] font-bold text-[rgb(var(--vc-coral))]">
                +9k
              </div>
            </div>
          </div>
        </section>

        <footer className="relative z-10 w-full px-6 pb-6 text-center">
          <p className="text-xs font-semibold text-zinc-500">
            Al continuar, aceptas nuestros <a className="font-bold text-[rgb(var(--vc-coral))] underline" href="#">Términos</a> y{" "}
            <a className="font-bold text-[rgb(var(--vc-coral))] underline" href="#">Privacidad</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
