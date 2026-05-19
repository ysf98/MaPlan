import { expect, type Page } from "@playwright/test";

export const E2E_EMAIL = process.env.E2E_EMAIL;
export const E2E_PASSWORD = process.env.E2E_PASSWORD;
export const HAS_E2E_CREDENTIALS = !!E2E_EMAIL && !!E2E_PASSWORD;

export async function loginWithEnvUser(page: Page) {
  if (!E2E_EMAIL || !E2E_PASSWORD) {
    throw new Error("Missing E2E credentials: define E2E_EMAIL and E2E_PASSWORD.");
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Contrasena").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
