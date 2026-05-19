import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

describe("personal places domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea lugar personal valido", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const selectMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: selectMaybeSingle
            })),
            ilike: vi.fn(() => ({
              ilike: vi.fn(() => ({
                maybeSingle: selectMaybeSingle
              }))
            }))
          }))
        })),
        insert: insertMock
      }))
    });

    const { createPersonalPlace } = await import("@/lib/personalPlaces");
    const result = await createPersonalPlace({
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Cafe Central",
      address: "Madrid",
      latitude: 40.4,
      longitude: -3.7
    });

    expect(result).toEqual({ error: null });
    expect(insertMock).toHaveBeenCalled();
  });

  it("rechaza duplicado por provider + external_place_id", async () => {
    const providerQuery = {
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "existing" }, error: null })
    };
    providerQuery.eq.mockReturnValue(providerQuery);

    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => providerQuery)
      }))
    });

    const { createPersonalPlace } = await import("@/lib/personalPlaces");
    const result = await createPersonalPlace({
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Cafe Central",
      address: "Madrid",
      latitude: 40.4,
      longitude: -3.7,
      provider: "google_places",
      externalPlaceId: "abc123"
    });

    expect(result).toEqual({ error: "Ese sitio ya esta guardado en tu mapa." });
  });

  it("elimina solo por user_id e id", async () => {
    const eqUserIdMock = vi.fn().mockResolvedValue({ error: null });
    const eqIdMock = vi.fn(() => ({ eq: eqUserIdMock }));
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: eqIdMock
        }))
      }))
    });

    const { deletePersonalPlace } = await import("@/lib/personalPlaces");
    const result = await deletePersonalPlace({
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      placeId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    });

    expect(result).toEqual({ error: null });
    expect(eqIdMock).toHaveBeenCalledWith("id", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(eqUserIdMock).toHaveBeenCalledWith("user_id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });
});
