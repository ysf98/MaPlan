import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const revalidatePathMock = vi.fn();
const getCurrentUserMock = vi.fn();
const createPlaceMock = vi.fn();
const updatePlaceStatusMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/auth/getCurrentUser", () => ({
  getCurrentUser: getCurrentUserMock
}));

vi.mock("@/lib/places", () => ({
  createPlace: createPlaceMock,
  updatePlaceStatus: updatePlaceStatusMock
}));

describe("places server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => {
      throw new Error("redirect");
    });
  });

  it("addPlaceAction rejects invalid payload", async () => {
    const { addPlaceAction } = await import("@/app/groups/[groupId]/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });

    const formData = new FormData();
    formData.set("groupId", "");
    formData.set("name", "");
    formData.set("address", "");

    const result = await addPlaceAction({ error: null, success: false }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Grupo invalido.");
  });

  it("updatePlaceStatusAction updates and revalidates", async () => {
    const { updatePlaceStatusAction } = await import("@/app/groups/[groupId]/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    updatePlaceStatusMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("groupId", "group-1");
    formData.set("placeId", "place-1");
    formData.set("status", "visited");

    const result = await updatePlaceStatusAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(updatePlaceStatusMock).toHaveBeenCalledWith({
      userId: "user-1",
      groupId: "group-1",
      placeId: "place-1",
      status: "visited"
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/groups/group-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });
});
