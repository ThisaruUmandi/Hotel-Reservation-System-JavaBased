import { useState } from 'react';
import { site } from '../../config/site';
import SearchCard from './SearchCard';

export default function Hero({ types, maxGuests }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <section className="hero" aria-labelledby="hero-title">
      {!imageFailed && (
        <img className="hero__image" src="/images/hero/hero.jpg" alt="" fetchPriority="high" onError={() => setImageFailed(true)} />
      )}
      <div className="container hero__inner">
        <div className="hero__copy">
          <h1 id="hero-title">{site.tagline}</h1>
          <p className="lead hero__lead">Choose your dates to see which rooms are free and what they cost.</p>
        </div>
        <SearchCard variant="bar" title="Check availability" submitLabel="Check availability" types={types} maxGuests={maxGuests} />
      </div>
    </section>
  );
}
