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
          <span className="eyebrow hero__eyebrow">{site.name}</span>
          <h1 id="hero-title">A quiet place <em>by the water</em></h1>
          <p className="lead hero__lead">
            Unhurried mornings, cool rooms and a table set for you. Choose your dates and we will show you what is free.
          </p>
        </div>
        <SearchCard types={types} maxGuests={maxGuests} />
      </div>
    </section>
  );
}
