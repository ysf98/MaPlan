import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClientMock = vi.fn();
const canEditPlacesMock = vi.fn();
const isGroupMemberMock = vi.fn();
const isGroupOwnerMock = vi.fn();
const recordPlaceAddedGroupActivityMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

vi.mock("@/lib/groupPermissions", () => ({
  canEditPlaces: canEditPlacesMock,
  isGroupMember: isGroupMemberMock,
  isGroupOwner: isGroupOwnerMock
}));

vi.mock("@/lib/groupActivity", () => ({
  recordPlaceAddedGroupActivity: recordPlaceAddedGroupActivityMock
}));

describe("places domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createNoExistingPlaceQueryMock() {
    const chain = {
      eq: vi.fn(),
      ilike: vi.fn(),
      is: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
    };
    chain.eq.mockReturnValue(chain);
    chain.ilike.mockReturnValue(chain);
    chain.is.mockReturnValue(chain);
    return chain;
  }

  function createInsertChainMock() {
    const chain = {
      select: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "place-1", name: "Lugar" }, error: null })
    };
    chain.select.mockReturnValue(chain);
    return chain;
  }

  it("member puede crear lugar si tiene permiso", async () => {
    canEditPlacesMock.mockResolvedValue(true);
    const insertMock = vi.fn(() => createInsertChainMock());
    const existingPlaceQuery = createNoExistingPlaceQueryMock();
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "categories") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cat-1" }, error: null })
                }))
              }))
            }))
          };
        }

        if (table === "places") {
          return {
            select: vi.fn(() => existingPlaceQuery),
            insert: insertMock
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    });

    const { createPlace } = await import("@/lib/places");
    const result = await createPlace({
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      groupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Lugar",
      address: "Direccion"
    });

    expect(result).toEqual({ error: null });
    expect(insertMock).toHaveBeenCalled();
    expect(recordPlaceAddedGroupActivityMock).toHaveBeenCalled();
  });

  it("owner (canEdit true) puede crear lugar", async () => {
    canEditPlacesMock.mockResolvedValue(true);
    const insertMock = vi.fn(() => createInsertChainMock());
    const existingPlaceQuery = createNoExistingPlaceQueryMock();
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "categories") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cat-1" }, error: null })
                }))
              }))
            }))
          };
        }

        if (table === "places") {
          return {
            select: vi.fn(() => existingPlaceQuery),
            insert: insertMock
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    });

    const { createPlace } = await import("@/lib/places");
    const result = await createPlace({
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      groupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Lugar owner",
      address: "Direccion owner"
    });

    expect(result).toEqual({ error: null });
    expect(insertMock).toHaveBeenCalled();
    expect(recordPlaceAddedGroupActivityMock).toHaveBeenCalled();
  });

  it("usuario sin permiso no puede actualizar ubicacion", async () => {
    canEditPlacesMock.mockResolvedValue(false);
    const { updatePlaceLocation } = await import("@/lib/places");
    const result = await updatePlaceLocation({
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      groupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      placeId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      address: "Madrid",
      latitude: 40.4,
      longitude: -3.7
    });

    expect(result).toEqual({ error: "No tienes permisos para editar lugares en este grupo." });
  });

  it("usuario con permiso puede actualizar ubicacion", async () => {
    canEditPlacesMock.mockResolvedValue(true);
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "places") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "place-1" }, error: null })
                }))
              }))
            })),
            update: vi.fn(() => ({
              eq: updateEqMock
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    });

    const { updatePlaceLocation } = await import("@/lib/places");
    const result = await updatePlaceLocation({
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      groupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      placeId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      address: "Madrid Centro",
      latitude: 40.4,
      longitude: -3.7
    });

    expect(result).toEqual({ error: null });
    expect(updateEqMock).toHaveBeenCalledWith("id", "cccccccc-cccc-4ccc-8ccc-cccccccccccc");
  });
});
