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
      <div className="flex items-center gap-5">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              aria-selected={isActive}
              className={`-mb-px border-b-2 px-1 py-2 text-sm font-semibold transition ${
                isActive ? "border-[#c6283a] text-[#c6283a]" : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
              href={`/groups/${groupId}?tab=${tab.key}`}
              key={tab.key}
              role="tab"
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
