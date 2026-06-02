import { useEffect, useState } from "react";
import { getDirections } from "../api/googleMaps";

// Module-level cache. Survives re-renders but not app restarts.
// Keyed by: `${placeId}|${origin.lat},${origin.lng}->${dest.lat},${dest.lng}`.
// No eviction policy — acceptable for typical session volumes.
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
      baseDurationSec == null
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
          setState({ detourMinutes: null, isLoading: false, error: err?.message ?? "fetch-error" });
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
