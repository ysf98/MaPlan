import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

function createMembershipClient(role: "owner" | "member", privacy: "privado" | "abierto") {
  return {
    from(table: string) {
      if (table === "group_members") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      eq() {
                        return {
                          maybeSingle: async () => ({ data: role === "owner" ? { id: "owner-membership" } : null, error: null })
                        };
                      },
                      maybeSingle: async () => ({ data: { role }, error: null })
                    };
                  }
                };
              }
            };
          }
        };
      }

      if (table === "groups") {
        return {
          select(columns: string) {
            if (columns === "id") {
              return {
                eq() {
                  return {
                    eq() {
                      return {
                        maybeSingle: async () => ({
                          data: null,
                          error: null
                        })
                      };
                    }
                  };
                }
              };
            }

            return {
              eq() {
                return {
                  maybeSingle: async () => ({
                    data: { privacy },
                    error: null
                  })
                };
              }
            };
          }
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }
  };
}

describe("group permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("miembro puede editar lugares en grupo abierto", async () => {
    createSupabaseServerClientMock.mockResolvedValue(createMembershipClient("member", "abierto"));
    const { canEditPlaces } = await import("@/lib/groupPermissions");

    await expect(canEditPlaces("user", "group")).resolves.toBe(true);
  });

  it("miembro no puede editar lugares en grupo privado", async () => {
    createSupabaseServerClientMock.mockResolvedValue(createMembershipClient("member", "privado"));
    const { canEditPlaces } = await import("@/lib/groupPermissions");

    await expect(canEditPlaces("user", "group")).resolves.toBe(false);
  });

  it("solo owner puede cambiar privacidad", async () => {
    createSupabaseServerClientMock.mockResolvedValue(createMembershipClient("member", "abierto"));
    const { canChangeGroupPrivacy } = await import("@/lib/groupPermissions");

    await expect(canChangeGroupPrivacy("user", "group")).resolves.toBe(false);
  });
});
