// Two deployment modes from one codebase:
// - server (default): `npm start` on the Mac. API routes, server-side PIN, server-held keys.
// - static (GitHub Pages): `npm run build:pages`. No server; TMDB is called from the browser with a
//   key the user enters on each device, and the PIN is a client-side lock screen.
export const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';

/** e.g. "/anima-atlas" on GitHub Pages project sites, "" otherwise. next/link adds it automatically; plain URLs need it. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const withBase = (path: string) => `${BASE_PATH}${path}`;
