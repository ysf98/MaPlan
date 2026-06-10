import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const revalidatePathMock = vi.fn();
const getCurrentUserMock = vi.fn();
const canEditPlacesMock = vi.fn();
const isGroupMemberMock = vi.fn();
const canReviewJoinRequestsMock = vi.fn();
const isGroupOwnerMock = vi.fn();
const canChangeGroupPrivacyMock = vi.fn();
const canEditGroupDetailsMock = vi.fn();
const createSupabaseServerClientMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/auth/getCurrentUser", () => ({
  getCurrentUser: getCurrentUserMock
}));

vi.mock("@/lib/groupPermissions", () => ({
  canEditPlaces: canEditPlacesMock,
  canReviewJoinRequests: canReviewJoinRequestsMock,
  canChangeGroupPrivacy: canChangeGroupPrivacyMock,
  canEditGroupDetails: canEditGroupDetailsMock,
  isGroupOwner: isGroupOwnerMock,
  isGroupMember: isGroupMemberMock
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

describe("security checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => {
      throw new Error("redirect");
    });
  });

  it("usuario no miembro no puede crear lugar", async () => {
    canEditPlacesMock.mockResolvedValue(false);
    const { createPlace } = await import("@/lib/places");

    const result = await createPlace({
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      groupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Lugar",
      address: "Direccion"
    });

    expect(result).toMatchObject({
      error: "No tienes permisos para editar lugares en este grupo.",
      duplicate: false
    });
    expect(result.placeId).toBeNull();
  });

  it("usuario no miembro no puede actualizar su estado individual de lugar", async () => {
    isGroupMemberMock.mockResolvedValue(false);
    const { updatePlaceStatus } = await import("@/lib/places");

    const result = await updatePlaceStatus({
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      groupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      placeId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      status: "visited"
    });

    expect(result).toEqual({ error: "No tienes permisos para actualizar este lugar." });
  });

  it("no owner no puede revisar join requests", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    canReviewJoinRequestsMock.mockResolvedValue(false);
    const { reviewJoinRequestAction } = await import("@/app/groups/[groupId]/actions");

    const formData = new FormData();
    formData.set("groupId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    formData.set("requestId", "cccccccc-cccc-4ccc-8ccc-cccccccccccc");
    formData.set("decision", "approved");

    const result = await reviewJoinRequestAction({ error: null, success: false }, formData);
    expect(result).toEqual({
      error: "No tienes permisos para gestionar solicitudes de este grupo.",
      success: false
    });
  });

  it("no owner no puede cambiar settings", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    canChangeGroupPrivacyMock.mockResolvedValue(false);
    const { updateGroupSettingsAction } = await import("@/app/groups/[groupId]/actions");

    const formData = new FormData();
    formData.set("groupId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    formData.set("privacy", "privado");
    formData.set("joinPolicy", "request_to_join");

    const result = await updateGroupSettingsAction({ error: null, success: false }, formData);
    expect(result).toEqual({
      error: "Solo el administrador puede cambiar la privacidad del grupo.",
      success: false
    });
  });

  it("no owner no puede borrar grupo", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    isGroupOwnerMock.mockResolvedValue(false);
    const { deleteGroupAction } = await import("@/app/groups/[groupId]/actions");

    const formData = new FormData();
    formData.set("groupId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

    const result = await deleteGroupAction({ error: null, success: false }, formData);
    expect(result).toEqual({
      error: "Solo el propietario puede eliminar este grupo.",
      success: false
    });
  });

  it("no owner no puede expulsar miembros", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    isGroupOwnerMock.mockResolvedValue(false);
    const { removeGroupMemberAction } = await import("@/app/groups/[groupId]/actions");

    const formData = new FormData();
    formData.set("groupId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    formData.set("memberUserId", "cccccccc-cccc-4ccc-8ccc-cccccccccccc");

    const result = await removeGroupMemberAction({ error: null, success: false }, formData);
    expect(result).toEqual({
      error: "Solo el administrador puede expulsar miembros.",
      success: false
    });
  });

  it("owner puede expulsar miembro cuando la RPC confirma el borrado", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    isGroupOwnerMock.mockResolvedValue(true);
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: null })
    });
    const { removeGroupMemberAction } = await import("@/app/groups/[groupId]/actions");

    const formData = new FormData();
    formData.set("groupId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    formData.set("memberUserId", "cccccccc-cccc-4ccc-8ccc-cccccccccccc");

    const result = await removeGroupMemberAction({ error: null, success: false }, formData);
    expect(result).toEqual({
      error: null,
      success: true
    });
  });

  it("owner recibe error si el miembro ya no pertenece al grupo", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    isGroupOwnerMock.mockResolvedValue(true);
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "El miembro ya no pertenece al grupo." } })
    });
    const { removeGroupMemberAction } = await import("@/app/groups/[groupId]/actions");

    const formData = new FormData();
    formData.set("groupId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    formData.set("memberUserId", "cccccccc-cccc-4ccc-8ccc-cccccccccccc");

    const result = await removeGroupMemberAction({ error: null, success: false }, formData);
    expect(result).toEqual({
      error: "El miembro ya no pertenece al grupo.",
      success: false
    });
  });
});
