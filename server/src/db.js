import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data", "weather.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS weather_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_query TEXT NOT NULL,
    resolved_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    daily_json TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
