import { test, expect } from "@playwright/test";
import { HAS_E2E_CREDENTIALS, loginWithEnvUser } from "./utils/auth";

test.describe("groups", () => {
  test("groups screen renders base actions for logged user", async ({ page }) => {
    test.skip(!HAS_E2E_CREDENTIALS, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated tests.");

    await loginWithEnvUser(page);
    await page.goto("/groups");
    await expect(page.getByRole("heading", { name: "Tus grupos" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Crear nuevo grupo/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Unirse con codigo/i })).toBeVisible();
  });
});
