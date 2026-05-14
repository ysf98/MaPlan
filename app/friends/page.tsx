import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { FriendsPageClient } from "@/components/friends/FriendsPageClient";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getFriendRequests, getFriends, searchUsers } from "@/lib/friends";

type FriendsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/friends");
  }

  const { q = "" } = await searchParams;
  const [requests, friends, results] = await Promise.all([
    getFriendRequests(user.id),
    getFriends(user.id),
    searchUsers(q, user.id)
  ]);

  return (
    <AppShell>
      <FriendsPageClient
        friends={friends}
        query={q}
        receivedRequests={requests.received}
        searchResults={results}
        sentRequests={requests.sent}
      />
    </AppShell>
  );
}

