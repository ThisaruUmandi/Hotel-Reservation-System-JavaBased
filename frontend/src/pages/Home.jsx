import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import Hero from '../components/home/Hero';
import Photo from '../components/Photo';
import RoomCard from '../components/RoomCard';
import Stars from '../components/Stars';
import { site } from '../config/site';
import { formatPrice, onePerType, typeLabel } from '../lib/rooms';

const PROMISES = [
  ['Honest prices', 'The rate you see is the rate you pay for your stay. No fees appear at the last step.'],
  ['Change of plans', 'Cancel any time before check-in and a card payment is refunded in full.'],
  ['Book in a minute', 'Pick dates, pick a room, confirm. Your booking is saved the moment you finish.'],
  ['Pay your way', 'Settle by card when you book, or with the team at the front desk when you arrive.'],
];

export default function Home() {
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    roomsApi
      .list()
      .then(async (list) => {
        setRooms(list);
        // Show real guest comments only. If nobody has reviewed yet, the section is simply not shown.
        const perRoom = await Promise.all(
          onePerType(list).map((r) =>
            roomsApi.reviews(r.id).then((res) => res.reviews.map((rev) => ({ ...rev, room: typeLabel(r.type.name) }))).catch(() => []),
          ),
        );
        setReviews(
          perRoom.flat().filter((r) => r.comment?.trim()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
        );
      })
      .catch((e) => setError(e.message));
  }, []);

  const featured = useMemo(() => (rooms ? onePerType(rooms).slice(0, 3) : []), [rooms]);
  const types = useMemo(() => [...new Set((rooms ?? []).map((r) => r.type.name))], [rooms]);
  const maxGuests = useMemo(() => Math.max(2, ...(rooms ?? []).map((r) => r.type.capacity)), [rooms]);
  const lowest = useMemo(() => (rooms?.length ? Math.min(...rooms.map((r) => r.pricePerNight)) : null), [rooms]);

  return (
    <>
      <Hero types={types} maxGuests={maxGuests} />

      <section className="section" aria-labelledby="welcome-title">
        <div className="container welcome">
          <Photo className="welcome__photo" src="/images/about/story.jpg" alt={`A quiet corner of ${site.name}`} ratio="4 / 5" label="Portrait" />
          <div className="welcome__text">
            <span className="eyebrow">Welcome</span>
            <h2 id="welcome-title" className="welcome__statement">
              A stay should feel like coming home to somewhere <em>better</em>. Quiet rooms, honest prices and nothing between you and a good night&rsquo;s sleep.
            </h2>
            {rooms && (
              <dl className="stats">
                <div><dt>Rooms and suites</dt><dd>{rooms.length}</dd></div>
                <div><dt>Guests in our largest room</dt><dd>{maxGuests}</dd></div>
                {lowest !== null && <div><dt>Lowest nightly rate</dt><dd>{formatPrice(lowest)}</dd></div>}
                <div><dt>Cancellation before check-in</dt><dd>Free</dd></div>
              </dl>
            )}
          </div>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="rooms-title">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Where you will sleep</span>
              <h2 id="rooms-title">Rooms made for <em>resting</em></h2>
            </div>
            <Link to="/rooms" className="btn btn--ghost">See all rooms</Link>
          </div>
          {error && <p className="alert alert--error" role="alert">{error}</p>}
          {!error && !rooms && <p className="muted">Loading rooms…</p>}
          {featured.length > 0 && (
            <div className="rooms-grid">
              {featured.map((room, i) => <RoomCard key={room.id} room={room} variant={i === 0 ? 'feature' : 'compact'} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="promise-title">
        <div className="container promise">
          <div>
            <span className="eyebrow">Why book with us</span>
            <h2 id="promise-title">Simple, <em>from start to finish</em></h2>
            <p className="lead" style={{ marginTop: 'var(--space-4)' }}>
              We would rather you spend your energy on the trip than on the booking.
            </p>
          </div>
          <ol className="promise__list">
            {PROMISES.map(([title, text], i) => (
              <li key={title}>
                <span className="promise__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="section section--tint" aria-labelledby="reviews-title">
          <div className="container">
            <span className="eyebrow">Guest notes</span>
            <h2 id="reviews-title">In their <em>own words</em></h2>
            <div className="reviews">
              {reviews.map((r) => (
                <figure key={r.id} className="review">
                  <Stars value={r.rating} />
                  <blockquote>{r.comment}</blockquote>
                  <figcaption><strong>{r.guestName}</strong><span>{r.room}</span></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cta" aria-labelledby="cta-title">
        <CtaImage />
        <div className="container cta__inner">
          <h2 id="cta-title">Ready when <em>you</em> are</h2>
          <p className="lead">Pick your dates and a room, and we will keep it for you.</p>
          <Link to="/rooms" className="btn btn--primary">Book a stay</Link>
        </div>
      </section>
    </>
  );
}

function CtaImage() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img className="cta__image" src="/images/about/cta.jpg" alt="" loading="lazy" onError={() => setFailed(true)} />;
}
