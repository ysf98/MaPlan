import { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BottomDockNav } from "@/components/navigation/BottomDockNav";
import { Navbar } from "@/components/navigation/Navbar";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPendingNotificationsCountForUser } from "@/lib/notifications";
import { resolveDisplayName } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AppShellProps = {
  backHref?: string;
  children: ReactNode;
  currentUser?: Awaited<ReturnType<typeof getCurrentUser>>;
};

type AppShellProfileRow = {
  username: string | null;
  avatar_url: string | null;
};

export async function AppShell({ backHref, children, currentUser }: AppShellProps) {
  const user = currentUser === undefined ? await getCurrentUser() : currentUser;
  let pendingNotificationsCount = 0;
  let profile: AppShellProfileRow | null = null;

  if (user) {
    const supabase = await createSupabaseServerClient();
    const [notificationsCount, profileResult] = await Promise.all([
      getPendingNotificationsCountForUser(user.id),
      supabase.from("profiles").select("username, avatar_url").eq("id", user.id).maybeSingle()
    ]);

    pendingNotificationsCount = notificationsCount;
    profile = profileResult.data as AppShellProfileRow | null;
  }

  const displayName = user
    ? resolveDisplayName({
        email: user.email,
        metadataUsername: user.user_metadata?.username,
        profileUsername: profile?.username
      })
    : "";

  return (
    <div className="min-h-screen bg-white">
      {user ? (
        <DashboardHeader
          avatarUrl={profile?.avatar_url || null}
          backHref={backHref}
          displayName={displayName}
          hasNotifications={pendingNotificationsCount > 0}
        />
      ) : (
        <Navbar />
      )}
      <main className="mx-auto w-full max-w-3xl px-5 pb-32 pt-6">
        <div className="w-full">{children}</div>
      </main>
      <BottomDockNav isAuthenticated={Boolean(user)} />
    </div>
  );
}
