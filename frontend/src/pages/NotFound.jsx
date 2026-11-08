import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">Page not found</span>
        <h1>This path <em>leads nowhere</em></h1>
        <p className="lead" style={{ marginTop: 'var(--space-4)' }}>
          The page you were looking for has moved or does not exist yet.
        </p>
        <Link to="/" className="btn btn--dark" style={{ marginTop: 'var(--space-6)' }}>Back to the home page</Link>
      </div>
    </section>
  );
}
