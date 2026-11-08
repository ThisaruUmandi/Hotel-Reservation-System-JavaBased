import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { paymentsApi } from '../api/payments';
import { reservationsApi } from '../api/reservations';
import { site } from '../config/site';
import ReviewForm from '../components/ReviewForm';
import { bookingRef } from '../lib/booking';
import { canCancel, canReview } from '../lib/bookings';
import { formatLong } from '../lib/dates';
import { formatPrice, typeLabel } from '../lib/rooms';
import { usePageTitle } from '../lib/usePageTitle';

const STATUS = { CONFIRMED: 'Confirmed', CANCELLED: 'Cancelled', COMPLETED: 'Completed' };

export default function BookingDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  usePageTitle(booking ? `Booking ${bookingRef(booking.id)}` : 'Booking');

  const load = useCallback(async () => {
    const [b, p] = await Promise.all([reservationsApi.get(id), paymentsApi.forReservation(id)]);
    setBooking(b);
    setPayments(p);
  }, [id]);

  useEffect(() => {
    setBooking(null); setError(null);
    load().catch(setError);
  }, [load]);

  async function cancel() {
    setBusy(true);
    setActionError('');
    try {
      await reservationsApi.cancel(id);
      await load();
      setConfirming(false);
    } catch (e) {
      setActionError(e.message);
    }
    setBusy(false);
  }

  if (error) {
    const missing = error.status === 404;
    return (
      <section className="section">
        <div className="container">
          <h1>{missing ? 'Booking not found' : 'This page did not load'}</h1>
          <p className="lead" style={{ marginTop: 'var(--space-4)' }}>{missing ? 'Check the reference, or log in with the account you booked with.' : error.message}</p>
          <Link to="/rooms" className="btn btn--dark" style={{ marginTop: 'var(--space-6)' }}>See rooms</Link>
        </div>
      </section>
    );
  }
  if (!booking) return <section className="section"><div className="container"><p className="muted" role="status">Loading your booking…</p></div></section>;

  const paid = payments.find((p) => p.status === 'PAID');
  const refunded = payments.find((p) => p.status === 'REFUNDED');
  const cancelled = booking.status === 'CANCELLED';
  const justBooked = state?.justBooked && !cancelled;

  let paymentText = 'Pay at the front desk when you arrive.';
  if (paid) paymentText = `Paid by ${paid.description}.`;
  else if (refunded) paymentText = `Refunded to ${refunded.description}.`;
  else if (cancelled) paymentText = 'No payment was taken.';

  return (
    <section className="section">
      <div className="container confirm">
        {justBooked ? (
          <header className="confirm__head">
            <svg className="confirm__tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
            <div>
              <h1>Booking confirmed</h1>
              <p className="lead">Your reference is <strong>{bookingRef(booking.id)}</strong>. Keep it for your records.</p>
            </div>
          </header>
        ) : (
          <header>
            <span className="eyebrow">Booking {bookingRef(booking.id)}</span>
            <h1>{cancelled ? 'Booking cancelled' : typeLabel(booking.room.type.name)}</h1>
          </header>
        )}

        {state?.paymentError && (
          <p className="alert alert--error" role="alert">
            Your room is booked, but the card payment did not go through: {state.paymentError} You can pay at the front desk when you arrive.
          </p>
        )}

        <dl className="facts confirm__list">
          <div><dt>Status</dt><dd><span className={`badge badge--${booking.status.toLowerCase()}`}>{STATUS[booking.status] ?? booking.status}</span></dd></div>
          <div><dt>Room</dt><dd>{typeLabel(booking.room.type.name)}, room {booking.room.roomNumber}</dd></div>
          <div><dt>Check-in</dt><dd>{formatLong(booking.checkIn)}</dd></div>
          <div><dt>Check-out</dt><dd>{formatLong(booking.checkOut)}</dd></div>
          <div><dt>Stay</dt><dd>{booking.nights} {booking.nights === 1 ? 'night' : 'nights'} · {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}</dd></div>
          <div><dt>Name</dt><dd>{booking.guest.name} · {booking.guest.email}</dd></div>
          <div><dt>Total</dt><dd>{formatPrice(booking.totalPrice)}</dd></div>
          <div><dt>Payment</dt><dd>{paymentText}</dd></div>
          <div><dt>Where</dt><dd>{site.name}, {site.contact.address}</dd></div>
        </dl>

        {actionError && <p className="alert alert--error" role="alert">{actionError}</p>}

        {canReview(booking) && <ReviewForm reservationId={booking.id} onDone={load} />}
        {booking.reviewed && <p className="alert alert--success" role="status">Thank you. You have reviewed this stay.</p>}

        <div className="confirm__actions">
          {canCancel(booking) && !confirming && <button type="button" className="btn btn--ghost" onClick={() => setConfirming(true)}>Cancel booking</button>}
          {confirming && (
            <div className="confirm__cancel" role="alertdialog" aria-label="Confirm cancellation">
              <p><strong>Cancel this booking?</strong> {paid ? 'Your card payment will be refunded.' : 'You will not be charged.'}</p>
              <div className="confirm__buttons">
                <button type="button" className="btn btn--dark btn--small" onClick={cancel} disabled={busy}>{busy ? 'Cancelling…' : 'Yes, cancel it'}</button>
                <button type="button" className="btn btn--ghost btn--small" onClick={() => setConfirming(false)} disabled={busy}>Keep my booking</button>
              </div>
            </div>
          )}
          <Link to="/bookings" className="text-link">All my bookings</Link>
          <Link to="/rooms" className="text-link">Browse rooms</Link>
        </div>
      </div>
    </section>
  );
}
