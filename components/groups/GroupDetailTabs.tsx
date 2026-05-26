"use client";

import Link from "next/link";
import type { GroupDetailTab } from "@/lib/groups/tabs";

type GroupDetailTabsProps = {
  groupId: string;
  activeTab: GroupDetailTab;
};

const tabs: Array<{ key: GroupDetailTab; label: string }> = [
  { key: "lugares", label: "Lugares" },
  { key: "actividad", label: "Actividad" },
  { key: "mapa", label: "Mapa" }
];

export function GroupDetailTabs({ groupId, activeTab }: GroupDetailTabsProps) {
  return (
    <div aria-label="Secciones de grupo" className="border-b border-zinc-200" role="tablist">
      <div className="flex w-full items-end justify-center gap-14">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              aria-selected={isActive}
              className={`relative px-1 pb-3 pt-1 text-sm font-semibold transition ${
                isActive ? "text-[#c6283a]" : "text-zinc-500 hover:text-zinc-800"
              }`}
              href={`/groups/${groupId}?tab=${tab.key}`}
              key={tab.key}
              role="tab"
            >
              {tab.label}
              {isActive ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#c6283a]" /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
