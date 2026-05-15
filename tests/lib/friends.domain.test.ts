import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

describe("friends domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aceptar solicitud usa RPC atomica", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: rpcMock
    });

    const { respondFriendRequest } = await import("@/lib/friends");
    const result = await respondFriendRequest(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "accepted"
    );

    expect(result).toEqual({ error: null });
    expect(rpcMock).toHaveBeenCalledWith("accept_friend_request", {
      request_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    });
  });

  it("no puedes enviarte solicitud a ti mismo", async () => {
    const { sendFriendRequest } = await import("@/lib/friends");
    const result = await sendFriendRequest(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    );
    expect(result).toEqual({ error: "No puedes enviarte solicitud de amistad a ti mismo." });
  });

  it("no permite duplicar solicitud pendiente", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          match: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
          }))
        })),
        insert: vi.fn().mockResolvedValue({ error: { code: "23505", message: "duplicate" } })
      }))
    });

    const { sendFriendRequest } = await import("@/lib/friends");
    const result = await sendFriendRequest(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    );
    expect(result).toEqual({ error: "Ya existe una solicitud de amistad entre estos usuarios." });
  });

  it("rechazar solicitud no crea friendship (no RPC)", async () => {
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    const rpcMock = vi.fn();
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: rpcMock,
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                receiver_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                status: "pending"
              },
              error: null
            })
          }))
        })),
        update: vi.fn(() => ({
          eq: updateEqMock
        }))
      }))
    });

    const { respondFriendRequest } = await import("@/lib/friends");
    const result = await respondFriendRequest(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "rejected"
    );
    expect(result).toEqual({ error: null });
    expect(rpcMock).not.toHaveBeenCalled();
    expect(updateEqMock).toHaveBeenCalledWith("id", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  });

  it("solo receiver puede responder solicitud", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                receiver_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                status: "pending"
              },
              error: null
            })
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn()
        }))
      }))
    });

    const { respondFriendRequest } = await import("@/lib/friends");
    const result = await respondFriendRequest(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "rejected"
    );
    expect(result).toEqual({ error: "No tienes permisos para responder esta solicitud." });
  });
});
