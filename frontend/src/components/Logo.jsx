import { site } from '../config/site';

/** A lotus flower on the water: the hotel's mark. */
export function LogoMark(props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 5c3.6 4.2 3.6 14.6 0 21-3.6-6.4-3.6-16.8 0-21z" />
      <path d="M16 26c-6.2-1.7-8.6-8.6-7.6-14.2 4.2 1.7 7.2 8 7.6 14.2z" />
      <path d="M16 26c6.2-1.7 8.6-8.6 7.6-14.2-4.2 1.7-7.2 8-7.6 14.2z" />
      <path d="M16 26C8.5 26 3.4 22 2.6 16.6c5 .1 10.8 3.6 13.4 9.4z" />
      <path d="M16 26c7.5 0 12.6-4 13.4-9.4-5 .1-10.8 3.6-13.4 9.4z" />
      <path d="M9 29.4h14" />
    </svg>
  );
}

export default function Logo() {
  return (
    <>
      <LogoMark className="brand__mark" />
      <span className="brand__name">{site.name}</span>
    </>
  );
}
