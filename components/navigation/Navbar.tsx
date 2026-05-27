import Link from "next/link";
import { MaplanMinimalIcon } from "@/components/branding/MaplanMinimalIcon";
import { APP_NAME, ROUTES } from "@/utils/constants";

export function Navbar() {
  return (
    <header className="vc-glass sticky top-0 z-30 border-b border-[rgb(var(--border)/0.6)]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-[20px]">
        <Link className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-[rgb(var(--primary-strong))]" href={ROUTES.home}>
          <MaplanMinimalIcon size="sm" />
          <span>{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            className="rounded-2xl px-3 py-2 text-sm font-medium text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface-soft))] hover:text-[rgb(var(--primary-strong))]"
            href={ROUTES.login}
          >
            Login
          </Link>
          <Link
            className="rounded-2xl bg-[rgb(var(--primary-strong))] px-3 py-2 text-sm font-medium text-white hover:bg-[rgb(var(--primary))]"
            href={ROUTES.register}
          >
            Registro
          </Link>
        </nav>
      </div>
    </header>
  );
}
