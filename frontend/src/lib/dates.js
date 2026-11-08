// Dates travel to the API as YYYY-MM-DD strings. Everything here uses the user's local calendar
// (never toISOString, which shifts the day for anyone not on UTC).

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export const todayISO = () => toISODate(new Date());

export function nightsBetween(checkIn, checkOut) {
  const ms = parseISODate(checkOut) - parseISODate(checkIn);
  return Math.round(ms / 86_400_000);
}

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
export const formatDay = (iso) => dayFormat.format(parseISODate(iso));

const longFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const formatLong = (iso) => longFormat.format(parseISODate(iso));
