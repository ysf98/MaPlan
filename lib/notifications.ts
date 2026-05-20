import { getFriendRequests } from "@/lib/friends";
import { getGroupInvitationsForUser } from "@/lib/groupInvitations";

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
    };

export type PendingNotifications = {
  pendingInvitations: NotificationItem[];
  reviewedInvitations: NotificationItem[];
  friendRequests: NotificationItem[];
  total: number;
};

export async function getPendingNotificationsForUser(userId: string): Promise<PendingNotifications> {
  const [invitations, friendRequests] = await Promise.all([
    getGroupInvitationsForUser(userId),
    getFriendRequests(userId)
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

  return {
    pendingInvitations,
    reviewedInvitations,
    friendRequests: pendingFriendRequests,
    total: pendingInvitations.length + pendingFriendRequests.length
  };
}

export async function getPendingNotificationsCountForUser(userId: string): Promise<number> {
  const pending = await getPendingNotificationsForUser(userId);
  return pending.total;
}
