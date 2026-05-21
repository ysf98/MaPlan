import { ReactNode } from "react";
import { BottomDockNav } from "@/components/navigation/BottomDockNav";
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
    <div className="min-h-screen bg-white">
      <Navbar isAuthenticated={Boolean(user)} pendingNotificationsCount={pendingNotificationsCount} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6">
        <div className="w-full">{children}</div>
      </main>
      <BottomDockNav isAuthenticated={Boolean(user)} />
    </div>
  );
}
