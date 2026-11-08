import { describe, expect, it } from 'vitest';
import { addDays, nightsBetween, parseISODate, toISODate } from './dates';

describe('dates', () => {
  it('formats local dates without shifting the day', () => {
    expect(toISODate(new Date(2030, 0, 5, 23, 30))).toBe('2030-01-05');
    expect(toISODate(new Date(2030, 11, 31, 0, 5))).toBe('2030-12-31');
  });

  it('round-trips ISO strings', () => {
    expect(toISODate(parseISODate('2030-03-09'))).toBe('2030-03-09');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2030-01-30', 3)).toBe('2030-02-02');
    expect(addDays('2030-12-30', 3)).toBe('2031-01-02');
    expect(addDays('2032-02-28', 1)).toBe('2032-02-29'); // leap year
  });

  it('counts nights, including across a daylight-saving change', () => {
    expect(nightsBetween('2030-06-10', '2030-06-13')).toBe(3);
    expect(nightsBetween('2030-03-09', '2030-03-11')).toBe(2);
    expect(nightsBetween('2030-10-26', '2030-10-28')).toBe(2);
  });
});
