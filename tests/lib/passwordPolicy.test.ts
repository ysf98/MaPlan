import { describe, expect, it } from "vitest";
import { validatePassword } from "@/lib/auth/passwordPolicy";

describe("password policy", () => {
  it("contrasena menor de 9 caracteres falla", () => {
    expect(validatePassword("Abc123")).toBe("La contraseña debe tener al menos 9 caracteres.");
  });

  it("sin mayuscula falla", () => {
    expect(validatePassword("abcdefg12")).toBe("La contraseña debe incluir al menos una letra mayúscula.");
  });

  it("sin minuscula falla", () => {
    expect(validatePassword("ABCDEFG12")).toBe("La contraseña debe incluir al menos una letra minúscula.");
  });

  it("sin numero falla", () => {
    expect(validatePassword("Abcdefghi")).toBe("La contraseña debe incluir al menos un número.");
  });

  it("contrasena valida pasa", () => {
    expect(validatePassword("Abcdefg12")).toBeNull();
  });
});
