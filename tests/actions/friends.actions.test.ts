import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const revalidatePathMock = vi.fn();
const getCurrentUserMock = vi.fn();
const sendFriendRequestMock = vi.fn();
const respondFriendRequestMock = vi.fn();
const removeFriendMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/auth/getCurrentUser", () => ({
  getCurrentUser: getCurrentUserMock
}));

vi.mock("@/lib/friends", () => ({
  sendFriendRequest: sendFriendRequestMock,
  respondFriendRequest: respondFriendRequestMock,
  removeFriend: removeFriendMock
}));

describe("friends actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => {
      throw new Error("redirect");
    });
  });

  it("sendFriendRequestAction validates payload", async () => {
    const { sendFriendRequestAction } = await import("@/app/friends/actions");
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });

    const formData = new FormData();
    formData.set("receiverId", "bad-id");

    const result = await sendFriendRequestAction({ error: null, success: false }, formData);
    expect(result.success).toBe(false);
  });

  it("sendFriendRequestAction calls domain and revalidates", async () => {
    const { sendFriendRequestAction } = await import("@/app/friends/actions");
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    sendFriendRequestMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("receiverId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

    const result = await sendFriendRequestAction({ error: null, success: false }, formData);
    expect(result).toEqual({ error: null, success: true });
    expect(sendFriendRequestMock).toHaveBeenCalledWith(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/friends");
  });

  it("respondFriendRequestAction only accepts valid decisions", async () => {
    const { respondFriendRequestAction } = await import("@/app/friends/actions");
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });

    const formData = new FormData();
    formData.set("requestId", "11111111-1111-4111-8111-111111111111");
    formData.set("decision", "pending");

    const result = await respondFriendRequestAction({ error: null, success: false }, formData);
    expect(result.success).toBe(false);
  });

  it("removeFriendAction removes friendship and revalidates", async () => {
    const { removeFriendAction } = await import("@/app/friends/actions");
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    removeFriendMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("friendUserId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

    const result = await removeFriendAction({ error: null, success: false }, formData);
    expect(result).toEqual({ error: null, success: true });
    expect(removeFriendMock).toHaveBeenCalledWith(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/friends");
  });
});
