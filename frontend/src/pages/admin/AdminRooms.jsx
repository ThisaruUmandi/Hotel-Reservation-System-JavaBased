import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { roomsApi } from '../../api/rooms';
import { useAuth } from '../../auth/AuthContext';
import { formatPrice, typeLabel } from '../../lib/rooms';

function RoomRow({ room, isAdmin, onChanged }) {
  const [price, setPrice] = useState(String(room.pricePerNight));
  const [confirmClose, setConfirmClose] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => setPrice(String(room.pricePerNight)), [room.pricePerNight]);
  const open = room.status === 'AVAILABLE';
  const priceNumber = Number(price);
  const priceChanged = price !== '' && priceNumber !== room.pricePerNight;
  const priceValid = Number.isFinite(priceNumber) && priceNumber > 0 && priceNumber <= 10_000_000;

  async function apply(changes, message) {
    setBusy(true); setError(''); setSaved('');
    try {
      onChanged(await adminApi.updateRoom(room.id, changes));
      setSaved(message);
      setConfirmClose(false);
    } catch (e) {
      setError(e.fieldErrors?.pricePerNight ?? e.message);
    }
    setBusy(false);
  }

  return (
    <tr>
      <td><strong>Room {room.roomNumber}</strong><div className="muted small">Floor {room.floor}</div></td>
      <td>{typeLabel(room.type.name)}<div className="muted small">Sleeps {room.type.capacity}</div></td>
      <td>
        {isAdmin ? (
          <div className="price-edit">
            <input className="input" type="number" inputMode="numeric" min="1" step="500" value={price}
              aria-label={`Price per night for room ${room.roomNumber}, in rupees`}
              aria-invalid={priceChanged && !priceValid ? 'true' : undefined} onChange={(e) => { setPrice(e.target.value); setSaved(''); }} />
            <button type="button" className="btn btn--ghost btn--small" disabled={busy || !priceChanged || !priceValid}
              onClick={() => apply({ pricePerNight: priceNumber }, 'Price saved.')}>Save</button>
          </div>
        ) : formatPrice(room.pricePerNight)}
        {isAdmin && <div className="muted small">per night, LKR</div>}
        {saved && <div className="small" role="status" style={{ color: 'var(--moss-dark)' }}>{saved}</div>}
        {error && <div className="field__error" role="alert">{error}</div>}
      </td>
      <td><span className={`badge${open ? ' badge--confirmed' : ' badge--cancelled'}`}>{open ? 'Open' : 'Closed'}</span></td>
      <td className="table__actions">
        {confirmClose ? (
          <div className="rowconfirm" role="alertdialog" aria-label="Confirm closing the room">
            <p className="small">Close for maintenance? Existing bookings are not cancelled.</p>
            <div className="rowconfirm__buttons">
              <button type="button" className="btn btn--dark btn--small" disabled={busy} onClick={() => apply({ status: 'MAINTENANCE' }, 'Room closed.')}>Close room</button>
              <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={() => setConfirmClose(false)}>Keep open</button>
            </div>
          </div>
        ) : open ? (
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setConfirmClose(true)}>Close for maintenance</button>
        ) : (
          <button type="button" className="btn btn--dark btn--small" disabled={busy} onClick={() => apply({ status: 'AVAILABLE' }, 'Room reopened.')}>Reopen</button>
        )}
      </td>
    </tr>
  );
}

export default function AdminRooms() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading', rooms: [], error: '' });

  useEffect(() => {
    roomsApi.list()
      .then((rooms) => setState({ status: 'ready', rooms: rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)), error: '' }))
      .catch((e) => setState({ status: 'error', rooms: [], error: e.message }));
  }, []);

  const replace = (updated) => setState((s) => ({ ...s, rooms: s.rooms.map((r) => (r.id === updated.id ? updated : r)) }));

  if (state.status === 'error') return <p className="alert alert--error" role="alert">{state.error}</p>;
  if (state.status === 'loading') return <p className="muted" role="status">Loading rooms…</p>;

  const isAdmin = user.role === 'ADMIN';
  return (
    <div className="admin__page">
      <p className="muted">
        {isAdmin ? 'Change a nightly rate or close a room for maintenance.' : 'Close a room for maintenance or reopen it. Only administrators can change prices.'}
        {' '}Bookings already made keep the price they were booked at.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Room</th><th>Type</th><th>Price</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>{state.rooms.map((r) => <RoomRow key={r.id} room={r} isAdmin={isAdmin} onChanged={replace} />)}</tbody>
        </table>
      </div>
    </div>
  );
}
