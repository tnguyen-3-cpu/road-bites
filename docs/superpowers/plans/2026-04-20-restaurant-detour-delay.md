# Restaurant Detour Delay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each restaurant's real detour delay (e.g. `+12 min`) on the focused carousel card and the detail sheet, using Google Directions API lazily (focused card only) with an in-memory cache.

**Architecture:** `HomeScreen` owns the focused restaurant and the base route duration. A new `useDetour` hook fetches `start → restaurant → destination` via an extended `getDirections`, subtracts base duration, caches by `${placeId}|${routeKey}`. Result flows to `RestaurantCarousel` (pill on focused card only) and `RestaurantDetailSheet` (inline row).

**Tech Stack:** React Native (Expo), Google Directions API, existing `@env` import for `GOOGLE_MAPS_API_KEY`.

**Testing:** No unit-test infrastructure exists in this repo. Each task uses **manual verification** via Expo (`npm start`) on the device/simulator plus `console.log` checks. Commits are after manual verification passes.

---

## File Structure

- **Modify** `src/api/googleMaps.js` — extend `getDirections` to accept optional `waypoints`, sum legs, return `durationValue` (seconds).
- **Create** `src/hooks/useDetour.js` — new hook. Module-level `Map` cache. Takes focused restaurant + route endpoints + baseline duration, returns `{ detourMinutes, isLoading, error }`.
- **Modify** `src/screens/HomeScreen.js` — store `durationValue` in `routeInfo`; derive `focusedRestaurant`; call `useDetour`; pass result to carousel + sheet.
- **Modify** `src/components/RestaurantCarousel.js` — accept `focusedDetour` prop; render pill on the selected card.
- **Modify** `src/components/RestaurantDetailSheet.js` — accept `detour` prop; render inline row below the meta row.

---

## Task 1: Extend `getDirections` to support waypoints and return numeric duration

**Files:**
- Modify: `src/api/googleMaps.js`

- [ ] **Step 1: Replace the full contents of `src/api/googleMaps.js`**

```javascript
import { GOOGLE_MAPS_API_KEY } from "@env";
import { decodePolyline } from "../utils/polyline";

const BASE_URL = "https://maps.googleapis.com/maps/api";

export async function getDirections(origin, destination, options = {}) {
  const { waypoints } = options;
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;

  let url =
    `${BASE_URL}/directions/json` +
    `?origin=${originStr}` +
    `&destination=${destStr}` +
    `&key=${GOOGLE_MAPS_API_KEY}`;

  if (waypoints && waypoints.length > 0) {
    const wpStr = waypoints
      .map((w) => `${w.latitude},${w.longitude}`)
      .join("|");
    url += `&waypoints=${encodeURIComponent(wpStr)}`;
  }

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" || !data.routes?.length) {
    return null;
  }

  const route = data.routes[0];
  const legs = route.legs || [];
  const points = decodePolyline(route.overview_polyline.points);

  // Sum duration and distance across all legs (required when waypoints are used).
  let durationValue = 0;
  let distanceValue = 0;
  for (const leg of legs) {
    durationValue += leg.duration?.value ?? 0;
    distanceValue += leg.distance?.value ?? 0;
  }

  // For display, use the first leg's text when no waypoints; otherwise the API
  // doesn't give us a single summary string, so fall back to seconds/meters.
  const firstLeg = legs[0];
  const distanceText =
    waypoints && waypoints.length > 0
      ? `${(distanceValue / 1609.344).toFixed(1)} mi`
      : firstLeg?.distance?.text ?? "";
  const durationText =
    waypoints && waypoints.length > 0
      ? `${Math.round(durationValue / 60)} min`
      : firstLeg?.duration?.text ?? "";

  return {
    points,
    distance: distanceText,
    duration: durationText,
    durationValue,
    distanceValue,
  };
}
```

- [ ] **Step 2: Manual verify — no regression on existing base route fetch**

