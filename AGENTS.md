# Context

We are building a Personal Travel App integrated with an OpenClaw AI agent.

## Architecture & Tech Stack

- Frontend: Next.js (App Router, Turbopack enabled), Tailwind CSS, shadcn/ui
- Database: Turso (LibSQL) with Drizzle ORM
- AI Parsing: Gemini 2.5 Flash (`@google/genai`)
- PWA: Serwist (`@serwist/next`) for offline service worker caching
- Validation & Types: Husky pre-commit hook (`npm run lint && npx tsc --noEmit`)

## User Flows

- **Trip Creation**: User creates a trip by specifying days, airports, date, travel style, and budget.
- **Trip Import**: User uploads a photo/PDF of an itinerary. The app parses it via Gemini 2.5 Flash into daily events.
- **AI Enrichment**: The app pre-generates history, fun facts, and spontaneous ideas for parsed locations before the trip starts.
- **Agentic Interaction**: OpenClaw AI reads/writes data to the app via REST API endpoints, guided by a `skill.md` file.
- **Anonymous Sharing**: Users can share trips via a link for anonymous viewing and modification by friends.
- **Travel Utilities**: Provides an interactive map view, offline capability (PWA), weather integration, and expense/budget tracking.
