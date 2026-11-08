import { describe, expect, it } from 'vitest';
import { formatPrice, onePerType, roomGallery, roomImage, stayTotal, typeLabel } from './rooms';

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

  it('formats prices in rupees with thousands separators', () => {
    expect(formatPrice(120)).toBe('LKR 120');
    expect(formatPrice(18500)).toBe('LKR 18,500');
    expect(formatPrice(1250000)).toBe('LKR 1,250,000');
  });

  it('keeps the cheapest room of each type', () => {
    const picked = onePerType([room(3, 'SUITE', 300), room(1, 'SINGLE', 80), room(2, 'SUITE', 250), room(4, 'SINGLE', 90)]);
    expect(picked.map((r) => r.id)).toEqual([1, 2]);
  });

  it('builds the gallery from the type photos, or the room photo alone', () => {
    expect(roomGallery(room(1, 'DOUBLE', 120))).toEqual(['/images/rooms/double.jpg', '/images/rooms/double-2.jpg']);
    expect(roomGallery(room(1, 'DOUBLE', 120, '/mine.jpg'))).toEqual(['/mine.jpg']);
  });

  it('totals a stay without floating point drift', () => {
    expect(stayTotal(120, 3)).toBe(360);
    expect(stayTotal(79.99, 3)).toBe(239.97);
    expect(stayTotal(0.1, 3)).toBe(0.3);
  });
});
