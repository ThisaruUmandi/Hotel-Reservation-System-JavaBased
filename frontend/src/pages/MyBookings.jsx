import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { reservationsApi } from '../api/reservations';
import BookingRow from '../components/BookingRow';
import { groupBookings } from '../lib/bookings';

const TABS = [
  ['upcoming', 'Upcoming'],
  ['past', 'Past'],
  ['cancelled', 'Cancelled'],
];
const EMPTY = {
  upcoming: ['No upcoming stays', 'When you book a room, it will show up here.'],
  past: ['No past stays yet', 'Stays you have completed will appear here, and you can review them.'],
  cancelled: ['No cancelled bookings', 'Anything you cancel will be listed here.'],
};

export default function MyBookings() {
  const [state, setState] = useState({ status: 'loading', list: [], error: '' });
  const [tab, setTab] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading' }));
    reservationsApi
      .mine()
      .then((list) => !cancelled && setState({ status: 'ready', list, error: '' }))
      .catch((e) => !cancelled && setState({ status: 'error', list: [], error: e.message }));
    return () => { cancelled = true; };
  }, [attempt]);

  const groups = useMemo(() => groupBookings(state.list), [state.list]);
  // Open on the most useful tab: upcoming if there is one, otherwise past, otherwise cancelled.
  const active = tab ?? (groups.upcoming.length ? 'upcoming' : groups.past.length ? 'past' : groups.cancelled.length ? 'cancelled' : 'upcoming');
  const shown = groups[active];

  return (
    <section className="section">
      <div className="container my-bookings">
        <h1>My bookings</h1>

        {state.status === 'error' ? (
          <div className="alert alert--error" role="alert">
            <p>{state.error}</p>
            <button type="button" className="link-quiet" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
          </div>
        ) : (
          <>
            <div className="segmented" role="group" aria-label="Show bookings">
              {TABS.map(([key, label]) => (
                <button key={key} type="button" aria-pressed={active === key} onClick={() => setTab(key)}>
                  {label} <span className="segmented__count">{state.status === 'ready' ? groups[key].length : '–'}</span>
                </button>
              ))}
            </div>

            {state.status === 'loading' && <p className="muted" role="status">Loading your bookings…</p>}

            {state.status === 'ready' && shown.length === 0 && (
              <div className="empty">
                <h3>{EMPTY[active][0]}</h3>
                <p className="muted">{EMPTY[active][1]}</p>
                {active === 'upcoming' && <Link to="/rooms" className="btn btn--dark btn--small">Find a room</Link>}
              </div>
            )}

            <div className="booking-list" aria-live="polite">
              {shown.map((b) => <BookingRow key={b.id} booking={b} />)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
