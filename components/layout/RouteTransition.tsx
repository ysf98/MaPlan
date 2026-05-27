"use client";

import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import { useMemo, useRef } from "react";
import type { ReactNode } from "react";

type RouteTransitionProps = {
  children: ReactNode;
};

const sectionOrder = ["/dashboard", "/map", "/friends", "/profile"] as const;

function getSectionIndex(pathname: string): number {
  return sectionOrder.findIndex((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

  const direction = useMemo<"forward" | "backward">(() => {
    const previousPathname = previousPathnameRef.current;
    const previousIndex = getSectionIndex(previousPathname);
    const currentIndex = getSectionIndex(pathname);

    previousPathnameRef.current = pathname;

    if (previousIndex === -1 || currentIndex === -1) {
      return "forward";
    }

    return currentIndex >= previousIndex ? "forward" : "backward";
  }, [pathname]);

  return (
    <div className={cn("route-transition-enter", direction === "forward" ? "route-transition-forward" : "route-transition-backward")} key={pathname}>
      {children}
    </div>
  );
}
