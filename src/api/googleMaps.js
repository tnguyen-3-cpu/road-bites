import { GOOGLE_MAPS_API_KEY } from "@env";
import { decodePolyline } from "../utils/polyline";

const BASE_URL = "https://maps.googleapis.com/maps/api";

export async function getDirections(origin, destination) {
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;
  const url =
    `${BASE_URL}/directions/json` +
    `?origin=${originStr}` +
    `&destination=${destStr}` +
    `&key=${GOOGLE_MAPS_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" || !data.routes?.length) {
    return null;
  }

  const route = data.routes[0];
  const leg = route.legs[0];
  const points = decodePolyline(route.overview_polyline.points);

  return {
    points,
    distance: leg.distance.text,
    duration: leg.duration.text,
  };
}
