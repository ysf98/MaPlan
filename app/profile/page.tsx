import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/components/profile/ProfileView";
import { resolveDisplayName } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { ROUTES } from "@/utils/constants";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const supabase = await createSupabaseServerClient();
  const [profileResult, personalPlacesResult, createdPlacesResult, groupPlaceStatesResult, groupsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.from("personal_places").select("id, created_at", { count: "exact" }).eq("user_id", user.id),
    supabase.from("places").select("id", { count: "exact" }).eq("created_by", user.id),
    supabase.from("group_place_user_states").select("status, is_favorite").eq("user_id", user.id),
    supabase.from("group_members").select("group_id", { count: "exact" }).eq("user_id", user.id)
  ]);

  const profile = profileResult.data;
  const displayName = resolveDisplayName({
    email: user.email,
    metadataUsername: user.user_metadata?.username,
    profileFullName: profile?.full_name,
    profileUsername: profile?.username
  });
  const groupPlaceStates = groupPlaceStatesResult.data || [];
  const favoriteCount = groupPlaceStates.filter((place) => place.is_favorite).length;
  const visitedCount = groupPlaceStates.filter((place) => place.status === "visited").length;
  const pendingCount = groupPlaceStates.filter((place) => place.status === "pending").length;
  const totalPlaces = (personalPlacesResult.count || 0) + (createdPlacesResult.count || 0);
  const handle = (profile?.username || "").trim().toLowerCase() || "usuario";

  return (
    <AppShell backHref={ROUTES.dashboard} currentUser={user}>
      <ProfileView
        handle={handle}
        initialAvatarUrl={profile?.avatar_url || null}
        initialFullName={displayName}
        quickLists={{
          favorites: favoriteCount,
          history: visitedCount,
          toVisit: pendingCount
        }}
        stats={{
          favorites: favoriteCount,
          groups: groupsResult.count || 0,
          places: totalPlaces
        }}
      />
    </AppShell>
  );
}
