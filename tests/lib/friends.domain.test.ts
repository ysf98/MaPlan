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
});
