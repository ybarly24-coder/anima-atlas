'use client';

import { useEffect, useState } from 'react';
import { cx } from '@/lib/util';
import Link from 'next/link';
import { IS_STATIC } from '@/lib/runtime';
import { fetchServiceStatus, type ServiceStatus } from '@/lib/tmdbClient';

/** Official TMDB logo, linked from TMDB's logo page (not re-hosted). Must stay less prominent than our brand. */
export const TMDB_LOGO_SVG = 'https://www.themoviedb.org/assets/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg';
export const TMDB_NOTICE = 'This product uses the TMDB API but is not endorsed or certified by TMDB.';

export function TmdbAttribution({ compact }: { compact?: boolean }) {
  return (
    <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className={cx('inline-flex items-center gap-2 text-muted hover:text-ink', compact ? 'text-[10px]' : 'text-xs')} title={TMDB_NOTICE}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={TMDB_LOGO_SVG} alt="TMDB" className={compact ? 'h-2.5' : 'h-3'} />
      <span>{compact ? '작품 정보·이미지 제공' : TMDB_NOTICE}</span>
    </a>
  );
}

export type { ServiceStatus } from '@/lib/tmdbClient';

export function useServiceStatus(): ServiceStatus | null {
  const [s, setS] = useState<ServiceStatus | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchServiceStatus().then((x) => !cancelled && setS(x));
    return () => {
      cancelled = true;
    };
  }, []);
  return s;
}

export function TmdbSetupGuide() {
  if (IS_STATIC) {
    return (
      <div className="rounded-xl border border-[#ecd6ab] bg-hypo-bg/50 p-4 text-sm">
        <p className="font-semibold text-ink">이 기기에 TMDB 키가 없습니다 — 작품 자동 검색·포스터/백드롭이 꺼져 있습니다.</p>
        <p className="mt-1 text-ink-2">지금은 <b>내 라이브러리(초기 시드 11개 작품 포함)</b>에서만 찾습니다. 이미지 직접 올리기와 구글 이미지 링크는 그대로 쓸 수 있습니다.</p>
        <p className="mt-2 text-ink-2">
          <Link href="/settings#tmdb-key" className="font-semibold underline">데이터·크레딧 → TMDB 키</Link>에서 키를 한 번 입력하면 이 기기(브라우저)에만 저장되고 바로 켜집니다. 키는 GitHub나 배포 파일에 들어가지 않습니다.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[#ecd6ab] bg-hypo-bg/50 p-4 text-sm">
      <p className="font-semibold text-ink">TMDB 키가 아직 설정되지 않았습니다 — 작품 자동 검색·포스터/백드롭이 꺼져 있습니다.</p>
      <p className="mt-1 text-ink-2">지금은 <b>내 라이브러리(초기 시드 11개 작품 포함)</b>에서만 찾습니다. 이미지 직접 업로드와 구글 이미지 링크는 그대로 쓸 수 있습니다.</p>
      <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-ink-2">
        <li><a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="underline">themoviedb.org/settings/api</a>에서 무료(비상업용) API 키 발급</li>
        <li><code className="rounded bg-card px-1">anima-atlas/.env.local</code>의 <code className="rounded bg-card px-1">TMDB_READ_ACCESS_TOKEN=</code>(권장) 또는 <code className="rounded bg-card px-1">TMDB_API_KEY=</code> 뒤에 붙여넣기</li>
        <li>서버 재시작 (<code className="rounded bg-card px-1">npm start</code>)</li>
      </ol>
    </div>
  );
}

const GOOGLE_MODIFIERS = [
  { label: '공식 스틸', q: 'official still' },
  { label: '장면', q: 'scene' },
  { label: '컬러 스크립트', q: 'color script' },
  { label: '프로덕션 아트', q: 'production art' },
  { label: '배경 미술', q: 'background art' },
  { label: '스토리보드', q: 'storyboard' },
];

/** Opens Google Images in a new tab. Results are NOT pulled into the app (no scraping). */
export function GoogleImageLinks({ title }: { title: string }) {
  const t = title.trim();
  if (!t) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-ink-2">구글 이미지에서 찾기 ↗</span>
        {GOOGLE_MODIFIERS.map((m) => (
          <a key={m.q} href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${t} ${m.q}`)}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line-2 bg-card px-2.5 py-0.5 text-xs text-ink-2 hover:border-ink">
            {m.label}
          </a>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">새 탭에서 구글 이미지가 열립니다. 결과를 앱 안으로 자동으로 가져오지 않습니다. 마음에 드는 이미지는 캡처(⌘⇧4) 후 &quot;이미지 직접 올리기&quot;에서 ⌘V로 붙여넣으세요. 각 이미지의 권리는 원권리자에게 있습니다.</p>
    </div>
  );
}
