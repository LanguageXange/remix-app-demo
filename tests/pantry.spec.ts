import { test, expect } from "@playwright/test";

test("redirect user to login if they are not logged in", async ({ page }) => {
  // page in the current headless browser
  await page.goto("/app/pantry");
  await expect(
    page.getByRole("button", { name: /login \/ sign up/i })
  ).toBeVisible();
});
