"use client";

import { useRouter } from "next/navigation";

type MapMobileTabsProps<TValue extends string> = {
  tabs: Array<{ label: string; value: TValue }>;
  activeValue: TValue;
  onChange: (value: TValue) => void;
};

export function MapMobileTabs<TValue extends string>({ tabs, activeValue, onChange }: MapMobileTabsProps<TValue>) {
  const router = useRouter();

  return (
    <div
      aria-label="Secciones"
      className="pointer-events-auto -mx-4 -mt-[calc(env(safe-area-inset-top)+12px)] bg-white/35 px-4 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-[2px] sm:hidden"
      data-map-control=""
      onPointerDownCapture={(event) => event.stopPropagation()}
      onTouchStartCapture={(event) => event.stopPropagation()}
    >
      <div className="relative flex items-end border-b border-[#c6283a]/45">
        <button
          aria-label="Volver"
          className="mb-1 mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-700 transition hover:bg-white/40 hover:text-zinc-950 active:scale-95"
          onClick={() => router.back()}
          type="button"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div
          aria-label="Secciones"
          className="flex min-w-0 flex-1 items-end justify-center gap-7 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = tab.value === activeValue;
            return (
            <button
              aria-selected={isActive}
              className={`relative px-1 pb-2.5 pt-3 text-sm font-semibold drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] transition ${
                isActive ? "text-[#c6283a]" : "text-zinc-700 hover:text-zinc-950"
              }`}
              key={tab.value}
              onClick={() => onChange(tab.value)}
              role="tab"
              type="button"
            >
              {tab.label}
              {isActive ? <span className="absolute inset-x-0 -bottom-px h-1 rounded-full bg-[#c6283a]" /> : null}
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
