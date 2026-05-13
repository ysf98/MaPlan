import { cn } from "@/lib/cn";

type CategoryBadgeProps = {
  label: string;
  tone?: "food" | "coffee" | "party" | "visit" | "plan";
};

const toneStyles = {
  food: "bg-orange-100 text-orange-700",
  coffee: "bg-amber-100 text-amber-700",
  party: "bg-pink-100 text-pink-700",
  visit: "bg-sky-100 text-sky-700",
  plan: "bg-teal-100 text-teal-700"
} as const;

export function CategoryBadge({ label, tone = "plan" }: CategoryBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneStyles[tone])}>
      {label}
    </span>
  );
}
