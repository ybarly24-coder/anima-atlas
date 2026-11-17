// Detail pages use query strings (not [id] segments) so they work on GitHub Pages' static export too.
// next/link and router.push add the base path automatically.
export const sceneHref = (id: string) => `/scene?id=${encodeURIComponent(id)}`;
export const workHref = (slug: string) => `/work?slug=${encodeURIComponent(slug)}`;
export const boardHref = (id: string) => `/board?id=${encodeURIComponent(id)}`;
export const movieHref = (tmdbId: number | string) => `/movie?id=${encodeURIComponent(String(tmdbId))}`;
