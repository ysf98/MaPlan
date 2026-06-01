import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidatePathMock,
  requireAuthenticatedUserMock,
  createPlaceMock,
  updatePlaceFavoriteMock,
  updatePlaceStatusMock,
  updatePlaceLocationMock,
  deletePlaceMock
} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  requireAuthenticatedUserMock: vi.fn(),
  createPlaceMock: vi.fn(),
  updatePlaceFavoriteMock: vi.fn(),
  updatePlaceStatusMock: vi.fn(),
  updatePlaceLocationMock: vi.fn(),
  deletePlaceMock: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/auth/getCurrentUser", () => ({
  getCurrentUser: vi.fn()
}));

vi.mock("@/lib/actions/serverAction", () => ({
  requireAuthenticatedUser: requireAuthenticatedUserMock,
  getValidationErrorMessage: (error: { issues?: Array<{ message?: string }> }) => error.issues?.[0]?.message ?? "Datos invalidos."
}));

vi.mock("@/lib/places", () => ({
  createPlace: createPlaceMock,
  updatePlaceFavorite: updatePlaceFavoriteMock,
  updatePlaceStatus: updatePlaceStatusMock,
  updatePlaceLocation: updatePlaceLocationMock,
  deletePlace: deletePlaceMock
}));

let placesActions: typeof import("@/app/groups/[groupId]/actions");

describe("places server actions", () => {
  beforeAll(async () => {
    placesActions = await import("@/app/groups/[groupId]/actions");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedUserMock.mockResolvedValue({ id: "user-1" });
    redirectMock.mockImplementation(() => {
      throw new Error("redirect");
    });
  });

  it("addPlaceAction rejects invalid payload", async () => {
    const formData = new FormData();
    formData.set("groupId", "not-a-uuid");
    formData.set("name", "");
    formData.set("address", "");

    const result = await placesActions.addPlaceAction({ error: null, success: false }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Identificador invalido.");
  });

  it("addPlaceAction creates new places without favorite state", async () => {
    createPlaceMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("groupId", "11111111-1111-4111-8111-111111111111");
    formData.set("name", "Lugar nuevo");
    formData.set("address", "Calle Mayor 1");
    formData.set("city", "Madrid");
    formData.set("category", "Otros");
    formData.set("isFavorite", "true");
    formData.set("latitude", "40.4168");
    formData.set("longitude", "-3.7038");

    const result = await placesActions.addPlaceAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(createPlaceMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        isFavorite: expect.any(Boolean)
      })
    );
    expect(createPlaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        groupId: "11111111-1111-4111-8111-111111111111",
        name: "Lugar nuevo",
        address: "Calle Mayor 1",
        city: "Madrid",
        category: "Otros",
        latitude: 40.4168,
        longitude: -3.7038
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/groups/11111111-1111-4111-8111-111111111111");
  });

  it("updatePlaceStatusAction updates without revalidating pages", async () => {
    updatePlaceStatusMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("groupId", "11111111-1111-4111-8111-111111111111");
    formData.set("placeId", "22222222-2222-4222-8222-222222222222");
    formData.set("status", "visited");

    const result = await placesActions.updatePlaceStatusAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(updatePlaceStatusMock).toHaveBeenCalledWith({
      userId: "user-1",
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      status: "visited"
    });
    expect(revalidatePathMock).not.toHaveBeenCalledWith("/groups/11111111-1111-4111-8111-111111111111");
    expect(revalidatePathMock).not.toHaveBeenCalledWith("/dashboard");
  });

  it("updatePlaceFavoriteAction updates without revalidating pages", async () => {
    updatePlaceFavoriteMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("groupId", "11111111-1111-4111-8111-111111111111");
    formData.set("placeId", "22222222-2222-4222-8222-222222222222");
    formData.set("isFavorite", "true");

    const result = await placesActions.updatePlaceFavoriteAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(updatePlaceFavoriteMock).toHaveBeenCalledWith({
      userId: "user-1",
      groupId: "11111111-1111-4111-8111-111111111111",
      placeId: "22222222-2222-4222-8222-222222222222",
      isFavorite: true
    });
    expect(revalidatePathMock).not.toHaveBeenCalledWith("/groups/11111111-1111-4111-8111-111111111111");
    expect(revalidatePathMock).not.toHaveBeenCalledWith("/dashboard");
  });

  it("updatePlaceLocationAction updates and revalidates", async () => {
    updatePlaceLocationMock.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("groupId", "11111111-1111-4111-8111-111111111111");
    formData.set("placeId", "22222222-2222-4222-8222-222222222222");
    formData.set("address", "Madrid Centro");
    formData.set("latitude", "40.4168");
    formData.set("longitude", "-3.7038");

    const result = await placesActions.updatePlaceLocationAction({ error: null, success: false }, formData);

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
