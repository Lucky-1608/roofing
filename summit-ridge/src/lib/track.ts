declare global {
  interface Window {
    whop?: { track: (name: string, props?: Record<string, unknown>) => void };
    __trackLog?: { t: string; name: string; props?: unknown }[];
  }
}

/** Thin wrapper over the pixel Whop injects on hosted sites. Never throws. */
export function track(name: string, props?: Record<string, unknown>) {
  try {
    window.whop?.track(name, props);
  } catch {
    /* tracking must never break the page */
  }
  // Visible log so pixel events can be shown on screen: add ?debug=1 to the URL.
  (window.__trackLog ??= []).push({ t: new Date().toISOString().slice(11, 19), name, props });
  window.dispatchEvent(new Event("track-log"));
}

const seen = new Set<string>();
/** Fire once per page load for a given key (e.g. service_viewed per service). */
export function trackOnce(key: string, name: string, props?: Record<string, unknown>) {
  if (seen.has(key)) return;
  seen.add(key);
  track(name, props);
}
