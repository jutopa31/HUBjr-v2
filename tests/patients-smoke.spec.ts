import { test, expect } from "@playwright/test";

test("filters sync to URL and id deep link opens drawer", async ({ page }) => {
  const url = new URL("/v3/patients", "http://localhost:3000");
  url.searchParams.set("search", "ana");
  url.searchParams.set("service", "ICU");
  url.searchParams.set("status", "active");
  url.searchParams.set("page", "2");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("id", "37");

  await page.goto(url.toString());
  await expect(page.getByText(/Patient Detail/i)).toBeVisible();

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/v3\/patients(?!.*id=)/);
});