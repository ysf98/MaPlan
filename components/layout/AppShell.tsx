import { ReactNode } from "react";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Navbar } from "@/components/navigation/Navbar";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPendingNotificationsCountForUser } from "@/lib/notifications";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const user = await getCurrentUser();
  const pendingNotificationsCount = user ? await getPendingNotificationsCountForUser(user.id) : 0;

  return (
    <div className="app-bg min-h-screen">
      <Navbar isAuthenticated={Boolean(user)} pendingNotificationsCount={pendingNotificationsCount} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 lg:pb-8">
        <div className="w-full">{children}</div>
      </main>
      <MobileNav isAuthenticated={Boolean(user)} />
    </div>
  );
}
