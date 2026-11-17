import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { TEST_SECRET, authed } from './fixtures';
import { AttemptTracker, authConfig, createSessionToken, lockoutMs, pinMatches, safeNextPath, SESSION_COOKIE, SESSION_TTL_MS, verifySessionToken } from '@/lib/auth';
import { proxy } from '@/proxy';
import { POST as unlock } from '@/app/api/unlock/route';
import { GET as tmdbStatus } from '@/app/api/tmdb/status/route';
import { POST as analyze } from '@/app/api/analyze/route';

const cfg = { pin: '5931', secret: TEST_SECRET };
const unlockReq = (pin: string, ip = '10.0.0.1') =>
  new Request('http://localhost/api/unlock', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify({ pin }) });

describe('session tokens', () => {
  it('accepts a fresh token and rejects tampered, expired or foreign ones', async () => {
    const t = await createSessionToken(TEST_SECRET);
    expect(await verifySessionToken(t, TEST_SECRET)).toBe(true);
    expect(await verifySessionToken(`${t}x`, TEST_SECRET)).toBe(false);
    expect(await verifySessionToken(t, 'another-secret-0123456789abcdef0123456789')).toBe(false);
    const [exp, sig] = t.split('.');
    expect(await verifySessionToken(`${Number(exp) + 1000}.${sig}`, TEST_SECRET)).toBe(false); // extended expiry, old signature
    expect(await verifySessionToken(t, TEST_SECRET, Date.now() + SESSION_TTL_MS + 1)).toBe(false); // expired
    expect(await verifySessionToken(undefined, TEST_SECRET)).toBe(false);
  });

  it('checks the PIN and fails closed when not configured', async () => {
    expect(await pinMatches('5931', cfg)).toBe(true);
    expect(await pinMatches('5932', cfg)).toBe(false);
    expect(await pinMatches('59310', cfg)).toBe(false);
    expect(authConfig({})).toBeNull();
    expect(authConfig({ APP_PIN: '5931', APP_SESSION_SECRET: 'short' })).toBeNull();
  });

  it('only redirects to same-site paths after unlock', () => {
    expect(safeNextPath('/scenes/abc?x=1')).toBe('/scenes/abc?x=1');
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath('/\\evil.example')).toBe('/');
    expect(safeNextPath(null)).toBe('/');
  });

  it('locks out after 5 wrong PINs with growing waits', () => {
    expect([1, 4, 5, 6, 7].map(lockoutMs)).toEqual([0, 0, 30_000, 60_000, 120_000]);
    expect(lockoutMs(40)).toBe(15 * 60_000);
    const t = new AttemptTracker();
    for (let i = 0; i < 4; i++) expect(t.fail('ip', 0).lockedUntil).toBe(0);
    expect(t.fail('ip', 0).lockedUntil).toBe(30_000);
  });
});

describe('proxy gate', () => {
  it('redirects pages to /unlock (keeping the target) and returns 401 for APIs', async () => {
    const page = await proxy(new NextRequest('http://localhost/scenes/abc?tab=1'));
    expect(page.status).toBe(307);
    const loc = new URL(page.headers.get('location')!);
    expect(loc.pathname).toBe('/unlock');
    expect(loc.searchParams.get('next')).toBe('/scenes/abc?tab=1');
    const api = await proxy(new NextRequest('http://localhost/api/tmdb/search?q=x'));
    expect(api.status).toBe(401);
  });

  it('lets the unlock page/API through, and everything through with a valid cookie', async () => {
    expect((await proxy(new NextRequest('http://localhost/unlock'))).headers.get('x-middleware-next')).toBe('1');
    expect((await proxy(new NextRequest('http://localhost/api/unlock', { method: 'POST' }))).headers.get('x-middleware-next')).toBe('1');
    const token = await createSessionToken(TEST_SECRET);
    const ok = await proxy(new NextRequest('http://localhost/scenes', { headers: { cookie: `${SESSION_COOKIE}=${token}` } }));
    expect(ok.headers.get('x-middleware-next')).toBe('1');
    const forged = await proxy(new NextRequest('http://localhost/scenes', { headers: { cookie: `${SESSION_COOKIE}=9999999999999.forged` } }));
    expect(forged.status).toBe(307);
  });
});

describe('/api/unlock', () => {
  it('sets an HttpOnly session cookie for the right PIN', async () => {
    const res = await unlock(unlockReq('5931', '10.0.0.2'));
    expect(res.status).toBe(200);
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie.toLowerCase()).toContain('httponly');
    expect(cookie.toLowerCase()).not.toContain('max-age'); // session cookie
    const token = decodeURIComponent(/anima_session=([^;]+)/.exec(cookie)![1]);
    expect(await verifySessionToken(token, TEST_SECRET)).toBe(true);
  });

  it('rejects wrong PINs, then locks the client out (brute force)', async () => {
    const ip = '10.0.0.3';
    for (let i = 0; i < 4; i++) expect((await unlock(unlockReq('0000', ip))).status).toBe(401);
    const fifth = await unlock(unlockReq('0000', ip));
    expect(fifth.status).toBe(429);
    expect((await fifth.json()).retryAfterSec).toBeGreaterThan(0);
    // Even the correct PIN is refused while locked out.
    expect((await unlock(unlockReq('5931', ip))).status).toBe(429);
  });

  it('rejects non-numeric input', async () => {
    expect((await unlock(unlockReq('abcd', '10.0.0.4'))).status).toBe(400);
  });
});

describe('API routes re-check the session (defense in depth)', () => {
  it('return 401 without a session even if the proxy were bypassed', async () => {
    expect((await tmdbStatus(new Request('http://x/api/tmdb/status'))).status).toBe(401);
    expect((await analyze(new Request('http://x/api/analyze', { method: 'POST', body: '{}' }))).status).toBe(401);
    expect((await tmdbStatus(await authed('http://x/api/tmdb/status'))).status).toBe(200);
  });
});
