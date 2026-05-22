"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/utils/constants";

const items = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: "grid" },
  { href: ROUTES.map, label: "Mapa", icon: "map" },
  { href: ROUTES.friends, label: "Amigos", icon: "users" },
  { href: ROUTES.profile, label: "Perfil", icon: "user" }
] as const;

type BottomDockNavProps = {
  isAuthenticated?: boolean;
};

function NavIcon({ name }: { name: (typeof items)[number]["icon"] | "pin" }) {
  if (name === "grid") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
      </svg>
    );
  }

  if (name === "map") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="m9 18-5 2V6l5-2 6 2 5-2v14l-5 2-6-2Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path d="M9 4v14M15 6v14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 10a2.5 2.5 0 1 0 0-5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <path d="M3.5 19c.6-3.3 2.5-5 5.5-5s4.9 1.7 5.5 5M15.5 14.3c2.3.4 3.8 2 4.3 4.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 22s7-5.5 7-13A7 7 0 0 0 5 9c0 7.5 7 13 7 13Zm0-10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c.9-4 3.4-6 7.5-6s6.6 2 7.5 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function BottomDockNav({ isAuthenticated = true }: BottomDockNavProps) {
  const pathname = usePathname();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3">
      <div className="mx-auto grid h-20 max-w-3xl grid-cols-5 items-center rounded-t-[28px] border border-rose-100 bg-white/95 px-2 shadow-[0_-14px_35px_rgba(198,40,58,0.12)] backdrop-blur-xl sm:mb-4 sm:rounded-[32px]">
        {items.slice(0, 2).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition",
                active ? "bg-rose-100 text-[#c6283a]" : "text-zinc-500 hover:text-[#c6283a]"
              )}
              href={item.href}
              key={item.href}
              prefetch={false}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}

        <Link
          aria-label="Guardar lugar"
          className="mx-auto grid h-14 w-14 -translate-y-5 place-items-center rounded-2xl bg-[#c6283a] text-white shadow-[0_12px_24px_rgba(198,40,58,0.35)] transition hover:bg-[#a91f31]"
          href={ROUTES.map}
          prefetch={false}
        >
          <NavIcon name="pin" />
        </Link>

        {items.slice(2).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition",
                active ? "bg-rose-100 text-[#c6283a]" : "text-zinc-500 hover:text-[#c6283a]"
              )}
              href={item.href}
              key={item.href}
              prefetch={false}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
