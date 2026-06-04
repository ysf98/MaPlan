"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref: string;
};

export function BackButton({ fallbackHref }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      aria-label="Volver"
      className="grid h-10 w-10 place-items-center rounded-full text-[rgb(var(--primary-strong))] transition hover:bg-[rgb(var(--surface-soft))]"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      type="button"
    >
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path d="M15 6 9 12l6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </button>
  );
}
