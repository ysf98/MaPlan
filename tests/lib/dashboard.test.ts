import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock, getGroupMembersPreviewForUserMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  getGroupMembersPreviewForUserMock: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

vi.mock("@/lib/groups", () => ({
  getGroupMembersPreviewForUser: getGroupMembersPreviewForUserMock
}));

describe("dashboard group summaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cuenta los planes de cada grupo", async () => {
    const rowsByTable = {
      places: [{ group_id: "group-1" }],
      group_plans: [{ group_id: "group-1" }, { group_id: "group-1" }],
      group_members: [{ group_id: "group-1" }, { group_id: "group-2" }]
    };
    const inMock = vi.fn((table: keyof typeof rowsByTable) =>
      Promise.resolve({ data: rowsByTable[table], error: null })
    );
    const fromMock = vi.fn((table: keyof typeof rowsByTable) => ({
      select: vi.fn(() => ({
        in: vi.fn(() => inMock(table))
      }))
    }));

    createSupabaseServerClientMock.mockResolvedValue({ from: fromMock });
    getGroupMembersPreviewForUserMock.mockResolvedValue({ members: [], total: 1 });

    const { getDashboardGroupSummaries } = await import("@/lib/dashboard");
    const groups = [
      {
        id: "group-1",
        name: "Viaje",
        description: null,
        coverImageUrl: "https://example.com/group-1.jpg",
        createdAt: "2026-01-01T00:00:00.000Z",
        role: "owner" as const,
        privacy: "abierto" as const,
        joinPolicy: "invite_only" as const
      },
      {
        id: "group-2",
        name: "Cena",
        description: null,
        coverImageUrl: "https://example.com/group-2.jpg",
        createdAt: "2026-01-01T00:00:00.000Z",
        role: "member" as const,
        privacy: "abierto" as const,
        joinPolicy: "invite_only" as const
      }
    ];

    const summaries = await getDashboardGroupSummaries("user-1", groups, groups.length);

    expect(summaries.map(({ id, planCount }) => ({ id, planCount }))).toEqual([
      { id: "group-1", planCount: 2 },
      { id: "group-2", planCount: 0 }
    ]);
    expect(fromMock).toHaveBeenCalledWith("group_plans");
  });
});
