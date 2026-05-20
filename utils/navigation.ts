import { ROUTES } from "@/utils/constants";
import type { NavItem } from "@/types/navigation";

export const AUTH_NAV_ITEMS: NavItem[] = [
  { href: ROUTES.dashboard, label: "Inicio" },
  { href: ROUTES.friends, label: "Amigos" },
  { href: ROUTES.groups, label: "Grupos" },
  { href: ROUTES.map, label: "Mapa" },
  { href: ROUTES.profile, label: "Perfil" }
];

export function getSectionLabel(pathname: string): string | null {
  if (pathname === ROUTES.home) return null;
  if (pathname === ROUTES.dashboard || pathname.startsWith(`${ROUTES.dashboard}/`)) return "Inicio";
  if (pathname === ROUTES.notifications || pathname.startsWith(`${ROUTES.notifications}/`)) return "Notificaciones";
  if (pathname === ROUTES.friends || pathname.startsWith(`${ROUTES.friends}/`)) return "Amigos";
  if (pathname === ROUTES.groups || pathname.startsWith(`${ROUTES.groups}/`)) return "Grupos";
  if (pathname === ROUTES.map || pathname.startsWith(`${ROUTES.map}/`)) return "Mapa";
  if (pathname === ROUTES.profile || pathname.startsWith(`${ROUTES.profile}/`)) return "Perfil";
  if (pathname === ROUTES.login || pathname.startsWith(`${ROUTES.login}/`)) return "Login";
  if (pathname === ROUTES.register || pathname.startsWith(`${ROUTES.register}/`)) return "Registro";
  return null;
}
