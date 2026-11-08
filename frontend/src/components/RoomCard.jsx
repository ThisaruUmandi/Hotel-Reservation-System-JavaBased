import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { formatPrice, roomImage, typeLabel } from '../lib/rooms';
import Photo from './Photo';

/** variant: "feature" (tall photo above text) or "compact" (photo beside text on wide screens). */
export default function RoomCard({ room, variant = 'compact' }) {
  const label = typeLabel(room.type.name);
  return (
    <article className={`room-card room-card--${variant}`}>
      <Link to={`/rooms/${room.id}`} className="room-card__media" tabIndex={-1} aria-hidden="true">
        <Photo src={roomImage(room)} alt="" ratio={variant === 'feature' ? 'auto' : '4 / 3'} label={label} />
      </Link>
      <div className="room-card__body">
        <div className="room-card__top">
          <h3><Link to={`/rooms/${room.id}`}>{label}</Link></h3>
          <p className="room-card__price"><strong>{formatPrice(room.pricePerNight)}</strong> <span>per night</span></p>
        </div>
        <p className="room-card__meta">Sleeps {room.type.capacity} · {site.name}</p>
        <p className="room-card__desc">{room.type.description}</p>
        {room.type.amenities.length > 0 && (
          <ul className="room-card__amenities">
            {room.type.amenities.slice(0, 3).map((a) => <li key={a}>{a}</li>)}
          </ul>
        )}
      </div>
    </article>
  );
}
