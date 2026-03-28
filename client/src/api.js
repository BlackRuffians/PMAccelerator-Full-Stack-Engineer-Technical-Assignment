const base = "";

async function handle(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || "Invalid response" };
  }
  if (!res.ok) {
    const msg = data?.error || data?.hint || res.statusText || "Request failed";
    const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function getWeatherByQuery(q) {
  return fetch(`${base}/api/weather/by-location?q=${encodeURIComponent(q)}`).then(handle);
}

export function getWeatherByCoords(lat, lon) {
  return fetch(`${base}/api/weather/current?lat=${lat}&lon=${lon}`).then(handle);
}

export function geocode(q) {
  return fetch(`${base}/api/weather/geocode?q=${encodeURIComponent(q)}`).then(handle);
}

export function listRecords() {
  return fetch(`${base}/api/records`).then(handle);
}

export function createRecord(body) {
  return fetch(`${base}/api/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(handle);
}

export function updateRecord(id, body) {
  return fetch(`${base}/api/records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(handle);
}

export function deleteRecord(id) {
  return fetch(`${base}/api/records/${id}`, { method: "DELETE" }).then((res) => {
    if (res.status === 204) return true;
    return handle(res);
  });
}

export function mapLink(lat, lon, label) {
  const p = new URLSearchParams({ lat, lon, label: label || "Place" });
  return fetch(`${base}/api/media/map-link?${p}`).then(handle);
}

export function youtubeFor(q) {
  return fetch(`${base}/api/media/youtube?q=${encodeURIComponent(q)}`).then(handle);
}

export function exportUrl(format) {
  return `${base}/api/export?format=${encodeURIComponent(format)}`;
}
