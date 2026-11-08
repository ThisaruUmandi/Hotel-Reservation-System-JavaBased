import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import { todayISO } from '../lib/dates';
import { formatPrice, stayTotal } from '../lib/rooms';
import { parseSearch, toQuery } from '../lib/search';
import TextField from './TextField';

/** Dates + guests for one room, a live price, and a live availability check. */
export default function BookingPanel({ room, search, onSearchChange }) {
  const capacity = room.type.capacity;
  const bookable = room.status === 'AVAILABLE';
  const [form, setForm] = useState({
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    guests: String(Math.min(search.guests, capacity)),
  });
  const [availability, setAvailability] = useState('idle'); // idle | checking | free | taken | error

  const parsed = useMemo(() => parseSearch(new URLSearchParams(form)), [form]);
  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const today = todayISO();
  const shownError = form.checkIn && form.checkOut ? parsed.error : '';

  // Keep the page address in sync so the stay survives a refresh or a shared link.
  const notify = useRef(onSearchChange);
  notify.current = onSearchChange;
  useEffect(() => {
    if (!parsed.valid) return;
    if (parsed.checkIn === search.checkIn && parsed.checkOut === search.checkOut && parsed.guests === search.guests) return;
    notify.current({ checkIn: parsed.checkIn, checkOut: parsed.checkOut, guests: parsed.guests });
  }, [parsed.valid, parsed.checkIn, parsed.checkOut, parsed.guests]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ask the server whether this room is free for the chosen dates.
  useEffect(() => {
    if (!parsed.valid || !bookable) {
      setAvailability('idle');
      return undefined;
    }
    let cancelled = false;
    setAvailability('checking');
    roomsApi
      .available({ checkIn: parsed.checkIn, checkOut: parsed.checkOut, guests: parsed.guests })
      .then((list) => !cancelled && setAvailability(list.some((r) => r.id === room.id) ? 'free' : 'taken'))
      .catch(() => !cancelled && setAvailability('error'));
    return () => { cancelled = true; };
  }, [parsed.valid, parsed.checkIn, parsed.checkOut, parsed.guests, room.id, bookable]);

  const total = parsed.valid ? stayTotal(room.pricePerNight, parsed.nights) : null;
  const bookingLink = `/book/${room.id}?${toQuery({ checkIn: parsed.checkIn, checkOut: parsed.checkOut, guests: parsed.guests })}`;

  return (
    <aside className="booking-panel" aria-label="Book this room">
      <p className="booking-panel__price">
        <strong>{formatPrice(room.pricePerNight)}</strong> <span>per night</span>
      </p>

      {!bookable && <p className="alert alert--error">This room is closed for bookings right now.</p>}

      <div className="booking-panel__fields">
        <TextField label="Check-in" type="date" min={today} value={form.checkIn} onChange={set('checkIn')} disabled={!bookable} />
        <TextField label="Check-out" type="date" min={form.checkIn || today} value={form.checkOut} onChange={set('checkOut')} disabled={!bookable} />
        <TextField label="Guests" as="select" value={form.guests} onChange={set('guests')} disabled={!bookable}
          hint={`Sleeps up to ${capacity}`}>
          {Array.from({ length: capacity }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
          ))}
        </TextField>
      </div>

      {shownError && <p className="alert alert--error" role="alert">{shownError}</p>}

      <div aria-live="polite">
        {availability === 'checking' && <p className="muted small">Checking availability…</p>}
        {availability === 'free' && <p className="alert alert--success">Available for your dates.</p>}
        {availability === 'taken' && <p className="alert alert--error">Sorry, this room is booked for those dates. Try different dates.</p>}
        {availability === 'error' && <p className="alert alert--error">We could not check availability. Please try again.</p>}
      </div>

      {total !== null && (
        <dl className="booking-panel__sum">
          <div>
            <dt>{formatPrice(room.pricePerNight)} × {parsed.nights} {parsed.nights === 1 ? 'night' : 'nights'}</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
          <div className="booking-panel__total"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
      )}

      {availability === 'free' ? (
        <Link to={bookingLink} className="btn btn--primary btn--block">Reserve this room</Link>
      ) : (
        <button type="button" className="btn btn--primary btn--block" disabled>
          {parsed.valid ? 'Reserve this room' : 'Choose your dates'}
        </button>
      )}
      <p className="muted small booking-panel__note">You will not be charged yet. Cancel free until check-in.</p>
    </aside>
  );
}
