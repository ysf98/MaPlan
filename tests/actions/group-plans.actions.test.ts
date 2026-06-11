import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();
const requireAuthenticatedUserMock = vi.fn();
const getValidationErrorMessageMock = vi.fn(() => "Payload invalido.");
const createGroupPlanMock = vi.fn();
const addDraftPlaceToGroupPlanMock = vi.fn();
const voteGroupPlanMock = vi.fn();
const removePlaceFromGroupPlanMock = vi.fn();
const updateGroupPlanPlaceTimeMock = vi.fn();
const createPlaceMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

vi.mock("@/lib/actions/serverAction", () => ({
  getValidationErrorMessage: getValidationErrorMessageMock,
  requireAuthenticatedUser: requireAuthenticatedUserMock
}));

vi.mock("@/lib/groupPlans", () => ({
  addDraftPlaceToGroupPlan: addDraftPlaceToGroupPlanMock,
  addPlaceToGroupPlan: vi.fn(),
  createGroupPlan: createGroupPlanMock,
  deleteGroupPlan: vi.fn(),
  removePlaceFromGroupPlan: removePlaceFromGroupPlanMock,
  updateGroupPlanDate: vi.fn(),
  updateGroupPlanDetails: vi.fn(),
  updateGroupPlanPlaceTime: updateGroupPlanPlaceTimeMock,
  voteGroupPlan: voteGroupPlanMock
}));

vi.mock("@/lib/places", () => ({
  createPlace: createPlaceMock,
  deletePlace: vi.fn(),
  updatePlaceFavorite: vi.fn(),
  updatePlaceLocation: vi.fn(),
  updatePlaceName: vi.fn(),
  updatePlaceStatus: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/groupPermissions", () => ({
  canChangeGroupPrivacy: vi.fn(),
  canEditGroupDetails: vi.fn(),
  canReviewJoinRequests: vi.fn(),
  isGroupOwner: vi.fn()
}));

const user = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };
const groupId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const planPlaceId = "33333333-3333-4333-8333-333333333333";

function draftPlaceFormData() {
  const formData = new FormData();
  formData.set("groupId", groupId);
  formData.set("planId", planId);
  formData.set("name", "Bar La Palma");
  formData.set("address", "Carrer de Formentera");
  formData.set("city", "Gandia");
  formData.set("category", "Restaurante");
  formData.set("source", "google_maps");
  formData.set("provider", "google_places");
  formData.set("externalPlaceId", "google-1");
  formData.set("googleMapsUrl", "https://maps.google.com/?cid=1");
  formData.set("businessStatus", "OPERATIONAL");
  formData.set("phoneNumber", "+34960000000");
  formData.set("rating", "4.5");
  formData.set("userRatingsTotal", "120");
  formData.set("imageUrl", "https://example.com/photo.jpg");
  formData.set("latitude", "38.966");
  formData.set("longitude", "-0.181");
  formData.set("notes", "");
  formData.set("originalUrl", "");
  formData.set("plannedAt", "2099-07-10T21:15");
  formData.set("note", "Reservar mesa");
  return formData;
}

describe("group plan server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedUserMock.mockResolvedValue(user);
    createGroupPlanMock.mockResolvedValue({ error: null, planId });
    addDraftPlaceToGroupPlanMock.mockResolvedValue({ error: null });
    voteGroupPlanMock.mockResolvedValue({ error: null });
    removePlaceFromGroupPlanMock.mockResolvedValue({ error: null });
    updateGroupPlanPlaceTimeMock.mockResolvedValue({ error: null });
  });

  it("createGroupPlanAction validates payload before calling domain", async () => {
    const { createGroupPlanAction } = await import("@/app/groups/[groupId]/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("title", "   ");
    formData.set("plannedDate", "2099-07-10");

    const result = await createGroupPlanAction({ error: null, planId: null, requestId: null, success: false }, formData);

    expect(result.success).toBe(false);
    expect(createGroupPlanMock).not.toHaveBeenCalled();
  });

  it("createGroupPlanAction calls domain and revalidates group plus detail route", async () => {
    const { createGroupPlanAction } = await import("@/app/groups/[groupId]/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("title", "Ruta de tapas");
    formData.set("plannedDate", "2099-07-10");

    const result = await createGroupPlanAction({ error: null, planId: null, requestId: null, success: false }, formData);

    expect(result).toMatchObject({ error: null, planId, success: true });
    expect(createGroupPlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId,
        plannedDate: "2099-07-10",
        title: "Ruta de tapas",
        userId: user.id
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}`);
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/plans/${planId}`);
  });

  it("addDraftPlaceToGroupPlanAction adds snapshot-only place without creating a group place", async () => {
    const { addDraftPlaceToGroupPlanAction } = await import("@/app/groups/[groupId]/actions");

    const result = await addDraftPlaceToGroupPlanAction({ error: null, success: false }, draftPlaceFormData());

    expect(result).toEqual({ error: null, success: true });
    expect(createPlaceMock).not.toHaveBeenCalled();
    expect(addDraftPlaceToGroupPlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId,
        name: "Bar La Palma",
        planId,
        plannedAt: "2099-07-10T21:15",
        userId: user.id
      })
    );
  });

  it("voteGroupPlanAction accepts maybe votes and revalidates detail route", async () => {
    const { voteGroupPlanAction } = await import("@/app/groups/[groupId]/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("planId", planId);
    formData.set("vote", "maybe");

    const result = await voteGroupPlanAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(voteGroupPlanMock).toHaveBeenCalledWith({ groupId, planId, userId: user.id, vote: "maybe" });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/plans/${planId}`);
  });

  it("removeGroupPlanPlaceAction calls domain and revalidates group plus detail route", async () => {
    const { removeGroupPlanPlaceAction } = await import("@/app/groups/[groupId]/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("planId", planId);
    formData.set("planPlaceId", planPlaceId);
    formData.set("requestId", "request-1");

    const result = await removeGroupPlanPlaceAction({ error: null, success: false }, formData);

    expect(result).toMatchObject({ error: null, planPlaceId, requestId: "request-1", success: true });
    expect(removePlaceFromGroupPlanMock).toHaveBeenCalledWith({ groupId, planId, planPlaceId, userId: user.id });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}`);
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/plans/${planId}`);
  });

  it("updateGroupPlanPlaceTimeAction calls domain and revalidates group plus detail route", async () => {
    const { updateGroupPlanPlaceTimeAction } = await import("@/app/groups/[groupId]/actions");
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("planId", planId);
    formData.set("planPlaceId", planPlaceId);
    formData.set("plannedAt", "2099-07-10T21:15");
    formData.set("requestId", "request-2");

    const result = await updateGroupPlanPlaceTimeAction({ error: null, success: false }, formData);

    expect(result).toMatchObject({ error: null, planPlaceId, requestId: "request-2", success: true });
    expect(updateGroupPlanPlaceTimeMock).toHaveBeenCalledWith({
      groupId,
      planId,
      planPlaceId,
      plannedAt: "2099-07-10T21:15",
      userId: user.id
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}`);
    expect(revalidatePathMock).toHaveBeenCalledWith(`/groups/${groupId}/plans/${planId}`);
  });
});
