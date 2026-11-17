import { hasValidSession, UNAUTHORIZED_JSON } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getMovie, TmdbError, tmdbConfigured } from '@/lib/tmdb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidSession(req))) return NextResponse.json(UNAUTHORIZED_JSON, { status: 401 });
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) return NextResponse.json({ message: '잘못된 TMDB id입니다.' }, { status: 400 });
  if (!tmdbConfigured()) return NextResponse.json({ configured: false, message: 'TMDB 키가 설정되지 않았습니다.' }, { status: 503 });
  try {
    return NextResponse.json({ configured: true, movie: await getMovie(Number(id)) });
  } catch (e) {
    const status = e instanceof TmdbError ? e.status : 502;
    return NextResponse.json({ message: e instanceof Error ? e.message : 'TMDB 오류' }, { status });
  }
}
