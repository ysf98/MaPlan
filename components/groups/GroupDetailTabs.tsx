"use client";

import type { GroupDetailTab } from "@/lib/groups/tabs";

type GroupDetailTabsProps = {
  activeTab: GroupDetailTab;
  onTabChange: (tab: GroupDetailTab) => void;
};

const tabs: Array<{ key: GroupDetailTab; label: string }> = [
  { key: "lugares", label: "Lugares" },
  { key: "actividad", label: "Actividad" },
  { key: "mapa", label: "Mapa" },
  { key: "planes", label: "Planes" }
];

export function GroupDetailTabs({ activeTab, onTabChange }: GroupDetailTabsProps) {
  return (
    <div aria-label="Secciones de grupo" className="border-b border-zinc-200" role="tablist">
      <div
        className="flex w-full items-end justify-start gap-10 overflow-x-auto overflow-y-hidden px-2 md:justify-center md:overflow-x-visible"
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              aria-selected={isActive}
              className={`relative px-1 pb-3 pt-1 text-sm font-semibold transition ${
                isActive ? "text-[#c6283a]" : "text-zinc-500 hover:text-zinc-800"
              }`}
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              role="tab"
              type="button"
            >
              {tab.label}
              {isActive ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#c6283a]" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
