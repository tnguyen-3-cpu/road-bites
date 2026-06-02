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

const DETAILS_FIELDS = [
  "id",
  "displayName",
  "rating",
  "userRatingCount",
  "priceLevel",
  "formattedAddress",
  "nationalPhoneNumber",
  "websiteUri",
  "regularOpeningHours",
  "editorialSummary",
  "reviews",
  "photos",
].join(",");

export async function getRestaurantDetails(placeId) {
  const response = await fetch(`${BASE_URL}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": DETAILS_FIELDS,
    },
  });
  const data = await response.json();
  if (!data.id) return null;

  return {
    id: data.id,
    name: data.displayName?.text ?? "",
    rating: data.rating ?? null,
    reviewCount: data.userRatingCount ?? null,
    priceRange: PRICE_LEVEL_TO_SYMBOL[data.priceLevel] ?? null,
    address: data.formattedAddress ?? null,
    phone: data.nationalPhoneNumber ?? null,
    website: data.websiteUri ?? null,
    openNow: data.regularOpeningHours?.openNow ?? null,
    hoursDescriptions: data.regularOpeningHours?.weekdayDescriptions ?? [],
    summary: data.editorialSummary?.text ?? null,
    reviews: (data.reviews ?? []).map((rev) => ({
      author: rev.authorAttribution?.displayName ?? "",
      rating: rev.rating ?? null,
      text: rev.text?.text ?? rev.originalText?.text ?? "",
      relativeTime: rev.relativePublishTimeDescription ?? "",
    })),
  };
}

const NEARBY_FIELDS = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.formattedAddress",
].join(",");

const PRICE_LEVEL_TO_SYMBOL = {
  PRICE_LEVEL_FREE: "",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

export async function searchNearbyRestaurants(latitude, longitude, radiusMeters = 6000) {
  const response = await fetch(`${BASE_URL}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": NEARBY_FIELDS,
    },
    body: JSON.stringify({
      includedTypes: ["restaurant"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: radiusMeters,
        },
      },
      rankPreference: "POPULARITY",
    }),
  });

  const data = await response.json();
  if (!data.places) return [];

  return data.places.map((p) => ({
    id: p.id,
    name: p.displayName?.text ?? "",
    latitude: p.location?.latitude,
    longitude: p.location?.longitude,
    rating: p.rating ?? null,
    reviewCount: p.userRatingCount ?? null,
    priceRange: PRICE_LEVEL_TO_SYMBOL[p.priceLevel] ?? null,
    cuisine: p.primaryTypeDisplayName?.text ?? null,
    address: p.formattedAddress ?? null,
  }));
}
