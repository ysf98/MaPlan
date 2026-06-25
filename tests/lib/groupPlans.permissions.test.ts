import { beforeEach, describe, expect, it, vi } from "vitest";

const canEditPlacesMock = vi.fn();
const isGroupMemberMock = vi.fn();
const isGroupOwnerMock = vi.fn();
const createSupabaseServerClientMock = vi.fn();

vi.mock("@/lib/groupPermissions", () => ({
  canEditPlaces: canEditPlacesMock,
  isGroupMember: isGroupMemberMock,
  isGroupOwner: isGroupOwnerMock
}));

vi.mock("@/lib/groupActivity", () => ({
  recordPlanCreatedGroupActivity: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

function createPlanClient() {
  const updateMaybeSingleMock = vi.fn().mockResolvedValue({ data: { id: "plan-1" }, error: null });
  const updateSelectMock = vi.fn().mockReturnValue({ maybeSingle: updateMaybeSingleMock });
  const updateGroupEqMock = vi.fn().mockReturnValue({ select: updateSelectMock });
  const updateIdEqMock = vi.fn().mockReturnValue({ eq: updateGroupEqMock });
  const updateMock = vi.fn().mockReturnValue({ eq: updateIdEqMock });
  const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
  const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock });
  const selectMaybeSingleMock = vi.fn().mockResolvedValue({
    data: {
      created_at: "2026-01-01T00:00:00.000Z",
      created_by: "creator-1",
      description: null,
      group_id: "group-1",
      id: "plan-1",
      planned_date: "2099-07-10T00:00:00.000Z",
      public_share_token: "11111111-1111-4111-8111-111111111111",
      title: "Ruta",
      updated_at: "2026-01-01T00:00:00.000Z"
    },
    error: null
  });
  const selectPlanEqMock = vi.fn().mockReturnValue({ maybeSingle: selectMaybeSingleMock });
  const selectGroupEqMock = vi.fn().mockReturnValue({ eq: selectPlanEqMock });
  const selectMock = vi.fn().mockReturnValue({ eq: selectGroupEqMock });

  return {
    client: {
      from: vi.fn().mockReturnValue({
        delete: deleteMock,
        select: selectMock,
        update: updateMock
      })
    },
    deleteMock,
    updateMock
  };
}

describe("group plan permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isGroupMemberMock.mockResolvedValue(true);
    isGroupOwnerMock.mockResolvedValue(false);
  });

  it("allows a shared-content editor to update a plan created by another member", async () => {
    const { client, updateMock } = createPlanClient();
    createSupabaseServerClientMock.mockResolvedValue(client);
    canEditPlacesMock.mockResolvedValue(true);
    const { updateGroupPlanDetails } = await import("@/lib/groupPlans");

    const result = await updateGroupPlanDetails({
      groupId: "group-1",
      planId: "plan-1",
      plannedDate: "2099-07-10",
      title: "Ruta editada",
      userId: "member-2"
    });

    expect(result).toEqual({ error: null });
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Ruta editada" }));
  });

  it("rejects plan editing when shared-content permission is missing", async () => {
    const { client, updateMock } = createPlanClient();
    createSupabaseServerClientMock.mockResolvedValue(client);
    canEditPlacesMock.mockResolvedValue(false);
    const { updateGroupPlanDetails } = await import("@/lib/groupPlans");

    const result = await updateGroupPlanDetails({
      groupId: "group-1",
      planId: "plan-1",
      plannedDate: "2099-07-10",
      title: "Ruta editada",
      userId: "member-2"
    });

    expect(result).toEqual({ error: "No tienes permisos para editar este plan." });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("allows the group owner to delete a plan created by another user", async () => {
    const { client, deleteMock } = createPlanClient();
    createSupabaseServerClientMock.mockResolvedValue(client);
    isGroupOwnerMock.mockResolvedValue(true);
    const { deleteGroupPlan } = await import("@/lib/groupPlans");

    const result = await deleteGroupPlan({
      groupId: "group-1",
      planId: "plan-1",
      userId: "owner-1"
    });

    expect(result).toEqual({ error: null });
    expect(deleteMock).toHaveBeenCalled();
  });

  it("maps a public shared plan without exposing votes or members", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            created_at: "2026-01-01T00:00:00.000Z",
            description: null,
            google_maps_url: "https://maps.example",
            group_id: "group-1",
            group_name: "Viaje",
            latitude: 39.47,
            longitude: -0.37,
            note: null,
            phone_number: null,
            place_address: "Carrer de la Pau",
            place_city: "Valencia",
            place_created_at: "2026-01-01T00:00:00.000Z",
            place_id: null,
            place_image_url: null,
            place_name: "Bar Centro",
            plan_id: "plan-1",
            plan_place_id: "place-1",
            planned_at: "2026-07-10T20:00:00.000Z",
            planned_date: "2026-07-10T00:00:00.000Z",
            position: 0,
            public_share_token: "11111111-1111-4111-8111-111111111111",
            rating: 4.5,
            title: "Ruta compartida",
            updated_at: "2026-01-01T00:00:00.000Z",
            user_ratings_total: 12
          }
        ],
        error: null
      })
    });
    const { getPublicGroupPlanByToken } = await import("@/lib/groupPlans");

    const result = await getPublicGroupPlanByToken("11111111-1111-4111-8111-111111111111");

    expect(result?.groupName).toBe("Viaje");
    expect(result?.plan.title).toBe("Ruta compartida");
    expect(result?.plan.places).toHaveLength(1);
    expect(result?.plan.votes).toEqual([]);
    expect(result?.plan.canEdit).toBe(false);
    expect(result?.plan.canDelete).toBe(false);
  });

  it("returns null when a public shared plan token has no rows", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: [], error: null })
    });
    const { getPublicGroupPlanByToken } = await import("@/lib/groupPlans");

    await expect(getPublicGroupPlanByToken("11111111-1111-4111-8111-111111111111")).resolves.toBeNull();
  });

  it("returns null when public shared plan rows are incomplete", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            group_id: "group-1",
            group_name: "Viaje",
            plan_id: "plan-1",
            public_share_token: null,
            title: "Ruta"
          }
        ],
        error: null
      })
    });
    const { getPublicGroupPlanByToken } = await import("@/lib/groupPlans");

    await expect(getPublicGroupPlanByToken("11111111-1111-4111-8111-111111111111")).resolves.toBeNull();
  });
});
