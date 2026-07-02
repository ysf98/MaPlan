import Link from "next/link";
import { MaplanMinimalIcon } from "@/components/branding/MaplanMinimalIcon";
import { APP_NAME, ROUTES } from "@/utils/constants";

export default function NotFoundPage() {
  return (
    <main className="min-h-dvh bg-[#fff8f7] px-5 py-10 text-zinc-950">
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-md flex-col items-center justify-center text-center">
        <MaplanMinimalIcon size="lg" />
        <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.22em] text-[#c6283a]">P&aacute;gina no disponible</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">No hemos podido abrir esta p&aacute;gina</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-zinc-600">
          Puede que el enlace haya caducado, que no tengas acceso o que la p&aacute;gina ya no exista.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#c6283a] px-5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(198,40,58,0.24)] transition hover:bg-[#b32033]"
            href={ROUTES.dashboard}
          >
            Ir al dashboard
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-rose-100 bg-white px-5 text-sm font-extrabold text-[#c6283a] shadow-sm transition hover:bg-[#fff0ef]"
            href={ROUTES.groups}
          >
            Ver mis grupos
          </Link>
        </div>
        <p className="mt-8 text-xs font-semibold text-zinc-400">{APP_NAME}</p>
      </section>
    </main>
  );
}
