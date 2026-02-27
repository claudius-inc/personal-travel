# Context

We are building a Personal Travel App integrated with an OpenClaw AI agent.

## Architecture & Tech Stack

- Frontend: Next.js (App Router, Turbopack enabled), Tailwind CSS, shadcn/ui
- Database: Turso (LibSQL) with Drizzle ORM
- AI Parsing: Gemini 2.5 Flash (`@google/genai`)
- PWA: Serwist (`@serwist/next`) for offline service worker caching
- Validation & Types: Husky pre-commit hook (`npm run lint && npx tsc --noEmit`)
- Best Practices: Strict separation of React Server Components and nested Client Components to optimize data fetching.
- Code Quality: Strict `zod` validation, centralized `next-themes` dark mode support, and DRY shared components (`ItineraryTimeline`, `useGeocode`).
- POI Enrichment: Google Places API (`@googlemaps/google-maps-services-js`) via `/api/poi` route with in-memory caching. `POIHoverCard` component with shadcn HoverCard + Carousel.

## User Flows

- **Trip Creation**: User creates a trip via a minimalist form with style chips, animated Exact Dates / Flexible toggle, progressive-disclosure airport fields (autocomplete from `airports.json`), and smart validation.
- **Trip Import**: User uploads a photo/PDF of an itinerary. The app parses it via Gemini 2.5 Flash into daily events.
- **AI Enrichment**: The app pre-generates history, fun facts, and spontaneous ideas for parsed locations before the trip starts.
- **POI Hover Info**: Hovering over a location name in the itinerary timeline shows a rich card with Google Places photos, star ratings, review counts, category, and description.
- **Agentic Interaction**: OpenClaw AI reads/writes data to the app via REST API endpoints, guided by a `skill.md` file.
- **Anonymous Sharing**: Users can share trips via a link for anonymous viewing and modification by friends.
- **Travel Utilities**: Provides an interactive map view, offline capability (PWA), weather integration, and expense/budget tracking.
