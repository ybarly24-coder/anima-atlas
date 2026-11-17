// TMDB client. In server mode the key comes from env (never sent to the browser).
// In static (GitHub Pages) mode the browser calls TMDB directly with a key the user stored on that device.
// Docs: https://developer.themoviedb.org/reference/search-movie , /reference/movie-images
import type { CategoryId } from './types';

const BASE = 'https://api.themoviedb.org/3';

export const TMDB_IMAGE_SIZES = ['w92', 'w154', 'w185', 'w300', 'w342', 'w500', 'w780', 'w1280', 'original'] as const;
export type TmdbImageSize = (typeof TMDB_IMAGE_SIZES)[number];

export function tmdbConfigured(): boolean {
  return !!(process.env.TMDB_READ_ACCESS_TOKEN?.trim() || process.env.TMDB_API_KEY?.trim());
}

export class TmdbError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type Fetcher = typeof fetch;

/** A v4 "API Read Access Token" (JWT, starts with eyJ) goes in a Bearer header; a v3 key goes in ?api_key=. */
export interface TmdbAuth {
  token?: string;
  apiKey?: string;
}

export function authFromKey(key: string): TmdbAuth {
  const k = key.trim();
  return k.startsWith('eyJ') ? { token: k } : { apiKey: k };
}

const envAuth = (): TmdbAuth => ({ token: process.env.TMDB_READ_ACCESS_TOKEN?.trim() || undefined, apiKey: process.env.TMDB_API_KEY?.trim() || undefined });

async function tmdbGet<T>(path: string, params: Record<string, string>, fetcher: Fetcher = fetch, auth: TmdbAuth = envAuth()): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
  else if (auth.apiKey) url.searchParams.set('api_key', auth.apiKey);
  else throw new TmdbError('TMDB 키가 설정되지 않았습니다.', 503);
  const res = await fetcher(url, { headers, signal: AbortSignal.timeout(12000) });
  if (res.status === 401) throw new TmdbError('TMDB 인증 실패: .env.local 의 TMDB 키를 확인하세요.', 401);
  if (res.status === 404) throw new TmdbError('TMDB에서 작품을 찾을 수 없습니다.', 404);
  if (res.status === 429) throw new TmdbError('TMDB 요청 한도에 걸렸습니다. 잠시 후 다시 시도하세요.', 429);
  if (!res.ok) throw new TmdbError(`TMDB 오류 (HTTP ${res.status})`, 502);
  return (await res.json()) as T;
}

interface RawSearchItem {
  id: number;
  title?: string;
  original_title?: string;
  original_language?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  popularity?: number;
  genre_ids?: number[];
}

export interface TmdbMovieSummary {
  id: number;
  titleKo: string;
  titleEn: string;
  originalTitle: string;
  originalLanguage: string;
  releaseYear: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  isAnimation: boolean;
}

const ANIMATION_GENRE_ID = 16; // TMDB "Animation" genre id

const yearOf = (d?: string) => (d && /^\d{4}/.test(d) ? Number(d.slice(0, 4)) : null);

/**
 * Searches in ko-KR and en-US in parallel and merges by TMDB id, so "주토피아" and
 * "Zootopia" resolve to the same movie with both Korean and English titles.
 */
export async function searchMovies(query: string, fetcher: Fetcher = fetch, auth?: TmdbAuth): Promise<TmdbMovieSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const common = { query: q, include_adult: 'false', page: '1' };
  const [ko, en] = await Promise.all([
    tmdbGet<{ results: RawSearchItem[] }>('/search/movie', { ...common, language: 'ko-KR' }, fetcher, auth),
    tmdbGet<{ results: RawSearchItem[] }>('/search/movie', { ...common, language: 'en-US' }, fetcher, auth),
  ]);
  return mergeSearch(ko.results ?? [], en.results ?? []);
}

export function mergeSearch(ko: RawSearchItem[], en: RawSearchItem[]): TmdbMovieSummary[] {
  const enById = new Map(en.map((r) => [r.id, r]));
  const order: number[] = [];
  const seen = new Set<number>();
  for (const r of [...ko, ...en]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      order.push(r.id);
    }
  }
  const koById = new Map(ko.map((r) => [r.id, r]));
  const out = order.map((id) => {
    const k = koById.get(id);
    const e = enById.get(id);
    const any = (k ?? e)!;
    return {
      id,
      titleKo: k?.title || e?.title || any.original_title || '',
      titleEn: e?.title || any.original_title || k?.title || '',
      originalTitle: any.original_title || '',
      originalLanguage: any.original_language || '',
      releaseYear: yearOf(any.release_date),
      posterPath: any.poster_path ?? null,
      backdropPath: any.backdrop_path ?? null,
      overview: k?.overview || e?.overview || '',
      isAnimation: (any.genre_ids ?? []).includes(ANIMATION_GENRE_ID),
    };
  });
  // Animation first (this is an animation research tool), otherwise keep TMDB relevance order.
  return out.sort((a, b) => Number(b.isAnimation) - Number(a.isAnimation));
}

