import { test, expect } from "@playwright/test";

test("landing page shows the hero and a signed-out CTA", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "The library is the product.",
  );
  await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
});

test("nav CTA links to sign-up when signed out", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/sign-up/);
});
