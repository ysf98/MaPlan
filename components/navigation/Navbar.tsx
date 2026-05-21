"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_NAME, ROUTES } from "@/utils/constants";
import { getSectionLabel } from "@/utils/navigation";
import { cn } from "@/lib/cn";

type NavbarProps = {
  isAuthenticated: boolean;
  pendingNotificationsCount: number;
};

export function Navbar({ isAuthenticated, pendingNotificationsCount }: NavbarProps) {
  const pathname = usePathname();
  const sectionLabel = getSectionLabel(pathname);
  const notificationsActive = pathname === ROUTES.notifications || pathname.startsWith(`${ROUTES.notifications}/`);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const hasUnreadIndicator = pendingNotificationsCount > lastSeenCount;

  useEffect(() => {
    const raw = window.localStorage.getItem("maplan.notifications.lastSeenCount");
    const parsed = raw ? Number(raw) : 0;
    setLastSeenCount(Number.isFinite(parsed) ? parsed : 0);
  }, []);

  useEffect(() => {
    if (!notificationsActive) return;
    setLastSeenCount(pendingNotificationsCount);
    window.localStorage.setItem("maplan.notifications.lastSeenCount", String(pendingNotificationsCount));
  }, [notificationsActive, pendingNotificationsCount]);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link className="text-lg font-bold tracking-tight text-[#c6283a]" href={ROUTES.home}>
            {APP_NAME}
          </Link>
          {sectionLabel ? (
            <span className="text-sm font-medium text-zinc-500">
              - {sectionLabel}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                aria-label="Notificaciones"
                className={cn(
                  "relative inline-flex h-11 w-11 items-center justify-center rounded-xl border text-zinc-700 transition",
                  notificationsActive
                    ? "border-[#c6283a] bg-[#c6283a] text-white"
                    : "border-zinc-100 bg-white hover:bg-rose-50 hover:text-[#c6283a]"
                )}
                href={ROUTES.notifications}
              >
                <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M12 4c-3.3 0-6 2.7-6 6v3.1c0 .6-.2 1.2-.5 1.7l-.9 1.6c-.4.8.1 1.6 1 1.6h12.8c.9 0 1.5-.8 1-1.6l-.9-1.6c-.3-.5-.5-1.1-.5-1.7V10c0-3.3-2.7-6-6-6Zm0 16c-1.3 0-2.4-.8-2.8-2h5.6c-.4 1.2-1.5 2-2.8 2Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                  />
                </svg>
                {hasUnreadIndicator ? (
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" />
                ) : null}
              </Link>
            </>
          ) : (
            <nav className="hidden items-center gap-2 md:flex">
              <Link className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-rose-50 hover:text-[#c6283a]" href={ROUTES.login}>
                Login
              </Link>
              <Link
                className="rounded-xl bg-[#c6283a] px-3 py-2 text-sm font-medium text-white hover:bg-[#a91f31]"
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
