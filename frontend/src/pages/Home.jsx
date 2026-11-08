import { useEffect, useState } from 'react';
import { roomsApi } from '../api/rooms';

// Temporary page that proves the frontend can reach the API. It is replaced by the real home page.
export default function Home() {
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    roomsApi.list().then(setRooms).catch((e) => setError(e.message));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!rooms) return <p>Loading rooms…</p>;
  return (
    <ul>
      {rooms.map((room) => (
        <li key={room.id}>
          Room {room.roomNumber} · {room.type.name} · ${room.pricePerNight} per night
        </li>
      ))}
    </ul>
  );
}
