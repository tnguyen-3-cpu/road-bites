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
