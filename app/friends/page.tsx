import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { FriendsPageClient } from "@/components/friends/FriendsPageClient";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getFriendRequests, getFriends } from "@/lib/friends";

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/friends");
  }

  const [requests, friends] = await Promise.all([getFriendRequests(user.id), getFriends(user.id)]);

  return (
    <AppShell currentUser={user}>
      <FriendsPageClient
        friends={friends}
        query=""
        receivedRequests={requests.received}
        searchResults={[]}
        sentRequests={requests.sent}
      />
    </AppShell>
  );
}
