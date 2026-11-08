import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import Hero from '../components/home/Hero';
import Photo from '../components/Photo';
import RoomCard from '../components/RoomCard';
import Stars from '../components/Stars';
import { site } from '../config/site';
import { onePerType, typeLabel } from '../lib/rooms';

export default function Home() {
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    roomsApi
      .list()
      .then(async (list) => {
        setRooms(list);
        // Real guest comments only. If nobody has reviewed yet, the section is simply not shown.
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

  return (
    <>
      <Hero types={types} maxGuests={maxGuests} />

      <section className="section" aria-labelledby="about-title">
        <div className="container about">
          <div className="about__text">
            <h2 id="about-title">About {site.name}</h2>
            <p>
              {site.name} is a small hotel by the water. You can book a room straight from this site: pick your dates,
              choose a room, and pay by card or at the front desk when you arrive.
            </p>
            <p>The price you see is the price you pay for the stay. If your plans change, you can cancel for free until the day before you arrive.</p>
          </div>
          <Photo src="/images/about/story.jpg" alt={`The beach near ${site.name}`} ratio="4 / 3" label="Photo" />
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="rooms-title">
        <div className="container">
          <div className="section-head">
            <h2 id="rooms-title">Our rooms</h2>
            <Link to="/rooms" className="text-link">See all rooms</Link>
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

      {reviews.length > 0 && (
        <section className="section" aria-labelledby="reviews-title">
          <div className="container">
            <h2 id="reviews-title">What guests say</h2>
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

      <section className={`section${reviews.length > 0 ? ' section--tint' : ''}`} aria-labelledby="facts-title">
        <div className="container">
          <h2 id="facts-title" style={{ marginBottom: 'var(--space-5)' }}>Good to know</h2>
          <dl className="facts">
            {site.facts.map(([label, text]) => (
              <div key={label}><dt>{label}</dt><dd>{text}</dd></div>
            ))}
            <div><dt>Find us</dt><dd>{site.contact.address} · {site.contact.phone} · {site.contact.email}</dd></div>
          </dl>
        </div>
      </section>
    </>
  );
}
