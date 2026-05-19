import { test, expect } from "@playwright/test";

test.describe("navigation and guards", () => {
  test("redirects private route to login for anonymous users", async ({ page }) => {
    await page.goto("/groups");
    await expect(page).toHaveURL(/\/login\?next=%2Fgroups$/);
    await expect(page.getByRole("heading", { name: "Iniciar sesion" })).toBeVisible();
  });

  test("home exposes auth entry points", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Registro" })).toBeVisible();
  });
});
