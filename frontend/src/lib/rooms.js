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

// Prices are in Sri Lankan rupees. Written out as "LKR 18,500" so it reads the same in every browser.
const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
export const formatPrice = (amount) => `LKR ${grouped.format(amount)}`;

/** One room per room type, cheapest first. Used to show a varied selection. */
export function onePerType(rooms) {
  const seen = new Set();
  return [...rooms]
    .sort((a, b) => a.pricePerNight - b.pricePerNight)
    .filter((room) => !seen.has(room.type.name) && seen.add(room.type.name));
}

/** Photos for a room: its own photo if set, otherwise the two shared photos for its type. */
export function roomGallery(room) {
  if (room.imageUrl) return [room.imageUrl];
  const slug = room.type.name.toLowerCase();
  return [`/images/rooms/${slug}.jpg`, `/images/rooms/${slug}-2.jpg`];
}

/** Total for a stay, computed in cents so decimals never drift. */
export function stayTotal(pricePerNight, nights) {
  return Math.round(pricePerNight * 100) * nights / 100;
}
