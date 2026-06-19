import { getFriendRequests } from "@/lib/friends";
import {
  getGroupActivityFeedForUser,
  getGroupActivityLastSeenAtForUser,
  type GroupActivityFeedItem
} from "@/lib/groupActivity";
import { getGroupChatUnreadSummariesForUser } from "@/lib/groupChat";
import { getGroupInvitationsForUser } from "@/lib/groupInvitations";
import { getUserGroups } from "@/lib/groups";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationItem =
  | {
      id: string;
      kind: "group_invitation";
      createdAt: string;
      invitationId: string;
      groupId: string;
      groupName: string | null;
      invitedByUsername: string | null;
      status: "pending" | "accepted" | "rejected";
    }
  | {
      id: string;
      kind: "friend_request";
      createdAt: string;
      requestId: string;
      senderId: string;
      senderUsername: string | null;
    }
  | {
      id: string;
      kind: "group_chat_unread";
      createdAt: string;
      groupId: string;
      groupName: string;
      unreadCount: number;
    }
  | {
      id: string;
      kind: "group_activity";
      createdAt: string;
      activity: GroupActivityFeedItem;
    }
  | {
      id: string;
      kind: "group_join_request";
      createdAt: string;
      requestId: string;
      groupId: string;
      groupName: string;
      requesterId: string;
      requesterUsername: string | null;
      href: string;
    };

export type PendingNotifications = {
  pendingInvitations: NotificationItem[];
  reviewedInvitations: NotificationItem[];
  friendRequests: NotificationItem[];
  groupActivities: NotificationItem[];
  groupJoinRequests: NotificationItem[];
  unreadChats: NotificationItem[];
  total: number;
};

async function getPendingGroupJoinRequestNotifications(userId: string): Promise<NotificationItem[]> {
  const groups = await getUserGroups(userId);
  const ownedGroups = groups.filter((group) => group.role === "owner");
  if (ownedGroups.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const groupNameById = new Map(ownedGroups.map((group) => [group.id, group.name]));
  const { data: requests, error } = await supabase
    .from("group_join_requests")
    .select("id, group_id, user_id, created_at")
    .in("group_id", ownedGroups.map((group) => group.id))
    .eq("status", "pending")
    .neq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !requests || requests.length === 0) {
    return [];
  }

  const requesterIds = Array.from(new Set(requests.map((request) => request.user_id)));
  const { data: profiles } = await supabase.rpc("get_profiles_by_ids", { p_ids: requesterIds });
  const usernameById = new Map((profiles || []).map((profile) => [profile.id, profile.username]));

  return requests.flatMap((request) => {
    const groupName = groupNameById.get(request.group_id);
    if (!groupName) {
      return [];
    }

    return [{
      id: `group_join_request:${request.id}`,
      kind: "group_join_request" as const,
      createdAt: request.created_at,
      requestId: request.id,
      groupId: request.group_id,
      groupName,
      requesterId: request.user_id,
      requesterUsername: usernameById.get(request.user_id) ?? null,
      href: `/groups/${request.group_id}?tab=actividad`
    }];
  });
}

export async function getPendingNotificationsForUser(userId: string): Promise<PendingNotifications> {
  const [invitations, friendRequests, unreadChatSummaries, activityFeed, activityLastSeenAt, groupJoinRequests] = await Promise.all([
    getGroupInvitationsForUser(userId),
    getFriendRequests(userId),
    getGroupChatUnreadSummariesForUser(userId),
    getGroupActivityFeedForUser(userId, 20, { includeGroupName: true, maxAgeDays: 14 }),
    getGroupActivityLastSeenAtForUser(userId),
    getPendingGroupJoinRequestNotifications(userId)
  ]);

  const invitationNotifications: NotificationItem[] = invitations
    .map((item) => ({
      id: `group_invitation:${item.id}`,
      kind: "group_invitation",
      createdAt: item.createdAt,
      invitationId: item.id,
      groupId: item.groupId,
      groupName: item.groupName,
      invitedByUsername: item.invitedByUsername,
      status: item.status
    }));
  const pendingInvitations = invitationNotifications.filter((item) => item.kind === "group_invitation" && item.status === "pending");
  const reviewedInvitations = invitationNotifications.filter(
    (item) => item.kind === "group_invitation" && item.status !== "pending"
  );

  const pendingFriendRequests: NotificationItem[] = friendRequests.received.map((item) => ({
    id: `friend_request:${item.id}`,
    kind: "friend_request",
    createdAt: item.createdAt,
    requestId: item.id,
    senderId: item.senderId,
    senderUsername: item.senderUsername
  }));

  const unreadChats: NotificationItem[] = unreadChatSummaries.map((item) => ({
    id: `group_chat_unread:${item.groupId}`,
    kind: "group_chat_unread",
    createdAt: item.latestMessageAt,
    groupId: item.groupId,
    groupName: item.groupName,
    unreadCount: item.unreadCount
  }));

  const groupActivities: NotificationItem[] = activityFeed
    .filter((item) => item.actorUserId !== userId)
    .map((item) => ({
      id: `group_activity:${item.id}`,
      kind: "group_activity",
      createdAt: item.createdAt,
      activity: item
    }));

  const unreadGroupActivities = groupActivities.filter(
    (item) => !activityLastSeenAt || new Date(item.createdAt).getTime() > new Date(activityLastSeenAt).getTime()
  );

  return {
    pendingInvitations,
    reviewedInvitations,
    friendRequests: pendingFriendRequests,
    unreadChats,
    groupActivities,
    groupJoinRequests,
    total:
      pendingInvitations.length +
      pendingFriendRequests.length +
      unreadChats.length +
      unreadGroupActivities.length +
      groupJoinRequests.length
  };
}

export async function getPendingNotificationsCountForUser(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const [invitationsResult, friendRequestsResult, unreadChatSummaries, activityFeed, activityLastSeenAt, groupJoinRequests] = await Promise.all([
    supabase
      .from("group_invitations")
      .select("id", { count: "exact", head: true })
      .eq("invited_user_id", userId)
      .eq("status", "pending"),
    supabase
      .from("friend_requests")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("status", "pending"),
    getGroupChatUnreadSummariesForUser(userId),
    getGroupActivityFeedForUser(userId, 20, { includeGroupName: true, maxAgeDays: 14 }),
    getGroupActivityLastSeenAtForUser(userId),
    getPendingGroupJoinRequestNotifications(userId)
  ]);

  const unreadGroupActivitiesCount = activityFeed.filter(
    (item) =>
      item.actorUserId !== userId &&
      (!activityLastSeenAt || new Date(item.createdAt).getTime() > new Date(activityLastSeenAt).getTime())
  ).length;

  return (
    (invitationsResult.count || 0) +
    (friendRequestsResult.count || 0) +
    unreadChatSummaries.length +
    unreadGroupActivitiesCount +
    groupJoinRequests.length
  );
}
