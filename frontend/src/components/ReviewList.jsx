import Stars from './Stars';

const dateFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

export default function ReviewList({ data }) {
  if (!data) return <p className="muted">Loading reviews…</p>;
  if (data.count === 0) return <p className="muted">No reviews yet. Guests can review a room once their stay is over.</p>;
  return (
    <>
      <p className="reviews-summary">
        <strong>{data.averageRating.toFixed(1)}</strong>
        <Stars value={Math.round(data.averageRating)} />
        <span className="muted">{data.count} {data.count === 1 ? 'review' : 'reviews'}</span>
      </p>
      <ul className="review-list">
        {data.reviews.map((r) => (
          <li key={r.id}>
            <Stars value={r.rating} size={14} />
            {r.comment && <p className="review-list__text">{r.comment}</p>}
            <p className="muted small">{r.guestName} · {dateFormat.format(new Date(r.createdAt))}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
