import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClientMock = vi.fn();
const canEditPlacesMock = vi.fn();
const isGroupMemberMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

vi.mock("@/lib/groupPermissions", () => ({
  canEditPlaces: canEditPlacesMock,
  isGroupMember: isGroupMemberMock
}));

describe("places domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("member puede crear lugar si tiene permiso", async () => {
    canEditPlacesMock.mockResolvedValue(true);
    const insertMock = vi.fn().mockResolvedValue({ error: null });
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
  });

  it("owner (canEdit true) puede crear lugar", async () => {
    canEditPlacesMock.mockResolvedValue(true);
    const insertMock = vi.fn().mockResolvedValue({ error: null });
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
  });
});
