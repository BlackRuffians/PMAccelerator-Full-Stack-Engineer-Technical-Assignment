const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseISODate(str) {
  if (!ISO_DATE.test(str)) return null;
  const d = new Date(str + "T12:00:00Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Validates inclusive date range for stored weather queries.
 */
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return { ok: false, error: "start_date and end_date are required (YYYY-MM-DD)" };
  }
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  if (!start || !end) {
    return { ok: false, error: "Invalid date format. Use YYYY-MM-DD" };
  }
  if (start > end) {
    return { ok: false, error: "start_date must be on or before end_date" };
  }
  const maxSpan = 366 * 24 * 60 * 60 * 1000;
  if (end - start > maxSpan) {
    return { ok: false, error: "Date range cannot exceed one year" };
  }
  const minYear = 1940;
  if (start.getUTCFullYear() < minYear) {
    return { ok: false, error: `start_date must be ${minYear} or later` };
  }
  return { ok: true, start, end };
}
