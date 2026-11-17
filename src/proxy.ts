import { NextResponse, type NextRequest } from 'next/server';
import { authConfig, SESSION_COOKIE, UNAUTHORIZED_JSON, verifySessionToken } from '@/lib/auth';

// Everything requires the PIN session except the unlock page/API and static build assets.
const PUBLIC_PATHS = ['/unlock', '/api/unlock'];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const cfg = authConfig();
  const ok = cfg ? await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, cfg.secret) : false;
  if (ok) return NextResponse.next();

  if (pathname.startsWith('/api/')) return NextResponse.json(UNAUTHORIZED_JSON, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/unlock';
  url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next's static assets and the icon; everything else (pages + API) goes through the gate.
  matcher: ['/((?!_next/static|_next/image|icon.svg|favicon.ico).*)'],
};
