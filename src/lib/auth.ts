// PIN gate: signed, HttpOnly session cookie. Web Crypto only, so it runs in both proxy and route handlers.
// The PIN and signing secret come from env (.env.local): APP_PIN, APP_SESSION_SECRET. Missing config fails closed.

export const SESSION_COOKIE = 'anima_session';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h, and the cookie itself ends when the browser closes

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer): string {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}

/** Constant-time string comparison (avoids leaking how many leading characters matched). */
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export interface AuthConfig {
  pin: string;
  secret: string;
}

/** null = not configured (callers must fail closed). */
export function authConfig(env: Record<string, string | undefined> = process.env): AuthConfig | null {
  const pin = env.APP_PIN?.trim();
  const secret = env.APP_SESSION_SECRET?.trim();
  if (!pin || !secret || secret.length < 32) return null;
  return { pin, secret };
}

export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  const exp = now + SESSION_TTL_MS;
  return `${exp}.${await hmac(secret, `anima-session:v1:${exp}`)}`;
}

export async function verifySessionToken(token: string | undefined | null, secret: string, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [expStr, sig] = token.split('.');
  const exp = Number(expStr);
  if (!sig || !Number.isFinite(exp) || exp < now || exp > now + SESSION_TTL_MS + 60_000) return false;
  return safeEqual(sig, await hmac(secret, `anima-session:v1:${exp}`));
}

/** Compare the typed PIN against the configured one without leaking timing. */
export async function pinMatches(input: string, cfg: AuthConfig): Promise<boolean> {
  return safeEqual(await hmac(cfg.secret, `pin:${input}`), await hmac(cfg.secret, `pin:${cfg.pin}`));
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

/** For route handlers: true when the request carries a valid session. */
export async function hasValidSession(req: Request): Promise<boolean> {
  const cfg = authConfig();
  if (!cfg) return false;
  return verifySessionToken(readCookie(req.headers.get('cookie'), SESSION_COOKIE), cfg.secret);
}

export const UNAUTHORIZED_JSON = { error: 'LOCKED', message: 'PIN을 입력해 잠금을 해제하세요.' };

/** Only allow same-site relative paths after unlock (no open redirects). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\') || next.startsWith('/unlock')) return '/';
  return next;
}

// ---- Brute-force protection (in-memory, per server process) ----

export interface Attempt {
  fails: number;
  lockedUntil: number;
}

export const MAX_FREE_FAILS = 5;

/** Lockout after 5 wrong PINs: 30s, then doubling per further failure, capped at 15 min. */
export function lockoutMs(fails: number): number {
  if (fails < MAX_FREE_FAILS) return 0;
  return Math.min(30_000 * 2 ** (fails - MAX_FREE_FAILS), 15 * 60_000);
}

export class AttemptTracker {
  private map = new Map<string, Attempt>();
  get(key: string): Attempt {
    return this.map.get(key) ?? { fails: 0, lockedUntil: 0 };
  }
  fail(key: string, now = Date.now()): Attempt {
    const a = this.get(key);
    const fails = a.fails + 1;
    const next = { fails, lockedUntil: now + lockoutMs(fails) };
    this.map.set(key, next);
    return next;
  }
  reset(key: string) {
    this.map.delete(key);
  }
}
