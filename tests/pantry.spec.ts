import { test, expect } from "@playwright/test";

test.afterEach(async ({ page }) => {
  // to delete user after testing
  await page.goto("/__tests/delete-user?email=newuser@gmail.com");
});

test("redirect user to login if they are not logged in", async ({ page }) => {
  // page in the current headless browser
  await page.goto("/app/pantry");
  await expect(
    page.getByRole("button", { name: /login \/ sign up/i })
  ).toBeVisible();
});

test("lets a user do a typical flow", async ({ page }) => {
  await page.goto(
    "/__tests/login?email=newuser@gmail.com&firstName=newuser&lastName=wooo"
  );
  await page.goto("/app/pantry");

  await page.getByRole("button", { name: /create shelf/i }).click();
  //https://www.w3.org/TR/html-aria/#docconformance
  const shelfNameInput = page
    .getByRole("textbox", {
      name: /shelf name/i,
    })
    .last(); // select the last one otherwise we might select multiple shelf inputs

  await shelfNameInput.fill("Dairy");
  const newItemInput = page.getByPlaceholder(/Enter Item Name/).last();
  await newItemInput.fill("Milk"); // .type is deprecated
  await newItemInput.press("Enter");
  await newItemInput.fill("Eggs"); // .type is deprecated
  await newItemInput.press("Enter");

  await page.goto("/app/recipes");
  await page.goto("/app/pantry");
  // test data persistency
  expect(await shelfNameInput.inputValue()).toBe("Dairy");
  expect(page.getByText("Milk")).toBeVisible();
  expect(page.getByText("Eggs")).toBeVisible();

  // testing delete shelf item
  await page
    .getByRole("button", { name: /delete eggs/i })
    .last()
    .click();
  expect(page.getByText("Eggs")).not.toBeVisible();

  // testing delete shelf
  page.on("dialog", (dialog) => dialog.accept()); // this will wait for the dialog to appear and click ok
  await page
    .getByRole("button", { name: /delete shelf/i })
    .last()
    .click();

  expect(shelfNameInput).not.toBeVisible();
});
