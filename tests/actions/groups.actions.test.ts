import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const revalidatePathMock = vi.fn();
const getCurrentUserMock = vi.fn();
const createSupabaseServerClientMock = vi.fn();
const createSupabaseAdminClientMock = vi.fn();

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
  createSupabaseAdminClient: createSupabaseAdminClientMock
}));

function createGroupsActionClient({
  createdGroupId = "11111111-1111-4111-8111-111111111111",
  existingMembership = null as { id: string } | null,
  memberInsertError = null as { message: string } | null,
  foundGroup = { id: "22222222-2222-4222-8222-222222222222", join_policy: "open_by_code" } as {
    id: string;
    join_policy: string;
  } | null
}) {
  const groupDeleteEqMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const groupInsertMock = vi.fn();
  return {
    groupDeleteEqMock,
    groupInsertMock,
    from(table: string) {
      if (table === "groups") {
        return {
          insert(payload: unknown) {
            groupInsertMock(payload);
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
              eq: groupDeleteEqMock
            };
          }
        };
      }

      if (table === "group_members") {
        return {
          insert: () => Promise.resolve(memberInsertError ? { data: null, error: memberInsertError } : { data: null, error: null }),
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
    const client = createGroupsActionClient({ createdGroupId: "33333333-3333-4333-8333-333333333333" });
    createSupabaseServerClientMock.mockResolvedValue(client);

    const formData = new FormData();
    formData.set("name", "My Group");
    formData.set("description", "Desc");
    formData.set("placeEditPolicy", "owner_only");
    formData.set("joinPolicy", "request_to_join");

    const result = await createGroupAction({ error: null, success: false, groupId: null }, formData);

    expect(result).toEqual({ error: null, success: true, groupId: "33333333-3333-4333-8333-333333333333" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/groups");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
  });

  it("createGroupAction defaults join policy to invite_only", async () => {
    const { createGroupAction } = await import("@/app/groups/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    const client = createGroupsActionClient({ createdGroupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    createSupabaseServerClientMock.mockResolvedValue(client);

    const formData = new FormData();
    formData.set("name", "My Group");
    formData.set("description", "Desc");
    formData.set("placeEditPolicy", "owner_only");

    const result = await createGroupAction({ error: null, success: false, groupId: null }, formData);

    expect(result).toEqual({ error: null, success: true, groupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    const firstInsertPayload = client.groupInsertMock.mock.calls[0]?.[0] as { join_policy?: string };
    expect(firstInsertPayload.join_policy).toBe("invite_only");
  });

  it("createGroupAction deletes created group if owner membership insert fails", async () => {
    const { createGroupAction } = await import("@/app/groups/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    const client = createGroupsActionClient({
      createdGroupId: "77777777-7777-4777-8777-777777777777",
      memberInsertError: { message: "membership insert failed" }
    });
    createSupabaseServerClientMock.mockResolvedValue(client);

    const formData = new FormData();
    formData.set("name", "My Group");
    formData.set("description", "Desc");
    formData.set("placeEditPolicy", "owner_only");
    formData.set("joinPolicy", "request_to_join");

    const result = await createGroupAction({ error: null, success: false, groupId: null }, formData);

    expect(result).toEqual({ error: "membership insert failed", success: false, groupId: null });
    expect(client.groupDeleteEqMock).toHaveBeenCalledWith("id", "77777777-7777-4777-8777-777777777777");
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
  });

  it("joinGroupAction returns group id and revalidates", async () => {
    const { joinGroupAction } = await import("@/app/groups/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    createSupabaseServerClientMock.mockResolvedValue(
      createGroupsActionClient({
        foundGroup: { id: "44444444-4444-4444-8444-444444444444", join_policy: "open_by_code" },
        existingMembership: null
      })
    );

    const formData = new FormData();
    formData.set("joinCode", "A1B2C3D4");

    const result = await joinGroupAction({ error: null, success: false, groupId: null, mode: null }, formData);

    expect(result).toEqual({ error: null, success: true, groupId: "44444444-4444-4444-8444-444444444444", mode: "joined" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/groups");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("joinGroupAction creates pending request when group requires approval", async () => {
    const { joinGroupAction } = await import("@/app/groups/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    createSupabaseServerClientMock.mockResolvedValue(
      createGroupsActionClient({
        foundGroup: { id: "55555555-5555-4555-8555-555555555555", join_policy: "request_to_join" },
        existingMembership: null
      })
    );

    const formData = new FormData();
    formData.set("joinCode", "A1B2C3D4");

    const result = await joinGroupAction({ error: null, success: false, groupId: null, mode: null }, formData);

    expect(result).toEqual({ error: null, success: true, groupId: "55555555-5555-4555-8555-555555555555", mode: "requested" });
  });

  it("joinGroupAction rejects invite_only groups by code", async () => {
    const { joinGroupAction } = await import("@/app/groups/actions");
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    createSupabaseServerClientMock.mockResolvedValue(
      createGroupsActionClient({
        foundGroup: { id: "66666666-6666-4666-8666-666666666666", join_policy: "invite_only" },
        existingMembership: null
      })
    );

    const formData = new FormData();
    formData.set("joinCode", "A1B2C3D4");
    const result = await joinGroupAction({ error: null, success: false, groupId: null, mode: null }, formData);

    expect(result).toEqual({
      error: "Este grupo solo permite acceso por invitacion.",
      success: false,
      groupId: null,
      mode: null
    });
  });
});
