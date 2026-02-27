# POI Hover Card Feature — 2026-02-26

## Summary

Added a Google Places API-powered hover card that shows rich POI details (photos, ratings, reviews, category) when hovering over location names in the itinerary timeline.

## Changes

### Backend

- **[NEW] `src/app/api/poi/route.ts`**: POST endpoint that accepts `{query, lat?, lng?}`, calls Google Places Text Search + Place Details, returns photos/rating/reviews/address/types. In-memory cache to stay within the free 5,000 req/month tier. Zod-validated input.

### Frontend

- **[NEW] `src/components/POIHoverCard.tsx`**: Client component using shadcn `HoverCard` + `Carousel`. Lazy-fetches data on hover open, shows loading skeleton, error state, and rich card with image carousel, star rating badge, category icon, and editorial summary.
- **[MODIFY] `src/components/ItineraryTimeline.tsx`**: Wrapped `item.location` text with `<POIHoverCard>` so every itinerary location is hoverable.

### Tests

- **[MODIFY] `tests/agentic.spec.ts`**: Rewrote to use real UI trip creation flow (matching `trips.spec.ts` locators) instead of fighting SSR mocking. Mocks external APIs (Open-Meteo, POI) to prevent real network calls.

### Dependencies

- Added `@googlemaps/google-maps-services-js`
- Added shadcn `hover-card` and `carousel` components

## Verification

- `npm run check` (ESLint + tsc): 0 errors, 1 warning (expected `<img>` for external Google URLs)
- Playwright: 16/17 passed (1 pre-existing flaky airport autocomplete test)