interface RawDetails {
  id: number;
  title?: string;
  original_title?: string;
  original_language?: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  runtime?: number | null;
  genres?: Array<{ id: number; name: string }>;
  production_companies?: Array<{ id: number; name: string }>;
  homepage?: string | null;
}

interface RawImage {
  file_path: string;
  width: number;
  height: number;
  aspect_ratio: number;
  iso_639_1: string | null;
  vote_average?: number;
}

export interface TmdbImage {
  filePath: string;
  width: number;
  height: number;
  aspectRatio: number;
  language: string | null;
}

export interface TmdbMovieDetail extends TmdbMovieSummary {
  overviewEn: string;
  runtime: number | null;
  genres: string[];
  companies: string[];
  homepage: string | null;
  categoryGuess: CategoryId;
  images: { backdrops: TmdbImage[]; posters: TmdbImage[] };
}

export function guessCategory(companies: string[]): CategoryId {
  const c = companies.map((x) => x.toLowerCase());
  if (c.some((x) => x.includes('pixar'))) return 'other';
  if (c.some((x) => x.includes('walt disney animation'))) return 'disney';
  if (c.some((x) => x.includes('studio ghibli'))) return 'ghibli';
  if (c.some((x) => x.includes('sony pictures animation') || x.includes('sony pictures imageworks'))) return 'sony';
  return 'other';
}

const mapImg = (i: RawImage): TmdbImage => ({ filePath: i.file_path, width: i.width, height: i.height, aspectRatio: i.aspect_ratio, language: i.iso_639_1 ?? null });

export async function getMovie(id: number, fetcher: Fetcher = fetch, auth?: TmdbAuth): Promise<TmdbMovieDetail> {
  const [ko, en, imgs] = await Promise.all([
    tmdbGet<RawDetails>(`/movie/${id}`, { language: 'ko-KR' }, fetcher, auth),
    tmdbGet<RawDetails>(`/movie/${id}`, { language: 'en-US' }, fetcher, auth),
    tmdbGet<{ backdrops?: RawImage[]; posters?: RawImage[] }>(`/movie/${id}/images`, { include_image_language: 'ko,en,ja,null' }, fetcher, auth),
  ]);
  const companies = (en.production_companies ?? ko.production_companies ?? []).map((c) => c.name);
  // Text-free backdrops (iso_639_1 null) read most like scene stills; show them first.
  const backdrops = [...(imgs.backdrops ?? [])].sort((a, b) => Number(a.iso_639_1 !== null) - Number(b.iso_639_1 !== null) || (b.vote_average ?? 0) - (a.vote_average ?? 0)).slice(0, 30).map(mapImg);
  const posters = [...(imgs.posters ?? [])].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0)).slice(0, 12).map(mapImg);
  return {
    id,
    titleKo: ko.title || en.title || ko.original_title || '',
    titleEn: en.title || en.original_title || '',
    originalTitle: en.original_title || '',
    originalLanguage: en.original_language || '',
    releaseYear: yearOf(en.release_date || ko.release_date),
    posterPath: ko.poster_path ?? en.poster_path ?? null,
    backdropPath: en.backdrop_path ?? null,
    overview: ko.overview || en.overview || '',
    overviewEn: en.overview || '',
    isAnimation: (en.genres ?? []).some((g) => g.id === ANIMATION_GENRE_ID),
    runtime: en.runtime ?? null,
    genres: (ko.genres ?? en.genres ?? []).map((g) => g.name),
    companies,
    homepage: en.homepage || null,
    categoryGuess: guessCategory(companies),
    images: { backdrops, posters },
  };
}

export function isValidTmdbPath(path: string): boolean {
  return /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|svg)$/.test(path);
}

/** Cheap authenticated call used to check that a key works. */
export async function pingTmdb(auth: TmdbAuth, fetcher: Fetcher = fetch): Promise<void> {
  await tmdbGet<unknown>('/configuration', {}, fetcher, auth);
}
