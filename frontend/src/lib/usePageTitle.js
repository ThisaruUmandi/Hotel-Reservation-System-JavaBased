import { useEffect } from 'react';
import { site } from '../config/site';

/** Sets the browser tab title, so tabs, history and screen readers say where you are. */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${site.name}` : `${site.name} · ${site.tagline}`;
  }, [title]);
}
