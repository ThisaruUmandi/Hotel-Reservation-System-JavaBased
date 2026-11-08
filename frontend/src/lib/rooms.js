const LABELS = { SINGLE: 'Single room', DOUBLE: 'Double room', SUITE: 'Suite' };

export function typeLabel(name) {
  if (LABELS[name]) return LABELS[name];
  const lower = name.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** The room's own photo if one is set, otherwise the shared photo for its type. */
export function roomImage(room) {
  return room.imageUrl ?? `/images/rooms/${room.type.name.toLowerCase()}.jpg`;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const formatPrice = (amount) => money.format(amount);

/** One room per room type, cheapest first. Used to show a varied selection. */
export function onePerType(rooms) {
  const seen = new Set();
  return [...rooms]
    .sort((a, b) => a.pricePerNight - b.pricePerNight)
    .filter((room) => !seen.has(room.type.name) && seen.add(room.type.name));
}
