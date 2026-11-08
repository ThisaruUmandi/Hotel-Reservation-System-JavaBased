import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { reservationsApi } from '../../api/reservations';
import { filterReservations, occupancyPercent } from '../../lib/admin';
import { bookingRef } from '../../lib/booking';
import { formatLong, todayISO } from '../../lib/dates';
import { formatPrice, typeLabel } from '../../lib/rooms';

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
  const [data, setData] = useState({ status: 'loading' });
  const today = todayISO();

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.summary(), reservationsApi.all()])
      .then(([summary, list]) => !cancelled && setData({ status: 'ready', summary, list }))
      .catch((e) => !cancelled && setData({ status: 'error', error: e.message }));
    return () => { cancelled = true; };
  }, []);

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

      <p><Link to="/admin/reservations" className="text-link">Open all reservations</Link></p>
    </div>
  );
}
