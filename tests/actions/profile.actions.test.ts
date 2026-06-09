import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  adminDeleteUserMock,
  adminEqMock,
  adminFromMock,
  adminOrMock,
  adminDeleteMock,
  createSupabaseAdminClientMock,
  createSupabaseServerClientMock,
  eqMock,
  fromMock,
  maybeSingleMock,
  profileLookupEqMock,
  profileLookupMaybeSingleMock,
  profileLookupSelectMock,
  redirectMock,
  requireAuthenticatedUserMock,
  revalidatePathMock,
  selectMock,
  signOutMock,
  updateMock
} = vi.hoisted(() => ({
  adminDeleteUserMock: vi.fn(),
  adminEqMock: vi.fn(),
  adminFromMock: vi.fn(),
  adminOrMock: vi.fn(),
  adminDeleteMock: vi.fn(),
  createSupabaseAdminClientMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
  eqMock: vi.fn(),
  fromMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  profileLookupEqMock: vi.fn(),
  profileLookupMaybeSingleMock: vi.fn(),
  profileLookupSelectMock: vi.fn(),
  redirectMock: vi.fn(),
  requireAuthenticatedUserMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  selectMock: vi.fn(),
  signOutMock: vi.fn(),
  updateMock: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("@/lib/actions/serverAction", () => ({
  requireAuthenticatedUser: requireAuthenticatedUserMock,
  getValidationErrorMessage: (error: { issues?: Array<{ message?: string }> }) => error.issues?.[0]?.message ?? "Datos invalidos."
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock
}));

let profileActions: typeof import("@/app/profile/actions");

function buildFormData(confirmation: string) {
  const formData = new FormData();
  formData.set("confirmation", confirmation);
  return formData;
}

describe("profile server actions", () => {
  beforeAll(async () => {
    profileActions = await import("@/app/profile/actions");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedUserMock.mockResolvedValue({ id: "user-1" });
    profileLookupMaybeSingleMock.mockResolvedValue({ data: { id: "user-1" }, error: null });
    profileLookupEqMock.mockReturnValue({ maybeSingle: profileLookupMaybeSingleMock });
    profileLookupSelectMock.mockReturnValue({ eq: profileLookupEqMock });
    maybeSingleMock.mockResolvedValue({ data: { id: "user-1" }, error: null });
    selectMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    eqMock.mockReturnValue({ select: selectMock });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: profileLookupSelectMock, update: updateMock });
    adminEqMock.mockResolvedValue({ error: null });
    adminOrMock.mockResolvedValue({ error: null });
    adminDeleteMock.mockReturnValue({ eq: adminEqMock, or: adminOrMock });
    adminFromMock.mockReturnValue({ delete: adminDeleteMock });
    adminDeleteUserMock.mockResolvedValue({ error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        signOut: signOutMock
      },
      from: fromMock
    });
    createSupabaseAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          deleteUser: adminDeleteUserMock
        }
      },
      from: adminFromMock
    });
    redirectMock.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`);
    });
  });

  it("rechaza eliminar cuenta si la confirmacion es incorrecta", async () => {
    const result = await profileActions.deleteAccountAction({ error: null, success: false }, buildFormData("BORRAR"));

    expect(result).toEqual({ error: "Escribe ELIMINAR para confirmar.", success: false });
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("anonimiza el perfil, elimina datos, borra auth user, cierra sesion y redirige a login", async () => {
    await expect(profileActions.deleteAccountAction({ error: null, success: false }, buildFormData("ELIMINAR"))).rejects.toThrow(
      "redirect:/login"
    );

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar_url: null,
        deleted_at: expect.any(String),
        full_name: "Usuario eliminado",
        username: "deleted_user1"
      })
    );
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(createSupabaseAdminClientMock).toHaveBeenCalled();
    expect(adminFromMock).toHaveBeenCalledWith("groups");
    expect(adminEqMock).toHaveBeenCalledWith("created_by", "user-1");
    expect(adminFromMock).toHaveBeenCalledWith("places");
    expect(adminEqMock).toHaveBeenCalledWith("created_by", "user-1");
    expect(adminFromMock).toHaveBeenCalledWith("personal_places");
    expect(adminEqMock).toHaveBeenCalledWith("user_id", "user-1");
    expect(adminOrMock).toHaveBeenCalledWith("sender_id.eq.user-1,receiver_id.eq.user-1");
    expect(adminOrMock).toHaveBeenCalledWith("user_a_id.eq.user-1,user_b_id.eq.user-1");
    expect(adminDeleteUserMock).toHaveBeenCalledWith("user-1", false);
    expect(adminFromMock).toHaveBeenCalledWith("profiles");
    expect(signOutMock).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/profile");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("devuelve error claro si no encuentra el perfil", async () => {
    profileLookupMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    const result = await profileActions.deleteAccountAction({ error: null, success: false }, buildFormData("ELIMINAR"));

    expect(result).toEqual({ error: "No se encontro el perfil.", success: false });
    expect(updateMock).not.toHaveBeenCalled();
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
    expect(adminDeleteUserMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("devuelve error si falta configurar service role", async () => {
    createSupabaseAdminClientMock.mockImplementation(() => {
      throw new Error("Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.");
    });

    const result = await profileActions.deleteAccountAction({ error: null, success: false }, buildFormData("ELIMINAR"));

    expect(result).toEqual({ error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.", success: false });
    expect(updateMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("devuelve error si Supabase Auth no elimina el usuario", async () => {
    adminDeleteUserMock.mockResolvedValue({ error: { message: "Auth user not found" } });

    const result = await profileActions.deleteAccountAction({ error: null, success: false }, buildFormData("ELIMINAR"));

    expect(result).toEqual({ error: "No se pudo eliminar el usuario de autenticacion: Auth user not found", success: false });
    expect(signOutMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("no toca Supabase si no hay usuario autenticado", async () => {
    requireAuthenticatedUserMock.mockRejectedValue(new Error("auth"));

    await expect(profileActions.deleteAccountAction({ error: null, success: false }, buildFormData("ELIMINAR"))).rejects.toThrow("auth");
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
  });
});
