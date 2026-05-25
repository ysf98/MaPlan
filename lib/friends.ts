import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FriendRequestStatus } from "@/types/supabase";

export type UserSearchItem = {
  id: string;
  username: string | null;
  alreadyFriend: boolean;
  hasPendingRequest: boolean;
};

export type FriendRequestItem = {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
  senderUsername: string | null;
  receiverUsername: string | null;
};

export type FriendItem = {
  userId: string;
  username: string | null;
  createdAt: string;
};

function isFriendRequestStatus(value: string): value is FriendRequestStatus {
  return value === "pending" || value === "accepted" || value === "rejected";
}

function normalizeFriendPair(userAId: string, userBId: string) {
  return userAId < userBId ? { user_a_id: userAId, user_b_id: userBId } : { user_a_id: userBId, user_b_id: userAId };
}

async function getProfileUsernameMap(ids: string[]): Promise<Map<string, string | null>> {
  if (ids.length === 0) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_profiles_by_ids", { p_ids: ids });
  return new Map((data || []).map((profile) => [profile.id, profile.username]));
}

export async function areFriends(userAId: string, userBId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const pair = normalizeFriendPair(userAId, userBId);
  const { data, error } = await supabase.from("friendships").select("id").match(pair).maybeSingle();
  return !error && Boolean(data);
}

export async function getFriends(userId: string): Promise<FriendItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("user_a_id, user_b_id, created_at")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !friendships || friendships.length === 0) {
    return [];
  }

  const friendIds = friendships.map((f) => (f.user_a_id === userId ? f.user_b_id : f.user_a_id));
  const usernameById = await getProfileUsernameMap(friendIds);

  return friendships.map((f) => {
    const friendId = f.user_a_id === userId ? f.user_b_id : f.user_a_id;
    return {
      userId: friendId,
      username: usernameById.get(friendId) ?? null,
      createdAt: f.created_at
    };
  });
}

export async function getFriendRequests(userId: string): Promise<{
  received: FriendRequestItem[];
  sent: FriendRequestItem[];
}> {
  const supabase = await createSupabaseServerClient();
  const { data: requests, error } = await supabase
    .from("friend_requests")
    .select("id, sender_id, receiver_id, status, created_at, updated_at")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !requests || requests.length === 0) {
    return { received: [], sent: [] };
  }

  const profileIds = Array.from(new Set(requests.flatMap((r) => [r.sender_id, r.receiver_id])));
  const usernameById = await getProfileUsernameMap(profileIds);

  const mapped: FriendRequestItem[] = requests.flatMap((request) => {
      if (!isFriendRequestStatus(request.status)) {
        return [];
      }

      return [
        {
          id: request.id,
          senderId: request.sender_id,
          receiverId: request.receiver_id,
          status: request.status,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
          senderUsername: usernameById.get(request.sender_id) ?? null,
          receiverUsername: usernameById.get(request.receiver_id) ?? null
        }
      ];
    });

  return {
    received: mapped.filter((request) => request.receiverId === userId && request.status === "pending"),
    sent: mapped.filter((request) => request.senderId === userId && request.status === "pending")
  };
}

export async function searchUsers(query: string, currentUserId: string): Promise<UserSearchItem[]> {
  const term = query.trim();
  if (term.length < 2) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const rpcResult = await supabase.rpc("search_profiles_by_username", { p_query: term });
  const profiles = (rpcResult.data || []).slice(0, 12);
  const error = rpcResult.error;

  if (error || !profiles || profiles.length === 0) {
    return [];
  }

  const candidateIds = profiles.map((p) => p.id);
  const { data: friendships } = await supabase
    .from("friendships")
    .select("user_a_id, user_b_id")
    .or(
      `and(user_a_id.eq.${currentUserId},user_b_id.in.(${candidateIds.join(",")})),and(user_b_id.eq.${currentUserId},user_a_id.in.(${candidateIds.join(",")}))`
    );

  const friendIdSet = new Set<string>();
  (friendships || []).forEach((f) => {
    friendIdSet.add(f.user_a_id === currentUserId ? f.user_b_id : f.user_a_id);
  });

  const { data: requests } = await supabase
    .from("friend_requests")
    .select("sender_id, receiver_id, status")
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.in.(${candidateIds.join(",")})),and(receiver_id.eq.${currentUserId},sender_id.in.(${candidateIds.join(",")}))`
    )
    .eq("status", "pending");

  const pendingIdSet = new Set<string>();
  (requests || []).forEach((request) => {
    pendingIdSet.add(request.sender_id === currentUserId ? request.receiver_id : request.sender_id);
  });

  return profiles.map((profile) => ({
    id: profile.id,
    username: profile.username,
    alreadyFriend: friendIdSet.has(profile.id),
    hasPendingRequest: pendingIdSet.has(profile.id)
  }));
}

export async function sendFriendRequest(senderId: string, receiverId: string): Promise<{ error: string | null }> {
  if (senderId === receiverId) {
    return { error: "No puedes enviarte solicitud de amistad a ti mismo." };
  }

  if (await areFriends(senderId, receiverId)) {
    return { error: "Ya sois amigos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("friend_requests").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    status: "pending"
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una solicitud de amistad entre estos usuarios." };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function respondFriendRequest(
  userId: string,
  requestId: string,
  decision: "accepted" | "rejected"
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  if (decision === "accepted") {
    const { error } = await supabase.rpc("accept_friend_request", { request_id: requestId });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }

  const { data: request, error: requestError } = await supabase
    .from("friend_requests")
    .select("id, receiver_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) {
    return { error: "Solicitud no encontrada." };
  }

  if (request.receiver_id !== userId) {
    return { error: "No tienes permisos para responder esta solicitud." };
  }

  if (request.status !== "pending") {
    return { error: "Esta solicitud ya fue respondida." };
  }

  const { error: updateError } = await supabase.from("friend_requests").update({ status: "rejected" }).eq("id", requestId);
  if (updateError) {
    return { error: updateError.message };
  }

  return { error: null };
}

export async function removeFriend(userId: string, friendUserId: string): Promise<{ error: string | null }> {
  if (userId === friendUserId) {
    return { error: "No puedes eliminarte como amigo." };
  }

  const pair = normalizeFriendPair(userId, friendUserId);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("friendships").delete().match(pair);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
