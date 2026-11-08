import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, todayISO } from '../../lib/dates';
import { typeLabel } from '../../lib/rooms';
import TextField from '../TextField';

/** The booking search on the hero. Sends the guest to the rooms page with their choices in the URL. */
export default function SearchCard({ types = [], maxGuests = 4 }) {
  const navigate = useNavigate();
  const today = todayISO();
  const [form, setForm] = useState({ checkIn: addDays(today, 1), checkOut: addDays(today, 3), guests: '2', type: '' });
  const [errors, setErrors] = useState({});

  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  function validate() {
    const found = {};
    if (!form.checkIn) found.checkIn = 'Choose a check-in date';
    else if (form.checkIn < today) found.checkIn = 'Check-in cannot be in the past';
    if (!form.checkOut) found.checkOut = 'Choose a check-out date';
    else if (form.checkIn && form.checkOut <= form.checkIn) found.checkOut = 'Check-out must be after check-in';
    return found;
  }

  function submit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    const params = new URLSearchParams({ checkIn: form.checkIn, checkOut: form.checkOut, guests: form.guests });
    if (form.type) params.set('type', form.type);
    navigate(`/rooms?${params}`);
  }

  return (
    <form className="search-card" onSubmit={submit} noValidate aria-labelledby="search-title">
      <h2 id="search-title" className="search-card__title">Find your room</h2>
      <div className="search-card__grid">
        <TextField label="Check-in" type="date" min={today} value={form.checkIn} onChange={set('checkIn')} error={errors.checkIn} />
        <TextField label="Check-out" type="date" min={form.checkIn || today} value={form.checkOut} onChange={set('checkOut')} error={errors.checkOut} />
        <TextField label="Guests" as="select" value={form.guests} onChange={set('guests')}>
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
          ))}
        </TextField>
        <TextField label="Room type" as="select" value={form.type} onChange={set('type')}>
          <option value="">Any room</option>
          {types.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
        </TextField>
      </div>
      <button type="submit" className="btn btn--dark btn--block">Search availability</button>
    </form>
  );
}
