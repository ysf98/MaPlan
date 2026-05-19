import { test, expect } from "@playwright/test";
import { HAS_E2E_CREDENTIALS, loginWithEnvUser } from "./utils/auth";

test.describe("authentication", () => {
  test("register with unique email", async ({ page }) => {
    test.skip(process.env.E2E_RUN_SIGNUP !== "1", "Set E2E_RUN_SIGNUP=1 to run signup flow.");

    const uniqueEmail = `e2e+${Date.now()}@example.com`;
    const password = "Aa1!aaaa";
    await page.goto("/register");
    await page.getByLabel("Nombre").fill("E2E User");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Contrasena").fill(password);
    await page.getByRole("button", { name: "Registrarme" }).click();

    await expect(
      page.getByText("Cuenta creada. Revisa tu email para confirmar tu registro.")
    ).toBeVisible();
  });

  test("login with existing user and logout", async ({ page }) => {
    test.skip(!HAS_E2E_CREDENTIALS, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated tests.");

    await loginWithEnvUser(page);
    await expect(page.getByRole("button", { name: "Cerrar sesion" })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar sesion" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
