import { nightsBetween, parseISODate, todayISO, toISODate } from './dates';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isRealDate = (value) => ISO.test(value) && toISODate(parseISODate(value)) === value; // rejects 2030-02-31

/** Reads a stay search (dates, guests, room type) from URL parameters and checks it. */
export function parseSearch(params, today = todayISO()) {
  const checkIn = params.get('checkIn') ?? '';
  const checkOut = params.get('checkOut') ?? '';
  const type = params.get('type') ?? '';
  const guestsNumber = Number(params.get('guests') ?? 1);
  const guests = Number.isInteger(guestsNumber) && guestsNumber >= 1 && guestsNumber <= 10 ? guestsNumber : 1;

  let error = '';
  if (checkIn || checkOut) {
    if (!isRealDate(checkIn) || !isRealDate(checkOut)) error = 'Choose both a check-in and a check-out date.';
    else if (checkIn < today) error = 'Check-in cannot be in the past.';
    else if (checkOut <= checkIn) error = 'Check-out must be after check-in.';
  }
  const valid = Boolean(checkIn && checkOut) && !error;
  return { checkIn, checkOut, guests, type, valid, error, nights: valid ? nightsBetween(checkIn, checkOut) : 0 };
}

/** Builds a query string (without "?"), leaving out empty values. */
export function toQuery({ checkIn, checkOut, guests, type } = {}) {
  const query = new URLSearchParams();
  if (checkIn) query.set('checkIn', checkIn);
  if (checkOut) query.set('checkOut', checkOut);
  if (guests) query.set('guests', String(guests));
  if (type) query.set('type', type);
  return query.toString();
}
