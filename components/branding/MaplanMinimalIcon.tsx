import { cn } from "@/lib/cn";

type MaplanMinimalIconProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<MaplanMinimalIconProps["size"]>, { outer: string; compass: string; ring: string; svg: string }> = {
  sm: {
    outer: "h-7 w-7 rounded-xl",
    compass: "h-5 w-5",
    ring: "border-[2px]",
    svg: "h-3.5 w-3.5"
  },
  md: {
    outer: "h-12 w-12 rounded-[14px]",
    compass: "h-8 w-8",
    ring: "border-[3px]",
    svg: "h-5.5 w-5.5"
  },
  lg: {
    outer: "h-20 w-20 rounded-[20px]",
    compass: "h-14 w-14",
    ring: "border-[5px]",
    svg: "h-10 w-10"
  }
};

export function MaplanMinimalIcon({ className, size = "md" }: MaplanMinimalIconProps) {
  const classes = sizeClasses[size];

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center bg-[linear-gradient(145deg,#ff6b6f_0%,#ff5a5f_45%,#e9434b_100%)] shadow-[0_12px_24px_rgba(181,35,48,0.22),inset_0_2px_6px_rgba(255,255,255,0.28),inset_0_-6px_12px_rgba(97,0,14,0.16)]",
        classes.outer,
        className
      )}
    >
      <span className={cn("relative inline-flex items-center justify-center rounded-full border-white", classes.compass, classes.ring)}>
        <svg
          aria-hidden="true"
          className={classes.svg}
          viewBox="0 0 100 100"
          fill="none"
        >
          <g transform="translate(-5 -12)">
            <path
              d="M 79 46 L 70 65 C 68 71 64 75 59 77 L 38 88 C 22 98 22 95 29 81 L 39 59 C 41 54 42 51 50 47 L 69 37 C 79 32 88 26 84 34 Z"
              fill="white"
            />
            <circle cx="54" cy="62" r="9.5" fill="#ff5a5f" />
          </g>
        </svg>
      </span>
    </span>
  );
}
