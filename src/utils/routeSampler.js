// Haversine distance between two coordinates in miles
export function distanceMiles(a, b) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Minimum distance in miles from `point` to the closest vertex of `routeCoords`.
 * Uses vertex distance (not perpendicular-to-segment) — good enough for a
 * dense polyline and much faster.
 */
export function minDistanceToRoute(point, routeCoords) {
  let min = Infinity;
  for (let i = 0; i < routeCoords.length; i++) {
    const d = distanceMiles(point, routeCoords[i]);
    if (d < min) min = d;
  }
  return min;
}

/**
 * Sample points along a polyline at roughly `intervalMiles` apart.
 * Returns an array of {latitude, longitude} points, always including
 * the first and last points.
 */
export function sampleRoute(coordinates, intervalMiles = 30) {
  if (!coordinates || coordinates.length < 2) return [];

  const sampled = [coordinates[0]];
  let accumulated = 0;

  for (let i = 1; i < coordinates.length; i++) {
    accumulated += distanceMiles(coordinates[i - 1], coordinates[i]);
    if (accumulated >= intervalMiles) {
      sampled.push(coordinates[i]);
      accumulated = 0;
    }
  }

  // Always include the last point
  const last = coordinates[coordinates.length - 1];
  const lastSampled = sampled[sampled.length - 1];
  if (
    lastSampled.latitude !== last.latitude ||
    lastSampled.longitude !== last.longitude
  ) {
    sampled.push(last);
  }

  return sampled;
}