Run `npm start` and launch the app. In the app:
1. Type a start location, select it from suggestions.
2. Type a destination, select it from suggestions.
3. Confirm the route polyline renders and the `RouteInfoPill` shows distance + duration text as before.

Expected: identical behavior to before — the existing single-origin-destination call path works unchanged because `waypoints` is undefined.

- [ ] **Step 3: Manual verify — waypoint call returns summed duration**

Temporarily add a dev-only log in `HomeScreen.js` after the existing `getDirections` call, OR open the React Native console and run in the JS Debugger:

```javascript
import { getDirections } from "../api/googleMaps";

(async () => {
  const start = { latitude: 30.2672, longitude: -97.7431 }; // Austin
  const end = { latitude: 29.7604, longitude: -95.3698 };   // Houston
  const via = { latitude: 29.9511, longitude: -95.8716 };   // a random waypoint
  const base = await getDirections(start, end);
  const withStop = await getDirections(start, end, { waypoints: [via] });
  console.log("base seconds:", base.durationValue, "with stop seconds:", withStop.durationValue);
})();
```

Expected: both calls succeed; `withStop.durationValue > base.durationValue` by a sensible positive delta (minutes). Remove the debug snippet before committing.

- [ ] **Step 4: Commit**

```bash
git add src/api/googleMaps.js
git commit -m "feat(api): support waypoints and numeric duration in getDirections"
```

---

## Task 2: Create `useDetour` hook

**Files:**
- Create: `src/hooks/useDetour.js`

- [ ] **Step 1: Create `src/hooks/useDetour.js` with this content**

```javascript
import { useEffect, useState } from "react";
import { getDirections } from "../api/googleMaps";

// Module-level cache. Survives re-renders but not app restarts.
// Keyed by: `${placeId}|${origin.lat},${origin.lng}->${dest.lat},${dest.lng}`.
const detourCache = new Map();

function makeKey(restaurant, origin, destination) {
  return `${restaurant.id}|${origin.latitude},${origin.longitude}->${destination.latitude},${destination.longitude}`;
}

export function useDetour(restaurant, origin, destination, baseDurationSec) {
  const [state, setState] = useState({
    detourMinutes: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (
      !restaurant?.id ||
      restaurant.latitude == null ||
      restaurant.longitude == null ||
      !origin ||
      !destination ||
      !baseDurationSec
    ) {
      setState({ detourMinutes: null, isLoading: false, error: null });
      return;
    }

    const key = makeKey(restaurant, origin, destination);

    // Cache hit → return synchronously, no fetch.
    if (detourCache.has(key)) {
      setState({
        detourMinutes: detourCache.get(key),
        isLoading: false,
        error: null,
      });
      return;
    }

    let cancelled = false;
    setState({ detourMinutes: null, isLoading: true, error: null });

    (async () => {
      try {
        const result = await getDirections(origin, destination, {
          waypoints: [
            { latitude: restaurant.latitude, longitude: restaurant.longitude },
          ],
        });
        if (cancelled) return;
        if (!result || result.durationValue == null) {
          setState({ detourMinutes: null, isLoading: false, error: "no-result" });
          return;
        }
        const detourSec = result.durationValue - baseDurationSec;
        const detourMinutes = Math.max(0, Math.round(detourSec / 60));
        detourCache.set(key, detourMinutes);
        setState({ detourMinutes, isLoading: false, error: null });
      } catch (err) {
        if (!cancelled)
          setState({ detourMinutes: null, isLoading: false, error: err.message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    restaurant?.id,
    restaurant?.latitude,
    restaurant?.longitude,
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
    baseDurationSec,
  ]);

  return state;
}
```

- [ ] **Step 2: Lint/syntax check**

Run `npm start` (Expo bundler) and confirm the file compiles with no red error overlay. No runtime use yet — just making sure the import graph stays clean.

