import { hasValidSession, UNAUTHORIZED_JSON } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { tmdbConfigured } from '@/lib/tmdb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await hasValidSession(req))) return NextResponse.json(UNAUTHORIZED_JSON, { status: 401 });
  return NextResponse.json({ tmdb: tmdbConfigured(), ai: !!(process.env.ANTHROPIC_API_KEY?.trim() || process.env.ANTHROPIC_AUTH_TOKEN?.trim()) });
}
