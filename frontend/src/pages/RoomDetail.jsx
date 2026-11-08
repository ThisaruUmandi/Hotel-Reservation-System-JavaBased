import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import Amenity from '../components/Amenity';
import BookingPanel from '../components/BookingPanel';
import Photo from '../components/Photo';
import ReviewList from '../components/ReviewList';
import Stars from '../components/Stars';
import { site } from '../config/site';
import { roomGallery, typeLabel } from '../lib/rooms';
import { parseSearch, toQuery } from '../lib/search';

export default function RoomDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const search = useMemo(() => parseSearch(params), [params]);
  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRoom(null); setReviews(null); setError(null);
    roomsApi.get(id).then((r) => !cancelled && setRoom(r)).catch((e) => !cancelled && setError(e));
    // Reviews are a bonus: if they fail to load the room page still works.
    roomsApi.reviews(id).then((r) => !cancelled && setReviews(r)).catch(() => !cancelled && setReviews({ averageRating: 0, count: 0, reviews: [] }));
    return () => { cancelled = true; };
  }, [id]);

  const onSearchChange = useCallback((next) => setParams(toQuery(next), { replace: true }), [setParams]);
  const backTo = `/rooms${params.toString() ? `?${params}` : ''}`;

  if (error) {
    const missing = error.status === 404;
    return (
      <section className="section">
        <div className="container">
          <h1>{missing ? 'Room not found' : 'This page did not load'}</h1>
          <p className="lead" style={{ marginTop: 'var(--space-4)' }}>{missing ? 'It may have been removed.' : error.message}</p>
          <Link to="/rooms" className="btn btn--dark" style={{ marginTop: 'var(--space-6)' }}>See all rooms</Link>
        </div>
      </section>
    );
  }
  if (!room) return <section className="section"><div className="container"><p className="muted" role="status">Loading room…</p></div></section>;

  const label = typeLabel(room.type.name);
  const photos = roomGallery(room);

  return (
    <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
      <div className="container">
        <Link to={backTo} className="back-link">← All rooms</Link>

        <header className="room-head">
          <div>
            <span className="eyebrow">Room {room.roomNumber} · Floor {room.floor}</span>
            <h1>{label}</h1>
          </div>
          {reviews?.count > 0 && (
            <a href="#reviews" className="room-head__rating">
              <Stars value={Math.round(reviews.averageRating)} /> <strong>{reviews.averageRating.toFixed(1)}</strong>
              <span className="muted"> ({reviews.count})</span>
            </a>
          )}
        </header>

        <div className={`gallery${photos.length === 1 ? ' gallery--single' : ''}`}>
          <Photo className="gallery__main" src={photos[0]} alt={`${label} at ${site.name}`} ratio="3 / 2" label={label} />
          {photos[1] && <Photo className="gallery__side" src={photos[1]} alt={`Another view of the ${label.toLowerCase()}`} ratio="auto" label="Another view" />}
        </div>

        <div className="room-layout">
          <div className="room-layout__main">
            <h2 className="room-layout__lead">{room.type.description}</h2>
            <p className="muted">Sleeps up to {room.type.capacity} {room.type.capacity === 1 ? 'guest' : 'guests'}.</p>

            <h3 className="room-layout__h">What is included</h3>
            <ul className="amenity-list">
              {room.type.amenities.map((a) => <li key={a}><Amenity name={a} />{a}</li>)}
            </ul>

            <h3 className="room-layout__h" id="reviews">Guest reviews</h3>
            <ReviewList data={reviews} />
          </div>
          <BookingPanel key={room.id} room={room} search={search} onSearchChange={onSearchChange} />
        </div>
      </div>
    </section>
  );
}
