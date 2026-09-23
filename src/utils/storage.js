const PREFIX = 'wavelength:';

export const STORAGE_KEYS = {
  library: `${PREFIX}library`,
  player: `${PREFIX}player`,
  layout: `${PREFIX}layout`,
};

export function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
