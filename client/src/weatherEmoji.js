/** Open-Meteo WMO weather code → display emoji */
export function codeToEmoji(code) {
  const c = Number(code);
  if (c === 0) return "☀️";
  if (c <= 3) return "⛅";
  if (c <= 48) return "🌫️";
  if (c <= 57) return "🌦️";
  if (c <= 67) return "🌧️";
  if (c <= 77) return "🌨️";
  if (c <= 82) return "🌧️";
  if (c <= 86) return "🌨️";
  return "⛈️";
}

export function codeToLabel(code) {
  const c = Number(code);
  if (c === 0) return "Clear";
  if (c <= 3) return "Partly cloudy";
  if (c <= 48) return "Fog";
  if (c <= 57) return "Drizzle";
  if (c <= 67) return "Rain";
  if (c <= 77) return "Snow";
  if (c <= 82) return "Rain showers";
  if (c <= 86) return "Snow showers";
  return "Thunderstorm";
}
