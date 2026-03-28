import { Router } from "express";
import PDFDocument from "pdfkit";
import db from "../db.js";

const router = Router();

const selectAll = db.prepare(
  `SELECT id, location_query, resolved_name, latitude, longitude,
          start_date, end_date, daily_json, notes, created_at
   FROM weather_records ORDER BY id`
);

function getRecords() {
  return selectAll.all().map((r) => ({
    id: r.id,
    location_query: r.location_query,
    resolved_name: r.resolved_name,
    latitude: r.latitude,
    longitude: r.longitude,
    start_date: r.start_date,
    end_date: r.end_date,
    notes: r.notes,
    created_at: r.created_at,
    daily: JSON.parse(r.daily_json),
  }));
}

function quoteCsv(s) {
  return `"${String(s).replace(/"/g, '""')}"`;
}

function toCsv(records) {
  const header =
    "id,location_query,resolved_name,latitude,longitude,start_date,end_date,created_at,notes";
  const lines = [header];
  for (const r of records) {
    lines.push(
      [
        r.id,
        quoteCsv(r.location_query),
        quoteCsv(r.resolved_name),
        r.latitude,
        r.longitude,
        r.start_date,
        r.end_date,
        r.created_at,
        quoteCsv(r.notes || ""),
      ].join(",")
    );
  }
  return lines.join("\n");
}

function toXml(records) {
  const rows = records
    .map((r) => {
      const days = r.daily.time
        .map(
          (t, i) =>
            `    <day date="${t}"><max>${r.daily.tempMax[i]}</max><min>${r.daily.tempMin[i]}</min></day>`
        )
        .join("\n");
      return `  <record id="${r.id}">
    <location_query>${escapeXml(r.location_query)}</location_query>
    <resolved_name>${escapeXml(r.resolved_name)}</resolved_name>
    <latitude>${r.latitude}</latitude>
    <longitude>${r.longitude}</longitude>
    <start_date>${r.start_date}</start_date>
    <end_date>${r.end_date}</end_date>
    <notes>${escapeXml(r.notes || "")}</notes>
    <created_at>${r.created_at}</created_at>
    <daily>
${days}
    </daily>
  </record>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<weather_records>\n${rows}\n</weather_records>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toMarkdown(records) {
  const parts = ["# Saved weather records\n"];
  for (const r of records) {
    parts.push(`## Record ${r.id}: ${r.resolved_name}\n`);
    parts.push(`- **Query:** ${r.location_query}`);
    parts.push(`- **Range:** ${r.start_date} → ${r.end_date}`);
    parts.push(`- **Coords:** ${r.latitude}, ${r.longitude}`);
    if (r.notes) parts.push(`- **Notes:** ${r.notes}`);
    parts.push("\n| Date | High °C | Low °C |");
    parts.push("|------|---------|--------|");
    for (let i = 0; i < r.daily.time.length; i++) {
      parts.push(
        `| ${r.daily.time[i]} | ${r.daily.tempMax[i]} | ${r.daily.tempMin[i]} |`
      );
    }
    parts.push("");
  }
  return parts.join("\n");
}

router.get("/", (req, res) => {
  const format = String(req.query.format || "json").toLowerCase();
  const records = getRecords();

  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", 'attachment; filename="weather-records.json"');
    return res.send(JSON.stringify(records, null, 2));
  }

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="weather-records.csv"');
    return res.send(toCsv(records));
  }

  if (format === "xml") {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="weather-records.xml"');
    return res.send(toXml(records));
  }

  if (format === "markdown" || format === "md") {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="weather-records.md"');
    return res.send(toMarkdown(records));
  }

  if (format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="weather-records.pdf"');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(18).text("Weather records export", { underline: true });
    doc.moveDown();

    if (records.length === 0) {
      doc.fontSize(12).text("No records stored yet.");
    } else {
      for (const r of records) {
        doc.fontSize(14).text(`Record #${r.id}: ${r.resolved_name}`, { continued: false });
        doc.fontSize(10).text(`Query: ${r.location_query}`);
        doc.text(`Dates: ${r.start_date} to ${r.end_date}`);
        doc.text(`Lat/Lon: ${r.latitude}, ${r.longitude}`);
        if (r.notes) doc.text(`Notes: ${r.notes}`);
        doc.moveDown(0.5);
        doc.text("Daily temperatures (°C):");
        for (let i = 0; i < r.daily.time.length; i++) {
          doc.text(
            `  ${r.daily.time[i]}  high ${r.daily.tempMax[i]}  low ${r.daily.tempMin[i]}`
          );
        }
        doc.moveDown();
      }
    }
    doc.end();
    return;
  }

  res.status(400).json({
    error: "Unsupported format",
    allowed: ["json", "csv", "xml", "markdown", "pdf"],
  });
});

export default router;
