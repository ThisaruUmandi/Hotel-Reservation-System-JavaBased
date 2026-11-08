import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { reservationsApi } from '../../api/reservations';
import { filterReservations, occupancyPercent } from '../../lib/admin';
import { bookingRef } from '../../lib/booking';
import { formatLong, todayISO } from '../../lib/dates';
import { formatPrice, typeLabel } from '../../lib/rooms';
import { usePageTitle } from '../../lib/usePageTitle';

function MovementList({ title, rows, empty }) {
  return (
    <section aria-labelledby={`${title}-h`}>
      <h2 id={`${title}-h`}>{title}</h2>
      {rows.length === 0 ? <p className="muted">{empty}</p> : (
        <ul className="movements">
          {rows.map((b) => (
            <li key={b.id}>
              <div>
                <strong>{b.guest.name}</strong>
                <span className="muted small"> · {typeLabel(b.room.type.name)}, room {b.room.roomNumber} · {b.numberOfGuests} {b.numberOfGuests === 1 ? 'guest' : 'guests'}</span>
              </div>
              <div className="movements__side">
                {!b.paid && <span className="badge">Unpaid</span>}
                <Link to={`/bookings/${b.id}`} className="text-link small">{bookingRef(b.id)}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AdminOverview() {
  usePageTitle('Admin: overview');
  const [data, setData] = useState({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [refundBusy, setRefundBusy] = useState(null);
  const [refundError, setRefundError] = useState('');
  const today = todayISO();

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.summary(), reservationsApi.all(), adminApi.refunds()])
      .then(([summary, list, refunds]) => !cancelled && setData({ status: 'ready', summary, list, refunds }))
      .catch((e) => !cancelled && setData({ status: 'error', error: e.message }));
    return () => { cancelled = true; };
  }, [reloadKey]);

  async function markRefunded(paymentId) {
    setRefundBusy(paymentId);
    setRefundError('');
    try {
      await adminApi.markRefunded(paymentId);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setRefundError(e.message);
    }
    setRefundBusy(null);
  }

  const arriving = useMemo(() => (data.list ? filterReservations(data.list, { filter: 'arriving', today }) : []), [data.list, today]);
  const leaving = useMemo(() => (data.list ? filterReservations(data.list, { filter: 'leaving', today }) : []), [data.list, today]);

  if (data.status === 'error') return <p className="alert alert--error" role="alert">{data.error}</p>;
  if (data.status === 'loading') return <p className="muted" role="status">Loading…</p>;

  const s = data.summary;
  return (
    <div className="admin__page">
      <p className="muted">{formatLong(today)}</p>

      <dl className="admin-stats">
        <div><dt>Arriving today</dt><dd>{s.arrivalsToday}</dd></div>
        <div><dt>Leaving today</dt><dd>{s.departuresToday}</dd></div>
        <div><dt>In house now</dt><dd>{s.inHouse}<span> of {s.totalRooms} rooms · {occupancyPercent(s.inHouse, s.totalRooms)}%</span></dd></div>
        <div><dt>Refunds to process</dt><dd>{s.refundsDue}</dd></div>
        <div>
          <dt>Awaiting payment</dt>
          <dd>{s.awaitingPayment}<span> {s.awaitingPayment === 1 ? 'booking' : 'bookings'}</span></dd>
        </div>
        <div><dt>Collected in total</dt><dd className="admin-stats__money">{formatPrice(s.collected)}</dd></div>
      </dl>

      <div className="admin__two">
        <MovementList title="Arriving today" rows={arriving} empty="Nobody is arriving today." />
        <MovementList title="Leaving today" rows={leaving} empty="Nobody is leaving today." />
      </div>

      {data.refunds.length > 0 && (
        <section aria-labelledby="refunds-h">
          <h2 id="refunds-h">Refunds to process</h2>
          <p className="muted small" style={{ marginBottom: 'var(--space-3)' }}>
            These guests paid online and then cancelled. Send the money back in the payment provider&rsquo;s dashboard, then mark it as refunded here.
          </p>
          {refundError && <p className="alert alert--error" role="alert">{refundError}</p>}
          <ul className="movements">
            {data.refunds.map((r) => (
              <li key={r.paymentId}>
                <div>
                  <strong>{r.guestName}</strong>
                  <span className="muted small"> · {r.guestEmail} · {formatPrice(r.amount)} · {bookingRef(r.reservationId)}</span>
                </div>
                <div className="movements__side">
                  <button type="button" className="btn btn--ghost btn--small" disabled={refundBusy === r.paymentId} onClick={() => markRefunded(r.paymentId)}>
                    {refundBusy === r.paymentId ? 'Saving…' : 'Mark as refunded'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p><Link to="/admin/reservations" className="text-link">Open all reservations</Link></p>
    </div>
  );
}
