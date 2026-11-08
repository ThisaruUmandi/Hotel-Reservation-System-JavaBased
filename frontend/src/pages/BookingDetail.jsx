import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { paymentsApi } from '../api/payments';
import { reservationsApi } from '../api/reservations';
import { site } from '../config/site';
import ReviewForm from '../components/ReviewForm';
import { bookingRef } from '../lib/booking';
import { canCancel, canReview } from '../lib/bookings';
import { formatLong, todayISO } from '../lib/dates';
import { postForm } from '../lib/gateway';
import { describePayment } from '../lib/payments';
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
  const [params] = useSearchParams();
  const returnedFrom = params.get('payment'); // 'return' or 'cancelled', added by the payment gateway's redirect
  const [options, setOptions] = useState(null);
  const [gaveUp, setGaveUp] = useState(false);
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

  useEffect(() => { paymentsApi.options().then(setOptions).catch(() => setOptions(null)); }, []);

  // The gateway sends the guest back before its server has told ours the result, which can take a moment.
  // Look again every couple of seconds for up to half a minute.
  const isPaid = payments.some((p) => p.status === 'PAID');
  const waitingForGateway = returnedFrom === 'return' && Boolean(booking) && !isPaid && !gaveUp;
  useEffect(() => {
    if (!waitingForGateway) return undefined;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      try { await load(); } catch { /* try again next time */ }
      if (tries >= 15) { clearInterval(timer); setGaveUp(true); }
    }, 2000);
    return () => clearInterval(timer);
  }, [waitingForGateway, load]);

  async function payOnline() {
    setBusy(true);
    setActionError('');
    try {
      const form = await paymentsApi.startOnline(id);
      postForm(form.url, form.fields);
    } catch (e) {
      setActionError(e.message);
      setBusy(false);
    }
  }

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
  const cancelled = booking.status === 'CANCELLED';
  const justBooked = state?.justBooked && !cancelled;
  const paymentText = describePayment(payments, cancelled);
  const canPayOnline = Boolean(options?.onlineEnabled) && booking.status === 'CONFIRMED' && !paid && booking.checkOut >= todayISO();

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
            Your room is booked, but the payment did not go through: {state.paymentError} You can try again below, or pay at the front desk when you arrive.
          </p>
        )}

        <div aria-live="polite">
          {returnedFrom === 'return' && isPaid && <p className="alert alert--success" role="status">Payment received. Thank you!</p>}
          {waitingForGateway && <p className="alert alert--success" role="status">Confirming your payment…</p>}
          {returnedFrom === 'return' && !isPaid && gaveUp && (
            <p className="alert alert--error" role="status">
              We have not heard back from the payment service yet. If you were charged, it will show here shortly, so check again in a few minutes.
              You can also pay at the front desk.
            </p>
          )}
          {returnedFrom === 'cancelled' && !isPaid && (
            <p className="alert alert--error" role="status">The payment was cancelled and nothing was charged. Your room is still held. You can try again or pay at the front desk.</p>
          )}
        </div>

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
          {canPayOnline && (
            <button type="button" className="btn btn--dark" onClick={payOnline} disabled={busy}>
              {busy ? 'Taking you to the payment page…' : `Pay ${formatPrice(booking.totalPrice)} online`}
            </button>
          )}
          {canCancel(booking) && !confirming && <button type="button" className="btn btn--ghost" onClick={() => setConfirming(true)}>Cancel booking</button>}
          {confirming && (
            <div className="confirm__cancel" role="alertdialog" aria-label="Confirm cancellation">
              <p><strong>Cancel this booking?</strong> {paid ? (paid.method === 'ONLINE' ? 'The hotel will return your online payment, usually within a few days.' : 'Your card payment will be refunded.') : 'You will not be charged.'}</p>
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