Expected: bundler succeeds; if Metro complains about an unresolved import, fix before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDetour.js
git commit -m "feat(hooks): add useDetour hook with in-memory cache"
```

---

## Task 3: Wire `useDetour` into `HomeScreen` and capture `durationValue` in `routeInfo`

**Files:**
- Modify: `src/screens/HomeScreen.js`

- [ ] **Step 1: Add the import at the top of `HomeScreen.js`**

Find the existing import block near lines 13–16. Add this line right after `import { useRestaurants } from "../hooks/useRestaurants";`:

```javascript
import { useDetour } from "../hooks/useDetour";
```

- [ ] **Step 2: Capture `durationValue` in `routeInfo`**

Find this line (around line 81):

```javascript
setRouteInfo({ distance: result.distance, duration: result.duration });
```

Replace with:

```javascript
setRouteInfo({
  distance: result.distance,
  duration: result.duration,
  durationValue: result.durationValue,
});
```

- [ ] **Step 3: Derive `focusedRestaurant` and call `useDetour`**

Find the line (around line 35):

```javascript
const { restaurants, isLoading: restaurantsLoading } = useRestaurants(routeCoords);
```

Immediately after it, add:

```javascript
const focusedRestaurant = useMemo(
  () => restaurants.find((r) => r.id === focusedRestaurantId) ?? null,
  [restaurants, focusedRestaurantId]
);

const detour = useDetour(
  focusedRestaurant,
  startAC.selectedPlace?.coordinate ?? null,
  endAC.selectedPlace?.coordinate ?? null,
  routeInfo?.durationValue ?? null
);
```

Note: `useMemo` is already imported at the top of the file.

- [ ] **Step 4: Pass `detour` down to carousel and detail sheet**

Find the `<RestaurantCarousel .../>` JSX (around line 257). Add a new prop:

```javascript
<RestaurantCarousel
  restaurants={restaurants}
  selectedId={focusedRestaurantId}
  onSelect={handleCarouselSelect}
  onOpen={handleCarouselOpen}
  bottomInset={insets.bottom}
  focusedDetour={detour}
/>
```

Find the `<RestaurantDetailSheet .../>` JSX (around line 265). Add:

```javascript
<RestaurantDetailSheet
  restaurant={selectedRestaurant}
  visible={selectedRestaurant != null}
  onClose={() => setSelectedRestaurant(null)}
  detour={detour}
