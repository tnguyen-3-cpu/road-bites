# Restaurant Detour Delay — Design

## Problem

The carousel shows a rating, price, cuisine, and review count — enough to judge *quality*, but nothing about *cost of stopping*. A 4.7-star BBQ joint that adds 2 minutes to a trip is a very different decision from one that adds 25 minutes, and the current UI gives the user no way to tell them apart. Users have to eyeball the map and guess.

## User Story

As a road-tripper comparing restaurants along my route, I can see how many extra minutes each stop will add to my trip, so I can weigh "worth the detour" against "skip it" at a glance.

## Scope

- Compute accurate detour time (in minutes) via Google Directions API — `start → restaurant → destination` minus the base route duration.
- Fetch **lazily**, only for the currently focused restaurant (carousel-selected or marker-tapped). Fetching happens at the `HomeScreen` level so the value can be shared by both the carousel card and the detail sheet without duplicate calls.
- Cache results in-memory by `${placeId}|${routeKey}` so re-focusing is instant and switching cards back-and-forth doesn't re-fetch.
- Display on the focused carousel card as a small pill (e.g. `+12 min`) and inline in the detail sheet header (`Adds 12 min to your trip`).
- Graceful states: loading shimmer / `…`, silent hide on error, special-case `On route` when detour ≤ 0 min.

## Out of Scope

- Pre-fetching detour for non-focused cards.
- Sorting or filtering restaurants by detour time.
- Showing detour on map markers.
- Persisting the detour cache across app restarts.
- Background warming, prefetch on idle, etc.

## Architecture

### Data flow

```
HomeScreen
  ├── has: startCoord, endCoord, baseDurationSec, focusedRestaurantId, restaurants
  ├── useDetour(focusedRestaurant, startCoord, endCoord, baseDurationSec)
  │     └── fetches Directions start→restaurant→end, subtracts base, caches
  └── passes { detourMinutes, isLoading } down to:
        ├── RestaurantCarousel (shows on focused card only)
        └── RestaurantDetailSheet (shows in header)
```

### Units & components

**`src/api/googleMaps.js` — extend `getDirections`**
- Signature becomes `getDirections(origin, destination, { waypoints } = {})`.
- When `waypoints` is provided (array of `{latitude, longitude}`), append `&waypoints=lat,lng|lat,lng` to the URL.
- Sum `duration.value` (seconds) and `distance.value` (meters) across *all* legs when waypoints are present — Google splits the route into one leg per segment.
- Return shape gains a numeric field: `{ points, distance, duration, durationValue }`. `durationValue` is total seconds; existing `duration` text field stays for display.
- Existing single-origin-destination callers keep working without changes (they just now also get `durationValue` in the returned object, which the base route fetch in `HomeScreen` needs anyway).

**`src/hooks/useDetour.js` — new**
- Inputs: `restaurant` (may be null), `origin` (may be null), `destination` (may be null), `baseDurationSec` (may be null).
- Effect: when all four inputs exist and valid, compute `cacheKey = ${restaurant.id}|${origin.lat},${origin.lng}->${destination.lat},${destination.lng}`.
  - If cache hit: return cached value synchronously, no fetch.
  - If miss: set `isLoading = true`, call `getDirections(origin, destination, { waypoints: [{latitude: restaurant.latitude, longitude: restaurant.longitude}] })`, compute `detourSec = result.durationValue - baseDurationSec`, convert to minutes (`Math.max(0, Math.round(detourSec / 60))`), store in cache.
- Cache is a module-level `Map` so it survives re-renders but not app restarts (as intended).
- Output: `{ detourMinutes, isLoading, error }`. When any input is null, returns `{ detourMinutes: null, isLoading: false, error: null }` and does nothing.
- Cancellation: cleanup function flips a `cancelled` flag so stale fetches don't write to state after the user moves to a different card.

