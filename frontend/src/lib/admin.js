import { bookingRef } from './booking';
import { todayISO } from './dates';

export const FILTERS = [
  ['all', 'All'],
  ['arriving', 'Arriving today'],
  ['leaving', 'Leaving today'],
  ['inhouse', 'In house'],
  ['upcoming', 'Upcoming'],
  ['unpaid', 'Awaiting payment'],
  ['past', 'Past'],
  ['cancelled', 'Cancelled'],
];

const live = (b) => b.status === 'CONFIRMED';

/** In house means the guest has arrived and has not yet left, matching the dashboard count. */
export function matchesFilter(b, filter, today = todayISO()) {
  switch (filter) {
    case 'arriving': return live(b) && b.checkIn === today;
    case 'leaving': return live(b) && b.checkOut === today;
    case 'inhouse': return live(b) && b.checkIn <= today && b.checkOut > today;
    case 'upcoming': return live(b) && b.checkIn > today;
    case 'unpaid': return live(b) && b.checkOut >= today && !b.paid;
    case 'past': return live(b) && b.checkOut < today;
    case 'cancelled': return b.status === 'CANCELLED';
    default: return true;
  }
}

/** Matches a booking reference (PH00012 or just 12), the guest's name or email, or a room number. */
export function matchesQuery(b, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${bookingRef(b.id)} ${b.id} ${b.guest.name} ${b.guest.email} ${b.room.roomNumber}`.toLowerCase();
  return haystack.includes(q);
}

const SOONEST_FIRST = new Set(['arriving', 'leaving', 'inhouse', 'upcoming', 'unpaid']);

export function filterReservations(list, { query = '', filter = 'all', today = todayISO() } = {}) {
  const rows = list.filter((b) => matchesFilter(b, filter, today) && matchesQuery(b, query));
  const direction = SOONEST_FIRST.has(filter) ? 1 : -1;
  return rows.sort((a, b) => direction * a.checkIn.localeCompare(b.checkIn) || b.id - a.id);
}

export const occupancyPercent = (inHouse, totalRooms) => (totalRooms ? Math.round((inHouse / totalRooms) * 100) : 0);
