import { describe, expect, it } from 'vitest';
import { formatPrice, onePerType, roomImage, typeLabel } from './rooms';

const room = (id, type, price, imageUrl = null) => ({ id, type: { name: type }, pricePerNight: price, imageUrl });

describe('room helpers', () => {
  it('labels known and unknown types', () => {
    expect(typeLabel('SUITE')).toBe('Suite');
    expect(typeLabel('DOUBLE')).toBe('Double room');
    expect(typeLabel('FAMILY')).toBe('Family');
  });

  it('prefers the room photo, then the type photo', () => {
    expect(roomImage(room(1, 'SUITE', 250, '/custom.jpg'))).toBe('/custom.jpg');
    expect(roomImage(room(1, 'SUITE', 250))).toBe('/images/rooms/suite.jpg');
  });

  it('formats prices without decimals', () => {
    expect(formatPrice(120)).toBe('$120');
  });

  it('keeps the cheapest room of each type', () => {
    const picked = onePerType([room(3, 'SUITE', 300), room(1, 'SINGLE', 80), room(2, 'SUITE', 250), room(4, 'SINGLE', 90)]);
    expect(picked.map((r) => r.id)).toEqual([1, 2]);
  });
});
