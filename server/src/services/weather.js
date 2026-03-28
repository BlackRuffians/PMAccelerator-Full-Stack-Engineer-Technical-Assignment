const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function mergeDailyParts(a, b) {
  const map = new Map();
  for (let i = 0; i < a.time.length; i++) {
    map.set(a.time[i], {
      max: a.tempMax[i],
      min: a.tempMin[i],
      code: a.weatherCode[i],
    });
  }
  for (let i = 0; i < b.time.length; i++) {
    map.set(b.time[i], {
      max: b.tempMax[i],
      min: b.tempMin[i],
      code: b.weatherCode[i],
    });
  }
  const times = [...map.keys()].sort();
  return {
    time: times,
    tempMax: times.map((t) => map.get(t).max),
    tempMin: times.map((t) => map.get(t).min),
    weatherCode: times.map((t) => map.get(t).code),
  };
}

async function fetchForecastRange(lat, lon, startDate, endDate) {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather forecast service unavailable");
  const data = await res.json();
  const daily = data.daily;
  if (!daily?.time?.length) {
    throw new Error("No forecast data for this date range");
  }
  return {
    time: daily.time,
    tempMax: daily.temperature_2m_max,
    tempMin: daily.temperature_2m_min,
    weatherCode: daily.weather_code,
  };
}

async function fetchArchiveRange(lat, lon, startDate, endDate) {
  const url = new URL(ARCHIVE_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Historical weather service unavailable");
  const data = await res.json();
  const daily = data.daily;
  if (!daily?.time?.length) {
    throw new Error("No historical data for this date range");
  }
  return {
    time: daily.time,
    tempMax: daily.temperature_2m_max,
    tempMin: daily.temperature_2m_min,
    weatherCode: daily.weather_code,
  };
}

/**
 * Daily min/max temps for an inclusive date range (archive + forecast as needed).
 */
export async function getDailyRange(lat, lon, startDate, endDate) {
  const today = todayISO();
  if (endDate < today) {
    return fetchArchiveRange(lat, lon, startDate, endDate);
  }
  if (startDate >= today) {
    return fetchForecastRange(lat, lon, startDate, endDate);
  }
  const yesterday = new Date(`${today}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const archiveEnd = endDate < yesterdayStr ? endDate : yesterdayStr;
  let archivePart = { time: [], tempMax: [], tempMin: [], weatherCode: [] };
  if (startDate <= archiveEnd) {
    archivePart = await fetchArchiveRange(lat, lon, startDate, archiveEnd);
  }
  const forecastStart = endDate >= today ? today : endDate;
  let forecastPart = { time: [], tempMax: [], tempMin: [], weatherCode: [] };
  if (forecastStart <= endDate) {
    forecastPart = await fetchForecastRange(lat, lon, forecastStart, endDate);
  }
  const merged = mergeDailyParts(archivePart, forecastPart);
  if (!merged.time.length) {
    throw new Error("No daily data for this date range");
  }
  return merged;
}

/**
 * Current conditions + 5-day daily forecast for map UI.
 */
export async function getCurrentAndFiveDay(lat, lon) {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum"
  );
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather service unavailable");
  return res.json();
}
