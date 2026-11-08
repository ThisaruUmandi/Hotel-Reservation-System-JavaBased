import { todayISO } from './dates';

/** Where a booking is in its life: upcoming, current (guest is staying now), past, or cancelled. */
export function stage(booking, today = todayISO()) {
  if (booking.status === 'CANCELLED') return 'cancelled';
  if (booking.checkOut <= today) return 'past';
  if (booking.checkIn <= today) return 'current';
  return 'upcoming';
}

/** Splits bookings into the three tabs. A stay in progress counts as upcoming. */
export function groupBookings(list, today = todayISO()) {
  const groups = { upcoming: [], past: [], cancelled: [] };
  list.forEach((b) => {
    const s = stage(b, today);
    groups[s === 'current' ? 'upcoming' : s].push(b);
  });
  groups.upcoming.sort((a, b) => a.checkIn.localeCompare(b.checkIn)); // soonest first
  groups.past.sort((a, b) => b.checkOut.localeCompare(a.checkOut)); // most recent first
  groups.cancelled.sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  return groups;
}

export const canCancel = (b, today = todayISO()) => b.status === 'CONFIRMED' && b.checkIn > today;
export const canReview = (b, today = todayISO()) => b.status === 'CONFIRMED' && b.checkOut <= today && !b.reviewed;
