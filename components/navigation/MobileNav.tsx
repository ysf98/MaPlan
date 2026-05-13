"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/utils/constants";
import { cn } from "@/lib/cn";

const items = [
  { href: ROUTES.dashboard, label: "Inicio" },
  { href: ROUTES.groups, label: "Grupos" },
  { href: ROUTES.map, label: "Mapa" },
  { href: ROUTES.profile, label: "Perfil" }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-xl px-2 py-2 text-center text-xs font-medium",
                  active ? "bg-slate-900 text-white" : "text-slate-600"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
