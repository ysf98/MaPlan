"use client";

import { cn } from "@/lib/cn";

type UserLocationButtonProps = {
  className?: string;
  error: string | null;
  isLocating: boolean;
  onClick: () => void;
};

export function UserLocationButton({ className, error, isLocating, onClick }: UserLocationButtonProps) {
  return (
    <div
      className={cn("pointer-events-none absolute bottom-4 left-4 z-20 flex max-w-[240px] flex-col items-start gap-2", className)}
      data-map-control=""
    >
      <button
        aria-label="Mostrar mi ubicacion"
        className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-rose-100/80 bg-white/92 text-[#c6283a] shadow-[0_10px_24px_rgba(181,35,48,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-rose-50 active:translate-y-0 disabled:cursor-wait disabled:opacity-75"
        data-map-control=""
        disabled={isLocating}
        onClick={onClick}
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        type="button"
      >
        {isLocating ? (
          <svg className="h-[18px] w-[18px] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
          </svg>
        ) : (
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M12 2v3" />
            <path d="M12 19v3" />
            <path d="M2 12h3" />
            <path d="M19 12h3" />
            <circle cx="12" cy="12" r="5" />
          </svg>
        )}
      </button>
      {error ? (
        <div className="pointer-events-auto rounded-2xl border border-rose-100 bg-white/95 px-3 py-2 text-left text-xs font-medium text-rose-700 shadow-[0_10px_24px_rgba(181,35,48,0.14)] backdrop-blur-xl">
          {error}
        </div>
      ) : null}
    </div>
  );
}
