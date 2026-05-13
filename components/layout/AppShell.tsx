import { ReactNode } from "react";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Navbar } from "@/components/navigation/Navbar";
import { Sidebar } from "@/components/navigation/Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl gap-6 px-4 pb-24 pt-6 lg:pb-8">
        <Sidebar />
        <div className="w-full">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
