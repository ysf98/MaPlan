import { ReactNode } from "react";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Navbar } from "@/components/navigation/Navbar";
import { Sidebar } from "@/components/navigation/Sidebar";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const user = await getCurrentUser();

  return (
    <div className="app-bg min-h-screen">
      <Navbar isAuthenticated={Boolean(user)} />
      <main className="mx-auto flex w-full max-w-6xl gap-6 px-4 pb-24 pt-6 lg:pb-8">
        <Sidebar isAuthenticated={Boolean(user)} />
        <div className="w-full">{children}</div>
      </main>
      <MobileNav isAuthenticated={Boolean(user)} />
    </div>
  );
}
