import { useState } from 'react';

/** Five clickable stars built from real radio buttons, so it works with the keyboard and screen readers. */
export default function RatingInput({ value, onChange, error }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className="rating" onMouseLeave={() => setHover(0)} aria-describedby={error ? 'rating-error' : undefined}>
      <legend className="field__label">Your rating</legend>
      <div className="rating__stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= shown ? 'is-on' : ''} onMouseEnter={() => setHover(n)}>
            <input type="radio" name="rating" value={n} checked={value === n} onChange={() => onChange(n)} className="visually-hidden" />
            <svg viewBox="0 0 20 20" width="32" height="32" aria-hidden="true">
              <path d="M10 1.8l2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L10 14l-5 2.9 1.2-5.5L2 7.6l5.6-.6z" />
            </svg>
            <span className="visually-hidden">{n} {n === 1 ? 'star' : 'stars'}</span>
          </label>
        ))}
      </div>
      {error && <span id="rating-error" className="field__error">{error}</span>}
    </fieldset>
  );
}