**`src/screens/HomeScreen.js` — wire it up**
- In the route-fetch effect, capture `result.durationValue` into `routeInfo` alongside existing fields.
- Derive `focusedRestaurant` from `restaurants.find(r => r.id === focusedRestaurantId)`.
- Call `useDetour(focusedRestaurant, startAC.selectedPlace?.coordinate, endAC.selectedPlace?.coordinate, routeInfo?.durationValue)`.
- Pass `{ detourMinutes, isLoading }` to `<RestaurantCarousel>` as a new prop `focusedDetour`, and to `<RestaurantDetailSheet>` as `detour`.

**`src/components/RestaurantCarousel.js` — render on focused card**
- New prop `focusedDetour: { detourMinutes, isLoading } | null`.
- In the `Card` component, render a small amber pill in the footer row (left of the `Details →` CTA, replacing or pairing with the review-count line) **only when `selected === true` and `focusedDetour` is truthy**. The footer was chosen over the header so the existing rating chip + price layout stays untouched.
- States:
  - `isLoading` → pill shows `…` with a subtle opacity shimmer.
  - `detourMinutes === 0` → pill shows `On route` in green.
  - `detourMinutes > 0` → pill shows `+{n} min` in warm amber.
  - `detourMinutes === null` with no loading → render nothing (silent hide, covers the error case too).

**`src/components/RestaurantDetailSheet.js` — header row**
- New prop `detour: { detourMinutes, isLoading } | null`.
- Below the name/rating block, a single-line row: `Adds 12 min to your trip` / `On route — no extra time` / empty on loading or error.
- Uses the same state rules as the carousel pill.

## Data Flow Example

1. User selects start and end places → `HomeScreen` fires `getDirections`, stores `routeInfo = { ..., durationValue: 5400 }` (90 min).
2. Restaurants arrive, first one auto-focuses. `useDetour` fires for `focusedRestaurant`.
3. `getDirections(start, end, { waypoints: [restaurant] })` returns total duration 5760s.
4. `detourSec = 5760 - 5400 = 360` → `detourMinutes = 6`.
5. Carousel's focused card shows `+6 min`; detail sheet shows `Adds 6 min to your trip` if opened.
6. User swipes to next card → `focusedRestaurantId` changes → `useDetour` fires for the new one. Previous one is cached; swiping back is instant.

## Error Handling

- Directions call fails (network, bad key, `ZERO_RESULTS`, etc.) → `useDetour` sets `error`, returns `detourMinutes: null`. UI renders nothing. No toast or alert — this is non-critical info and the rest of the card is still useful.
- Base route duration missing (shouldn't happen once route is set, but guard anyway) → hook no-ops.
- Focused restaurant changes mid-fetch → cancellation flag prevents stale writes.

## Testing

Manual test plan (no unit test infrastructure in the repo currently):

1. **Happy path**: Set start + end, wait for restaurants, confirm focused card shows `+N min` within ~1s. Confirm opening detail sheet shows same value.
2. **Cache hit**: Swipe right then left, confirm original card shows detour instantly (no loading state).
3. **On-route edge**: Pick a restaurant clearly on the route (e.g., a drive-through along a highway), confirm it shows `On route` not `+0 min`.
4. **Error path**: Temporarily break the API key or disconnect network; confirm the pill just disappears (no crash, no error UI on the card).
5. **Rapid switching**: Swipe the carousel quickly across 5+ cards; confirm no stale values appear on the wrong card.
6. **Route change**: Change destination after detour has loaded for a card; confirm cache key includes route so the old value isn't reused.

## Implementation Notes

- `durationValue` from Google is in seconds; always work in seconds internally, convert to minutes only at render time.
- Waypoint encoding: `&waypoints=LAT,LNG` — do NOT use `|` separator unless multiple waypoints (not needed for this feature, one waypoint per call).
- The base route and detour route both go through the same `getDirections`, so the polyline-decoding overhead is paid twice — acceptable, we don't need the detour route's geometry (only its duration).
- Consider whether `useDetour` should debounce rapid focus changes. Initial take: no — cache handles the common case (back-and-forth swipes), and a 50ms debounce would just add latency on first-focus. Revisit if API cost becomes an issue.
