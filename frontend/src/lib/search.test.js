import { describe, expect, it } from 'vitest';
import { parseSearch, toQuery } from './search';

const parse = (query, today = '2030-06-01') => parseSearch(new URLSearchParams(query), today);

describe('parseSearch', () => {
  it('accepts a valid stay', () => {
    const s = parse('checkIn=2030-06-10&checkOut=2030-06-13&guests=2&type=SUITE');
    expect(s).toMatchObject({ valid: true, nights: 3, guests: 2, type: 'SUITE', error: '' });
  });

  it('treats an empty search as browsing, not an error', () => {
    expect(parse('')).toMatchObject({ valid: false, error: '', guests: 1, nights: 0 });
  });

  it('rejects past, reversed and incomplete dates', () => {
    expect(parse('checkIn=2030-05-01&checkOut=2030-05-03').error).toMatch(/past/);
    expect(parse('checkIn=2030-06-10&checkOut=2030-06-10').error).toMatch(/after check-in/);
    expect(parse('checkIn=2030-06-12&checkOut=2030-06-10').error).toMatch(/after check-in/);
    expect(parse('checkIn=2030-06-10').error).toMatch(/both/);
    expect(parse('checkIn=2030-06-10').valid).toBe(false);
  });

  it('rejects malformed and impossible dates', () => {
    expect(parse('checkIn=tomorrow&checkOut=later').valid).toBe(false);
    expect(parse('checkIn=2030-02-31&checkOut=2030-03-02').valid).toBe(false);
  });

  it('falls back to one guest for bad values', () => {
    expect(parse('guests=0').guests).toBe(1);
    expect(parse('guests=abc').guests).toBe(1);
    expect(parse('guests=2.5').guests).toBe(1);
    expect(parse('guests=99').guests).toBe(1);
  });

  it('allows check-in today', () => {
    expect(parse('checkIn=2030-06-01&checkOut=2030-06-02').valid).toBe(true);
  });
});

describe('toQuery', () => {
  it('leaves out empty values', () => {
    expect(toQuery({ checkIn: '2030-06-10', checkOut: '2030-06-12', guests: 2, type: '' })).toBe(
      'checkIn=2030-06-10&checkOut=2030-06-12&guests=2',
    );
    expect(toQuery({})).toBe('');
  });
});
