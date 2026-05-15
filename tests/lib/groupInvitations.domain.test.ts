import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

describe("group invitations domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "group_members") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: maybeSingleMock
                  }))
                }))
              }))
            }))
          };
        }
        throw new Error("Unexpected table");
      })
    });

    const { inviteFriendToGroup } = await import("@/lib/groupInvitations");
    const result = await inviteFriendToGroup(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
    );

    expect(result).toEqual({ error: "Solo el owner puede invitar amigos." });
  });

  it("no se puede invitar a usuario ya miembro", async () => {
    const ownerMembershipMock = vi.fn().mockResolvedValueOnce({ data: { id: "owner-membership" } });
    const alreadyMemberMock = vi.fn().mockResolvedValueOnce({ data: { id: "existing-member" } });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "group_members") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: ownerMembershipMock
                  })),
                  maybeSingle: alreadyMemberMock
                }))
              }))
            }))
          };
        }
        throw new Error("Unexpected table");
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
