import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const revalidatePathMock = vi.fn();
const getCurrentUserMock = vi.fn();
const createPlaceMock = vi.fn();
const updatePlaceStatusMock = vi.fn();
const updatePlaceLocationMock = vi.fn();
const deletePlaceMock = vi.fn();

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
  updatePlaceStatus: updatePlaceStatusMock,
  updatePlaceLocation: updatePlaceLocationMock,
  deletePlace: deletePlaceMock
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
    formData.set("groupId", "not-a-uuid");
    formData.set("name", "");
    formData.set("address", "");

    const result = await addPlaceAction({ error: null, success: false }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Identificador invalido.");
  });

  it("updatePlaceStatusAction updates and revalidates", async () => {
    const { updatePlaceStatusAction } = await import("@/app/groups/[groupId]/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    updatePlaceStatusMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("groupId", "11111111-1111-4111-8111-111111111111");
    formData.set("placeId", "22222222-2222-4222-8222-222222222222");
    formData.set("status", "visited");

    const result = await updatePlaceStatusAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(updatePlaceStatusMock).toHaveBeenCalledWith({
      userId: "user-1",
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      status: "visited"
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/groups/11111111-1111-4111-8111-111111111111");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("updatePlaceLocationAction updates and revalidates", async () => {
    const { updatePlaceLocationAction } = await import("@/app/groups/[groupId]/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    updatePlaceLocationMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("groupId", "11111111-1111-4111-8111-111111111111");
    formData.set("placeId", "22222222-2222-4222-8222-222222222222");
    formData.set("address", "Madrid Centro");
    formData.set("latitude", "40.4168");
    formData.set("longitude", "-3.7038");

    const result = await updatePlaceLocationAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(updatePlaceLocationMock).toHaveBeenCalledWith({
      userId: "user-1",
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      address: "Madrid Centro",
      city: null,
      latitude: 40.4168,
      longitude: -3.7038
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/groups/11111111-1111-4111-8111-111111111111");
  });
});
