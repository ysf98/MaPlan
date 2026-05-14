"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ROUTES } from "@/utils/constants";
import { cn } from "@/lib/cn";

const items = [
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.invitations, label: "Invitations" },
  { href: ROUTES.friends, label: "Friends" },
  { href: ROUTES.groups, label: "Groups" },
  { href: ROUTES.map, label: "Map" },
  { href: ROUTES.profile, label: "Profile" }
];

type SidebarProps = {
  isAuthenticated: boolean;
};

export function Sidebar({ isAuthenticated }: SidebarProps) {
  const pathname = usePathname();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-56 rounded-2xl border border-slate-200 bg-white p-3 lg:block">
      <ul className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm font-medium transition",
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {isAuthenticated ? <div className="mt-4"><SignOutButton /></div> : null}
    </aside>
  );
}
