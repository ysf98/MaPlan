import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProfilePlacesView } from "@/components/profile/ProfilePlacesView";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  filterProfilePlaces,
  getProfilePlacesFilter,
  getProfilePlacesForUser
} from "@/lib/profilePlaces";
import { ROUTES } from "@/utils/constants";

type ProfilePlacesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePlacesPage({ searchParams }: ProfilePlacesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/profile/places");
  }

  const [places, resolvedSearchParams] = await Promise.all([
    getProfilePlacesForUser(user.id),
    searchParams
  ]);
  const activeFilter = getProfilePlacesFilter(resolvedSearchParams?.filter);
  const filteredPlaces = filterProfilePlaces(places, activeFilter);

  return (
    <AppShell backHref={ROUTES.profile} currentUser={user}>
      <ProfilePlacesView activeFilter={activeFilter} places={filteredPlaces} totalCount={places.length} />
    </AppShell>
  );
}
