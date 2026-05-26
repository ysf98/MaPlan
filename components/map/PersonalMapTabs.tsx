"use client";

import type { PersonalMapTab } from "@/lib/map/tabs";

type PersonalMapTabsProps = {
  activeTab: PersonalMapTab;
  onTabChange: (tab: PersonalMapTab) => void;
};

const tabs: Array<{ key: PersonalMapTab; label: string }> = [
  { key: "lugares", label: "Lugares" },
  { key: "mapa", label: "Mapa" }
];

export function PersonalMapTabs({ activeTab, onTabChange }: PersonalMapTabsProps) {
  return (
    <div aria-label="Secciones del mapa personal" className="border-b border-zinc-200" role="tablist">
      <div
        className="flex w-full items-end justify-center gap-14 overflow-x-auto overflow-y-hidden px-2 md:overflow-x-visible"
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
