import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MapPageClient } from "@/components/map/MapPageClient";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPersonalPlacesForUser } from "@/lib/personalPlaces";
import { getPersonalMapTab } from "@/lib/map/tabs";
import { ROUTES } from "@/utils/constants";

type MapPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MapPage({ searchParams }: MapPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/map");
  }

  const [personalPlaces, resolvedSearchParams] = await Promise.all([
    getPersonalPlacesForUser(user.id),
    searchParams
  ]);

  const activeTab = getPersonalMapTab(resolvedSearchParams?.tab);

  return (
    <AppShell backHref={ROUTES.dashboard} currentUser={user}>
      <MapPageClient activeTab={activeTab} personalPlaces={personalPlaces} />
    </AppShell>
  );
}
