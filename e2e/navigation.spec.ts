import { test, expect } from "@playwright/test";
import { expectProtectedRouteRedirectsToLogin } from "./utils/auth";

test.describe("navigation and guards", () => {
  const protectedRoutes = [
    "/dashboard",
    "/friends",
    "/groups",
    "/groups/new",
    "/groups/join",
    "/groups/11111111-1111-4111-8111-111111111111",
    "/groups/11111111-1111-4111-8111-111111111111/chat",
    "/groups/11111111-1111-4111-8111-111111111111/plans/22222222-2222-4222-8222-222222222222",
    "/maps",
    "/map",
    "/explore",
    "/notifications",
    "/profile",
    "/profile/places"
  ];

  for (const route of protectedRoutes) {
    test(`redirects ${route} to login for anonymous users`, async ({ page }) => {
      await expectProtectedRouteRedirectsToLogin(page, route);
    });
  }

  test("home exposes auth entry points", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Crear cuenta" })).toBeVisible();
  });
});
