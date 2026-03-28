import { useCallback, useEffect, useMemo, useState } from "react";
import MapView from "./MapView.jsx";
import { codeToEmoji, codeToLabel } from "./weatherEmoji.js";
import * as api from "./api.js";

const DEVELOPER_NAME = "Pranav";
const PM_LINK = "https://www.linkedin.com/company/product-manager-accelerator";

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function defaultEndDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 5);
  return formatDate(d);
}

function defaultStartDate() {
  return formatDate(new Date());
}

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [place, setPlace] = useState(null);
  const [weather, setWeather] = useState(null);
  const [mapExtras, setMapExtras] = useState(null);
  const [yt, setYt] = useState(null);

  const [records, setRecords] = useState([]);
  const [recError, setRecError] = useState("");
  const [form, setForm] = useState({
    location_query: "",
    start_date: defaultStartDate(),
    end_date: defaultEndDate(),
    notes: "",
  });
  const [editingId, setEditingId] = useState(null);

  const loadRecords = useCallback(async () => {
    try {
      setRecError("");
      const list = await api.listRecords();
      setRecords(list);
    } catch (e) {
      setRecError(e.message || "Could not load saved records");
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const showWeather = useCallback(async (lat, lon, label) => {
    setPlace({
      displayName: label,
      latitude: lat,
      longitude: lon,
    });
    const w = await api.getWeatherByCoords(lat, lon);
    setWeather(w);
    const ml = await api.mapLink(lat, lon, label);
    setMapExtras(ml);
    try {
      const y = await api.youtubeFor(label);
      setYt(y);
    } catch {
      setYt(null);
    }
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setError("Enter a city, postal code, landmark, or coordinates (lat,lon).");
      return;
    }
    setLoading(true);
    setError("");
    setWeather(null);
    setPlace(null);
    setMapExtras(null);
    setYt(null);
    try {
      const parts = q.split(/[, ]+/).map((s) => s.trim()).filter(Boolean);
      let lat;
      let lon;
      if (parts.length === 2) {
        lat = parseFloat(parts[0]);
        lon = parseFloat(parts[1]);
      }
      if (
        parts.length === 2 &&
        !Number.isNaN(lat) &&
        !Number.isNaN(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      ) {
        await showWeather(lat, lon, `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      } else {
        const data = await api.getWeatherByQuery(q);
        setPlace(data.place);
        setWeather(data.weather);
        const ml = await api.mapLink(
          data.place.latitude,
          data.place.longitude,
          data.place.displayName
        );
        setMapExtras(ml);
        try {
          setYt(await api.youtubeFor(data.place.displayName));
        } catch {
          setYt(null);
        }
      }
    } catch (err) {
      if (err.status === 404) {
        setError(
          err.message ||
            "That location was not found. Try another spelling or a nearby city."
        );
      } else if (err.status === 502) {
        setError("Weather service failed. Please try again in a moment.");
      } else {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          await showWeather(lat, lon, "Your location");
          setQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        } catch (err) {
          setError(err.message || "Could not load weather for your position.");
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        setLoading(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError("Location permission was denied. Enable it in browser settings or type a place.");
        } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
          setError("Your position could not be determined.");
        } else if (geoErr.code === geoErr.TIMEOUT) {
          setError("Location request timed out.");
        } else {
          setError("Could not read your current location.");
        }
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 }
    );
  };

  const onSaveRecord = async (e) => {
    e.preventDefault();
    setRecError("");
    try {
      if (editingId) {
        await api.updateRecord(editingId, form);
      } else {
        await api.createRecord(form);
      }
      setForm({
        location_query: "",
        start_date: defaultStartDate(),
        end_date: defaultEndDate(),
        notes: "",
      });
      setEditingId(null);
      await loadRecords();
    } catch (err) {
      setRecError(err.message || "Save failed");
    }
  };

  const onEdit = (r) => {
    setEditingId(r.id);
    setForm({
      location_query: r.location_query,
      start_date: r.start_date,
      end_date: r.end_date,
      notes: r.notes || "",
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this saved record?")) return;
    setRecError("");
    try {
      await api.deleteRecord(id);
      if (editingId === id) {
        setEditingId(null);
        setForm({
          location_query: "",
          start_date: defaultStartDate(),
          end_date: defaultEndDate(),
          notes: "",
        });
      }
      await loadRecords();
    } catch (err) {
      setRecError(err.message || "Delete failed");
    }
  };

  const current = weather?.current;
  const daily = weather?.daily;

  const fiveDay = useMemo(() => {
    if (!daily?.time?.length) return [];
    const n = Math.min(5, daily.time.length);
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({
        date: daily.time[i],
        code: daily.weather_code[i],
        max: daily.temperature_2m_max[i],
        min: daily.temperature_2m_min[i],
        precip: daily.precipitation_sum?.[i],
      });
    }
    return out;
  }, [daily]);

  return (
    <div className="app">
      <header>
        <h1>Weather app</h1>
        <p className="hint">
          Tech assessment — full stack (current weather, 5-day forecast, saved queries, exports).
        </p>
      </header>

      <section className="card" aria-labelledby="search-heading">
        <h2 id="search-heading">Location</h2>
        <form onSubmit={onSearch} className="row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City, zip/postal code, landmark, or lat,lon"
            style={{ flex: "1 1 200px" }}
            aria-label="Location search"
          />
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Loading…" : "Get weather"}
          </button>
          <button type="button" onClick={onUseMyLocation} disabled={loading}>
            Use my location
          </button>
        </form>
        {error ? <div className="error" role="alert">{error}</div> : null}
      </section>

      {place && weather ? (
        <section className="card" aria-labelledby="current-heading">
          <h2 id="current-heading">Current — {place.displayName}</h2>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <span className="emoji" style={{ fontSize: "3rem" }} aria-hidden>
              {codeToEmoji(current?.weather_code)}
            </span>
            <div>
              <div className="current-big">
                {current?.temperature_2m != null
                  ? `${Math.round(current.temperature_2m)}°C`
                  : "—"}
              </div>
              <p style={{ margin: "0.25rem 0" }}>
                {codeToLabel(current?.weather_code)} · Feels like{" "}
                {current?.apparent_temperature != null
                  ? `${Math.round(current.apparent_temperature)}°C`
                  : "—"}
              </p>
              <p className="hint" style={{ margin: 0 }}>
                Humidity {current?.relative_humidity_2m ?? "—"}% · Wind{" "}
                {current?.wind_speed_10m != null
                  ? `${current.wind_speed_10m} km/h`
                  : "—"}
              </p>
            </div>
          </div>

          <h2>5-day forecast</h2>
          <div className="forecast-grid">
            {fiveDay.map((d) => (
              <div key={d.date} className="forecast-day">
                <div className="emoji" aria-hidden>{codeToEmoji(d.code)}</div>
                <strong>{d.date}</strong>
                <div>{codeToLabel(d.code)}</div>
                <div>
                  ↑ {d.max != null ? Math.round(d.max) : "—"}° / ↓{" "}
                  {d.min != null ? Math.round(d.min) : "—"}°
                </div>
                {d.precip != null ? (
                  <div className="hint">Rain {d.precip} mm</div>
                ) : null}
              </div>
            ))}
          </div>

          <h2>Map</h2>
          <MapView
            latitude={place.latitude}
            longitude={place.longitude}
            label={place.displayName}
          />
          {mapExtras ? (
            <p className="hint">
              <a href={mapExtras.openStreetMapUrl} target="_blank" rel="noreferrer">
                Open in OpenStreetMap
              </a>
              {" · "}
              <a href={mapExtras.googleMapsSearchUrl} target="_blank" rel="noreferrer">
                Open in Google Maps
              </a>
            </p>
          ) : null}

          <h2>Videos about this place</h2>
          {yt && !yt.configured ? (
            <p className="hint">
              {yt.message}{" "}
              <a href={yt.searchUrl} target="_blank" rel="noreferrer">
                Search on YouTube
              </a>
            </p>
          ) : null}
          {yt?.configured && yt.items?.length ? (
            <ul>
              {yt.items.map((v) => (
                <li key={v.videoId}>
                  <a href={v.url} target="_blank" rel="noreferrer">
                    {v.title}
                  </a>{" "}
                  <span className="hint">— {v.channel}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {yt?.configured && !yt.items?.length ? (
            <p className="hint">No videos returned for this search.</p>
          ) : null}
        </section>
      ) : null}

      <section className="card" aria-labelledby="crud-heading">
        <h2 id="crud-heading">Save temperature range (database)</h2>
        <p className="hint">
          Enter a real place and a date range. The server validates dates, resolves the location,
          fetches daily highs/lows from Open-Meteo, and stores the result (SQLite).
        </p>
        {recError ? <div className="error" role="alert">{recError}</div> : null}
        <form onSubmit={onSaveRecord}>
          <div className="row" style={{ marginBottom: "0.5rem" }}>
            <label style={{ flex: "1 1 200px" }}>
              Location
              <input
                type="text"
                required
                value={form.location_query}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location_query: e.target.value }))
                }
                placeholder="e.g. Paris, 10001, Tokyo Tower"
                style={{ width: "100%", marginTop: "0.25rem" }}
              />
            </label>
          </div>
          <div className="row" style={{ marginBottom: "0.5rem" }}>
            <label>
              Start
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_date: e.target.value }))
                }
                style={{ display: "block", marginTop: "0.25rem" }}
              />
            </label>
            <label>
              End
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_date: e.target.value }))
                }
                style={{ display: "block", marginTop: "0.25rem" }}
              />
            </label>
          </div>
          <label>
            Notes (optional)
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              style={{ marginTop: "0.25rem" }}
            />
          </label>
          <div className="row" style={{ marginTop: "0.75rem" }}>
            <button type="submit" className="primary">
              {editingId ? "Update record" : "Create record"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    location_query: "",
                    start_date: defaultStartDate(),
                    end_date: defaultEndDate(),
                    notes: "",
                  });
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <h2>Export saved data</h2>
        <div className="export-links">
          {["json", "csv", "xml", "markdown", "pdf"].map((fmt) => (
            <a key={fmt} href={api.exportUrl(fmt)} download>
              Download {fmt.toUpperCase()}
            </a>
          ))}
        </div>

        <h2>Saved records</h2>
        {records.length === 0 ? (
          <p className="hint">No records yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="records">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Place</th>
                  <th>Range</th>
                  <th>Daily (°C)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>
                      {r.resolved_name}
                      <div className="hint">q: {r.location_query}</div>
                    </td>
                    <td>
                      {r.start_date} → {r.end_date}
                    </td>
                    <td>
                      {r.daily?.time?.slice(0, 3).map((t, i) => (
                        <div key={t}>
                          {t}: ↑{Math.round(r.daily.tempMax[i])} ↓
                          {Math.round(r.daily.tempMin[i])}
                        </div>
                      ))}
                      {(r.daily?.time?.length || 0) > 3 ? (
                        <span className="hint">…</span>
                      ) : null}
                    </td>
                    <td>
                      <button type="button" onClick={() => onEdit(r)}>
                        Edit
                      </button>{" "}
                      <button type="button" onClick={() => onDelete(r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>
        <p>
          <strong>{DEVELOPER_NAME}</strong> — Full stack submission.
        </p>
        <p>
          <strong>PM Accelerator</strong> helps professionals break into and grow in product
          management. Learn more on their{" "}
          <a href={PM_LINK} target="_blank" rel="noreferrer">
            LinkedIn — Product Manager Accelerator
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
