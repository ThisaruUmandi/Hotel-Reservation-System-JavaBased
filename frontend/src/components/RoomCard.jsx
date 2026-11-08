import { Link } from 'react-router-dom';
import { formatPrice, roomImage, stayTotal, typeLabel } from '../lib/rooms';
import Photo from './Photo';

/**
 * variant "feature": tall photo above text (home page)
 * variant "compact": photo above text, boxed (home page)
 * variant "row": photo left, details middle, price and button right (search results)
 * `query` keeps the guest's search (dates, guests) when they open the room. `nights` adds the stay total.
 */
export default function RoomCard({ room, variant = 'compact', query = '', nights = 0 }) {
  const label = typeLabel(room.type.name);
  const to = `/rooms/${room.id}${query ? `?${query}` : ''}`;
  const ratio = variant === 'feature' ? 'auto' : '4 / 3';
  const amenities = room.type.amenities.slice(0, 4).join(' · ');

  return (
    <article className={`room-card room-card--${variant}`}>
      <Link to={to} className="room-card__media" tabIndex={-1} aria-hidden="true">
        <Photo src={roomImage(room)} alt="" ratio={ratio} label={label} />
      </Link>
      <div className="room-card__body">
        <div className="room-card__top">
          <h3><Link to={to}>{label}</Link></h3>
          {variant !== 'row' && (
            <p className="room-card__price"><strong>{formatPrice(room.pricePerNight)}</strong> <span>per night</span></p>
          )}
        </div>
        <p className="room-card__meta">Room {room.roomNumber} · Sleeps {room.type.capacity}</p>
        <p className="room-card__desc">{room.type.description}</p>
        {amenities && <p className="room-card__amenities">{amenities}</p>}
      </div>
      {variant === 'row' && (
        <div className="room-card__aside">
          <p className="room-card__price">
            <strong>{formatPrice(room.pricePerNight)}</strong> <span>per night</span>
          </p>
          {nights > 0 && (
            <p className="room-card__total">
              {formatPrice(stayTotal(room.pricePerNight, nights))} total · {nights} {nights === 1 ? 'night' : 'nights'}
            </p>
          )}
          <Link to={to} className="btn btn--dark btn--small">View room</Link>
        </div>
      )}
    </article>
  );
}
