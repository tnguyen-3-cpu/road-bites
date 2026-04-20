import { useState, useEffect, useRef } from "react";
import { sampleRoute, minDistanceToRoute } from "../utils/routeSampler";
import { searchNearbyRestaurants } from "../api/googlePlaces";
import { gemScore } from "../utils/hiddenGem";

function deduplicateById(restaurants) {
  const seen = new Set();
  return restaurants.filter((r) => {
    if (!r.id || seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export function useRestaurants(routeCoords) {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevKeyRef = useRef(null);

  useEffect(() => {
    if (!routeCoords || routeCoords.length === 0) {
      setRestaurants([]);
      setError(null);
      return;
    }

    const first = routeCoords[0];
    const last = routeCoords[routeCoords.length - 1];
    const routeKey = `${first.latitude},${first.longitude}-${last.latitude},${last.longitude}`;
    if (prevKeyRef.current === routeKey) return;
    prevKeyRef.current = routeKey;

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const samplePoints = sampleRoute(routeCoords, 3);

        const results = await Promise.all(
          samplePoints.map((p) =>
            searchNearbyRestaurants(p.latitude, p.longitude, 3000).catch(() => [])
          )
        );

        if (cancelled) return;
        const all = results.flat();
        const unique = deduplicateById(all);
        const MAX_MILES_FROM_ROUTE = 0.5;
        const nearRoute = unique.filter(
          (r) =>
            r.latitude != null &&
            r.longitude != null &&
            minDistanceToRoute(r, routeCoords) <= MAX_MILES_FROM_ROUTE
        );

        const gems = nearRoute
          .map((r) => ({ ...r, gemScore: gemScore(r) }))
          .filter((r) => r.gemScore > 0)
          .sort((a, b) => b.gemScore - a.gemScore);

        console.log(
          `[restaurants] samples=${samplePoints.length}, fetched=${all.length}, nearRoute=${nearRoute.length}, gems=${gems.length}`
        );
        setRestaurants(gems);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeCoords]);

  return { restaurants, isLoading, error };
}
