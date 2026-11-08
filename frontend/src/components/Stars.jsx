export default function Stars({ value, size = 16 }) {
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className={n <= value ? 'is-on' : ''}>
          <path d="M10 1.8l2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L10 14l-5 2.9 1.2-5.5L2 7.6l5.6-.6z" />
        </svg>
      ))}
    </span>
  );
}
