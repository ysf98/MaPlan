import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createPersonalPlaceMock,
  createPlaceMock,
  requireAuthenticatedUserMock,
  revalidatePathMock
} = vi.hoisted(() => ({
  createPersonalPlaceMock: vi.fn(),
  createPlaceMock: vi.fn(),
  requireAuthenticatedUserMock: vi.fn(),
  revalidatePathMock: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/actions/serverAction", () => ({
  requireAuthenticatedUser: requireAuthenticatedUserMock,
  getValidationErrorMessage: (error: { issues?: Array<{ message?: string }> }) => error.issues?.[0]?.message ?? "Datos invalidos."
}));

vi.mock("@/lib/personalPlaces", () => ({
  createPersonalPlace: createPersonalPlaceMock
}));

vi.mock("@/lib/places", () => ({
  createPlace: createPlaceMock
}));

let exploreActions: typeof import("@/app/explore/actions");

function buildFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("destinationType", "personal");
  formData.set("destinationId", "personal");
  formData.set("name", "Lugar nuevo");
  formData.set("address", "Calle Mayor 1");
  formData.set("city", "Madrid");
  formData.set("category", "Otros");
  formData.set("source", "google_maps");
  formData.set("provider", "google_places");
  formData.set("externalPlaceId", "google-place-1");
  formData.set("googleMapsUrl", "https://www.google.com/maps/search/?api=1&query=Lugar");
  formData.set("businessStatus", "OPERATIONAL");
  formData.set("phoneNumber", "+34123456789");
  formData.set("imageUrl", "/api/places/photo?name=test");
  formData.set("latitude", "40.4168");
  formData.set("longitude", "-3.7038");

  Object.entries(overrides).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("explore server actions", () => {
  beforeAll(async () => {
    exploreActions = await import("@/app/explore/actions");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedUserMock.mockResolvedValue({ id: "user-1" });
  });

  it("guarda un lugar en el mapa personal", async () => {
    createPersonalPlaceMock.mockResolvedValue({ error: null });

    const result = await exploreActions.saveExploredPlaceAction({ error: null, success: false }, buildFormData());

    expect(result).toEqual({ error: null, success: true });
    expect(createPersonalPlaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        name: "Lugar nuevo",
        address: "Calle Mayor 1",
        city: "Madrid",
        provider: "google_places",
        externalPlaceId: "google-place-1",
        latitude: 40.4168,
        longitude: -3.7038
      })
    );
    expect(createPlaceMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/map");
  });

  it("guarda un lugar en un grupo permitido usando la logica de dominio", async () => {
    createPlaceMock.mockResolvedValue({ error: null });

    const result = await exploreActions.saveExploredPlaceAction(
      { error: null, success: false },
      buildFormData({
        destinationType: "group",
        destinationId: "11111111-1111-4111-8111-111111111111"
      })
    );

    expect(result).toEqual({ error: null, success: true });
    expect(createPlaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        groupId: "11111111-1111-4111-8111-111111111111",
        name: "Lugar nuevo",
        address: "Calle Mayor 1",
        latitude: 40.4168,
        longitude: -3.7038
      })
    );
    expect(createPersonalPlaceMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/groups/11111111-1111-4111-8111-111111111111");
  });

  it("rechaza un destino personal manipulado", async () => {
    const result = await exploreActions.saveExploredPlaceAction(
      { error: null, success: false },
      buildFormData({
        destinationType: "personal",
        destinationId: "11111111-1111-4111-8111-111111111111"
      })
    );

    expect(result).toEqual({ error: "Destino invalido.", success: false });
    expect(createPersonalPlaceMock).not.toHaveBeenCalled();
    expect(createPlaceMock).not.toHaveBeenCalled();
  });

  it("propaga errores de permisos o duplicados al guardar en grupo", async () => {
    createPlaceMock.mockResolvedValue({ error: "No tienes permisos para editar lugares en este grupo." });

    const result = await exploreActions.saveExploredPlaceAction(
      { error: null, success: false },
      buildFormData({
        destinationType: "group",
        destinationId: "11111111-1111-4111-8111-111111111111"
      })
    );

    expect(result).toEqual({ error: "No tienes permisos para editar lugares en este grupo.", success: false });
  });
});
