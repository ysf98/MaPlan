"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const notificationsActive = pathname === ROUTES.notifications || pathname.startsWith(`${ROUTES.notifications}/`);

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
              <Link
                aria-label="Notificaciones"
                className={cn(
                  "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border text-slate-700 transition",
                  notificationsActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900"
                )}
                href={ROUTES.notifications}
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M14.857 17.082A23.848 23.848 0 0 1 12 17.25c-.996 0-1.968-.061-2.857-.168m5.714 0a3 3 0 1 1-5.714 0m5.714 0a5.997 5.997 0 0 0 1.143-3.542V11.25a4 4 0 1 0-8 0v2.29c0 1.312.422 2.527 1.143 3.542m5.714 0H9.143"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
                {pendingNotificationsCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                    {pendingNotificationsCount > 99 ? "99+" : pendingNotificationsCount}
                  </span>
                ) : null}
              </Link>
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
