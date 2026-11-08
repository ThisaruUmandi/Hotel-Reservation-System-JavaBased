import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <h1>Page not found</h1>
        <p className="lead" style={{ marginTop: 'var(--space-4)' }}>The page you were looking for does not exist or has moved.</p>
        <Link to="/" className="btn btn--dark" style={{ marginTop: 'var(--space-6)' }}>Back to the home page</Link>
      </div>
    </section>
  );
}
