'use client';

// Recent searches: a per-viewer convenience (localStorage), safe to lose.
const KEY = 'anima-atlas:search-history';
const MAX = 8;

export type SearchMode = 'title' | 'keyword' | 'mine';

export interface SearchHistoryItem {
  q: string;
  mode: SearchMode;
  at: string;
}

export function readHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as SearchHistoryItem[]) : [];
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.q === 'string') : [];
  } catch {
    return [];
  }
}

export function pushHistory(q: string, mode: SearchMode): SearchHistoryItem[] {
  const t = q.trim();
  if (!t) return readHistory();
  const next = [{ q: t, mode, at: new Date().toISOString() }, ...readHistory().filter((x) => !(x.q === t && x.mode === mode))].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function searchHref(q: string, mode: SearchMode): string {
  const e = encodeURIComponent(q.trim());
  if (mode === 'title') return `/search?q=${e}`;
  if (mode === 'keyword') return `/explore?q=${e}&mode=or&type=scenes`;
  return `/explore?q=${e}`;
}
