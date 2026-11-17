export function nowIso(): string {
  return new Date().toISOString();
}

/** Stable, collision-resistant id with a readable prefix. */
export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}-${Date.now().toString(36)}${rand}`;
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'work';
}

export function uniqueSlug(input: string, existing: string[]): string {
  const base = slugify(input);
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** 83 -> "01:23"; 3723 -> "1:02:03" */
export function formatTimecode(sec: number | null | undefined): string {
  if (sec == null || Number.isNaN(sec)) return '';
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}

/** "1:02:03" | "62:03" | "83" -> seconds. Empty -> null. Invalid -> NaN. */
export function parseTimecode(input: string): number | null {
  const t = input.trim();
  if (!t) return null;
  if (!/^\d+(:\d{1,2}){0,2}$/.test(t)) return NaN;
  const parts = t.split(':').map(Number);
  if (parts.slice(1).some((p) => p >= 60)) return NaN;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export function isHexColor(v: string): boolean {
  return /^#([0-9a-f]{6})$/i.test(v.trim());
}

export function normalizeHex(v: string): string {
  let t = v.trim();
  if (!t.startsWith('#')) t = `#${t}`;
  if (/^#[0-9a-f]{3}$/i.test(t)) t = `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`;
  return t.toUpperCase();
}

export function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Simple deterministic hash for placeholder art. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
