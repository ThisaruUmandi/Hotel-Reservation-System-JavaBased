import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentsApi } from '../../api/payments';
import { reservationsApi } from '../../api/reservations';
import { useAuth } from '../../auth/AuthContext';
import { FILTERS, filterReservations } from '../../lib/admin';
import { bookingRef } from '../../lib/booking';
import { canCancel, stage } from '../../lib/bookings';
import { formatRange } from '../../lib/dates';
import { formatPrice, typeLabel } from '../../lib/rooms';

const STAGE = { upcoming: 'Upcoming', current: 'In house', past: 'Completed', cancelled: 'Cancelled' };

export default function AdminReservations() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading', list: [], error: '' });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [pending, setPending] = useState(null); // { id, kind: 'cash' | 'cancel' }
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    const list = await reservationsApi.all();
    setState({ status: 'ready', list, error: '' });
  }, []);

  useEffect(() => {
    load().catch((e) => setState({ status: 'error', list: [], error: e.message }));
  }, [load]);

  const rows = useMemo(() => filterReservations(state.list, { query, filter }), [state.list, query, filter]);

  async function run(action, message) {
    setBusy(true);
    setActionError('');
    setNotice('');
    try {
      await action();
      await load();
      setNotice(message);
      setPending(null);
    } catch (e) {
      setActionError(e.message);
    }
    setBusy(false);
  }

  const recordCash = (b) => run(
    () => paymentsApi.pay({ reservationId: b.id, method: 'CASH', receivedBy: user.username }),
    `Cash payment recorded for ${bookingRef(b.id)}.`,
  );
  const cancel = (b) => run(() => reservationsApi.cancel(b.id), `${bookingRef(b.id)} was cancelled.`);

  if (state.status === 'error') return <p className="alert alert--error" role="alert">{state.error}</p>;

  return (
    <div className="admin__page">
      <div className="toolbar">
        <label className="toolbar__search">
          <span className="visually-hidden">Search reservations</span>
          <input className="input" type="search" placeholder="Search by name, email, reference or room" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <div className="chips" role="group" aria-label="Filter reservations">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" className="chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      <div aria-live="polite">
        {notice && <p className="alert alert--success" role="status">{notice}</p>}
        {actionError && <p className="alert alert--error" role="alert">{actionError}</p>}
      </div>

      {state.status === 'loading' ? <p className="muted" role="status">Loading reservations…</p> : rows.length === 0 ? (
        <div className="empty"><h3>No reservations match</h3><p className="muted">Try a different search or filter.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Booking</th><th>Room</th><th>Stay</th><th>Total</th><th>Status</th><th>Payment</th><th><span className="visually-hidden">Actions</span></th></tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const isPending = pending?.id === b.id;
                const needsCash = b.status === 'CONFIRMED' && !b.paid;
                return (
                  <tr key={b.id}>
                    <td>
                      <Link to={`/bookings/${b.id}`} className="table__ref">{bookingRef(b.id)}</Link>
                      <div><strong>{b.guest.name}</strong></div>
                      <div className="muted small">{b.guest.email}</div>
                    </td>
                    <td>{typeLabel(b.room.type.name)}<div className="muted small">Room {b.room.roomNumber}</div></td>
                    <td>{formatRange(b.checkIn, b.checkOut)}<div className="muted small">{b.nights} {b.nights === 1 ? 'night' : 'nights'} · {b.numberOfGuests} {b.numberOfGuests === 1 ? 'guest' : 'guests'}</div></td>
                    <td className="table__num">{formatPrice(b.totalPrice)}</td>
                    <td><span className={`badge${b.status === 'CANCELLED' ? ' badge--cancelled' : stage(b) === 'past' ? '' : ' badge--confirmed'}`}>{STAGE[stage(b)]}</span></td>
                    <td>{b.status === 'CANCELLED' ? <span className="muted">–</span> : <span className={`badge${b.paid ? ' badge--paid' : ''}`}>{b.paid ? 'Paid' : 'Unpaid'}</span>}</td>
                    <td className="table__actions">
                      {isPending ? (
                        <div className="rowconfirm" role="alertdialog" aria-label="Confirm action">
                          <p className="small">
                            {pending.kind === 'cash' ? `Cash received: ${formatPrice(b.totalPrice)}?` : `Cancel ${bookingRef(b.id)}?`}
                          </p>
                          <div className="rowconfirm__buttons">
                            <button type="button" className="btn btn--dark btn--small" disabled={busy}
                              onClick={() => (pending.kind === 'cash' ? recordCash(b) : cancel(b))}>{busy ? 'Saving…' : 'Yes'}</button>
                            <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={() => setPending(null)}>No</button>
                          </div>
                        </div>
                      ) : (
                        <div className="rowconfirm__buttons">
                          {needsCash && <button type="button" className="btn btn--ghost btn--small" onClick={() => setPending({ id: b.id, kind: 'cash' })}>Record cash</button>}
                          {canCancel(b) && <button type="button" className="link-quiet small" onClick={() => setPending({ id: b.id, kind: 'cancel' })}>Cancel</button>}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small">{state.status === 'ready' ? `${rows.length} of ${state.list.length} reservations` : ''}</p>
    </div>
  );
}
