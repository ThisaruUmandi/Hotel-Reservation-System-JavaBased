import Photo from '../components/Photo';
import TextField from '../components/TextField';

const swatches = [
  ['Sand 50', 'var(--sand-50)'], ['Sand 100', 'var(--sand-100)'], ['Sand 200', 'var(--sand-200)'], ['Sand 300', 'var(--sand-300)'],
  ['Clay', 'var(--clay)'], ['Clay dark', 'var(--clay-dark)'], ['Moss', 'var(--moss)'], ['Ink', 'var(--ink)'],
];

// Reference page for the design system. Visit /styleguide. It can be removed before launch.
export default function StyleGuide() {
  return (
    <div className="container">
      <section className="section">
        <span className="eyebrow">Design system</span>
        <h1>Warm, <em>unhurried</em> and a little bit handmade</h1>
        <p className="lead" style={{ marginTop: 'var(--space-4)' }}>
          Fraunces for headlines, Figtree for everything you read. A sand, clay and moss palette,
          thin borders instead of heavy shadows, and generous space.
        </p>
      </section>

      <section style={{ paddingBottom: 'var(--space-7)' }}>
        <h3>Colour</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
          {swatches.map(([name, value]) => (
            <div key={name}>
              <div style={{ background: value, height: 72, borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }} />
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ paddingBottom: 'var(--space-7)' }}>
        <h3>Type</h3>
        <div className="card card--pad" style={{ marginTop: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)' }}>
          <h2>Discover the coast with <em>ease</em></h2>
          <h3>Suites with a view of the lagoon</h3>
          <h4>Deluxe room, garden side</h4>
          <p className="lead">Plan, book and settle in. Every room is quiet, cool and a short walk from the water.</p>
          <p className="muted small">Small supporting text, used for hints, dates and fine print.</p>
        </div>
      </section>

      <section style={{ paddingBottom: 'var(--space-7)' }}>
        <h3>Buttons and badges</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center', marginTop: 'var(--space-5)' }}>
          <button className="btn btn--primary">Book this room</button>
          <button className="btn btn--dark">Check availability</button>
          <button className="btn btn--ghost">View details</button>
          <button className="btn btn--primary" disabled>Unavailable</button>
          <button className="link-quiet">Cancel booking</button>
          <span className="badge badge--confirmed">Confirmed</span>
          <span className="badge badge--cancelled">Cancelled</span>
          <span className="badge">Pending</span>
        </div>
      </section>

      <section style={{ paddingBottom: 'var(--space-7)' }}>
        <h3>Form fields</h3>
        <div className="card card--pad" style={{ marginTop: 'var(--space-5)', display: 'grid', gap: 'var(--space-5)', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <TextField label="Full name" placeholder="Your name" hint="As it appears on your ID" />
          <TextField label="Email" type="email" defaultValue="not-an-email" error="Enter a valid email" />
          <TextField label="Guests" as="select" defaultValue="2">
            <option value="1">1 guest</option>
            <option value="2">2 guests</option>
            <option value="3">3 guests</option>
          </TextField>
          <TextField label="Check-in" type="date" />
        </div>
        <p className="alert alert--error" style={{ marginTop: 'var(--space-5)' }}>That room is not available for those dates.</p>
        <p className="alert alert--success" style={{ marginTop: 'var(--space-3)' }}>Your reservation is confirmed.</p>
      </section>

      <section>
        <h3>Photo frames</h3>
        <p className="muted small" style={{ marginTop: 'var(--space-2)' }}>
          The striped frames below are placeholders. They turn into real photos as images are added.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
          <Photo alt="Poolside at golden hour" ratio="4 / 3" label="Wide 4:3" />
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <Photo alt="Room detail" ratio="1 / 1" label="Square" />
            <Photo alt="Breakfast table" ratio="3 / 2" label="3:2" />
          </div>
        </div>
      </section>
    </div>
  );
}
