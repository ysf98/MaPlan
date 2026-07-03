import Image from "next/image";
import { cn } from "@/lib/cn";

type MaplanMinimalIconProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<MaplanMinimalIconProps["size"]>, string> = {
  sm: "h-7 w-7",
  md: "h-12 w-12",
  lg: "h-20 w-20"
};

export function MaplanMinimalIcon({ className, size = "md" }: MaplanMinimalIconProps) {
  return (
    <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center", sizeClasses[size], className)}>
      <Image alt="" className="block h-full w-full object-contain" height={128} src="/maplan-icon-128.png" width={128} />
    </span>
  );
}
