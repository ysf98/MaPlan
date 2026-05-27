import { cn } from "@/lib/cn";

type CategoryBadgeProps = {
  label: string;
  tone?: "food" | "coffee" | "party" | "visit" | "plan";
};

const toneStyles = {
  food: "bg-[rgb(242_153_74/0.18)] text-[rgb(161_98_7)]",
  coffee: "bg-[rgb(242_153_74/0.18)] text-[rgb(146_64_14)]",
  party: "bg-[rgb(255_90_95/0.16)] text-[rgb(var(--primary-strong))]",
  visit: "bg-[rgb(var(--vc-blue)/0.16)] text-[rgb(0_62_115)]",
  plan: "bg-[rgb(var(--ring))] text-[rgb(var(--primary-strong))]"
} as const;

export function CategoryBadge({ label, tone = "plan" }: CategoryBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneStyles[tone])}>
      {label}
    </span>
  );
}
