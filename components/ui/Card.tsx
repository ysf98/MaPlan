import { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <section className={cn("rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm", className)}>{children}</section>;
}
