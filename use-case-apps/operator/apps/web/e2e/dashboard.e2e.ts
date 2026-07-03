import { expect, test } from "@playwright/test";

test("dashboard renders the tactical map without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/dashboard/");
  await expect(page.locator(".ops-map-panel")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(2, { timeout: 15000 });
  await page.waitForTimeout(1500);

  expect(errors).toHaveLength(0);
});
