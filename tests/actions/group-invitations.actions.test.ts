import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const revalidatePathMock = vi.fn();
const getCurrentUserMock = vi.fn();
const inviteFriendToGroupMock = vi.fn();
const respondGroupInvitationMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/auth/getCurrentUser", () => ({
  getCurrentUser: getCurrentUserMock
}));

vi.mock("@/lib/groupInvitations", () => ({
  inviteFriendToGroup: inviteFriendToGroupMock,
  respondGroupInvitation: respondGroupInvitationMock
}));

describe("group invitations actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => {
      throw new Error("redirect");
    });
  });

  it("inviteFriendToGroupAction calls domain", async () => {
    const { inviteFriendToGroupAction } = await import("@/app/groups/[groupId]/invitations/actions");
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    inviteFriendToGroupMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("groupId", "11111111-1111-4111-8111-111111111111");
    formData.set("friendUserId", "22222222-2222-4222-8222-222222222222");

    const result = await inviteFriendToGroupAction({ error: null, success: false }, formData);
    expect(result).toEqual({ error: null, success: true });
    expect(inviteFriendToGroupMock).toHaveBeenCalledWith(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222"
    );
  });

  it("inviteFriendToGroupAction returns domain security error (no owner/no friend)", async () => {
    const { inviteFriendToGroupAction } = await import("@/app/groups/[groupId]/invitations/actions");
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    inviteFriendToGroupMock.mockResolvedValue({ error: "No tienes permisos para invitar amigos a este grupo." });

    const formData = new FormData();
    formData.set("groupId", "11111111-1111-4111-8111-111111111111");
    formData.set("friendUserId", "22222222-2222-4222-8222-222222222222");

    const result = await inviteFriendToGroupAction({ error: null, success: false }, formData);
    expect(result).toEqual({ error: "No tienes permisos para invitar amigos a este grupo.", success: false });
  });

  it("inviteFriendToGroupAction rejects invalid ids", async () => {
    const { inviteFriendToGroupAction } = await import("@/app/groups/[groupId]/invitations/actions");
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });

    const formData = new FormData();
    formData.set("groupId", "invalid");
    formData.set("friendUserId", "invalid");

    const result = await inviteFriendToGroupAction({ error: null, success: false }, formData);
    expect(result.success).toBe(false);
    expect(inviteFriendToGroupMock).not.toHaveBeenCalled();
  });

  it("respondGroupInvitationAction calls domain", async () => {
    const { respondGroupInvitationAction } = await import("@/app/invitations/actions");
    getCurrentUserMock.mockResolvedValue({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });
    respondGroupInvitationMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("invitationId", "33333333-3333-4333-8333-333333333333");
    formData.set("decision", "accepted");

    const result = await respondGroupInvitationAction({ error: null, success: false }, formData);
    expect(result).toEqual({ error: null, success: true });
    expect(respondGroupInvitationMock).toHaveBeenCalledWith(
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "33333333-3333-4333-8333-333333333333",
      "accepted"
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/invitations");
  });

  it("respondGroupInvitationAction rejects invalid decision", async () => {
    const { respondGroupInvitationAction } = await import("@/app/invitations/actions");
    getCurrentUserMock.mockResolvedValue({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });

    const formData = new FormData();
    formData.set("invitationId", "33333333-3333-4333-8333-333333333333");
    formData.set("decision", "pending");

    const result = await respondGroupInvitationAction({ error: null, success: false }, formData);
    expect(result.success).toBe(false);
    expect(respondGroupInvitationMock).not.toHaveBeenCalled();
  });

  it("respondGroupInvitationAction returns domain security error", async () => {
    const { respondGroupInvitationAction } = await import("@/app/invitations/actions");
    getCurrentUserMock.mockResolvedValue({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });
    respondGroupInvitationMock.mockResolvedValue({ error: "No tienes permisos para responder esta invitacion." });

    const formData = new FormData();
    formData.set("invitationId", "33333333-3333-4333-8333-333333333333");
    formData.set("decision", "accepted");

    const result = await respondGroupInvitationAction({ error: null, success: false }, formData);
    expect(result).toEqual({ error: "No tienes permisos para responder esta invitacion.", success: false });
  });
});
