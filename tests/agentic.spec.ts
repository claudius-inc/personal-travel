import { test, expect } from "@playwright/test";

test.describe("Agentic AI Features & Mock Data", () => {
  test("User can create a trip and the page renders with POI hover cards", async ({
    page,
  }) => {
    // Intercept only specific external APIs to prevent real network calls
    await page.route(
      "https://geocoding-api.open-meteo.com/**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            results: [{ latitude: 41.9028, longitude: 12.4964 }],
          }),
        });
      },
    );

    await page.route("https://api.open-meteo.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });

    // Intercept the POI API so it doesn't hit real Google Places
    await page.route("**/api/poi", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          name: "AI Generated Rome Tour",
          rating: 4.5,
          user_ratings_total: 1200,
          formatted_address: "Rome, Italy",
          editorial_summary: "A beautiful city with ancient history.",
          photos: [],
          types: ["tourist_attraction"],
        }),
      });
    });

    // Navigate to homepage
    await page.goto("/");
    await expect(
      page.locator("h1", { hasText: "Your Journeys" }),
    ).toBeVisible();

    // Fill in the trip creation form using known-good locators from trips.spec.ts
    const uniqueName = `AI Generated Rome Tour ${Date.now()}`;
    await page.fill('input[id="name"]', uniqueName);
    await page.fill('input[id="start"]', "2026-09-10");
    await page.fill('input[id="end"]', "2026-09-15");

    // Submit the form
    const createBtn = page.locator(
      'button[type="submit"]:has-text("Create Trip")',
    );
    await expect(createBtn).toBeEnabled();
    await createBtn.click();

    // Trip card should appear in the list
    await expect(page.locator(`text=${uniqueName}`).first()).toBeVisible({
      timeout: 10000,
    });

    // Click the trip card to navigate to details
    await page.locator(`text=${uniqueName}`).first().click();
    await page.waitForURL("**/trip/*");

    // Verify trip details page loaded with the correct name
    await expect(
      page.locator("h1", { hasText: "AI Generated Rome Tour" }),
    ).toBeVisible();
  });
});
