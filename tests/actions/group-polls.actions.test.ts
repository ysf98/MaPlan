import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();
const requireAuthenticatedUserMock = vi.fn();
const createGroupPollMock = vi.fn();
const voteGroupPollMock = vi.fn();
const respondGroupAvailabilityMock = vi.fn();
const closeGroupPollMock = vi.fn();
const deleteGroupPollMock = vi.fn();
const convertGroupPollToPlanMock = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/actions/serverAction", () => ({
  getValidationErrorMessage: vi.fn(() => "Payload inválido."),
  requireAuthenticatedUser: requireAuthenticatedUserMock
}));
vi.mock("@/lib/groupPolls", () => ({
  closeGroupPoll: closeGroupPollMock,
  convertGroupPollToPlan: convertGroupPollToPlanMock,
  createGroupPoll: createGroupPollMock,
  deleteGroupPoll: deleteGroupPollMock,
  respondGroupAvailability: respondGroupAvailabilityMock,
  voteGroupPoll: voteGroupPollMock
}));

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const groupId = "11111111-1111-4111-8111-111111111111";
const pollId = "22222222-2222-4222-8222-222222222222";
const optionId = "33333333-3333-4333-8333-333333333333";
const firstPlaceId = "55555555-5555-4555-8555-555555555555";
const secondPlaceId = "66666666-6666-4666-8666-666666666666";

describe("group poll server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedUserMock.mockResolvedValue({ id: userId });
    createGroupPollMock.mockResolvedValue({ error: null, pollId });
    voteGroupPollMock.mockResolvedValue({ error: null });
    closeGroupPollMock.mockResolvedValue({ error: null });
    deleteGroupPollMock.mockResolvedValue({ error: null });
    convertGroupPollToPlanMock.mockResolvedValue({ error: null, planId: "44444444-4444-4444-8444-444444444444" });
  });

  it("valida y crea una encuesta de lugares", async () => {
    const { createGroupPollAction } = await import("@/app/groups/[groupId]/decisions/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("kind", "poll");
    formData.set("pollType", "place");
    formData.set("title", "¿Dónde cenamos?");
    formData.set("options", JSON.stringify([
      { label: "Centro", placeId: firstPlaceId },
      { label: "Playa", placeId: secondPlaceId }
    ]));

    const result = await createGroupPollAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, pollId, success: true });
    expect(createGroupPollMock).toHaveBeenCalledWith(expect.objectContaining({
      groupId,
      kind: "poll",
      pollType: "place",
      userId
    }));
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/decisions`);
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/chat`);
  });

  it("rechaza encuestas que no sean de lugares", async () => {
    const { createGroupPollAction } = await import("@/app/groups/[groupId]/decisions/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("kind", "poll");
    formData.set("pollType", "time");
    formData.set("title", "¿A qué hora?");
    formData.set("options", JSON.stringify([
      { label: "20:00", placeId: firstPlaceId },
      { label: "21:00", placeId: secondPlaceId }
    ]));

    const result = await createGroupPollAction({ error: null, success: false }, formData);

    expect(result.success).toBe(false);
    expect(createGroupPollMock).not.toHaveBeenCalled();
  });

  it("rechaza lugares duplicados", async () => {
    const { createGroupPollAction } = await import("@/app/groups/[groupId]/decisions/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("kind", "poll");
    formData.set("pollType", "place");
    formData.set("title", "¿Dónde cenamos?");
    formData.set("options", JSON.stringify([
      { label: "Centro", placeId: firstPlaceId },
      { label: "Centro otra vez", placeId: firstPlaceId }
    ]));

    const result = await createGroupPollAction({ error: null, success: false }, formData);

    expect(result.success).toBe(false);
    expect(createGroupPollMock).not.toHaveBeenCalled();
  });

  it("rechaza opciones JSON dañadas", async () => {
    const { createGroupPollAction } = await import("@/app/groups/[groupId]/decisions/actions");
    const formData = new FormData();
    formData.set("options", "{");

    const result = await createGroupPollAction({ error: null, success: false }, formData);

    expect(result.success).toBe(false);
    expect(createGroupPollMock).not.toHaveBeenCalled();
  });

  it("permite cambiar el voto mediante la acción", async () => {
    const { voteGroupPollAction } = await import("@/app/groups/[groupId]/decisions/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("pollId", pollId);
    formData.set("optionId", optionId);

    await expect(voteGroupPollAction({ error: null, success: false }, formData)).resolves.toEqual({
      error: null,
      success: true
    });
    expect(voteGroupPollMock).toHaveBeenCalledWith({ groupId, optionId, pollId, userId });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/chat`);
  });

  it("elimina una encuesta y revalida grupo, decisiones y chat", async () => {
    const { deleteGroupPollAction } = await import("@/app/groups/[groupId]/decisions/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("pollId", pollId);

    await expect(deleteGroupPollAction({ error: null, success: false }, formData)).resolves.toEqual({
      error: null,
      success: true
    });
    expect(deleteGroupPollMock).toHaveBeenCalledWith({ groupId, pollId, userId });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}`);
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/decisions`);
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/chat`);
  });
});
