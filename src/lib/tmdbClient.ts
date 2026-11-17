'use client';

// Browser-side TMDB access that works in both deployment modes.
// static: calls api.themoviedb.org directly (TMDB allows CORS) with a key stored ONLY in this browser.
// server: goes through this app's /api/tmdb/* routes; the key stays in the server's .env.local.
import { IS_STATIC } from './runtime';
import { authFromKey, getMovie, pingTmdb, searchMovies, TmdbError, type TmdbMovieDetail, type TmdbMovieSummary } from './tmdb';

const KEY_STORAGE = 'anima-atlas:tmdb-key';

export function getLocalTmdbKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setLocalTmdbKey(key: string) {
  try {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } catch {
    /* storage blocked: the key just won't persist */
  }
}

export function clearLocalTmdbKey() {
  try {
    localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

/** Validates a key against TMDB before saving it. */
export async function testTmdbKey(key: string): Promise<{ ok: boolean; message: string }> {
  try {
    await pingTmdb(authFromKey(key));
    return { ok: true, message: 'TMDB 키가 확인되었습니다.' };
  } catch (e) {
    return { ok: false, message: e instanceof TmdbError && e.status === 401 ? '키가 올바르지 않습니다. TMDB 설정 페이지의 키를 다시 복사해 보세요.' : 'TMDB에 연결하지 못했습니다. 인터넷 연결을 확인하세요.' };
  }
}

export interface ServiceStatus {
  tmdb: boolean;
  ai: boolean;
  mode: 'static' | 'server';
}

export async function fetchServiceStatus(): Promise<ServiceStatus> {
  if (IS_STATIC) return { tmdb: !!getLocalTmdbKey(), ai: false, mode: 'static' };
  try {
    const j = await (await fetch('/api/tmdb/status')).json();
    return { tmdb: !!j.tmdb, ai: !!j.ai, mode: 'server' };
  } catch {
    return { tmdb: false, ai: false, mode: 'server' };
  }
}

const signalFetch = (signal?: AbortSignal): typeof fetch => (input, init) => fetch(input, { ...init, signal });

export async function tmdbSearch(q: string, signal?: AbortSignal): Promise<TmdbMovieSummary[]> {
  if (IS_STATIC) {
    const key = getLocalTmdbKey();
    if (!key) throw new TmdbError('TMDB 키가 설정되지 않았습니다.', 503);
    return searchMovies(q, signalFetch(signal), authFromKey(key));
  }
  const r = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`, { signal });
  const j = await r.json();
  if (!r.ok) throw new TmdbError(j.message ?? `HTTP ${r.status}`, r.status);
  return j.results ?? [];
}

/** null = no key configured. */
export async function tmdbMovie(id: number): Promise<TmdbMovieDetail | null> {
  if (IS_STATIC) {
    const key = getLocalTmdbKey();
    if (!key) return null;
    return getMovie(id, fetch, authFromKey(key));
  }
  const r = await fetch(`/api/tmdb/movie/${id}`);
  const j = await r.json();
  if (r.status === 503) return null;
  if (!r.ok) throw new TmdbError(j.message ?? `HTTP ${r.status}`, r.status);
  return j.movie;
}
