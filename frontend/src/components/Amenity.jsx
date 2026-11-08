// Simple line icons, one per kind of amenity. Unknown amenities get a tick.
const ICONS = [
  [/wi-?fi/i, 'M2 9a15 15 0 0 1 20 0M5 12.5a10.5 10.5 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0M12 19.6h.01'],
  [/air|a\/c|cool/i, 'M12 2v20M4.9 7l14.2 10M19.1 7 4.9 17M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5'],
  [/balcon|terrace|patio/i, 'M5 21V4h14v17M5 12h14M12 4v8M3 21h18'],
  [/bath|tub/i, 'M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 2-2h1M7 19l-1 2M17 19l1 2'],
  [/living|sofa|lounge/i, 'M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2'],
  [/mini ?bar|drinks/i, 'M8 3h8l-.5 6a3.5 3.5 0 0 1-7 0L8 3zM12 12.5V20M8.5 20h7'],
  [/desk|work/i, 'M3 8h18M5 8v12M19 8v12M9 8v6h6V8'],
];
const TICK = 'M5 12.5l4.5 4.5L19 7';

export default function Amenity({ name }) {
  const path = (ICONS.find(([pattern]) => pattern.test(name)) ?? [null, TICK])[1];
  return (
    <svg className="amenity-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
