import { Router } from "express";
import { geocodeLocation, geocodeSearch } from "../services/geocode.js";
import { getCurrentAndFiveDay } from "../services/weather.js";

const router = Router();

router.get("/geocode", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || !String(q).trim()) {
      return res.status(400).json({ error: "Missing query parameter q" });
    }
    const results = await geocodeSearch(String(q).trim(), 8);
    if (!results.length) {
      return res.status(404).json({
        error: "Location not found",
        hint: "Try a city name, postal code, or landmark spelling",
      });
    }
    res.json({ best: results[0], alternatives: results.slice(1) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not look up location" });
  }
});

router.get("/current", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: "lat and lon must be valid numbers" });
    }
    const data = await getCurrentAndFiveDay(lat, lon);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message || "Weather request failed" });
  }
});

router.get("/by-location", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || !String(q).trim()) {
      return res.status(400).json({ error: "Missing query parameter q" });
    }
    const place = await geocodeLocation(q);
    if (!place) {
      return res.status(404).json({
        error: "Location not found",
        hint: "Try a different spelling or a nearby city",
      });
    }
    const data = await getCurrentAndFiveDay(place.latitude, place.longitude);
    res.json({ place, weather: data });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message || "Weather request failed" });
  }
});

export default router;
