# Personal Travel App Implementation Plan

We are building a personal travel web application that integrates deeply with an OpenClaw AI agent. The app will allow scheduling itineraries, parsing itineraries from photos/PDFs using Gemini 2.5 Flash, pre-generating location histories/fun facts before the trip, and tracking expenses.

## Proposed Changes

### Core Architecture

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Turso (SQLite edge database), using Drizzle ORM
- **AI Processing**: Gemini 2.5 Flash API
- **PWA**: `next-pwa` for offline capability
- **Agent Integration**: Standardized REST API endpoints + `skill.md` definition for OpenClaw.

### Database Schema (Turso)

1. `trips`: `id`, `name`, `start_date`, `end_date`, `style` (family, solo, etc.), `budget`, `share_token`.
2. `itinerary_items`: `id`, `trip_id`, `day_index`, `start_time`, `end_time`, `location`, `description`, `address`, `lat`, `lng`.
3. `location_insights`: `id`, `item_id`, `history`, `fun_facts`, `spontaneous_ideas`.
4. `expenses`: `id`, `trip_id`, `amount`, `currency`, `description`, `paid_by`, `date`.

### Routing & API Endpoints

- Web UI:
  - `/` (Dashboard / Trip List)
  - `/trip/[id]` (Main Trip View: Itinerary, Map, Expenses)
  - `/trip/shared/[token]` (Anonymous Shared View)
- API for OpenClaw:
  - `POST /api/trips`
  - `GET /api/trips/[id]`
  - `POST /api/trips/[id]/parse-itinerary` (Calls Gemini 2.5 Flash)
  - `POST /api/trips/[id]/expenses`

### Agent & AI Features

- **Itinerary Parsing**: Users upload an image/pdf; we send it to Gemini 2.5 Flash to extract structured JSON data that matches the `itinerary_items` schema.
- **Context Pre-Generation**: Once a trip is populated with locations, an API trigger will use Gemini to generate `location_insights`.
- **OpenClaw `skill.md`**: We will write a markdown file outlining the available API paths, necessary payloads, and capabilities so the OpenClaw agent knows how to interact with the Next.js app.

### Additional Application Features

- **PWA / Offline Mode**: Integrate `next-pwa` to cache API responses and static assets so the app works without a network.
- **Interactive Map**: Use Mapbox or Leaflet (react-leaflet) to plot the itinerary.
- **Weather Integration**: Use a public Weather API (e.g., OpenMeteo) to fetch destination forecasts.

## Verification Plan

### Automated Tests

- We will rely mostly on manual verification for the MVP, but basic API endpoint tests (using Next.js testing tools or simple cURL checks in a workflow script) can be added for the core CRUD logic.

### Manual Verification

1. Initialize the Next.js scaffold and verify the dev server runs.
2. Setup the Turso connection and push the schema via Drizzle; manually verify tables exist.
3. Test the Gemini 2.5 Flash extraction by sending it a sample printed itinerary image.
4. Verify PWA behavior by using Chrome DevTools (setting Network to Offline) and loading a trip.
5. Create a shared link and verify anonymous users can access and modify an itinerary.
