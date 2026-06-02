import { FIRECRAWL_API_KEY } from "@env";

const BASE_URL = "https://api.firecrawl.dev/v1";

async function firecrawl(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return response.json();
}

function parseRestaurantGuruRatings(markdown) {
  const ratings = {};

  const sources = [
    { key: "google", label: "Google", pattern: /Google[^(]*\((\d+(?:\.\d+)?)\/5\)/i },
    { key: "foursquare", label: "Foursquare", pattern: /Foursquare[^(]*\((\d+(?:\.\d+)?)\/10\)/i },
    { key: "tripAdvisor", label: "Trip", pattern: /Trip[^(]*\((\d+(?:\.\d+)?)\/5\)/i },
  ];

  for (const { key, pattern } of sources) {
    const m = markdown.match(pattern);
    if (m) ratings[key] = parseFloat(m[1]);
  }

  return ratings;
}

export async function scrapeRestaurantGuru(name, latitude, longitude) {
  const query = `site:restaurantguru.com ${name}`;
  const searchResult = await firecrawl("/search", { query, limit: 3 });

  const firstHit = searchResult?.data?.find((r) =>
    r.url?.includes("restaurantguru.com")
  );
  if (!firstHit) return null;

  const scrapeResult = await firecrawl("/scrape", {
    url: firstHit.url,
    formats: ["markdown"],
  });

  const markdown = scrapeResult?.data?.markdown;
  if (!markdown) return null;

  return {
    restaurantGuruUrl: firstHit.url,
    ratings: parseRestaurantGuruRatings(markdown),
  };
}
