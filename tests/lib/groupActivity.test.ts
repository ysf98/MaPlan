import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

describe("group activity lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds feed only for user memberships and sorts by created_at desc", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [
          { id: "u-1", username: "ana", avatar_url: null },
          { id: "u-2", username: "luis", avatar_url: "https://example.com/luis.jpg" }
        ],
        error: null
      }),
      from: vi.fn((table: string) => {
        if (table === "group_members") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [{ group_id: "g-1" }, { group_id: "g-2" }],
                error: null
              })
            }))
          };
        }

        if (table === "group_activity_events") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "e-2",
                        group_id: "g-2",
                        actor_user_id: "u-2",
                        event_type: "place_added",
                        entity_id: "p-2",
                        entity_name: "Sitio 2",
                        created_at: "2026-05-20T10:00:00.000Z"
                      },
                      {
                        id: "e-1",
                        group_id: "g-1",
                        actor_user_id: "u-1",
                        event_type: "place_added",
                        entity_id: "p-1",
                        entity_name: "Sitio 1",
                        created_at: "2026-05-20T09:00:00.000Z"
                      }
                    ],
                    error: null
                  })
                }))
              }))
            }))
          };
        }

        if (table === "groups") {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: "g-1", name: "Grupo 1" },
                  { id: "g-2", name: "Grupo 2" }
                ],
                error: null
              })
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    });

    const { getGroupActivityFeedForUser } = await import("@/lib/groupActivity");
    const result = await getGroupActivityFeedForUser("me", 10);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("e-2");
    expect(result[0].message).toContain("@luis");
    expect(result[0].message).toContain('en "Grupo 2"');
    expect(result[0].href).toBe("/groups/g-2?tab=mapa&placeId=p-2");
    expect(result[0].actorAvatarUrl).toBe("https://example.com/luis.jpg");
    expect(result[1].id).toBe("e-1");
    expect(result[1].message).toContain('"Sitio 1"');
  });

  it("summarizes groups with recent activity without another query", async () => {
    const { summarizeGroupsWithRecentActivity } = await import("@/lib/groupActivity");
    const result = summarizeGroupsWithRecentActivity(
      [
        {
          id: "e-3",
          groupId: "g-1",
          groupName: "Grupo 1",
          actorUserId: "u-1",
          actorUsername: "ana",
          actorAvatarUrl: null,
          eventType: "place_added",
          entityId: "p-3",
          entityName: "Sitio 3",
          createdAt: "2026-05-20T11:00:00.000Z",
          href: null,
          message: ""
        },
        {
          id: "e-2",
          groupId: "g-2",
          groupName: "Grupo 2",
          actorUserId: "u-2",
          actorUsername: "luis",
          actorAvatarUrl: null,
          eventType: "place_added",
          entityId: "p-2",
          entityName: "Sitio 2",
          createdAt: "2026-05-20T10:00:00.000Z",
          href: null,
          message: ""
        },
        {
          id: "e-1",
          groupId: "g-1",
          groupName: "Grupo 1",
          actorUserId: "u-3",
          actorUsername: "eva",
          actorAvatarUrl: null,
          eventType: "place_added",
          entityId: "p-1",
          entityName: "Sitio 1",
          createdAt: "2026-05-20T09:00:00.000Z",
          href: null,
          message: ""
        }
      ],
      5
    );

    expect(result).toHaveLength(2);
    expect(result[0].groupId).toBe("g-1");
    expect(result[0].recentEventsCount).toBe(2);
    expect(result[1].groupId).toBe("g-2");
  });

  it("can omit group name when building activity for a group detail page", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [{ id: "u-1", username: "ana", avatar_url: null }],
        error: null
      }),
      from: vi.fn((table: string) => {
        if (table === "group_members") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [{ group_id: "g-1" }],
                error: null
              })
            }))
          };
        }

        if (table === "group_activity_events") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "e-1",
                        group_id: "g-1",
                        actor_user_id: "u-1",
                        event_type: "place_added",
                        entity_id: "p-1",
                        entity_name: "Sitio 1",
                        created_at: "2026-05-20T09:00:00.000Z"
                      }
                    ],
                    error: null
                  })
                }))
              }))
            }))
          };
        }

        if (table === "groups") {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "g-1", name: "Grupo 1" }],
                error: null
              })
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    });

    const { getGroupActivityFeedForUser } = await import("@/lib/groupActivity");
    const result = await getGroupActivityFeedForUser("me", 10, { includeGroupName: false });

    expect(result[0].message).toBe('@ana anadio "Sitio 1".');
  });
});
