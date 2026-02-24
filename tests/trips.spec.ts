import { test, expect } from "@playwright/test";

test.describe("Trip Creation Form - Core User Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("h1", { hasText: "Your Journeys" }),
    ).toBeVisible();
  });

  // ─── Form Structure & Initial State ─────────────────────────────

  test("renders the Plan a New Trip form with correct initial state", async ({
    page,
  }) => {
    // Form card is visible
    await expect(page.locator("text=Plan a New Trip").first()).toBeVisible();

    // Destination input is present and empty
    const nameInput = page.locator('input[id="name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue("");

    // "Exact Dates" tab is active by default
    await expect(page.getByText("Exact Dates").first()).toBeVisible();
    await expect(page.getByText("Flexible").first()).toBeVisible();

    // Date fields are visible by default (Exact Dates mode)
    await expect(page.locator('input[id="start"]')).toBeVisible();
    await expect(page.locator('input[id="end"]')).toBeVisible();

    // Style chips are rendered
    for (const style of ["solo", "family", "friends", "luxury", "budget"]) {
      await expect(
        page.locator(`button:has-text("${style}")`).first(),
      ).toBeVisible();
    }

    // Create button is disabled initially (no destination filled)
    const createBtn = page.locator(
      'button[type="submit"]:has-text("Create Trip")',
    );
    await expect(createBtn).toBeDisabled();
  });

  // ─── Smart Validation (Button Activation) ───────────────────────

  test("Create button enables only when required fields are filled", async ({
    page,
  }) => {
    const createBtn = page.locator(
      'button[type="submit"]:has-text("Create Trip")',
    );

    // Initially disabled
    await expect(createBtn).toBeDisabled();

    // Type destination only — still disabled (no dates)
    await page.fill('input[id="name"]', "Tokyo");
    await expect(createBtn).toBeDisabled();

    // Fill start date — still disabled (no end date)
    await page.fill('input[id="start"]', "2026-07-01");
    await expect(createBtn).toBeDisabled();

    // Fill end date — now enabled
    await page.fill('input[id="end"]', "2026-07-14");
    await expect(createBtn).toBeEnabled();
  });

  // ─── Toggle Between Exact Dates & Flexible ──────────────────────

  test("Flexible mode shows duration and time-of-year fields, hides date fields", async ({
    page,
  }) => {
    // Switch to Flexible mode
    await page.getByText("Flexible").first().click();

    // Duration and Time of Year fields should be visible
    await expect(page.locator('input[id="days"]')).toBeVisible();
    await expect(page.locator('input[id="time"]')).toBeVisible();

    // Date fields should be in a collapsed wrapper with opacity-0, pointer-events-none
    const datesWrapper = page.locator('[data-testid="dates-wrapper"]');
    await expect(datesWrapper).toHaveClass(/opacity-0/);
    await expect(datesWrapper).toHaveClass(/pointer-events-none/);
  });

  test("Switching back to Exact Dates restores date fields", async ({
    page,
  }) => {
    // Go to Flexible first
    await page.getByText("Flexible").first().click();
    await expect(page.locator('input[id="days"]')).toBeVisible();

    // Switch back to Exact Dates
    await page.getByText("Exact Dates").first().click();

    // Date fields should be visible again
    await expect(page.locator('input[id="start"]')).toBeVisible();
    await expect(page.locator('input[id="end"]')).toBeVisible();
  });

  // ─── Style Chip Selection ───────────────────────────────────────

  test("clicking a style chip selects it visually", async ({ page }) => {
    // "solo" should be selected by default (has bg-neutral-900)
    const soloBtn = page.locator('button:has-text("solo")').first();
    await expect(soloBtn).toHaveClass(/bg-neutral-900/);

    // Click "luxury" chip
    const luxuryBtn = page.locator('button:has-text("luxury")').first();
    await luxuryBtn.click();

    // "luxury" should now be selected
    await expect(luxuryBtn).toHaveClass(/bg-neutral-900/);
    // "solo" should no longer be selected
    await expect(soloBtn).not.toHaveClass(/bg-neutral-900/);
  });

  // ─── Progressive Disclosure (Travel Details) ────────────────────

  test("Travel Details section is collapsed by default and expands on click", async ({
    page,
  }) => {
    // The "Travel Details" expander should be visible
    const detailsBtn = page.getByText("Travel Details").first();
    await expect(detailsBtn).toBeVisible();

    // The travel details wrapper should be collapsed
    const detailsWrapper = page.locator(
      '[data-testid="travel-details-wrapper"]',
    );
    await expect(detailsWrapper).toHaveClass(/pointer-events-none/);
    await expect(detailsWrapper).toHaveClass(/opacity-0/);

    // Click to expand
    await detailsBtn.click();

    // After expanding, the wrapper should have opacity-100 and no pointer-events-none
    await expect(detailsWrapper).not.toHaveClass(/pointer-events-none/);
    await expect(detailsWrapper).toHaveClass(/opacity-100/);

    // Airport buttons should now be interactable
    await expect(page.locator('button[id="startAir"]')).toBeVisible();
    await expect(page.locator('button[id="endAir"]')).toBeVisible();
  });

  // ─── Airport Autocomplete ──────────────────────────────────────

  test("Airport autocomplete opens a searchable dropdown and selects an airport", async ({
    page,
  }) => {
    // Expand Travel Details
    await page.getByText("Travel Details").first().click();

    // Click the Start Airport combobox button to open dropdown
    const startAirBtn = page.locator('button[id="startAir"]');
    await expect(startAirBtn).toBeVisible();
    await startAirBtn.click();

    // The popover with search input should appear
    const searchInput = page
      .locator('input[placeholder="Search city or airport code..."]')
      .first();
    await expect(searchInput).toBeVisible();

    // Type "JFK" to search
    await searchInput.fill("JFK");

    // Wait for a result to appear (JFK should match "John F Kennedy International Airport")
    const jfkOption = page
      .locator('[role="option"]')
      .filter({ hasText: "JFK" })
      .first();
    await expect(jfkOption).toBeVisible({ timeout: 5000 });

    // Click on it to select
    await jfkOption.click();

    // The button should now show JFK
    await expect(startAirBtn).toContainText("JFK");
  });

  test("Airport autocomplete shows 'No airport found' for invalid searches", async ({
    page,
  }) => {
    // Expand Travel Details
    await page.getByText("Travel Details").first().click();

    // Open the Start Airport dropdown
    await page.locator('button[id="startAir"]').click();

    // Search for something that doesn't exist
    const searchInput = page
      .locator('input[placeholder="Search city or airport code..."]')
      .first();
    await searchInput.fill("ZZZZXYZ");

    // "No airport found." should appear
    await expect(page.locator("text=No airport found.")).toBeVisible({
      timeout: 3000,
    });
  });

  // ─── Full Trip Creation Flow (Exact Dates) ─────────────────────

  test("User can create a trip with exact dates and style chip", async ({
    page,
  }) => {
    const uniqueName = `Kyoto Spring ${Date.now()}`;

    // Fill destination
    await page.fill('input[id="name"]', uniqueName);

    // Fill dates
    await page.fill('input[id="start"]', "2026-04-01");
    await page.fill('input[id="end"]', "2026-04-10");

    // Select "family" style
    await page.locator('button:has-text("family")').first().click();

    // Submit
    const createBtn = page.locator(
      'button[type="submit"]:has-text("Create Trip")',
    );
    await expect(createBtn).toBeEnabled();
    await createBtn.click();

    // Trip card should appear in the list
    await expect(page.locator(`text=${uniqueName}`).first()).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── Full Trip Creation Flow (Flexible) ─────────────────────────

  test("User can create a trip with flexible planning (days + time of year)", async ({
    page,
  }) => {
    const uniqueName = `Nordic Fjords ${Date.now()}`;

    // Fill destination
    await page.fill('input[id="name"]', uniqueName);

    // Switch to Flexible mode
    await page.getByText("Flexible").first().click();

    // Fill duration and time of year
    await page.fill('input[id="days"]', "14");
    await page.fill('input[id="time"]', "Mid-Summer");

    // Select "luxury" style
    await page.locator('button:has-text("luxury")').first().click();

    // Submit
    const createBtn = page.locator(
      'button[type="submit"]:has-text("Create Trip")',
    );
    await expect(createBtn).toBeEnabled();
    await createBtn.click();

    // Trip card should appear
    await expect(page.locator(`text=${uniqueName}`).first()).toBeVisible({
      timeout: 10000,
    });

    // Flexible trips should show "Flexible Planning Phase" instead of dates
    const tripCard = page.locator(`text=${uniqueName}`).first().locator("..");
    await expect(
      tripCard.locator("..").locator("text=Flexible Planning Phase"),
    ).toBeVisible();
  });

  // ─── Trip Creation with Airport Autocomplete ────────────────────

  test("User can create a trip with airport selections via autocomplete", async ({
    page,
  }) => {
    const uniqueName = `Paris via JFK ${Date.now()}`;

    // Fill destination
    await page.fill('input[id="name"]', uniqueName);
    await page.fill('input[id="start"]', "2026-06-01");
    await page.fill('input[id="end"]', "2026-06-15");

    // Expand Travel Details
    await page.getByText("Travel Details").first().click();

    // Select Start Airport
    await page.locator('button[id="startAir"]').click();
    const searchInput1 = page
      .locator('input[placeholder="Search city or airport code..."]')
      .first();
    await searchInput1.fill("JFK");
    await page
      .locator('[role="option"]')
      .filter({ hasText: "JFK" })
      .first()
      .click({ timeout: 5000 });
    await expect(page.locator('button[id="startAir"]')).toContainText("JFK");

    // Select End Airport
    await page.locator('button[id="endAir"]').click();
    const searchInput2 = page
      .locator('input[placeholder="Search city or airport code..."]')
      .first();
    await searchInput2.fill("CDG");
    await page
      .locator('[role="option"]')
      .filter({ hasText: "CDG" })
      .first()
      .click({ timeout: 5000 });
    await expect(page.locator('button[id="endAir"]')).toContainText("CDG");

    // Submit the trip
    await page.locator('button[type="submit"]:has-text("Create Trip")').click();

    // Trip should appear in the list
    await expect(page.locator(`text=${uniqueName}`).first()).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── Trip Details Navigation ────────────────────────────────────

  test("Clicking a trip card navigates to details page", async ({ page }) => {
    const uniqueName = `Detail Test ${Date.now()}`;

    // Create a trip first
    await page.fill('input[id="name"]', uniqueName);
    await page.fill('input[id="start"]', "2026-08-01");
    await page.fill('input[id="end"]', "2026-08-07");
    await page.locator('button[type="submit"]:has-text("Create Trip")').click();

    // Wait for the trip card and click it
    const tripLink = page.locator(`text=${uniqueName}`).first();
    await tripLink.waitFor({ state: "visible", timeout: 10000 });
    await tripLink.click();

    // Verify we're on the trip details page
    await expect(page.locator("h1", { hasText: uniqueName })).toBeVisible({
      timeout: 10000,
    });

    // Itinerary tab should show "No itinerary items yet"
    await expect(page.locator("text=No itinerary items yet")).toBeVisible();
  });

  // ─── Expense Flow ──────────────────────────────────────────────

  test("User can add an expense to a trip via the Expenses tab", async ({
    page,
  }) => {
    const tripName = `Expense Flow ${Date.now()}`;

    // Create the trip
    await page.fill('input[id="name"]', tripName);
    await page.fill('input[id="start"]', "2026-09-01");
    await page.fill('input[id="end"]', "2026-09-05");
    await page.locator('button[type="submit"]:has-text("Create Trip")').click();

    // Navigate to trip details
    const tripLink = page.locator(`text=${tripName}`).first();
    await tripLink.waitFor({ state: "visible", timeout: 10000 });
    await tripLink.click();
    await expect(page.locator("h1", { hasText: tripName })).toBeVisible({
      timeout: 10000,
    });

    // Switch to Expenses tab
    await page.click('button[role="tab"]:has-text("Expenses")');

    // Add expense
    await page.locator('input[type="number"]').fill("42.50");
    await page.fill('label:has-text("Description") + input', "Sushi dinner");
    await page.click('button:has-text("Add")');

    // Verify the expense appears
    await expect(page.locator("text=Sushi dinner").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=USD 42.50").first()).toBeVisible();

    // Verify total spent updated
    await expect(page.locator('h3:has-text("$42.50")').first()).toBeVisible();
  });

  // ─── Form Reset After Submission ────────────────────────────────

  test("Form resets to default state after successful trip creation", async ({
    page,
  }) => {
    const uniqueName = `Reset Test ${Date.now()}`;

    // Fill and submit
    await page.fill('input[id="name"]', uniqueName);
    await page.fill('input[id="start"]', "2026-10-01");
    await page.fill('input[id="end"]', "2026-10-05");
    await page.locator('button:has-text("luxury")').first().click();
    await page.locator('button[type="submit"]:has-text("Create Trip")').click();

    // Wait for the trip to appear
    await expect(page.locator(`text=${uniqueName}`).first()).toBeVisible({
      timeout: 10000,
    });

    // Form should be reset
    await expect(page.locator('input[id="name"]')).toHaveValue("");
    await expect(page.locator('input[id="start"]')).toHaveValue("");
    await expect(page.locator('input[id="end"]')).toHaveValue("");

    // "solo" should be re-selected as default style
    await expect(page.locator('button:has-text("solo")').first()).toHaveClass(
      /bg-neutral-900/,
    );

    // Create button should be disabled again
    await expect(
      page.locator('button[type="submit"]:has-text("Create Trip")'),
    ).toBeDisabled();
  });
});
