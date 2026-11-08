import { Component } from 'react';

/** Catches a crash in one page so the header and footer stay, and offers a way back. */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch(error) { console.error('Page crashed:', error); } // eslint-disable-line no-console

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="section">
        <div className="container">
          <h1>Something went wrong</h1>
          <p className="lead" style={{ marginTop: 'var(--space-4)' }}>This page ran into a problem. Your bookings are safe. Try again, or go back to the home page.</p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--dark" onClick={() => window.location.reload()}>Reload the page</button>
            <a href="/" className="btn btn--ghost">Back to the home page</a>
          </div>
        </div>
      </section>
    );
  }
}
