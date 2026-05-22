import { beforeEach, describe, expect, it, vi } from "vitest";

const getGroupInvitationsForUserMock = vi.fn();
const getFriendRequestsMock = vi.fn();
const createSupabaseServerClientMock = vi.fn();

vi.mock("@/lib/groupInvitations", () => ({
  getGroupInvitationsForUser: getGroupInvitationsForUserMock
}));

vi.mock("@/lib/friends", () => ({
  getFriendRequests: getFriendRequestsMock
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

describe("notifications lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(pending.total).toBe(2);
    expect(count).toBe(2);
    expect(fromMock).toHaveBeenCalledWith("group_invitations");
    expect(fromMock).toHaveBeenCalledWith("friend_requests");
    expect(selectMock).toHaveBeenCalledWith("id", { count: "exact", head: true });
  });
});
