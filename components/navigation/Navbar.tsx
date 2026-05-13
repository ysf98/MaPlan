"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, ROUTES } from "@/utils/constants";
import { cn } from "@/lib/cn";

const items = [
  { href: ROUTES.dashboard, label: "Inicio" },
  { href: ROUTES.groups, label: "Grupos" },
  { href: ROUTES.map, label: "Mapa" },
  { href: ROUTES.profile, label: "Perfil" }
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link className="text-lg font-semibold tracking-tight text-slate-900" href={ROUTES.home}>
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {items.map((item) => {
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
      </div>
    </header>
  );
}
