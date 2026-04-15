import { GOOGLE_MAPS_API_KEY } from "@env";

const BASE_URL = "https://places.googleapis.com/v1";

export async function autocomplete(input, sessionToken) {
  const response = await fetch(`${BASE_URL}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
    },
    body: JSON.stringify({
      input,
      sessionToken,
    }),
  });
  return response.json();
}

export async function getPlaceDetails(placeId, sessionToken) {
  const response = await fetch(
    `${BASE_URL}/places/${placeId}?sessionToken=${sessionToken}`,
    {
      headers: {
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "location",
      },
    }
  );
  const data = await response.json();
  if (!data.location) {
    return null;
  }
  return {
    latitude: data.location.latitude,
    longitude: data.location.longitude,
  };
}