/>
```

- [ ] **Step 5: Manual verify via console**

Temporarily add this line inside `HomeScreen`, right after the `useDetour` call:

```javascript
console.log("[detour]", focusedRestaurant?.name, detour);
```

Run the app, set start + destination, wait for restaurants. In Metro logs, expect:
- First log: `[detour] <name> { detourMinutes: null, isLoading: true, error: null }`
- Seconds later: `[detour] <name> { detourMinutes: <small int>, isLoading: false, error: null }`

Swipe to the next card:
- Log for the new restaurant: brief loading → resolved value.
- Swipe back to the first card: should log the cached value instantly (no loading=true flash).

Remove the `console.log` before committing.

- [ ] **Step 6: Commit**

```bash
git add src/screens/HomeScreen.js
git commit -m "feat(home): compute detour for focused restaurant"
```

---

## Task 4: Render detour pill on focused carousel card

**Files:**
- Modify: `src/components/RestaurantCarousel.js`

- [ ] **Step 1: Update the `Card` component signature**

Find the existing `Card` function (around line 20):

```javascript
function Card({ restaurant, selected, onPress }) {
```

Replace with:

```javascript
function Card({ restaurant, selected, onPress, detour }) {
```

- [ ] **Step 2: Replace the card's footer block with a detour-aware version**

Find the existing footer block (around lines 48–55):

```javascript
<View style={styles.footer}>
  <Text style={styles.reviews} numberOfLines={1}>
    {restaurant.reviewCount
      ? `${restaurant.reviewCount.toLocaleString()} reviews`
      : "New find"}
  </Text>
  <Text style={styles.cta}>Details →</Text>
</View>
```

Replace with:

```javascript
<View style={styles.footer}>
  <View style={styles.footerLeft}>
    <Text style={styles.reviews} numberOfLines={1}>
      {restaurant.reviewCount
        ? `${restaurant.reviewCount.toLocaleString()} reviews`
        : "New find"}
    </Text>
    {selected && detour ? <DetourPill detour={detour} /> : null}
  </View>
  <Text style={styles.cta}>Details →</Text>
</View>
```

- [ ] **Step 3: Add the `DetourPill` sub-component above `Card`**

Insert this directly above the `function Card(...)` declaration:

```javascript
function DetourPill({ detour }) {
  const { detourMinutes, isLoading, error } = detour;

  if (error) return null;
  if (isLoading) {
    return (
      <View style={[styles.detourPill, styles.detourPillLoading]}>
        <Text style={styles.detourPillText}>…</Text>
      </View>
    );
  }
  if (detourMinutes == null) return null;
  if (detourMinutes === 0) {
    return (
      <View style={[styles.detourPill, styles.detourPillOnRoute]}>
        <Text style={styles.detourPillTextOnRoute}>On route</Text>
      </View>
    );
  }
  return (
    <View style={styles.detourPill}>
      <Text style={styles.detourPillText}>+{detourMinutes} min</Text>
    </View>
  );
}
```

- [ ] **Step 4: Pass `focusedDetour` from carousel props down to `Card`**

Find the `RestaurantCarousel` function signature (around line 60):

```javascript
export function RestaurantCarousel({
  restaurants,
  selectedId,
  onSelect,
  onOpen,
  bottomInset = 0,
}) {
```

Add `focusedDetour`:

```javascript
export function RestaurantCarousel({
  restaurants,
  selectedId,
  onSelect,
  onOpen,
  bottomInset = 0,
  focusedDetour = null,
}) {
```

Find the `renderItem` callback (around line 93):

```javascript
const renderItem = useCallback(
  ({ item }) => (
    <Card
      restaurant={item}
      selected={item.id === selectedId}
      onPress={onOpen}
    />
  ),
  [selectedId, onOpen]
);
```

Replace with:

```javascript
const renderItem = useCallback(
  ({ item }) => (
    <Card
      restaurant={item}
      selected={item.id === selectedId}
      onPress={onOpen}
      detour={item.id === selectedId ? focusedDetour : null}
    />
  ),
  [selectedId, onOpen, focusedDetour]
);
```

- [ ] **Step 5: Add the pill styles to the `StyleSheet.create(...)` block**

Find the styles block at the bottom of the file. Add these entries inside it (order doesn't matter; add them near `footer` for locality):

```javascript
footerLeft: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  marginRight: layout.spacing.sm,
  gap: 6,
},
detourPill: {
  paddingHorizontal: layout.spacing.sm,
  paddingVertical: 2,
  borderRadius: 999,
  backgroundColor: "#F4A84B", // warm amber
},
detourPillLoading: {
  backgroundColor: colors.borderCream,
},
detourPillOnRoute: {
  backgroundColor: "#2f8a4a",
},
detourPillText: {
  color: colors.ivory,
  fontSize: layout.fontSize.xs,
  fontWeight: layout.fontWeight.bold,
  letterSpacing: 0.3,
},
detourPillTextOnRoute: {
  color: colors.ivory,
  fontSize: layout.fontSize.xs,
  fontWeight: layout.fontWeight.bold,
  letterSpacing: 0.3,
},
```

- [ ] **Step 6: Manual verify on device/simulator**

Run `npm start`, set start + destination, wait for restaurants. Expected:
1. Focused (center) card shows `+N min` pill within ~1s.
2. Non-focused cards show no pill.
3. Swipe to next card → new card gets a `…` pill briefly, then resolves to `+N min`.
4. Swipe back → original card's pill appears instantly (cache hit).
5. Find a restaurant clearly on-route → its pill reads `On route` in green.

- [ ] **Step 7: Commit**

```bash
git add src/components/RestaurantCarousel.js
git commit -m "feat(carousel): show detour pill on focused card"
```

---

## Task 5: Render detour row in detail sheet

**Files:**
- Modify: `src/components/RestaurantDetailSheet.js`

- [ ] **Step 1: Add `detour` to the component props**

Find the signature (around line 56):

```javascript
export function RestaurantDetailSheet({ restaurant, visible, onClose }) {
```

Replace with:

```javascript
export function RestaurantDetailSheet({ restaurant, visible, onClose, detour }) {
```

- [ ] **Step 2: Add a detour row below the meta row**

Find the `metaRow` JSX block (around lines 123–138). Immediately after the closing `</View>` of `metaRow`, insert:

```javascript
{detour && !detour.error && !detour.isLoading && detour.detourMinutes != null ? (
  <Text
    style={[
      styles.detourLine,
      detour.detourMinutes === 0 && styles.detourLineOnRoute,
    ]}
  >
    {detour.detourMinutes === 0
      ? "On route — no extra time"
      : `Adds ${detour.detourMinutes} min to your trip`}
  </Text>
) : null}
```

- [ ] **Step 3: Add styles for the detour row**

Find the styles block. Add these entries (near the `meta` / `summary` entries for locality):

```javascript
detourLine: {
  fontSize: layout.fontSize.sm,
  fontWeight: layout.fontWeight.semibold,
  color: "#C07A1F", // darker amber for text contrast on ivory
  marginTop: layout.spacing.sm,
},
detourLineOnRoute: {
  color: "#2f8a4a",
},
```

- [ ] **Step 4: Manual verify**

Run `npm start`. Set start + destination, wait for restaurants. Expected:
1. Tap a carousel card → detail sheet opens → detour line visible below the meta row: `Adds N min to your trip`.
2. Close and reopen on the same card → detour shows instantly (cache hit, no flicker of empty space).
3. Open an on-route restaurant → line reads `On route — no extra time` in green.
4. Open a card before detour has resolved (rare, usually sheet opens after focus) → line is absent, no layout jump when it arrives — that's acceptable per spec ("silent hide on error/loading").

- [ ] **Step 5: Commit**

```bash
git add src/components/RestaurantDetailSheet.js
git commit -m "feat(sheet): show detour line in restaurant detail sheet"
```

---

## Task 6: Final end-to-end verification

- [ ] **Step 1: Full happy-path walkthrough**

Run `npm start` on a fresh app launch. Perform each check:

1. Set start + destination → polyline renders, `RouteInfoPill` shows duration.
2. Restaurants load → first card auto-focuses, `+N min` pill appears within ~1s.
3. Tap marker on map → carousel scrolls to that restaurant → pill loads for that one.
4. Swipe through 5+ carousel cards → each gets its own detour. Swipe back to previously seen cards → instant (cached).
5. Tap a card → detail sheet opens → detour line matches what the pill showed.
6. Change destination to a new place → restaurants refetch → old detour cache entries are keyed by old route so they don't bleed into new route (verify by picking a restaurant that appears in both routes: it should show loading, not stale value).
7. Toggle airplane mode during a swipe to a new card → pill disappears (no crash, no error toast). Disable airplane mode, swipe away and back → value loads.

- [ ] **Step 2: No final commit (already committed per task)**

If verification reveals any bugs, fix them in a follow-up commit with a clear message (e.g., `fix(detour): <bug>`), do not squash into prior commits.

---

## Notes for the Implementer

- **Do not** add pre-fetching, background warming, or detour for all cards — explicitly out of scope.
- **Do not** add error toasts or retry buttons — the spec calls for silent hide on error.
- **Do not** introduce a test framework in this plan. If you think tests are warranted, raise it as a separate task after implementation.
- The existing `getDirections` is called from only one place (`HomeScreen.js`); the signature change is safe.
- The amber color `#F4A84B` is chosen to read distinctly from `colors.primary` (which is used for the rating chip). If the project's `colors.js` gains a dedicated amber token later, swap the literal for the token.
