import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const revalidatePathMock = vi.fn();
const getCurrentUserMock = vi.fn();
const createSupabaseServerClientMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/auth/getCurrentUser", () => ({
  getCurrentUser: getCurrentUserMock
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => {
    throw new Error("admin not configured in tests");
  })
}));

function createGroupsActionClient({
  createdGroupId = "group-1",
  existingMembership = null as { id: string } | null,
  foundGroup = { id: "group-by-code", join_policy: "open_by_code" } as { id: string; join_policy: string } | null
}) {
  return {
    from(table: string) {
      if (table === "groups") {
        return {
          insert() {
            return {
              select() {
                return {
                  single: () => Promise.resolve({ data: { id: createdGroupId }, error: null })
                };
              }
            };
          },
          select() {
            return {
              eq(_column: string, _value: string) {
                return {
                  maybeSingle: () => Promise.resolve({ data: foundGroup, error: null })
                };
              }
            };
          },
          delete() {
            return {
              eq: () => Promise.resolve({ data: null, error: null })
            };
          }
        };
      }

      if (table === "group_members") {
        return {
          insert: () => Promise.resolve({ data: null, error: null }),
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: () => Promise.resolve({ data: existingMembership, error: null })
                    };
                  }
                };
              }
            };
          }
        };
      }

      if (table === "group_join_requests") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: () => Promise.resolve({ data: null, error: null })
                    };
                  }
                };
              }
            };
          },
          insert: () => Promise.resolve({ data: null, error: null }),
          update() {
            return {
              eq: () => Promise.resolve({ data: null, error: null })
            };
          }
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }
  };
}

describe("group server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => {
      throw new Error("redirect");
    });
  });

  it("createGroupAction validates input with zod", async () => {
    const { createGroupAction } = await import("@/app/groups/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    createSupabaseServerClientMock.mockResolvedValue(createGroupsActionClient({}));

    const formData = new FormData();
    formData.set("name", "   ");
    formData.set("description", "x");

    const result = await createGroupAction({ error: null, success: false, groupId: null }, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("El nombre del grupo es obligatorio.");
  });

  it("createGroupAction creates group and owner membership", async () => {
    const { createGroupAction } = await import("@/app/groups/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    createSupabaseServerClientMock.mockResolvedValue(createGroupsActionClient({ createdGroupId: "group-123" }));

    const formData = new FormData();
    formData.set("name", "My Group");
    formData.set("description", "Desc");
    formData.set("placeEditPolicy", "owner_only");
    formData.set("joinPolicy", "request_to_join");

    const result = await createGroupAction({ error: null, success: false, groupId: null }, formData);

    expect(result).toEqual({ error: null, success: true, groupId: "group-123" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/groups");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("joinGroupAction returns group id and revalidates", async () => {
    const { joinGroupAction } = await import("@/app/groups/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    createSupabaseServerClientMock.mockResolvedValue(
      createGroupsActionClient({
        foundGroup: { id: "group-xyz", join_policy: "open_by_code" },
        existingMembership: null
      })
    );

    const formData = new FormData();
    formData.set("joinCode", "A1B2C3D4");

    const result = await joinGroupAction({ error: null, success: false, groupId: null, mode: null }, formData);

    expect(result).toEqual({ error: null, success: true, groupId: "group-xyz", mode: "joined" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/groups");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("joinGroupAction creates pending request when group requires approval", async () => {
    const { joinGroupAction } = await import("@/app/groups/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    createSupabaseServerClientMock.mockResolvedValue(
      createGroupsActionClient({
        foundGroup: { id: "group-xyz", join_policy: "request_to_join" },
        existingMembership: null
      })
    );

    const formData = new FormData();
    formData.set("joinCode", "A1B2C3D4");

    const result = await joinGroupAction({ error: null, success: false, groupId: null, mode: null }, formData);

    expect(result).toEqual({ error: null, success: true, groupId: "group-xyz", mode: "requested" });
  });
});
