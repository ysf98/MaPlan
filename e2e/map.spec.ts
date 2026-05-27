import { test, expect } from "@playwright/test";
import { HAS_E2E_CREDENTIALS, loginWithEnvUser } from "./utils/auth";

test.describe("map", () => {
  test("map route is protected for anonymous users", async ({ page }) => {
    await page.goto("/map");
    await expect(page).toHaveURL(/\/login\?next=%2Fmap$/);
  });

  test("mi mapa renders for authenticated users", async ({ page }) => {
    test.skip(!HAS_E2E_CREDENTIALS, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated tests.");

    await loginWithEnvUser(page);
    await page.goto("/map");
    await expect(page.getByRole("heading", { name: "Tus lugares guardados" })).toBeVisible();
    await page.getByRole("tab", { name: "Mapa" }).click();
    await expect(page.getByPlaceholder("Buscar lugares cercanos o pegar un enlace de sitio")).toBeVisible();
  });
});
