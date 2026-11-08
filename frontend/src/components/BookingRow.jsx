import { Link } from 'react-router-dom';
import { bookingRef } from '../lib/booking';
import { canReview, stage } from '../lib/bookings';
import { formatRange } from '../lib/dates';
import { formatPrice, roomImage, typeLabel } from '../lib/rooms';
import Photo from './Photo';

const BADGE = {
  upcoming: ['Confirmed', 'confirmed'],
  current: ['Staying now', 'confirmed'],
  past: ['Completed', ''],
  cancelled: ['Cancelled', 'cancelled'],
};

export default function BookingRow({ booking }) {
  const label = typeLabel(booking.room.type.name);
  const [badgeText, badgeClass] = BADGE[stage(booking)];
  const to = `/bookings/${booking.id}`;
  return (
    <article className="booking-row">
      <Link to={to} tabIndex={-1} aria-hidden="true" className="booking-row__photo">
        <Photo src={roomImage(booking.room)} alt="" ratio="4 / 3" label={label} />
      </Link>
      <div className="booking-row__info">
        <p className="muted small">{bookingRef(booking.id)}</p>
        <h2><Link to={to}>{label}</Link></h2>
        <p>{formatRange(booking.checkIn, booking.checkOut)}</p>
        <p className="muted small">
          Room {booking.room.roomNumber} · {booking.nights} {booking.nights === 1 ? 'night' : 'nights'} · {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}
        </p>
      </div>
      <div className="booking-row__aside">
        <span className={`badge${badgeClass ? ` badge--${badgeClass}` : ''}`}>{badgeText}</span>
        <p className="booking-row__total">{formatPrice(booking.totalPrice)}</p>
        {canReview(booking)
          ? <Link to={to} className="btn btn--dark btn--small">Leave a review</Link>
          : <Link to={to} className="text-link small">View booking</Link>}
      </div>
    </article>
  );
}
