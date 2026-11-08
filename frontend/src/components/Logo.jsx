import { site } from '../config/site';

/** An arched doorway with a low sun: the hotel's mark. */
export function LogoMark(props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path d="M5 28V15a11 11 0 0 1 22 0v13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="17" r="3.4" fill="currentColor" />
      <path d="M3 28h26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
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
