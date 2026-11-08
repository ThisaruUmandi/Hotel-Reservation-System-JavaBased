import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import SearchCard from '../components/home/SearchCard';
import RoomCard from '../components/RoomCard';
import { formatDay } from '../lib/dates';
import { typeLabel } from '../lib/rooms';
import { parseSearch, toQuery } from '../lib/search';
import { usePageTitle } from '../lib/usePageTitle';

const SORTS = {
  'price-asc': ['Price: low to high', (a, b) => a.pricePerNight - b.pricePerNight],
  'price-desc': ['Price: high to low', (a, b) => b.pricePerNight - a.pricePerNight],
  size: ['Largest first', (a, b) => b.type.capacity - a.type.capacity],
};

export default function Rooms() {
  usePageTitle('Rooms');
  const [params, setParams] = useSearchParams();
  const search = useMemo(() => parseSearch(params), [params]);
  const [data, setData] = useState({ status: 'loading', all: [], available: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [sort, setSort] = useState('price-asc');
  const [picked, setPicked] = useState([]);

  // Load every room (for the filters) and, when the dates are valid, which of them are free.
  useEffect(() => {
    let cancelled = false;
    setData((d) => ({ ...d, status: 'loading' }));
    Promise.all([
      roomsApi.list(),
      search.valid
        ? roomsApi.available({ checkIn: search.checkIn, checkOut: search.checkOut, guests: search.guests, type: search.type })
        : Promise.resolve(null),
    ])
      .then(([all, available]) => !cancelled && setData({ status: 'ready', all, available, error: '' }))
      .catch((e) => !cancelled && setData({ status: 'error', all: [], available: null, error: e.message }));
    return () => { cancelled = true; };
  }, [search.valid, search.checkIn, search.checkOut, search.guests, search.type, attempt]);

  const types = useMemo(() => [...new Set(data.all.map((r) => r.type.name))], [data.all]);
  const maxGuests = useMemo(() => Math.max(2, ...data.all.map((r) => r.type.capacity)), [data.all]);

  // Without dates we are browsing: filter by guests and type here. With dates, the server already did.
  const candidates = useMemo(() => {
    if (search.valid) return data.available ?? [];
    return data.all.filter(
      (r) => r.type.capacity >= search.guests && (!search.type || r.type.name.toLowerCase() === search.type.toLowerCase()),
    );
  }, [search, data]);

  const amenityOptions = useMemo(() => [...new Set(candidates.flatMap((r) => r.type.amenities))].sort(), [candidates]);
  const visible = useMemo(
    () => candidates.filter((r) => picked.every((a) => r.type.amenities.includes(a))).sort(SORTS[sort][1]),
    [candidates, picked, sort],
  );

  const toggle = (amenity) => setPicked((p) => (p.includes(amenity) ? p.filter((a) => a !== amenity) : [...p, amenity]));
  const refine = (next) => { setPicked([]); setParams(toQuery(next)); };

  const guestsText = `${search.guests} ${search.guests === 1 ? 'guest' : 'guests'}`;
  const summary = search.valid
    ? `${formatDay(search.checkIn)} to ${formatDay(search.checkOut)} · ${search.nights} ${search.nights === 1 ? 'night' : 'nights'} · ${guestsText}`
    : 'Choose your dates to see what is free and the total price.';

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Rooms</h1>
          <SearchCard
            key={params.toString()}
            variant="bar"
            title="Refine your stay"
            submitLabel="Update"
            types={types}
            maxGuests={maxGuests}
            initial={search}
            onSearch={refine}
          />
        </div>
      </section>

      <section className="section results-section">
        <div className="container">
          {search.error && <p className="alert alert--error" role="alert" style={{ marginBottom: 'var(--space-5)' }}>{search.error}</p>}
          {data.status === 'error' ? (
            <div className="alert alert--error" role="alert">
              <p>{data.error}</p>
              <button type="button" className="link-quiet" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
            </div>
          ) : (
            <>
              <div className="results-bar">
                <div aria-live="polite">
                  <h2 className="results-bar__count">
                    {data.status === 'loading' ? 'Loading rooms…' : `${visible.length} ${visible.length === 1 ? 'room' : 'rooms'} ${search.valid ? 'available' : ''}`.trim()}
                  </h2>
                  <p className="muted small">{summary}</p>
                </div>
                <label className="results-bar__sort">
                  <span className="small muted">Sort</span>
                  <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
                    {Object.entries(SORTS).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
              </div>

              {amenityOptions.length > 1 && (
                <div className="chips" role="group" aria-label="Filter by feature">
                  {amenityOptions.map((a) => (
                    <button key={a} type="button" className="chip" aria-pressed={picked.includes(a)} onClick={() => toggle(a)}>{a}</button>
                  ))}
                  {picked.length > 0 && <button type="button" className="link-quiet" onClick={() => setPicked([])}>Clear</button>}
                </div>
              )}

              {data.status === 'ready' && visible.length === 0 && (
                <div className="empty">
                  <h3>{search.valid ? 'Nothing free for those dates' : 'No rooms match'}</h3>
                  <p className="muted">
                    {picked.length > 0
                      ? 'Try removing a filter.'
                      : search.valid
                        ? 'Try different dates, fewer guests, or any room type.'
                        : 'Try fewer guests or a different room type.'}
                  </p>
                  {picked.length > 0 && <button type="button" className="btn btn--ghost btn--small" onClick={() => setPicked([])}>Clear filters</button>}
                </div>
              )}

              <div className="results">
                {visible.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    variant="row"
                    nights={search.nights}
                    query={search.valid ? toQuery({ checkIn: search.checkIn, checkOut: search.checkOut, guests: search.guests }) : ''}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
