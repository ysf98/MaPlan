import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClientMock = vi.fn();
const canInviteToGroupMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

vi.mock("@/lib/groupPermissions", () => ({
  canInviteToGroup: canInviteToGroupMock
}));

describe("group invitations domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canInviteToGroupMock.mockResolvedValue(true);
  });

  it("aceptar invitacion usa RPC atomica", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: rpcMock
    });

    const { respondGroupInvitation } = await import("@/lib/groupInvitations");
    const result = await respondGroupInvitation(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "accepted"
    );

    expect(result).toEqual({ error: null });
    expect(rpcMock).toHaveBeenCalledWith("accept_group_invitation", {
      invitation_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    });
  });

  it("no owner no puede invitar", async () => {
    canInviteToGroupMock.mockResolvedValue(false);
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn()
    });

    const { inviteFriendToGroup } = await import("@/lib/groupInvitations");
    const result = await inviteFriendToGroup(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
    );

    expect(result).toEqual({ error: "No tienes permisos para invitar amigos a este grupo." });
  });

  it("no se puede invitar a usuario ya miembro", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            user_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            role: "member",
            created_at: new Date().toISOString(),
            username: "friend",
            avatar_url: null
          }
        ],
        error: null
      }),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "group_invitations") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null })
                }))
              }))
            })),
            insert: vi.fn()
          };
        }
        throw new Error(`Unexpected table ${table}`);
      })
    });

    const { inviteFriendToGroup } = await import("@/lib/groupInvitations");
    const result = await inviteFriendToGroup(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
    );

    expect(result).toEqual({ error: "Ese usuario ya es miembro del grupo." });
  });

  it("no se puede aceptar invitacion de otro usuario", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                invited_user_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                status: "pending"
              },
              error: null
            })
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn()
        }))
      })),
      rpc: vi.fn().mockResolvedValue({ error: null })
    });

    const { respondGroupInvitation } = await import("@/lib/groupInvitations");
    const result = await respondGroupInvitation(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "rejected"
    );

    expect(result).toEqual({ error: "No tienes permisos para responder esta invitacion." });
  });
});
