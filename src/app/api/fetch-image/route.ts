import { hasValidSession, UNAUTHORIZED_JSON } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  return v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:127.') || v === '::';
}

/** Fetches one image URL the user pasted (server-side, to avoid browser CORS). No crawling. */
export async function POST(req: Request) {
  if (!(await hasValidSession(req))) return NextResponse.json(UNAUTHORIZED_JSON, { status: 401 });
  let url: URL;
  try {
    const { url: raw } = (await req.json()) as { url?: string };
    url = new URL(String(raw ?? ''));
  } catch {
    return NextResponse.json({ message: '올바른 이미지 URL을 입력하세요.' }, { status: 400 });
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return NextResponse.json({ message: 'http(s) URL만 지원합니다.' }, { status: 400 });
  }
  try {
    const { address } = await lookup(url.hostname);
    if (isPrivateIp(address)) return NextResponse.json({ message: '내부 네트워크 주소는 가져올 수 없습니다.' }, { status: 400 });
  } catch {
    return NextResponse.json({ message: '주소를 찾을 수 없습니다.' }, { status: 400 });
  }

  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'AnimaAtlas/1.0 (personal research tool)', Accept: 'image/*' } });
    if (!res.ok) return NextResponse.json({ message: `이미지를 가져오지 못했습니다 (HTTP ${res.status}). 이미지를 직접 저장해 드래그하거나 캡처 후 붙여넣어 보세요.` }, { status: 502 });
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
    if (!type.startsWith('image/')) {
      return NextResponse.json({ message: '이 주소는 이미지 파일이 아닙니다(웹페이지일 수 있음). 이미지를 우클릭 → "이미지 주소 복사"한 URL을 넣거나, 캡처 후 붙여넣으세요.' }, { status: 415 });
    }
    const len = Number(res.headers.get('content-length') ?? 0);
    if (len > MAX_BYTES) return NextResponse.json({ message: '8MB 이하 이미지만 가져올 수 있습니다.' }, { status: 413 });
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) return NextResponse.json({ message: '8MB 이하 이미지만 가져올 수 있습니다.' }, { status: 413 });
    return new NextResponse(buf, { headers: { 'Content-Type': type, 'X-Source-Url': url.toString() } });
  } catch {
    return NextResponse.json({ message: '이미지를 가져오는 중 오류가 났습니다. 캡처 후 붙여넣기(Ctrl/Cmd+V)를 사용해 보세요.' }, { status: 502 });
  }
}
