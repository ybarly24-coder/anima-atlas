import { NextResponse } from 'next/server';
import { AttemptTracker, authConfig, createSessionToken, MAX_FREE_FAILS, pinMatches, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Per-IP and global trackers: a 4-digit PIN must not be guessable by brute force.
const perIp = new AttemptTracker();
const globalTracker = new AttemptTracker();
const GLOBAL_KEY = '*';

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}

export async function POST(req: Request) {
  const cfg = authConfig();
  if (!cfg) {
    return NextResponse.json({ ok: false, message: 'PIN이 설정되지 않았습니다. .env.local 에 APP_PIN 과 APP_SESSION_SECRET(32자 이상)을 넣고 서버를 재시작하세요.' }, { status: 503 });
  }
  const ip = clientIp(req);
  const now = Date.now();
  const lockedUntil = Math.max(perIp.get(ip).lockedUntil, globalTracker.get(GLOBAL_KEY).lockedUntil);
  if (lockedUntil > now) {
    return NextResponse.json({ ok: false, locked: true, retryAfterSec: Math.ceil((lockedUntil - now) / 1000), message: '시도가 너무 많습니다. 잠시 후 다시 입력하세요.' }, { status: 429 });
  }

  let pin = '';
  try {
    pin = String(((await req.json()) as { pin?: unknown }).pin ?? '');
  } catch {
    return NextResponse.json({ ok: false, message: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  if (!/^\d{4,12}$/.test(pin)) return NextResponse.json({ ok: false, message: '숫자 PIN을 입력하세요.' }, { status: 400 });

  if (!(await pinMatches(pin, cfg))) {
    const a = perIp.fail(ip, now);
    // Global limiter is looser (x4) so one device mistyping doesn't lock everyone out immediately.
    const g = globalTracker.get(GLOBAL_KEY);
    if (a.fails % 4 === 0 || g.fails > 0) globalTracker.fail(GLOBAL_KEY, now);
    const wait = Math.max(a.lockedUntil, globalTracker.get(GLOBAL_KEY).lockedUntil) - now;
    return NextResponse.json(
      wait > 0
        ? { ok: false, locked: true, retryAfterSec: Math.ceil(wait / 1000), message: 'PIN이 올바르지 않습니다. 잠시 후 다시 입력하세요.' }
        : { ok: false, remaining: Math.max(0, MAX_FREE_FAILS - a.fails), message: 'PIN이 올바르지 않습니다.' },
      { status: wait > 0 ? 429 : 401 },
    );
  }

  perIp.reset(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(cfg.secret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: new URL(req.url).protocol === 'https:',
    path: '/',
    // No maxAge: session cookie ends when the browser closes; the token itself also expires after 12h.
  });
  return res;
}
