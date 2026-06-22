import { expect, test } from "@playwright/test";

test.describe("páginas legales públicas", () => {
  test("la portada enlaza las páginas legales y no muestra métricas ficticias", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Términos" })).toHaveAttribute("href", "/terms");
    await expect(page.getByRole("link", { name: "Política de privacidad" })).toHaveAttribute("href", "/privacy");
    await expect(page.getByText("+10k")).toHaveCount(0);
    await expect(page.getByText("+9k")).toHaveCount(0);
  });

  test("términos es público y permite volver a la portada", async ({ page }) => {
    await page.goto("/terms");

    await expect(page).toHaveURL(/\/terms$/);
    await expect(page).toHaveTitle("Términos y condiciones | MaPlan");
    await expect(page.getByRole("heading", { level: 1, name: "Términos y condiciones" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver a MaPlan" })).toHaveAttribute("href", "/");
  });

  test("privacidad es pública y permite volver a la portada", async ({ page }) => {
    await page.goto("/privacy");

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page).toHaveTitle("Política de privacidad | MaPlan");
    await expect(page.getByRole("heading", { level: 1, name: "Política de privacidad" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver a MaPlan" })).toHaveAttribute("href", "/");
  });
});
