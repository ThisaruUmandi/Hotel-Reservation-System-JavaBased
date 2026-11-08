import { site } from '../config/site';
import { formatDay } from '../lib/dates';
import { formatPrice, roomImage, stayTotal, typeLabel } from '../lib/rooms';
import Photo from './Photo';

/** The booking at a glance, shown beside the checkout form. */
export default function StaySummary({ room, search }) {
  const label = typeLabel(room.type.name);
  const total = stayTotal(room.pricePerNight, search.nights);
  return (
    <aside className="summary" aria-label="Your stay">
      <Photo src={roomImage(room)} alt="" ratio="16 / 9" label={label} />
      <div className="summary__body">
        <div>
          <h2 className="summary__title">{label}</h2>
          <p className="muted small">Room {room.roomNumber} · {site.name}</p>
        </div>
        <dl className="summary__list">
          <div><dt>Check-in</dt><dd>{formatDay(search.checkIn)}</dd></div>
          <div><dt>Check-out</dt><dd>{formatDay(search.checkOut)}</dd></div>
          <div><dt>Guests</dt><dd>{search.guests}</dd></div>
        </dl>
        <dl className="summary__list summary__list--sum">
          <div><dt>{formatPrice(room.pricePerNight)} × {search.nights} {search.nights === 1 ? 'night' : 'nights'}</dt><dd>{formatPrice(total)}</dd></div>
          <div className="summary__total"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
        <p className="muted small">Cancel free until the day before you arrive.</p>
      </div>
    </aside>
  );
}
