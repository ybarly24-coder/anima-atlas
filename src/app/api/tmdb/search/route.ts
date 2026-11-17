import { hasValidSession, UNAUTHORIZED_JSON } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { searchMovies, TmdbError, tmdbConfigured } from '@/lib/tmdb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await hasValidSession(req))) return NextResponse.json(UNAUTHORIZED_JSON, { status: 401 });
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (!tmdbConfigured()) return NextResponse.json({ configured: false, results: [] });
  if (!q) return NextResponse.json({ configured: true, results: [] });
  if (q.length > 100) return NextResponse.json({ configured: true, results: [], message: '검색어가 너무 깁니다.' }, { status: 400 });
  try {
    return NextResponse.json({ configured: true, results: await searchMovies(q) });
  } catch (e) {
    const status = e instanceof TmdbError ? e.status : 502;
    return NextResponse.json({ configured: true, results: [], message: e instanceof Error ? e.message : 'TMDB 검색 실패' }, { status });
  }
}
