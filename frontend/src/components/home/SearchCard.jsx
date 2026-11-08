import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, todayISO } from '../../lib/dates';
import { typeLabel } from '../../lib/rooms';
import { toQuery } from '../../lib/search';
import TextField from '../TextField';

/**
 * The stay search form. On the home page it sends the guest to /rooms; on the rooms page it is
 * given onSearch so it refines the results in place. variant "bar" is the wide, flat version.
 */
export default function SearchCard({
  types = [], maxGuests = 4, initial, onSearch, variant = 'card',
  title = 'Find your room', submitLabel = 'Search availability',
}) {
  const navigate = useNavigate();
  const titleId = useId();
  const today = todayISO();
  const [form, setForm] = useState({
    checkIn: initial?.checkIn || addDays(today, 1),
    checkOut: initial?.checkOut || addDays(today, 3),
    guests: String(Math.min(initial?.guests ?? 2, maxGuests)),
    type: initial?.type ?? '',
  });
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
    const search = { checkIn: form.checkIn, checkOut: form.checkOut, guests: form.guests, type: form.type };
    if (onSearch) onSearch(search);
    else navigate(`/rooms?${toQuery(search)}`);
  }

  return (
    <form className={`search-card search-card--${variant}`} onSubmit={submit} noValidate aria-labelledby={titleId}>
      <h2 id={titleId} className={variant === 'bar' ? 'visually-hidden' : 'search-card__title'}>{title}</h2>
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
      <button type="submit" className="btn btn--dark btn--block">{submitLabel}</button>
    </form>
  );
}
