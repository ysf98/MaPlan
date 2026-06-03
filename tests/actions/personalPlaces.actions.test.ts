import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePathMock,
  requireAuthenticatedUserMock,
  createPersonalPlaceMock,
  deletePersonalPlaceMock,
  updatePersonalPlaceFavoriteMock,
  updatePersonalPlaceNameMock,
  updatePersonalPlaceStatusMock
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  requireAuthenticatedUserMock: vi.fn(),
  createPersonalPlaceMock: vi.fn(),
  deletePersonalPlaceMock: vi.fn(),
  updatePersonalPlaceFavoriteMock: vi.fn(),
  updatePersonalPlaceNameMock: vi.fn(),
  updatePersonalPlaceStatusMock: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/actions/serverAction", () => ({
  requireAuthenticatedUser: requireAuthenticatedUserMock,
  getValidationErrorMessage: (error: { issues?: Array<{ message?: string }> }) => error.issues?.[0]?.message ?? "Datos invalidos."
}));

vi.mock("@/lib/personalPlaces", () => ({
  createPersonalPlace: createPersonalPlaceMock,
  deletePersonalPlace: deletePersonalPlaceMock,
  updatePersonalPlaceFavorite: updatePersonalPlaceFavoriteMock,
  updatePersonalPlaceName: updatePersonalPlaceNameMock,
  updatePersonalPlaceStatus: updatePersonalPlaceStatusMock
}));

let mapActions: typeof import("@/app/map/actions");

describe("personal places server actions", () => {
  beforeAll(async () => {
    mapActions = await import("@/app/map/actions");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedUserMock.mockResolvedValue({ id: "user-1" });
  });

  it("updatePersonalPlaceStatusAction updates own personal place and revalidates map", async () => {
    updatePersonalPlaceStatusMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("placeId", "22222222-2222-4222-8222-222222222222");
    formData.set("status", "visited");

    const result = await mapActions.updatePersonalPlaceStatusAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(updatePersonalPlaceStatusMock).toHaveBeenCalledWith({
      userId: "user-1",
      placeId: "22222222-2222-4222-8222-222222222222",
      status: "visited"
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/map");
  });

  it("updatePersonalPlaceFavoriteAction updates own personal favorite and revalidates map", async () => {
    updatePersonalPlaceFavoriteMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("placeId", "22222222-2222-4222-8222-222222222222");
    formData.set("isFavorite", "true");

    const result = await mapActions.updatePersonalPlaceFavoriteAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(updatePersonalPlaceFavoriteMock).toHaveBeenCalledWith({
      userId: "user-1",
      placeId: "22222222-2222-4222-8222-222222222222",
      isFavorite: true
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/map");
  });

  it("updatePersonalPlaceStatusAction rejects invalid status", async () => {
    const formData = new FormData();
    formData.set("placeId", "22222222-2222-4222-8222-222222222222");
    formData.set("status", "favorite");

    const result = await mapActions.updatePersonalPlaceStatusAction({ error: null, success: false }, formData);

    expect(result.success).toBe(false);
    expect(updatePersonalPlaceStatusMock).not.toHaveBeenCalled();
  });
});
