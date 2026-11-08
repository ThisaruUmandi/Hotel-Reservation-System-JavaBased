import { useEffect, useState } from 'react';
import { roomsApi } from '../api/rooms';

// Temporary page that proves the frontend can reach the API. It is replaced by the real home page.
export default function Home() {
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    roomsApi.list().then(setRooms).catch((e) => setError(e.message));
  }, []);

  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">Rooms</span>
        <h1>Stay a while</h1>
        {error && <p className="alert alert--error" role="alert" style={{ marginTop: 'var(--space-5)' }}>{error}</p>}
        {!error && !rooms && <p className="muted" style={{ marginTop: 'var(--space-5)' }}>Loading rooms…</p>}
        {rooms && (
          <ul style={{ marginTop: 'var(--space-5)', paddingLeft: '1.2rem' }}>
            {rooms.map((room) => (
              <li key={room.id}>Room {room.roomNumber} · {room.type.name} · ${room.pricePerNight} per night</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
