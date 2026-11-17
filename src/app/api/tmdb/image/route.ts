import { hasValidSession, UNAUTHORIZED_JSON } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { isValidTmdbPath, TMDB_IMAGE_SIZES, type TmdbImageSize } from '@/lib/tmdb';

export const runtime = 'nodejs';

/**
 * Same-origin proxy for TMDB images (image.tmdb.org only), so the browser can read pixels
 * for palette extraction. No key needed; only well-formed TMDB file paths are accepted.
 */
export async function GET(req: Request) {
  if (!(await hasValidSession(req))) return NextResponse.json(UNAUTHORIZED_JSON, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const path = sp.get('path') ?? '';
  const size = (sp.get('size') ?? 'w780') as TmdbImageSize;
  if (!isValidTmdbPath(path) || !TMDB_IMAGE_SIZES.includes(size)) {
    return NextResponse.json({ message: '잘못된 이미지 경로입니다.' }, { status: 400 });
  }
  try {
    const res = await fetch(`https://image.tmdb.org/t/p/${size}${path}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return NextResponse.json({ message: `이미지를 가져오지 못했습니다 (HTTP ${res.status}).` }, { status: 502 });
    const type = res.headers.get('content-type') ?? 'image/jpeg';
    if (!type.startsWith('image/')) return NextResponse.json({ message: '이미지가 아닙니다.' }, { status: 502 });
    const buf = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buf, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' } });
  } catch {
    return NextResponse.json({ message: '이미지 요청 중 오류가 났습니다.' }, { status: 502 });
  }
}
