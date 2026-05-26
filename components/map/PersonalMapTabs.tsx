"use client";

import Link from "next/link";
import type { PersonalMapTab } from "@/lib/map/tabs";

type PersonalMapTabsProps = {
  activeTab: PersonalMapTab;
};

const tabs: Array<{ key: PersonalMapTab; label: string }> = [
  { key: "lugares", label: "Lugares" },
  { key: "mapa", label: "Mapa" }
];

export function PersonalMapTabs({ activeTab }: PersonalMapTabsProps) {
  return (
    <div aria-label="Secciones del mapa personal" className="border-b border-zinc-200" role="tablist">
      <div className="flex items-center gap-5">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              aria-selected={isActive}
              className={`-mb-px border-b-2 px-1 py-2 text-sm font-semibold transition ${
                isActive ? "border-[#c6283a] text-[#c6283a]" : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
              href={`/map?tab=${tab.key}`}
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
