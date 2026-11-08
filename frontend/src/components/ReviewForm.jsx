import { useState } from 'react';
import { reviewsApi } from '../api/reviews';
import RatingInput from './RatingInput';
import TextField from './TextField';

const MAX = 1000;

export default function ReviewForm({ reservationId, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const found = {};
    if (!rating) found.rating = 'Choose a rating from 1 to 5 stars';
    if (comment.length > MAX) found.comment = `Keep it under ${MAX} characters`;
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await reviewsApi.add({ reservationId, rating, comment: comment.trim() || null });
      onDone();
    } catch (e) {
      if (Object.keys(e.fieldErrors).length) setErrors(e.fieldErrors);
      else setFormError(e.message);
      setBusy(false);
    }
  }

  return (
    <form className="review-form" onSubmit={submit} noValidate aria-labelledby="review-title">
      <h2 id="review-title">How was your stay?</h2>
      <p className="muted">Your review appears on the room page with your first name and last initial.</p>
      {formError && <p className="alert alert--error" role="alert">{formError}</p>}
      <RatingInput value={rating} onChange={(n) => { setRating(n); setErrors((e) => ({ ...e, rating: undefined })); }} error={errors.rating} />
      <TextField
        label="Your comments (optional)" as="textarea" rows={4} value={comment} error={errors.comment}
        hint={`${comment.length} / ${MAX}`}
        onChange={(e) => { setComment(e.target.value); setErrors((x) => ({ ...x, comment: undefined })); }}
      />
      <button type="submit" className="btn btn--dark" disabled={busy}>{busy ? 'Sending…' : 'Post review'}</button>
    </form>
  );
}
