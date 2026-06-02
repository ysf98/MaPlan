"use client";

import { useRouter } from "next/navigation";

export function MapBackButton() {
  const router = useRouter();

  return (
    <button
      aria-label="Volver"
      className="pointer-events-auto inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-white/90 text-zinc-700 shadow-[0_6px_14px_rgba(24,24,27,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 sm:hidden"
      data-map-control=""
      onClick={() => router.back()}
      onPointerDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      type="button"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  );
}
