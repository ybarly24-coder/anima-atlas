'use client';

// Static-site (GitHub Pages) lock screen. There is no server, so this is a screen cover, not real security:
// anyone can read the site's code. The PIN itself is NOT shipped: only SHA-256(salt:PIN), computed at build
// time from the APP_PIN build secret. Research data is never on the site anyway (it lives in each browser).
import type { PinResult } from '@/components/PinPad';

const PIN_HASH = process.env.NEXT_PUBLIC_PIN_HASH ?? '';
const PIN_SALT = process.env.NEXT_PUBLIC_PIN_SALT ?? '';
const SESSION_KEY = 'anima-atlas:unlocked-until';
const FAIL_KEY = 'anima-atlas:pin-fails';
const SESSION_MS = 12 * 60 * 60 * 1000;

export const clientPinConfigured = () => PIN_HASH.length === 64 && PIN_SALT.length > 0;

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isClientUnlocked(now = Date.now()): boolean {
  try {
    const until = Number(sessionStorage.getItem(SESSION_KEY) ?? 0);
    return until > now;
  } catch {
    return false;
  }
}

export function lockClient() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function readFails(): { fails: number; lockedUntil: number } {
  try {
    return JSON.parse(localStorage.getItem(FAIL_KEY) ?? '') as { fails: number; lockedUntil: number };
  } catch {
    return { fails: 0, lockedUntil: 0 };
  }
}

function writeFails(v: { fails: number; lockedUntil: number }) {
  try {
    localStorage.setItem(FAIL_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

/** Same lockout schedule as the server: 5 free tries, then 30s doubling up to 15 min. */
export async function verifyClientPin(pin: string, now = Date.now()): Promise<PinResult> {
  if (!clientPinConfigured()) return { ok: false, message: '이 배포본에는 PIN이 설정되지 않았습니다. (빌드 시 APP_PIN 필요)' };
  const st = readFails();
  if (st.lockedUntil > now) return { ok: false, locked: true, retryAfterSec: Math.ceil((st.lockedUntil - now) / 1000), message: '시도가 너무 많습니다. 잠시 후 다시 입력하세요.' };
  const ok = (await sha256Hex(`${PIN_SALT}:${pin}`)) === PIN_HASH;
  if (ok) {
    writeFails({ fails: 0, lockedUntil: 0 });
    try {
      // sessionStorage: ends when the tab/browser session ends, like the server's session cookie.
      sessionStorage.setItem(SESSION_KEY, String(now + SESSION_MS));
    } catch {
      /* ignore */
    }
    return { ok: true };
  }
  const fails = st.fails + 1;
  const wait = fails < 5 ? 0 : Math.min(30_000 * 2 ** (fails - 5), 15 * 60_000);
  writeFails({ fails, lockedUntil: now + wait });
  return wait > 0
    ? { ok: false, locked: true, retryAfterSec: Math.ceil(wait / 1000), message: 'PIN이 올바르지 않습니다. 잠시 후 다시 입력하세요.' }
    : { ok: false, remaining: Math.max(0, 5 - fails), message: 'PIN이 올바르지 않습니다.' };
}
