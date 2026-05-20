"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTH_NAV_ITEMS } from "@/utils/navigation";
import { cn } from "@/lib/cn";

type MobileNavProps = {
  isAuthenticated: boolean;
};

export function MobileNav({ isAuthenticated }: MobileNavProps) {
  const pathname = usePathname();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {AUTH_NAV_ITEMS.map((item) => {
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
