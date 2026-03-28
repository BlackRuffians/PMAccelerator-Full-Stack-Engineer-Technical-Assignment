import { Router } from "express";
import db from "../db.js";
import { geocodeLocation } from "../services/geocode.js";
import { getDailyRange } from "../services/weather.js";
import { validateDateRange } from "../validation.js";

const router = Router();

const insertStmt = db.prepare(`
  INSERT INTO weather_records (
    location_query, resolved_name, latitude, longitude,
    start_date, end_date, daily_json, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectAll = db.prepare(
  `SELECT id, location_query, resolved_name, latitude, longitude,
          start_date, end_date, daily_json, notes, created_at
   FROM weather_records ORDER BY id DESC`
);

const selectOne = db.prepare(
  `SELECT id, location_query, resolved_name, latitude, longitude,
          start_date, end_date, daily_json, notes, created_at
   FROM weather_records WHERE id = ?`
);

const updateStmt = db.prepare(`
  UPDATE weather_records SET
    location_query = ?,
    resolved_name = ?,
    latitude = ?,
    longitude = ?,
    start_date = ?,
    end_date = ?,
    daily_json = ?,
    notes = ?
  WHERE id = ?
`);

const deleteStmt = db.prepare(`DELETE FROM weather_records WHERE id = ?`);

router.get("/", (_req, res) => {
  const rows = selectAll.all();
  const records = rows.map((r) => ({
    ...r,
    daily: JSON.parse(r.daily_json),
  }));
  res.json(records);
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const row = selectOne.get(id);
  if (!row) return res.status(404).json({ error: "Record not found" });
  res.json({ ...row, daily: JSON.parse(row.daily_json) });
});

router.post("/", async (req, res) => {
  try {
    const { location_query, start_date, end_date, notes = "" } = req.body || {};
    const v = validateDateRange(start_date, end_date);
    if (!v.ok) return res.status(400).json({ error: v.error });

    const q = String(location_query || "").trim();
    if (!q) return res.status(400).json({ error: "location_query is required" });

    const place = await geocodeLocation(q);
    if (!place) {
      return res.status(404).json({
        error: "Location could not be resolved",
        hint: "Check spelling or try a larger nearby city",
      });
    }

    const daily = await getDailyRange(place.latitude, place.longitude, start_date, end_date);
    const dailyJson = JSON.stringify(daily);

    const info = insertStmt.run(
      q,
      place.displayName,
      place.latitude,
      place.longitude,
      start_date,
      end_date,
      dailyJson,
      String(notes).slice(0, 2000)
    );

    const row = selectOne.get(info.lastInsertRowid);
    res.status(201).json({ ...row, daily: JSON.parse(row.daily_json) });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message || "Failed to create record" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const existing = selectOne.get(id);
    if (!existing) return res.status(404).json({ error: "Record not found" });

    const { location_query, start_date, end_date, notes } = req.body || {};
    const v = validateDateRange(start_date, end_date);
    if (!v.ok) return res.status(400).json({ error: v.error });

    const q = String(location_query || "").trim();
    if (!q) return res.status(400).json({ error: "location_query is required" });

    const place = await geocodeLocation(q);
    if (!place) {
      return res.status(404).json({
        error: "Location could not be resolved",
        hint: "Check spelling or try a larger nearby city",
      });
    }

    const daily = await getDailyRange(place.latitude, place.longitude, start_date, end_date);
    const dailyJson = JSON.stringify(daily);

    updateStmt.run(
      q,
      place.displayName,
      place.latitude,
      place.longitude,
      start_date,
      end_date,
      dailyJson,
      notes !== undefined ? String(notes).slice(0, 2000) : existing.notes,
      id
    );

    const row = selectOne.get(id);
    res.json({ ...row, daily: JSON.parse(row.daily_json) });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message || "Failed to update record" });
  }
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const result = deleteStmt.run(id);
  if (result.changes === 0) return res.status(404).json({ error: "Record not found" });
  res.status(204).send();
});

export default router;
