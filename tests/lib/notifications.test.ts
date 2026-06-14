import { beforeEach, describe, expect, it, vi } from "vitest";

const getGroupInvitationsForUserMock = vi.fn();
const getFriendRequestsMock = vi.fn();
const getGroupActivityFeedForUserMock = vi.fn();
const getGroupActivityLastSeenAtForUserMock = vi.fn();
const getGroupChatUnreadSummariesForUserMock = vi.fn();
const createSupabaseServerClientMock = vi.fn();

vi.mock("@/lib/groupInvitations", () => ({
  getGroupInvitationsForUser: getGroupInvitationsForUserMock
}));

vi.mock("@/lib/friends", () => ({
  getFriendRequests: getFriendRequestsMock
}));

vi.mock("@/lib/groupActivity", () => ({
  getGroupActivityFeedForUser: getGroupActivityFeedForUserMock,
  getGroupActivityLastSeenAtForUser: getGroupActivityLastSeenAtForUserMock
}));

vi.mock("@/lib/groupChat", () => ({
  getGroupChatUnreadSummariesForUser: getGroupChatUnreadSummariesForUserMock
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

describe("notifications lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGroupActivityLastSeenAtForUserMock.mockResolvedValue(null);
  });

  it("builds pending notifications and total count", async () => {
    getGroupInvitationsForUserMock.mockResolvedValue([
      {
        id: "inv-1",
        groupId: "group-1",
        groupName: "Grupo Madrid",
        invitedBy: "user-a",
        invitedByUsername: "ana",
        invitedUserId: "user-me",
        status: "pending",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      },
      {
        id: "inv-2",
        groupId: "group-2",
        groupName: "Grupo Barcelona",
        invitedBy: "user-b",
        invitedByUsername: "luis",
        invitedUserId: "user-me",
        status: "accepted",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ]);

    getFriendRequestsMock.mockResolvedValue({
      received: [
        {
          id: "req-1",
          senderId: "user-c",
          receiverId: "user-me",
          status: "pending",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          senderUsername: "carlos",
          receiverUsername: "me"
        }
      ],
      sent: []
    });
    getGroupChatUnreadSummariesForUserMock.mockResolvedValue([
      {
        groupId: "group-1",
        groupName: "Grupo Madrid",
        latestMessageAt: "2026-01-01T02:00:00.000Z",
        unreadCount: 3
      }
    ]);
    getGroupActivityFeedForUserMock.mockResolvedValue([
      {
        id: "activity-1",
        groupId: "group-1",
        groupName: "Grupo Madrid",
        actorUserId: "user-other",
        actorUsername: "ana",
        actorAvatarUrl: null,
        eventType: "plan_created",
        entityId: "plan-1",
        entityName: "Tapas",
        createdAt: "2026-01-01T03:00:00.000Z",
        message: '@ana ha creado "Tapas" en "Grupo Madrid".',
        href: "/groups/group-1/plans/plan-1"
      },
      {
        id: "activity-own",
        groupId: "group-1",
        groupName: "Grupo Madrid",
        actorUserId: "user-me",
        actorUsername: "me",
        actorAvatarUrl: null,
        eventType: "place_added",
        entityId: "place-1",
        entityName: "Bar",
        createdAt: "2026-01-01T04:00:00.000Z",
        message: '@me anadio "Bar" en "Grupo Madrid".',
        href: "/groups/group-1?tab=mapa&placeId=place-1"
      }
    ]);

    const invitationCountQuery = {
      eq: vi.fn()
    };
    invitationCountQuery.eq.mockReturnValueOnce(invitationCountQuery).mockResolvedValueOnce({ count: 1 });

    const friendRequestCountQuery = {
      eq: vi.fn()
    };
    friendRequestCountQuery.eq.mockReturnValueOnce(friendRequestCountQuery).mockResolvedValueOnce({ count: 1 });
    const selectMock = vi
      .fn()
      .mockReturnValueOnce(invitationCountQuery)
      .mockReturnValueOnce(friendRequestCountQuery);
    const fromMock = vi.fn().mockReturnValue({ select: selectMock });

    createSupabaseServerClientMock.mockResolvedValue({
      from: fromMock
    });

    const { getPendingNotificationsForUser, getPendingNotificationsCountForUser } = await import("@/lib/notifications");
    const pending = await getPendingNotificationsForUser("user-me");
    const count = await getPendingNotificationsCountForUser("user-me");

    expect(pending.pendingInvitations).toHaveLength(1);
    expect(pending.reviewedInvitations).toHaveLength(1);
    expect(pending.friendRequests).toHaveLength(1);
    expect(pending.unreadChats).toHaveLength(1);
    expect(pending.groupActivities).toHaveLength(1);
    expect(pending.total).toBe(4);
    expect(count).toBe(4);
    expect(fromMock).toHaveBeenCalledWith("group_invitations");
    expect(fromMock).toHaveBeenCalledWith("friend_requests");
    expect(selectMock).toHaveBeenCalledWith("id", { count: "exact", head: true });
  });

  it("keeps seen group activity visible but excludes it from the unread total", async () => {
    getGroupInvitationsForUserMock.mockResolvedValue([]);
    getFriendRequestsMock.mockResolvedValue({ received: [], sent: [] });
    getGroupChatUnreadSummariesForUserMock.mockResolvedValue([]);
    getGroupActivityLastSeenAtForUserMock.mockResolvedValue("2026-01-01T03:30:00.000Z");
    getGroupActivityFeedForUserMock.mockResolvedValue([
      {
        id: "activity-seen",
        groupId: "group-1",
        groupName: "Grupo Madrid",
        actorUserId: "user-other",
        actorUsername: "ana",
        actorAvatarUrl: null,
        eventType: "plan_created",
        entityId: "plan-1",
        entityName: "Tapas",
        createdAt: "2026-01-01T03:00:00.000Z",
        message: '@ana ha creado "Tapas" en "Grupo Madrid".',
        href: "/groups/group-1/plans/plan-1"
      }
    ]);

    const invitationCountQuery = { eq: vi.fn() };
    invitationCountQuery.eq.mockReturnValueOnce(invitationCountQuery).mockResolvedValueOnce({ count: 0 });
    const friendRequestCountQuery = { eq: vi.fn() };
    friendRequestCountQuery.eq.mockReturnValueOnce(friendRequestCountQuery).mockResolvedValueOnce({ count: 0 });
    const selectMock = vi.fn().mockReturnValueOnce(invitationCountQuery).mockReturnValueOnce(friendRequestCountQuery);
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: selectMock })
    });

    const { getPendingNotificationsForUser, getPendingNotificationsCountForUser } = await import("@/lib/notifications");
    const pending = await getPendingNotificationsForUser("user-me");
    const count = await getPendingNotificationsCountForUser("user-me");

    expect(pending.groupActivities).toHaveLength(1);
    expect(pending.total).toBe(0);
    expect(count).toBe(0);
  });
});
