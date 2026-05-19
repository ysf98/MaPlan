"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { APP_NAME, ROUTES } from "@/utils/constants";
import { cn } from "@/lib/cn";

const items = [
  { href: ROUTES.dashboard, label: "Inicio" },
  { href: ROUTES.invitations, label: "Invitaciones" },
  { href: ROUTES.friends, label: "Amigos" },
  { href: ROUTES.groups, label: "Grupos" },
  { href: ROUTES.map, label: "Mapa" },
  { href: ROUTES.profile, label: "Perfil" }
];

function getSectionLabel(pathname: string): string | null {
  if (pathname === ROUTES.home) return null;
  if (pathname === ROUTES.dashboard || pathname.startsWith(`${ROUTES.dashboard}/`)) return "Dashboard";
  if (pathname === ROUTES.invitations || pathname.startsWith(`${ROUTES.invitations}/`)) return "Invitaciones";
  if (pathname === ROUTES.friends || pathname.startsWith(`${ROUTES.friends}/`)) return "Amigos";
  if (pathname === ROUTES.groups || pathname.startsWith(`${ROUTES.groups}/`)) return "Grupos";
  if (pathname === ROUTES.map || pathname.startsWith(`${ROUTES.map}/`)) return "Mapa";
  if (pathname === ROUTES.profile || pathname.startsWith(`${ROUTES.profile}/`)) return "Perfil";
  if (pathname === ROUTES.login || pathname.startsWith(`${ROUTES.login}/`)) return "Login";
  if (pathname === ROUTES.register || pathname.startsWith(`${ROUTES.register}/`)) return "Registro";
  return null;
}

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
            <>
              <nav className="flex items-center gap-2">
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
              <SignOutButton />
            </>
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
