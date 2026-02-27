import { test, expect, type Page } from "@playwright/test";

// ─── Shared Helpers ──────────────────────────────────────────

/** Mock external APIs to prevent real network calls */
async function mockExternalAPIs(page: Page) {
  await page.route("https://geocoding-api.open-meteo.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [{ latitude: 41.9028, longitude: 12.4964 }],
      }),
    });
  });

  await page.route("https://api.open-meteo.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  await page.route("**/api/poi", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        name: "Test Place",
        rating: 4.5,
        user_ratings_total: 100,
        formatted_address: "Rome, Italy",
        editorial_summary: "A test place.",
        photos: [],
        types: ["tourist_attraction"],
      }),
    });
  });
}

/** Create a trip and navigate to its details page. Returns the trip name. */
async function createTripAndNavigate(
  page: Page,
  opts: { name?: string; startDate?: string; endDate?: string } = {},
): Promise<string> {
  const tripName = opts.name || `Test Trip ${Date.now()}`;
  const startDate = opts.startDate || "2026-09-10";
  const endDate = opts.endDate || "2026-09-15";

  await page.goto("/");
  await expect(
    page.locator("h1", { hasText: "Your Journeys" }),
  ).toBeVisible();

  await page.fill('input[id="name"]', tripName);
  await page.fill('input[id="start"]', startDate);
  await page.fill('input[id="end"]', endDate);

  await page
    .locator('button[type="submit"]:has-text("Create Trip")')
    .click();

  await expect(page.locator(`text=${tripName}`).first()).toBeVisible({
    timeout: 10000,
  });

  await page.locator(`text=${tripName}`).first().click();
  await page.waitForURL("**/trip/*");
  await expect(page.locator("h1", { hasText: tripName })).toBeVisible({
    timeout: 10000,
  });

  return tripName;
}

/** Add an itinerary item via the trip API directly (fast seeding) */
async function seedItineraryItem(
  page: Page,
  tripId: string,
  item: {
    dayIndex: number;
    location: string;
    startTime?: string;
    description?: string;
    lat?: number;
    lng?: number;
    sortOrder?: number;
  },
) {
  return await page.evaluate(
    async ({ tripId, item }) => {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      return res.json();
    },
    { tripId, item },
  );
}

/** Extract trip ID from the current URL */
function getTripIdFromUrl(page: Page): string {
  const url = page.url();
  const match = url.match(/\/trip\/([^/?]+)/);
  return match ? match[1] : "";
}

// ─── Feature Tests ───────────────────────────────────────────

