"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_NAME, ROUTES } from "@/utils/constants";
import { AUTH_NAV_ITEMS, getSectionLabel } from "@/utils/navigation";
import { cn } from "@/lib/cn";

type NavbarProps = {
  isAuthenticated: boolean;
  pendingNotificationsCount: number;
};

export function Navbar({ isAuthenticated, pendingNotificationsCount }: NavbarProps) {
  const pathname = usePathname();
  const sectionLabel = getSectionLabel(pathname);
  const isDashboard = pathname === ROUTES.dashboard || pathname.startsWith(`${ROUTES.dashboard}/`);
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
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <nav className="hidden items-center gap-2 md:flex">
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
              {isDashboard ? (
                <Link
                  aria-label="Notificaciones"
                  className={cn(
                    "relative inline-flex h-11 w-11 items-center justify-center rounded-xl border text-slate-700 transition",
                    notificationsActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900"
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
              ) : null}
            </>
          ) : (
            <nav className="hidden items-center gap-2 md:flex">
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
