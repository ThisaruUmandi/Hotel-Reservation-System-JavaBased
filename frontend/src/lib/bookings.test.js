import { describe, expect, it } from 'vitest';
import { canCancel, canReview, groupBookings, stage } from './bookings';

const TODAY = '2030-06-10';
const booking = (id, checkIn, checkOut, extra = {}) => ({ id, checkIn, checkOut, status: 'CONFIRMED', reviewed: false, ...extra });

describe('booking stages', () => {
  it('knows where a stay is', () => {
    expect(stage(booking(1, '2030-06-20', '2030-06-22'), TODAY)).toBe('upcoming');
    expect(stage(booking(2, '2030-06-10', '2030-06-12'), TODAY)).toBe('current'); // arrives today
    expect(stage(booking(3, '2030-06-08', '2030-06-11'), TODAY)).toBe('current');
    expect(stage(booking(4, '2030-06-07', '2030-06-10'), TODAY)).toBe('past'); // leaves today
    expect(stage(booking(5, '2030-06-20', '2030-06-22', { status: 'CANCELLED' }), TODAY)).toBe('cancelled');
  });

  it('groups and orders the tabs', () => {
    const groups = groupBookings([
      booking(1, '2030-07-01', '2030-07-03'),
      booking(2, '2030-06-12', '2030-06-14'),
      booking(3, '2030-06-01', '2030-06-03'),
      booking(4, '2030-05-01', '2030-05-03'),
      booking(5, '2030-08-01', '2030-08-02', { status: 'CANCELLED' }),
      booking(6, '2030-06-09', '2030-06-11'),
    ], TODAY);
    expect(groups.upcoming.map((b) => b.id)).toEqual([6, 2, 1]); // staying now first, then soonest
    expect(groups.past.map((b) => b.id)).toEqual([3, 4]); // most recent first
    expect(groups.cancelled.map((b) => b.id)).toEqual([5]);
  });

  it('allows cancelling only before the day of arrival', () => {
    expect(canCancel(booking(1, '2030-06-11', '2030-06-12'), TODAY)).toBe(true);
    expect(canCancel(booking(1, '2030-06-10', '2030-06-12'), TODAY)).toBe(false);
    expect(canCancel(booking(1, '2030-06-20', '2030-06-22', { status: 'CANCELLED' }), TODAY)).toBe(false);
  });

  it('allows one review, after the stay, never for cancelled stays', () => {
    expect(canReview(booking(1, '2030-06-01', '2030-06-03'), TODAY)).toBe(true);
    expect(canReview(booking(1, '2030-06-01', '2030-06-03', { reviewed: true }), TODAY)).toBe(false);
    expect(canReview(booking(1, '2030-06-08', '2030-06-11'), TODAY)).toBe(false);
    expect(canReview(booking(1, '2030-06-01', '2030-06-03', { status: 'CANCELLED' }), TODAY)).toBe(false);
  });
});
