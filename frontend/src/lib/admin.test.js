import { describe, expect, it } from 'vitest';
import { filterReservations, matchesFilter, matchesQuery, occupancyPercent } from './admin';

const TODAY = '2030-06-10';
let id = 0;
const b = (checkIn, checkOut, extra = {}) => ({
  id: (id += 1), checkIn, checkOut, status: 'CONFIRMED', paid: false,
  guest: { name: 'Nadia Perera', email: 'nadia@example.com' }, room: { roomNumber: '102' }, ...extra,
});

describe('reservation filters', () => {
  const arriving = b('2030-06-10', '2030-06-12');
  const leaving = b('2030-06-07', '2030-06-10');
  const inHouse = b('2030-06-09', '2030-06-12');
  const upcoming = b('2030-06-20', '2030-06-22');
  const past = b('2030-06-01', '2030-06-03');
  const cancelled = b('2030-06-20', '2030-06-22', { status: 'CANCELLED' });
  const paidUpcoming = b('2030-06-25', '2030-06-27', { paid: true });

  it('matches each tab like the dashboard does', () => {
    expect(matchesFilter(arriving, 'arriving', TODAY)).toBe(true);
    expect(matchesFilter(leaving, 'leaving', TODAY)).toBe(true);
    expect(matchesFilter(inHouse, 'inhouse', TODAY)).toBe(true);
    expect(matchesFilter(arriving, 'inhouse', TODAY)).toBe(true); // arrives today: counts as in house
    expect(matchesFilter(leaving, 'inhouse', TODAY)).toBe(false); // leaves today: no longer in house
    expect(matchesFilter(upcoming, 'upcoming', TODAY)).toBe(true);
    expect(matchesFilter(past, 'past', TODAY)).toBe(true);
    expect(matchesFilter(leaving, 'past', TODAY)).toBe(false);
    expect(matchesFilter(cancelled, 'cancelled', TODAY)).toBe(true);
    expect(matchesFilter(cancelled, 'upcoming', TODAY)).toBe(false);
  });

  it('flags unpaid live bookings, including guests leaving today', () => {
    expect(matchesFilter(leaving, 'unpaid', TODAY)).toBe(true);
    expect(matchesFilter(upcoming, 'unpaid', TODAY)).toBe(true);
    expect(matchesFilter(paidUpcoming, 'unpaid', TODAY)).toBe(false);
    expect(matchesFilter(past, 'unpaid', TODAY)).toBe(false);
    expect(matchesFilter(cancelled, 'unpaid', TODAY)).toBe(false);
  });

  it('searches by reference, name, email and room', () => {
    const r = b('2030-06-10', '2030-06-12', { guest: { name: 'Dana Silva', email: 'dana@mail.lk' }, room: { roomNumber: '201' } });
    expect(matchesQuery(r, '')).toBe(true);
    expect(matchesQuery(r, 'dana')).toBe(true);
    expect(matchesQuery(r, 'MAIL.LK')).toBe(true);
    expect(matchesQuery(r, '201')).toBe(true);
    expect(matchesQuery(r, `PH${String(r.id).padStart(5, '0')}`)).toBe(true);
    expect(matchesQuery(r, 'someone else')).toBe(false);
  });

  it('orders upcoming work soonest first and history newest first', () => {
    const list = [upcoming, arriving, paidUpcoming];
    expect(filterReservations(list, { filter: 'upcoming', today: TODAY }).map((x) => x.id)).toEqual([upcoming.id, paidUpcoming.id]);
    expect(filterReservations([past, upcoming, arriving], { filter: 'all', today: TODAY })[0].id).toBe(upcoming.id);
  });
});

describe('occupancy', () => {
  it('rounds and guards against zero rooms', () => {
    expect(occupancyPercent(1, 3)).toBe(33);
    expect(occupancyPercent(3, 3)).toBe(100);
    expect(occupancyPercent(0, 0)).toBe(0);
  });
});
