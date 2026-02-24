# 2026-02-24 — Trip Creation UX Enhancements & Airport Autocomplete

## Changes

### UX Improvements (`page.tsx`)

- **Style Chips**: Replaced text input with clickable pill buttons (solo, family, friends, luxury, budget)
- **Progressive Disclosure**: Airport fields hidden behind "Travel Details" expander
- **Smart Validation**: Create button disabled until required fields are filled
- **Animated Transitions**: Smooth CSS grid-rows animation for Exact Dates ↔ Flexible toggle
- **data-testid attributes**: Added to collapsible wrappers for robust test targeting

### Airport Autocomplete (`AirportAutocomplete.tsx`)

- New component using shadcn Command + Popover
- Fetches `airports.json` (70k entries), filters to active airports
- Search by IATA code, airport name, or country code
- Performance: memoized filtering, capped at 50 results

### Schema & Type Updates

- `TripDetailsClient.tsx`: Added nullable `days`, `startAirport`, `endAirport`, `timeOfYear` to Trip type; fixed nullable `budget`
- `trip/[id]/page.tsx`: Proper null-coalescing for DB → Trip type mapping
- `trip/shared/[token]/page.tsx`: Graceful handling of nullable dates

### Playwright Tests (`trips.spec.ts`)

14 comprehensive tests covering:

- Form initial state & smart validation
- Exact Dates ↔ Flexible toggling
- Style chip selection
- Progressive disclosure (Travel Details expand/collapse)
- Airport autocomplete (search, selection, empty state)
- Full creation flows (exact dates, flexible, with airports)
- Trip details navigation
- Expense flow
- Form reset after submission
