import { test, expect } from "@playwright/test";

test.describe("Personal Travel App - Core User Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto("/");
  });

  test("User can create a new trip and view its details", async ({ page }) => {
    const uniqueTripName = `Tokyo Getaway ${Date.now()}`;
    await page.fill('input[id="name"]', uniqueTripName);
    await page.fill('input[id="start"]', "2026-05-01");
    await page.fill('input[id="end"]', "2026-05-14");
    await page.fill('input[id="style"]', "solo");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the trip card to appear in the "Upcoming Trips" section
    await expect(page.locator(`text=${uniqueTripName}`).first()).toBeVisible();

    // Click on the newly created trip to view details
    await page.locator(`text=${uniqueTripName}`).first().click();

    // Verify we are on the trip details page
    await expect(
      page.locator(`h1:has-text("${uniqueTripName}")`),
    ).toBeVisible();

    // Check that the empty state is displayed in the Itinerary tab
    await expect(page.locator("text=No itinerary items yet")).toBeVisible();
  });

  test("User can add expenses to a trip", async ({ page }) => {
    const expenseTripName = `Budget Test Trip ${Date.now()}`;
    await page.fill('input[id="name"]', expenseTripName);
    await page.fill('input[id="start"]', "2026-06-01");
    await page.fill('input[id="end"]', "2026-06-05");
    await page.fill('input[id="style"]', "budget");
    await page.click('button[type="submit"]');

    // Wait for it and click it
    const tripCard = page.locator(`text=${expenseTripName}`).first();
    await tripCard.waitFor({ state: "visible" });
    await tripCard.click();

    // Verify details page loaded
    await expect(
      page.locator("h1", { hasText: expenseTripName }),
    ).toBeVisible();

    // Switch to Expenses tab
    await page.click('button[role="tab"]:has-text("Expenses")');

    // Add a new expense
    const expenseAmountInput = page.locator('input[type="number"]');
    await expenseAmountInput.fill("15.50");

    // Note: To target the right description input, we'll use a better selector since there are multiple
    const inputs = await page.locator("input").all();
    // Assuming the second text input in the form is description and third is date
    await page.fill(
      'label:has-text("Description") + input',
      "Coffee and croissant",
    );
    await page.click('button:has-text("Add")');

    // Verify the expense appears in the list
    await expect(
      page.locator("text=Coffee and croissant").first(),
    ).toBeVisible();
    await expect(page.locator("text=USD 15.50").first()).toBeVisible();

    // Verify the total spent updated
    await expect(page.locator('h3:has-text("$15.50")').first()).toBeVisible();
  });
});
