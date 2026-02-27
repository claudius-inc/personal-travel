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

---

## User Flows — Planning Stage (Before Travel)

### 1. First-Time User Onboarding
- User opens app → Sees empty state with guidance
- Options: "Import existing itinerary" or "Create from scratch"
- Quick tour highlighting key features (optional)

### 2. Trip Creation (Manual)
- **Step 1:** Enter destination/concept name (required)
- **Step 2:** Choose date mode:
  - Exact dates: Start date + End date
  - Flexible: Duration (days) + Time of year
- **Step 3:** Select travel style (solo, family, friends, luxury, budget)
- **Step 4 (optional):** Add airports, set budget
- → Trip created, redirected to trip detail page

### 3. Quick Import (URL)
- Paste a URL (blog, article, booking confirmation)
- App fetches page content via `/api/trips/quick-import`
- Gemini parses into trip + itinerary items
- Progress feedback shown during parsing
- → Trip created with pre-populated itinerary

### 4. Quick Import (File)
- Upload image (photo of itinerary) or PDF
- Gemini vision model extracts text and parses
- Same flow as URL import
- → Trip created with pre-populated itinerary

### 5. Itinerary Building via AI Chat
- User opens AI Chat tab
- Suggested prompts: "Add activities for Day 2", "Find a restaurant near X"
- AI responds with options, user confirms
- Items added to itinerary with geocoding

### 6. Itinerary Building (Manual)
- User can edit item location, time, description inline
- Drag-and-drop to reorder items or move between days
- Delete items with confirmation

### 7. POI Enrichment
- Hover over location name → POIHoverCard appears
- Shows: Google Places photos, star rating, review count, category
- AI-generated insights: history, fun facts, spontaneous ideas

### 8. Map Preview
- View all itinerary locations as markers on map
- Click marker → Highlight corresponding item in timeline
- Bidirectional linking: click item → center map on marker

### 9. Budget & Expense Setup
- Set total trip budget in trip creation
- Pre-trip: Budget serves as planning target
- During trip: Compare against actual expenses

### 10. Share Trip
- Generate anonymous share link (one-click)
- Anyone with link can view and modify (no auth required)
- Future: Invite specific companions, real-time collaboration

---

## User Flows — During Travel

### 11. Today View (Trip in Progress)
- **Auto-activated** when current date falls within trip dates
- Shows Day N activities in order
- Current activity highlighted with "Now" badge
- Next activity shows countdown ("in 45m")
- No activities? Prompt to add via AI Chat

### 12. Navigation
- Each activity has "Directions" button
- Opens Google Maps with destination pre-filled
- One-tap to navigate

### 13. Expense Tracking
- Add expense: Amount, currency, description, date
- View expense list with running total
- Budget vs. spent comparison
- Delete expenses

### 14. Expense Analytics
- Total spent vs. remaining budget
- Visual indicator if over budget
- (Future: Category breakdown, currency conversion)

### 15. Map View
- Full-screen map with all markers
- Click marker to see location name
- (Future: Route lines, offline maps)

### 16. AI Chat During Travel
- "What's open near me right now?"
- "Move tomorrow's museum visit to today"
- "Find a backup plan if it rains"
- Context-aware suggestions based on current day/time

### 17. Itinerary Modification
- Same editing capabilities as planning stage
- Reorder items within a day
- Add/remove items on the fly
- Changes sync immediately (offline: queue and sync later)

---

## User Flows — Post-Travel

### 18. Trip Archive (Future)
- Trip marked as "completed" after end date
- View-only mode (or editable for memories)
- Trip summary: total expenses, places visited, duration

### 19. Trip Memories (Future)
- Auto-generated summary with stats
- Photo gallery (user uploads)
- Shareable "Trip Report" for social media

### 20. Export (Future)
- Export itinerary as PDF
- Export to Google/Apple Calendar
- Share formatted summary to messaging apps

---

## Edge Cases & Error States

- **No internet:** PWA caches app shell; show "offline mode" banner; queue writes
- **Import fails:** Show clear error message with suggestion to try another format
- **Empty trip:** Show prompt to import or add items
- **Weather API fails:** Graceful degradation, hide weather widget
- **Places API rate limit:** Cache aggressively, show placeholder card

---

## Agentic Interaction

OpenClaw AI reads/writes data to the app via REST API endpoints, guided by `skill.md`:

- `GET /api/trips` — List all trips
- `POST /api/trips` — Create trip
- `GET /api/trips/:id` — Get trip with details
- `PATCH /api/trips/:id` — Update trip
- `DELETE /api/trips/:id` — Delete trip
- `POST /api/trips/:id/parse-itinerary` — Parse uploaded file
- `POST /api/trips/:id/import-url` — Import from URL
- `POST /api/trips/:id/chat` — AI chat endpoint
- `PATCH /api/trips/:id/items/:itemId` — Update item
- `DELETE /api/trips/:id/items/:itemId` — Delete item
- `POST /api/trips/:id/expenses` — Add expense
- `GET /api/insights/:itemId` — Get location insights
- `POST /api/insights/:itemId/generate` — Generate insights

---

## UX Improvement Roadmap

See `docs/UX_IMPROVEMENTS.md` for detailed proposals including:
- Mobile-first optimizations
- Onboarding flow
- Voice input for expenses
- Receipt photo scanning
- Offline maps
- Real-time collaboration
- Trip memories/summary
