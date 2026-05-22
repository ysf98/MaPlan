import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MapPageClient } from "@/components/map/MapPageClient";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPersonalPlacesForUser } from "@/lib/personalPlaces";
import { ROUTES } from "@/utils/constants";

export default async function MapPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/map");
  }

  const personalPlaces = await getPersonalPlacesForUser(user.id);

  return (
    <AppShell backHref={ROUTES.dashboard} currentUser={user}>
      <MapPageClient personalPlaces={personalPlaces} />
    </AppShell>
  );
}
