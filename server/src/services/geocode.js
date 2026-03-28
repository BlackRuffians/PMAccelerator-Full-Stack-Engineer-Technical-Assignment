const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";

function mapResult(r) {
  return {
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
    displayName: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
  };
}

/**
 * Top geocoding matches (for fuzzy pick / API responses).
 */
export async function geocodeSearch(query, count = 8) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return [];

  const url = new URL(GEO_URL);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", "en");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding service unavailable");
  const data = await res.json();
  const results = data.results;
  if (!results?.length) return [];
  return results.map(mapResult);
}

/**
 * Resolve a free-text location to coordinates. Returns best match or null.
 */
export async function geocodeLocation(query) {
  const list = await geocodeSearch(query, 5);
  return list[0] || null;
}
