import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/components/profile/ProfileView";
import { getProfileAchievements } from "@/lib/profileAchievements";
import { resolveDisplayName } from "@/lib/profile";
import { getProfilePlacesForUser, getProfilePlaceStats } from "@/lib/profilePlaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserGroups } from "@/lib/groups";
import { ROUTES } from "@/utils/constants";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const supabase = await createSupabaseServerClient();
  const [profileResult, groups] = await Promise.all([
    supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user.id).maybeSingle(),
    getUserGroups(user.id)
  ]);
  const profilePlaces = await getProfilePlacesForUser(user.id, groups);
  const placeStats = getProfilePlaceStats(profilePlaces);
  const achievements = getProfileAchievements(profilePlaces);

  const profile = profileResult.data;
  const displayName = resolveDisplayName({
    email: user.email,
    metadataUsername: user.user_metadata?.username,
    profileFullName: profile?.full_name,
    profileUsername: profile?.username
  });
  const handle = (profile?.username || "").trim().toLowerCase() || "usuario";

  return (
    <AppShell backHref={ROUTES.dashboard} currentUser={user}>
      <ProfileView
        achievements={achievements}
        handle={handle}
        initialAvatarUrl={profile?.avatar_url || null}
        initialFullName={displayName}
        quickLists={{
          favorites: placeStats.favorites,
          history: placeStats.visited,
          toVisit: placeStats.pending
        }}
        stats={{
          favorites: placeStats.favorites,
          groups: groups.length,
          places: placeStats.all
        }}
      />
    </AppShell>
  );
}
