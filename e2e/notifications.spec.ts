import { test, expect } from "@playwright/test";
import { HAS_E2E_CREDENTIALS, loginWithEnvUser } from "./utils/auth";

test.describe("notifications", () => {
  test("notifications route is protected for anonymous users", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/login\?next=%2Fnotifications$/);
  });

  test("authenticated user sees bell button and notifications page", async ({ page }) => {
    test.skip(!HAS_E2E_CREDENTIALS, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated tests.");

    await loginWithEnvUser(page);
    await expect(page.getByLabel("Notificaciones")).toBeVisible();

    await page.getByLabel("Notificaciones").click();
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(page.getByText("- Notificaciones")).toBeVisible();
  });
});
