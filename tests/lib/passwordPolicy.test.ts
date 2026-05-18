import { describe, expect, it } from "vitest";
import { validatePassword } from "@/lib/auth/passwordPolicy";

describe("password policy", () => {
  it("contrasena menor de 9 caracteres falla", () => {
    expect(validatePassword("Abc123")).toBe("La contrasena debe tener al menos 9 caracteres.");
  });

  it("sin mayuscula falla", () => {
    expect(validatePassword("abcdefg12")).toBe("La contrasena debe incluir al menos una letra mayuscula.");
  });

  it("sin minuscula falla", () => {
    expect(validatePassword("ABCDEFG12")).toBe("La contrasena debe incluir al menos una letra minuscula.");
  });

  it("sin numero falla", () => {
    expect(validatePassword("Abcdefghi")).toBe("La contrasena debe incluir al menos un numero.");
  });

  it("contrasena valida pasa", () => {
    expect(validatePassword("Abcdefg12")).toBeNull();
  });
});
