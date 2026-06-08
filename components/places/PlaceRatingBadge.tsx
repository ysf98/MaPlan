import { cn } from "@/lib/cn";

type PlaceRatingBadgeProps = {
  rating?: number | null;
  userRatingsTotal?: number | null;
  className?: string;
  compact?: boolean;
};

function formatRating(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1
  }).format(value);
}

function formatRatingsTotal(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value);
}

export function PlaceRatingBadge({ rating, userRatingsTotal, className, compact = false }: PlaceRatingBadgeProps) {
  if (typeof rating !== "number" || Number.isNaN(rating)) {
    return null;
  }

  const hasReviews = typeof userRatingsTotal === "number" && userRatingsTotal > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold leading-none text-zinc-800 ring-1 ring-amber-100",
        className
      )}
      title={hasReviews ? `${formatRating(rating)} en Google Places con ${userRatingsTotal} resenas` : `${formatRating(rating)} en Google Places`}
    >
      <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="m10 1.6 2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6-4.8 2.6.9-5.5-4-3.9 5.5-.8z" />
      </svg>
      <span>{formatRating(rating)}</span>
      {hasReviews ? <span className="font-semibold text-zinc-500">({compact ? formatRatingsTotal(userRatingsTotal) : `${formatRatingsTotal(userRatingsTotal)} resenas`})</span> : null}
    </span>
  );
}
