import { useEffect } from 'react';

const SITE = 'Wavelength';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE}` : `${SITE} — a really tuff music player`;
  }, [title]);
}
