"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, ROUTES } from "@/utils/constants";
import { AUTH_NAV_ITEMS, getSectionLabel } from "@/utils/navigation";
import { cn } from "@/lib/cn";

type NavbarProps = {
  isAuthenticated: boolean;
};

export function Navbar({ isAuthenticated }: NavbarProps) {
  const pathname = usePathname();
  const sectionLabel = getSectionLabel(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link className="text-lg font-semibold tracking-tight text-slate-900" href={ROUTES.home}>
            {APP_NAME}
          </Link>
          {sectionLabel ? (
            <span className="text-sm font-medium text-slate-500">
              - {sectionLabel}
            </span>
          ) : null}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <nav className="flex items-center gap-2">
              {AUTH_NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-medium transition",
                      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <nav className="flex items-center gap-2">
              <Link className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100" href={ROUTES.login}>
                Login
              </Link>
              <Link
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                href={ROUTES.register}
              >
                Registro
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