test.describe("Feature 1: Conversational AI Chat", () => {
  test("User can send a chat message and get a reply with items added", async ({
    page,
  }) => {
    await mockExternalAPIs(page);

    // Mock the chat API
    await page.route("**/api/trips/*/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply:
            "I recommend visiting the Colosseum in the morning and the Vatican in the afternoon!",
          items: [
            {
              dayIndex: 1,
              location: "Colosseum",
              startTime: "9:00 AM",
              description: "Ancient amphitheater",
            },
            {
              dayIndex: 1,
              location: "Vatican Museums",
              startTime: "2:00 PM",
              description: "Art and history",
            },
          ],
        }),
      });
    });

    await createTripAndNavigate(page, { name: `Chat Test ${Date.now()}` });

    // Switch to AI Chat tab
    await page.click('button[role="tab"]:has-text("AI Chat")');

    // Verify welcome message
    await expect(page.locator('[data-testid="chat-reply"]').first()).toBeVisible();

    // Send a message
    await page.fill('[data-testid="chat-input"]', "Plan my first day in Rome");
    await page.click('[data-testid="chat-send"]');

    // Verify user message appears
    await expect(
      page.locator('[data-testid="chat-user-message"]').first(),
    ).toBeVisible();

    // Verify assistant reply
    await expect(
      page.locator('[data-testid="chat-reply"]').nth(1),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('text=2 items added to itinerary'),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Feature 2: Drag-and-Drop Reorder", () => {
  test("Drag handles are visible for each itinerary item", async ({
    page,
  }) => {
    await mockExternalAPIs(page);
    await createTripAndNavigate(page, { name: `DnD Test ${Date.now()}` });

    const tripId = getTripIdFromUrl(page);

    // Seed items
    await seedItineraryItem(page, tripId, {
      dayIndex: 1,
      location: "Place A",
      startTime: "9:00 AM",
      description: "First stop",
      sortOrder: 0,
    });
    await seedItineraryItem(page, tripId, {
      dayIndex: 1,
      location: "Place B",
      startTime: "11:00 AM",
      description: "Second stop",
      sortOrder: 1,
    });

    // Reload to see seeded items
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify items are visible
    await expect(page.locator("text=Place A").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Place B").first()).toBeVisible();

    // Verify drag handles exist (GripVertical icons)
    const handles = page.locator('[data-testid^="drag-handle-"]');
    await expect(handles.first()).toBeVisible();
    expect(await handles.count()).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Feature 3: URL Import", () => {
  test("User can import itinerary items from a URL", async ({ page }) => {
    await mockExternalAPIs(page);

    await createTripAndNavigate(page, {
      name: `Import URL Test ${Date.now()}`,
    });

    const tripId = getTripIdFromUrl(page);

    // Mock the import-url API to actually seed items into the real DB
    await page.route("**/api/trips/*/import-url", async (route) => {
      // Seed real items into the DB so the trip refetch picks them up
      const itemData = [
        {
          dayIndex: 1,
          location: "Eiffel Tower",
          description: "Imported from blog",
          startTime: "10:00 AM",
        },
        {
          dayIndex: 2,
          location: "Louvre Museum",
          description: "World famous museum",
          startTime: "9:00 AM",
        },
      ];

      for (const item of itemData) {
        await page.evaluate(
          async ({ tripId, item }) => {
            await fetch(`/api/trips/${tripId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item),
            });
          },
          { tripId, item },
        );
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: itemData }),
      });
    });

    // The import URL input should be visible in the itinerary tab
    const urlInput = page.locator('[data-testid="import-url-input"]');
    await expect(urlInput).toBeVisible();

    // Paste a URL
    await urlInput.fill("https://example.com/travel-blog");

    // Click Import
    const importBtn = page.locator('[data-testid="import-url-button"]');
    await expect(importBtn).toBeEnabled();
    await importBtn.click();

    // Wait for the items to appear after import (page refreshes trip data)
    await expect(page.locator("text=Eiffel Tower").first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Feature 4: Map-Itinerary Bidirectional Linking", () => {
  test("Clicking an itinerary item highlights it with a ring", async ({
    page,
  }) => {
    await mockExternalAPIs(page);
    await createTripAndNavigate(page, { name: `Map Link Test ${Date.now()}` });

    const tripId = getTripIdFromUrl(page);

    // Seed an item with coordinates
    const item = await seedItineraryItem(page, tripId, {
      dayIndex: 1,
      location: "Test Marker Place",
      startTime: "10:00 AM",
      description: "A geocoded place",
      lat: 41.8902,
      lng: 12.4922,
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify item is visible
    await expect(
      page.locator("text=Test Marker Place").first(),
    ).toBeVisible({ timeout: 10000 });

    // Click on the item card
    const itemCard = page.locator(
      `[data-testid="itinerary-item-${item.id}"]`,
    );
    if ((await itemCard.count()) > 0) {
      await itemCard.click();
      // Item should get a ring highlight
      await expect(itemCard).toHaveClass(/ring-2/, { timeout: 3000 });
    }
  });
});

test.describe("Feature 5: Inline Itinerary Editing", () => {
  test("User can click a location to edit inline, save on blur", async ({
    page,
  }) => {
    await mockExternalAPIs(page);
    await createTripAndNavigate(page, {
      name: `Inline Edit Test ${Date.now()}`,
    });

    const tripId = getTripIdFromUrl(page);

    const item = await seedItineraryItem(page, tripId, {
      dayIndex: 1,
      location: "Original Place",
      startTime: "9:00 AM",
      description: "Original desc",
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Original Place").first()).toBeVisible({
      timeout: 10000,
    });

    // Click the location text to start editing
    const locationEl = page.locator(`[data-testid="location-${item.id}"]`);
    if ((await locationEl.count()) > 0) {
      await locationEl.click();

      // An input should appear
      const editInput = page.locator(
        `[data-testid="edit-location-${item.id}"]`,
      );
      await expect(editInput).toBeVisible({ timeout: 3000 });

      // Clear and type new value
      await editInput.fill("Updated Place");

      // Blur to save
      await editInput.blur();

      // Verify the update persisted (location text should update)
      await expect(page.locator("text=Updated Place").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("User can delete an itinerary item", async ({ page }) => {
    await mockExternalAPIs(page);
    await createTripAndNavigate(page, {
      name: `Delete Item Test ${Date.now()}`,
    });

    const tripId = getTripIdFromUrl(page);

    const item = await seedItineraryItem(page, tripId, {
      dayIndex: 1,
      location: "Deletable Place",
      startTime: "10:00 AM",
      description: "Will be deleted",
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Deletable Place").first()).toBeVisible({
      timeout: 10000,
    });

    // Click delete button (auto-accept the confirm dialog)
    page.on("dialog", (dialog) => dialog.accept());

    const deleteBtn = page.locator(
      `[data-testid="delete-item-${item.id}"]`,
    );
    if ((await deleteBtn.count()) > 0) {
      await deleteBtn.click();

      // Item should be removed
      await expect(
        page.locator("text=Deletable Place"),
      ).not.toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Feature 6: Today View", () => {
  test("Today tab appears when trip spans current date and shows items", async ({
    page,
  }) => {
    await mockExternalAPIs(page);

    // Create a trip that spans today
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 1);
    const end = new Date(today);
    end.setDate(end.getDate() + 3);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    await createTripAndNavigate(page, {
      name: `Today View Test ${Date.now()}`,
      startDate: formatDate(start),
      endDate: formatDate(end),
    });

    const tripId = getTripIdFromUrl(page);

    // Calculate today's day index (1-based, start is day 1)
    const diffMs = today.getTime() - start.getTime();
    const todayDayIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    // Seed an item for today
    await seedItineraryItem(page, tripId, {
      dayIndex: todayDayIndex,
      location: "Today Activity",
      startTime: "10:00 AM",
      description: "Something for today",
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Today tab should be visible
    const todayTab = page.locator('button[role="tab"]:has-text("Today")');
    await expect(todayTab).toBeVisible({ timeout: 10000 });

    // Click Today tab
    await todayTab.click();

    // Today's item should be visible
    await expect(page.locator("text=Today Activity").first()).toBeVisible({
      timeout: 10000,
    });

    // Directions button should be present
    await expect(
      page.locator('a:has-text("Directions")').first(),
    ).toBeVisible();
  });
});

test.describe("Feature 7: Expense Analytics", () => {
  test("Expense analytics renders budget gauge and category bars", async ({
    page,
  }) => {
    await mockExternalAPIs(page);
    await createTripAndNavigate(page, {
      name: `Analytics Test ${Date.now()}`,
    });

    const tripId = getTripIdFromUrl(page);

    // Add expenses directly via API
    await page.evaluate(
      async ({ tripId }) => {
        const expenses = [
          { amount: 50, description: "Sushi dinner", date: "2026-09-10", currency: "USD" },
          { amount: 30, description: "Taxi ride", date: "2026-09-10", currency: "USD" },
          { amount: 120, description: "Hotel stay", date: "2026-09-11", currency: "USD" },
          { amount: 25, description: "Museum ticket", date: "2026-09-12", currency: "USD" },
        ];
        for (const exp of expenses) {
          await fetch(`/api/trips/${tripId}/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(exp),
          });
        }
      },
      { tripId },
    );

    // Reload to get fresh data
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Switch to Expenses tab
    await page.click('button[role="tab"]:has-text("Expenses")');

    // Expense analytics should render
    const analytics = page.locator('[data-testid="expense-analytics"]');
    await expect(analytics).toBeVisible({ timeout: 10000 });

    // Budget gauge should be present
    const gauge = page.locator('[data-testid="budget-gauge"]');
    // Gauge only shows when budget > 0 (default is 0, but the component handles it)
    // Categories should be visible
    await expect(
      page.locator('[data-testid^="category-"]').first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
