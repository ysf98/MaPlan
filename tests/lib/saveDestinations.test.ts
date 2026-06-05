import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserGroupsMock } = vi.hoisted(() => ({
  getUserGroupsMock: vi.fn()
}));

vi.mock("@/lib/groups", () => ({
  getUserGroups: getUserGroupsMock
}));

describe("save destinations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("incluye mapa personal y grupos donde el usuario puede guardar", async () => {
    const { getPlaceSaveDestinationsForUser } = await import("@/lib/saveDestinations");
    getUserGroupsMock.mockResolvedValue([
      {
        id: "group-owner",
        name: "Grupo propio",
        description: null,
        coverImageUrl: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        role: "owner",
        privacy: "privado",
        joinPolicy: "invite_only"
      },
      {
        id: "group-open",
        name: "Grupo abierto",
        description: null,
        coverImageUrl: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        role: "member",
        privacy: "abierto",
        joinPolicy: "invite_only"
      },
      {
        id: "group-private",
        name: "Grupo privado",
        description: null,
        coverImageUrl: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        role: "member",
        privacy: "privado",
        joinPolicy: "invite_only"
      }
    ]);

    const destinations = await getPlaceSaveDestinationsForUser("user-1");

    expect(destinations).toEqual([
      expect.objectContaining({ type: "personal", id: "personal", label: "Mapa personal" }),
      expect.objectContaining({ type: "group", id: "group-owner", label: "Grupo propio" }),
      expect.objectContaining({ type: "group", id: "group-open", label: "Grupo abierto" })
    ]);
    expect(destinations).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: "group-private" })]));
  });
});
