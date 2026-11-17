import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { boardHref, movieHref, sceneHref, workHref } from '@/lib/routes';
import { authFromKey } from '@/lib/tmdb';

// Minimal Web Storage for Node so the static-site lock screen logic can run.
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

const SALT = 'test-salt';
const PIN = '4821';

let pin: typeof import('@/lib/clientPin');

beforeAll(async () => {
  Object.assign(globalThis, { sessionStorage: new MemoryStorage(), localStorage: new MemoryStorage() });
  process.env.NEXT_PUBLIC_PIN_SALT = SALT;
  process.env.NEXT_PUBLIC_PIN_HASH = createHash('sha256').update(`${SALT}:${PIN}`).digest('hex');
  pin = await import('@/lib/clientPin');
});

describe('GitHub Pages lock screen (client-side PIN)', () => {
  it('unlocks with the right PIN and remembers it for the session', async () => {
    expect(pin.clientPinConfigured()).toBe(true);
    expect(pin.isClientUnlocked()).toBe(false);
    expect((await pin.verifyClientPin(PIN)).ok).toBe(true);
    expect(pin.isClientUnlocked()).toBe(true);
    pin.lockClient();
    expect(pin.isClientUnlocked()).toBe(false);
  });

  it('rejects wrong PINs and locks out after 5 tries', async () => {
    localStorage.clear();
    for (let i = 0; i < 4; i++) expect((await pin.verifyClientPin('0000', 1_000)).locked).toBeFalsy();
    const fifth = await pin.verifyClientPin('0000', 1_000);
    expect(fifth.locked).toBe(true);
    expect(fifth.retryAfterSec).toBe(30);
    expect((await pin.verifyClientPin(PIN, 2_000)).ok).toBe(false); // still locked
    expect((await pin.verifyClientPin(PIN, 1_000 + 31_000)).ok).toBe(true); // after the wait
  });

  it('expires the unlocked session after 12 hours', async () => {
    sessionStorage.clear();
    await pin.verifyClientPin(PIN, 0);
    expect(pin.isClientUnlocked(12 * 60 * 60 * 1000 - 1)).toBe(true);
    expect(pin.isClientUnlocked(12 * 60 * 60 * 1000 + 1)).toBe(false);
  });
});

describe('static-friendly addresses and TMDB key types', () => {
  it('builds query-string detail URLs', () => {
    expect(sceneHref('scene-s-g02')).toBe('/scene?id=scene-s-g02');
    expect(workHref('spirited-away')).toBe('/work?slug=spirited-away');
    expect(boardHref('board b02')).toBe('/board?id=board%20b02');
    expect(movieHref(269149)).toBe('/movie?id=269149');
  });

  it('treats a JWT read token as Bearer and a 32-char key as api_key', () => {
    expect(authFromKey('eyJhbGciOiJIUzI1NiJ9.x.y')).toEqual({ token: 'eyJhbGciOiJIUzI1NiJ9.x.y' });
    expect(authFromKey(' 0123456789abcdef0123456789abcdef ')).toEqual({ apiKey: '0123456789abcdef0123456789abcdef' });
  });
});
