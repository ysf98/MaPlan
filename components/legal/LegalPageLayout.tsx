import type { ReactNode } from "react";
import Link from "next/link";
import { MaplanMinimalIcon } from "@/components/branding/MaplanMinimalIcon";
import { APP_NAME, ROUTES } from "@/utils/constants";

type LegalPageLayoutProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function LegalPageLayout({ children, description, title }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fff8f7] text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-rose-100 bg-[#fff8f7]/92 backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 w-full max-w-4xl items-center justify-center px-5">
          <Link
            aria-label="Volver a MaPlan"
            className="absolute left-3 grid h-10 w-10 place-items-center rounded-full text-[#c6283a] transition hover:bg-rose-50 sm:left-5"
            href={ROUTES.home}
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path d="m15 6-6 6 6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </Link>
          <Link className="inline-flex items-center gap-2 text-lg font-extrabold text-[#c6283a]" href={ROUTES.home}>
            <MaplanMinimalIcon size="sm" />
            <span>{APP_NAME}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <header className="border-b border-rose-100 pb-8">
          <p className="text-xs font-extrabold uppercase text-[#c6283a]">Información legal</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">{description}</p>
          <p className="mt-4 text-sm font-semibold text-zinc-500">Última actualización: 22 de junio de 2026</p>
        </header>

        <div className="legal-content mt-8 space-y-9 text-[15px] leading-7 text-zinc-700">{children}</div>

        <aside className="mt-12 border-t border-rose-100 pt-6 text-sm leading-6 text-zinc-500">
          Este contenido describe el funcionamiento actual de un prototipo personal y académico. No sustituye una revisión jurídica
          profesional si MaPlan pasa a ofrecerse como servicio comercial.
        </aside>
      </main>
    </div>
  );
}
