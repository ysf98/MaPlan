import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();
const requireAuthenticatedUserMock = vi.fn();
const getValidationErrorMessageMock = vi.fn(() => "Payload invalido.");
const createGroupChatMessageMock = vi.fn();
const deleteGroupChatMessageMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/actions/serverAction", () => ({
  getValidationErrorMessage: getValidationErrorMessageMock,
  requireAuthenticatedUser: requireAuthenticatedUserMock
}));

vi.mock("@/lib/groupChat", () => ({
  createGroupChatMessage: createGroupChatMessageMock,
  deleteGroupChatMessage: deleteGroupChatMessageMock
}));

const user = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };
const groupId = "11111111-1111-4111-8111-111111111111";
const messageId = "22222222-2222-4222-8222-222222222222";

describe("group chat server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedUserMock.mockResolvedValue(user);
    createGroupChatMessageMock.mockResolvedValue({ error: null });
    deleteGroupChatMessageMock.mockResolvedValue({ error: null });
  });

  it("createGroupChatMessageAction validates payload", async () => {
    const { createGroupChatMessageAction } = await import("@/app/groups/[groupId]/chat/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("content", "   ");

    const result = await createGroupChatMessageAction({ error: null, success: false }, formData);

    expect(result.success).toBe(false);
    expect(createGroupChatMessageMock).not.toHaveBeenCalled();
  });

  it("createGroupChatMessageAction calls domain and revalidates group", async () => {
    const { createGroupChatMessageAction } = await import("@/app/groups/[groupId]/chat/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("content", "Podriamos reservar terraza.");
    formData.set("kind", "plan_suggestion");
    formData.set("planId", "33333333-3333-4333-8333-333333333333");

    const result = await createGroupChatMessageAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(createGroupChatMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Podriamos reservar terraza.",
        groupId,
        kind: "plan_suggestion",
        planId: "33333333-3333-4333-8333-333333333333",
        userId: user.id
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}`);
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/chat`);
  });

  it("deleteGroupChatMessageAction calls domain and revalidates group", async () => {
    const { deleteGroupChatMessageAction } = await import("@/app/groups/[groupId]/chat/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("messageId", messageId);

    const result = await deleteGroupChatMessageAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(deleteGroupChatMessageMock).toHaveBeenCalledWith({ groupId, messageId, userId: user.id });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}`);
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/chat`);
  });
});
