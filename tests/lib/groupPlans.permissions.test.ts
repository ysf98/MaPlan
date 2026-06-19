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
});
