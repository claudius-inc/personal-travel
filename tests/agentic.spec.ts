import { test, expect } from "@playwright/test";

test.describe("Agentic AI Features & Mock Data", () => {
  test("User sees agent-parsed itinerary items and AI insights", async ({
    page,
  }) => {
    // 1. We'll intercept the backend API for a specific mocked trip
    // that simulates an OpenClaw AI having populated the database.
    const mockTripId = "mock-agent-trip-123";

    await page.route(`**/api/trips/${mockTripId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: mockTripId,
          name: "AI Generated Rome Tour",
          startDate: "2026-09-10",
          endDate: "2026-09-15",
          style: "Historical",
          budget: 2000,
          shareToken: null,
          itineraryItems: [
            {
              id: "item-colosseum",
              dayIndex: 1,
              startTime: "10:00 AM",
              location: "The Colosseum",
              description: "Guided tour of the ancient amphitheater.",
            },
          ],
          expenses: [],
        }),
      });
    });

    // 2. Intercept the AI Insights API
    await page.route(`**/api/insights/item-colosseum`, async (route) => {
      await route.fulfill({
        status: 404, // Not generated yet
        body: JSON.stringify({ error: "Not found" }),
      });
    });

    await page.route(
      `**/api/insights/item-colosseum/generate`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            history: "[MOCK] Built under the Flavian emperors...",
            funFacts:
              "[MOCK] It could hold an estimated 50,000 to 80,000 spectators...",
            spontaneousIdeas: "[MOCK] Grab gelato at a nearby cafe after...",
          }),
        });
      },
    );

    // Navigate directly to this mock trip URL
    await page.goto(`/trip/${mockTripId}`);

    // Verify it loaded the mocked data
    await expect(
      page.locator('h1:has-text("AI Generated Rome Tour")'),
    ).toBeVisible();
    await expect(page.locator("text=The Colosseum")).toBeVisible();

    // Click on "AI Insights" button for this item
    const insightBtn = page.locator('button:has-text("AI Insights")');
    await insightBtn.click();

    // Verify the mocked AI generation returned our specific dummy data
    await expect(
      page.locator("text=[MOCK] Built under the Flavian emperors"),
    ).toBeVisible();
    await expect(page.locator("text=[MOCK] Grab gelato")).toBeVisible();
  });
});
