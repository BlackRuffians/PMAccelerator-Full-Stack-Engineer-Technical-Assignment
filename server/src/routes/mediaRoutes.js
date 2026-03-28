import { Router } from "express";
import "dotenv/config";

const router = Router();

/**
 * YouTube search for videos about a place (requires YOUTUBE_API_KEY).
 */
router.get("/youtube", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Missing q" });

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return res.json({
      configured: false,
      message:
        "Set YOUTUBE_API_KEY in server/.env to load video results. Open search link works without a key.",
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " travel weather")}`,
    });
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", `${q} travel city`);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "6");
    url.searchParams.set("key", key);

    const upstream = await fetch(url);
    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("YouTube API:", upstream.status, errText);
      return res.status(502).json({ error: "YouTube API request failed" });
    }
    const data = await upstream.json();
    const items = (data.items || []).map((it) => ({
      title: it.snippet.title,
      channel: it.snippet.channelTitle,
      videoId: it.id.videoId,
      url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
    }));
    res.json({ configured: true, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load YouTube results" });
  }
});

/**
 * Map links / embed info (OpenStreetMap — no API key). Complements frontend Leaflet.
 */
router.get("/map-link", (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const label = String(req.query.label || "Location").trim();
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: "lat and lon required" });
  }
  const zoom = Math.min(18, Math.max(1, parseInt(req.query.zoom || "12", 10) || 12));
  res.json({
    openStreetMapUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`,
    embedOsm: `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.05},${lat - 0.05},${lon + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lon}`,
    googleMapsSearchUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}@${lat},${lon}`,
    latitude: lat,
    longitude: lon,
    label,
  });
});

export default router;
