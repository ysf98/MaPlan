"use client";

import Link from "next/link";
import { GroupPreviewCard } from "@/components/dashboard/GroupPreviewCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROUTES } from "@/utils/constants";
import type { DashboardGroupSummary } from "@/lib/dashboard";

type GroupsPageClientProps = {
  groups: DashboardGroupSummary[];
};

export function GroupsPageClient({ groups }: GroupsPageClientProps) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#c6283a] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(198,40,58,0.24)] transition hover:bg-[#a91f31]"
          href={`${ROUTES.groups}/new`}
        >
          Crear Grupo
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3.5 19c.5-3 2.2-5 4.5-5s4 2 4.5 5M14 18h6M17 15v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </Link>
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#c6283a] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(198,40,58,0.24)] transition hover:bg-[#a91f31]"
          href={`${ROUTES.groups}/join`}
        >
          Unirse con Codigo
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M9 12h6M12 9v6M12 21s7-5.2 7-12A7 7 0 0 0 5 9c0 6.8 7 12 7 12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        </Link>
      </div>

      {groups.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <li key={group.id}>
              <GroupPreviewCard className="w-full" group={group} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Aun no tienes grupos"
          description="Crea tu primer grupo para empezar a guardar y compartir recomendaciones."
          action={
            <Link href={`${ROUTES.groups}/new`}>
              <Button type="button" variant="secondary">
                Crear grupo
              </Button>
            </Link>
          }
        />
      )}
    </>
  );
}
