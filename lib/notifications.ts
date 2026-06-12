import { getFriendRequests } from "@/lib/friends";
import { getGroupActivityFeedForUser, type GroupActivityFeedItem } from "@/lib/groupActivity";
import { getGroupChatUnreadSummariesForUser } from "@/lib/groupChat";
import { getGroupInvitationsForUser } from "@/lib/groupInvitations";
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
    };

export type PendingNotifications = {
  pendingInvitations: NotificationItem[];
  reviewedInvitations: NotificationItem[];
  friendRequests: NotificationItem[];
  groupActivities: NotificationItem[];
  unreadChats: NotificationItem[];
  total: number;
};

export async function getPendingNotificationsForUser(userId: string): Promise<PendingNotifications> {
  const [invitations, friendRequests, unreadChatSummaries, activityFeed] = await Promise.all([
    getGroupInvitationsForUser(userId),
    getFriendRequests(userId),
    getGroupChatUnreadSummariesForUser(userId),
    getGroupActivityFeedForUser(userId, 20, { includeGroupName: true, maxAgeDays: 14 })
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

  return {
    pendingInvitations,
    reviewedInvitations,
    friendRequests: pendingFriendRequests,
    unreadChats,
    groupActivities,
    total: pendingInvitations.length + pendingFriendRequests.length + unreadChats.length + groupActivities.length
  };
}

export async function getPendingNotificationsCountForUser(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const [invitationsResult, friendRequestsResult, unreadChatSummaries, activityFeed] = await Promise.all([
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
    getGroupActivityFeedForUser(userId, 20, { includeGroupName: true, maxAgeDays: 14 })
  ]);

  return (
    (invitationsResult.count || 0) +
    (friendRequestsResult.count || 0) +
    unreadChatSummaries.length +
    activityFeed.filter((item) => item.actorUserId !== userId).length
  );
}
