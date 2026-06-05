import { redirect } from "next/navigation";
import { ExploreMap } from "@/components/explore/ExploreMap";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPlaceSaveDestinationsForUser } from "@/lib/saveDestinations";
import { ROUTES } from "@/utils/constants";

export default async function ExplorePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/explore");
  }

  const destinations = await getPlaceSaveDestinationsForUser(user.id);

  return (
    <AppShell backHref={ROUTES.maps} currentUser={user}>
      <ExploreMap destinations={destinations} />
    </AppShell>
  );
}
