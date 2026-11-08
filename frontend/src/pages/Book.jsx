import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { paymentsApi } from '../api/payments';
import { reservationsApi } from '../api/reservations';
import { roomsApi } from '../api/rooms';
import { useAuth } from '../auth/AuthContext';
import StaySummary from '../components/StaySummary';
import TextField from '../components/TextField';
import {
  digitsOnly, formatCardNumber, formatExpiry, validateCard, validateDetails,
} from '../lib/booking';
import { formatPrice, stayTotal } from '../lib/rooms';
import { parseSearch, toQuery } from '../lib/search';
import { usePageTitle } from '../lib/usePageTitle';

function Notice({ title, children, to, action }) {
  return (
    <section className="section">
      <div className="container">
        <h1>{title}</h1>
        <p className="lead" style={{ marginTop: 'var(--space-4)' }}>{children}</p>
        <Link to={to} className="btn btn--dark" style={{ marginTop: 'var(--space-6)' }}>{action}</Link>
      </div>
    </section>
  );
}

export default function Book() {
  usePageTitle('Confirm your booking');
  const { id } = useParams();
  const [params] = useSearchParams();
  const search = useMemo(() => parseSearch(params), [params]);
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const guest = user?.guest ?? null;

  const [room, setRoom] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [availability, setAvailability] = useState('checking'); // checking | free | taken | unknown
  const [details, setDetails] = useState({ name: '', email: '', phone: '' });
  const [method, setMethod] = useState('CARD'); // CARD | LATER
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    roomsApi.get(id).then((r) => !cancelled && setRoom(r)).catch((e) => !cancelled && setLoadError(e));
    return () => { cancelled = true; };
  }, [id]);

  // Check again that the room is still free before asking for any details.
  useEffect(() => {
    if (!room || !search.valid) return undefined;
    let cancelled = false;
    roomsApi
      .available({ checkIn: search.checkIn, checkOut: search.checkOut, guests: search.guests })
      .then((list) => !cancelled && setAvailability(list.some((r) => r.id === room.id) ? 'free' : 'taken'))
      .catch(() => !cancelled && setAvailability('unknown'));
    return () => { cancelled = true; };
  }, [room, search.valid, search.checkIn, search.checkOut, search.guests]);

  if (loadError) {
    return <Notice title="Room not found" to="/rooms" action="See all rooms">That room does not exist or is no longer listed.</Notice>;
  }
  if (!room) return <section className="section"><div className="container"><p className="muted" role="status">Loading…</p></div></section>;

  const roomPage = `/rooms/${room.id}${params.toString() ? `?${params}` : ''}`;
  if (!search.valid) {
    return <Notice title="Choose your dates first" to={`/rooms/${room.id}`} action="Back to the room">{search.error || 'We need your check-in and check-out dates to book this room.'}</Notice>;
  }
  if (room.status !== 'AVAILABLE') {
    return <Notice title="This room is closed" to="/rooms" action="See other rooms">It is not taking bookings right now.</Notice>;
  }
  if (search.guests > room.type.capacity) {
    return <Notice title="Too many guests" to={roomPage} action="Back to the room">This room sleeps up to {room.type.capacity}.</Notice>;
  }
  if (availability === 'taken') {
    return <Notice title="No longer available" to={`/rooms?${toQuery(search)}`} action="See what is free">Someone has booked this room for those dates. Other rooms may still be free.</Notice>;
  }

  const total = stayTotal(room.pricePerNight, search.nights);
  // A field's error goes away as soon as the guest edits that field.
  const clearError = (key) => setErrors((current) => {
    if (!current[key]) return current;
    const { [key]: removed, ...rest } = current;
    return rest;
  });
  const setDetail = (field) => (e) => { setDetails((d) => ({ ...d, [field]: e.target.value })); clearError(field); };
  const setCardField = (field, format = (v) => v) => (e) => { setCard((c) => ({ ...c, [field]: format(e.target.value) })); clearError(`card_${field}`); };
  const focusFirstError = () => requestAnimationFrame(() => document.querySelector('.checkout [aria-invalid="true"]')?.focus());

  async function submit(event) {
    event.preventDefault();
    const found = {
      ...(guest ? {} : validateDetails(details)),
      ...(method === 'CARD' ? Object.fromEntries(Object.entries(validateCard(card)).map(([k, v]) => [`card_${k}`, v])) : {}),
    };
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) { focusFirstError(); return; }

    setBusy(true);
    let reservation;
    try {
      const contact = guest ?? details;
      reservation = await reservationsApi.create({
        roomId: room.id,
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone?.trim() || null,
        guests: search.guests,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
      });
    } catch (e) {
      const fields = e.fieldErrors ?? {};
      const mine = Object.fromEntries(['name', 'email', 'phone'].filter((k) => fields[k]).map((k) => [k, fields[k]]));
      setErrors(mine);
      setFormError(Object.keys(mine).length ? 'Please fix the highlighted details.' : e.message);
      setBusy(false);
      if (Object.keys(mine).length) focusFirstError();
      return;
    }

    // The booking now exists. A failed card payment must not hide that from the guest.
    let paymentError = '';
    if (method === 'CARD') {
      try {
        await paymentsApi.pay({ reservationId: reservation.id, method: 'CARD', cardNumber: digitsOnly(card.number) });
      } catch (e) {
        paymentError = e.message;
      }
    }
    refresh().catch(() => {}); // pick up the saved guest profile; not critical
    navigate(`/bookings/${reservation.id}`, { replace: true, state: { justBooked: true, paymentError } });
  }

  return (
    <section className="section checkout">
      <div className="container">
        <Link to={roomPage} className="back-link">← Back to the room</Link>
        <h1>Confirm your booking</h1>

        <div className="checkout__grid">
          <form className="checkout__form" onSubmit={submit} noValidate>
            {formError && <p className="alert alert--error" role="alert">{formError}</p>}

            <section className="checkout__block" aria-labelledby="details-title">
              <h2 id="details-title">Your details</h2>
              {guest ? (
                <div className="saved">
                  <p><strong>{guest.name}</strong></p>
                  <p className="muted">{guest.email}{guest.phone ? ` · ${guest.phone}` : ''}</p>
                  <p className="muted small">Saved from your first booking.</p>
                </div>
              ) : (
                <div className="checkout__fields">
                  <TextField label="Full name" autoComplete="name" value={details.name} onChange={setDetail('name')} error={errors.name} />
                  <div className="checkout__row">
                    <TextField label="Email" type="email" autoComplete="email" value={details.email} onChange={setDetail('email')} error={errors.email} />
                    <TextField label="Phone (optional)" type="tel" autoComplete="tel" value={details.phone} onChange={setDetail('phone')} error={errors.phone} />
                  </div>
                </div>
              )}
            </section>

            <section className="checkout__block" aria-labelledby="payment-title">
              <h2 id="payment-title">Payment</h2>
              <fieldset className="choices">
                <legend className="visually-hidden">Payment method</legend>
                <label className={`choice${method === 'CARD' ? ' is-selected' : ''}`}>
                  <input type="radio" name="method" value="CARD" checked={method === 'CARD'} onChange={() => setMethod('CARD')} />
                  <span><strong>Pay by card now</strong><small>Your card is charged {formatPrice(total)} today.</small></span>
                </label>
                <label className={`choice${method === 'LATER' ? ' is-selected' : ''}`}>
                  <input type="radio" name="method" value="LATER" checked={method === 'LATER'} onChange={() => setMethod('LATER')} />
                  <span><strong>Pay at the front desk</strong><small>Pay in cash or by card when you arrive. We hold the room for you.</small></span>
                </label>
              </fieldset>

              {method === 'CARD' && (
                <div className="checkout__fields" style={{ marginTop: 'var(--space-5)' }}>
                  <p className="demo-note">
                    <strong>This is a demonstration.</strong> No money is taken, so please do not enter a real card.
                    Use 4242 4242 4242 4242, any future date and any 3 digits.
                  </p>
                  <TextField label="Card number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234"
                    value={card.number} onChange={setCardField('number', formatCardNumber)} error={errors.card_number} />
                  <TextField label="Name on card" autoComplete="cc-name" value={card.name}
                    onChange={setCardField('name')} error={errors.card_name} />
                  <div className="checkout__row">
                    <TextField label="Expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={card.expiry}
                      onChange={setCardField('expiry', formatExpiry)} error={errors.card_expiry} />
                    <TextField label="Security code" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={card.cvc}
                      onChange={setCardField('cvc', digitsOnly)} error={errors.card_cvc} />
                  </div>
                  <p className="muted small">Only the card brand and last 4 digits are kept. The expiry date and security code are never sent to our server.</p>
                </div>
              )}
            </section>

            <button type="submit" className="btn btn--dark btn--block checkout__submit" disabled={busy}>
              {busy ? 'Booking…' : method === 'CARD' ? `Confirm and pay ${formatPrice(total)}` : 'Confirm booking'}
            </button>
          </form>

          <StaySummary room={room} search={search} />
        </div>
      </div>
    </section>
  );
}
