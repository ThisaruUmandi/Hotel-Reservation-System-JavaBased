import { useEffect, useState } from 'react';

/** A photo with a fixed shape. Shows a neutral placeholder if the image is missing, so layouts never break. */
export default function Photo({ src, alt, ratio = '3 / 2', label = 'Photo', className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div className={`photo ${className}`.trim()} style={{ aspectRatio: ratio }} {...rest}>
      {src && !failed ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="photo__empty" role="img" aria-label={alt}>{label}</span>
      )}
    </div>
  );
}
