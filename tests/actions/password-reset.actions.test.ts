import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClientMock = vi.fn();
const headersMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

vi.mock("next/headers", () => ({
  headers: headersMock
}));

describe("password reset actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "origin" ? "https://maplan.test" : null)
    });
  });

  it("requiere email para enviar recuperación", async () => {
    const { forgotPasswordAction } = await import("@/app/forgot-password/actions");
    const formData = new FormData();

    const result = await forgotPasswordAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: "Introduce tu correo electrónico.", success: false });
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
  });

  it("envía enlace de recuperación con redirect a reset-password", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      auth: { resetPasswordForEmail }
    });
    const { forgotPasswordAction } = await import("@/app/forgot-password/actions");
    const formData = new FormData();
    formData.set("email", "USER@MAIL.COM ");

    const result = await forgotPasswordAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(resetPasswordForEmail).toHaveBeenCalledWith("user@mail.com", {
      redirectTo: "https://maplan.test/auth/callback?next=%2Freset-password"
    });
  });

  it("valida la nueva contraseña antes de actualizar", async () => {
    const { resetPasswordAction } = await import("@/app/reset-password/actions");
    const formData = new FormData();
    formData.set("password", "abc");
    formData.set("confirmPassword", "abc");

    const result = await resetPasswordAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: "La contraseña debe tener al menos 9 caracteres.", success: false });
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
  });

  it("rechaza contraseñas que no coinciden", async () => {
    const { resetPasswordAction } = await import("@/app/reset-password/actions");
    const formData = new FormData();
    formData.set("password", "NuevaPass1!");
    formData.set("confirmPassword", "OtraPass1!");

    const result = await resetPasswordAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: "Las contraseñas no coinciden.", success: false });
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
  });

  it("actualiza contraseña y cierra sesión temporal", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      auth: { updateUser, signOut }
    });
    const { resetPasswordAction } = await import("@/app/reset-password/actions");
    const formData = new FormData();
    formData.set("password", "NuevaPass1!");
    formData.set("confirmPassword", "NuevaPass1!");

    const result = await resetPasswordAction({ error: null, success: false }, formData);

    expect(result).toEqual({ error: null, success: true });
    expect(updateUser).toHaveBeenCalledWith({ password: "NuevaPass1!" });
    expect(signOut).toHaveBeenCalled();
  });
});
