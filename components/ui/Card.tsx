import { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <section className={cn("vc-surface-card p-4 md:p-5", className)}>{children}</section>;
}
