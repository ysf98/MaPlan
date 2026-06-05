import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MapsHubView } from "@/components/maps/MapsHubView";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { ROUTES } from "@/utils/constants";

export default async function MapsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/maps");
  }

  return (
    <AppShell backHref={ROUTES.dashboard} currentUser={user}>
      <MapsHubView />
    </AppShell>
  );
}
