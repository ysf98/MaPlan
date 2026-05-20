import { beforeEach, describe, expect, it, vi } from "vitest";

const getGroupInvitationsForUserMock = vi.fn();
const getFriendRequestsMock = vi.fn();

vi.mock("@/lib/groupInvitations", () => ({
  getGroupInvitationsForUser: getGroupInvitationsForUserMock
}));

vi.mock("@/lib/friends", () => ({
  getFriendRequests: getFriendRequestsMock
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

    const { getPendingNotificationsForUser, getPendingNotificationsCountForUser } = await import("@/lib/notifications");
    const pending = await getPendingNotificationsForUser("user-me");
    const count = await getPendingNotificationsCountForUser("user-me");

    expect(pending.invitations).toHaveLength(1);
    expect(pending.friendRequests).toHaveLength(1);
    expect(pending.total).toBe(2);
    expect(count).toBe(2);
  });
});
