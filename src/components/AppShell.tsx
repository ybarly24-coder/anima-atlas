'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useAtlas } from '@/lib/store';
import { cx } from '@/lib/util';
import { pushHistory } from '@/lib/searchHistory';
import { TmdbAttribution } from './SearchAids';
import { PinPad } from './PinPad';
import { isClientUnlocked, lockClient, verifyClientPin } from '@/lib/clientPin';
import { IS_STATIC, withBase } from '@/lib/runtime';

const NAV = [
  { href: '/', label: '홈', en: 'Home' },
  { href: '/search', label: '작품 검색', en: 'Search' },
  { href: '/capture', label: '이미지 올리기', en: 'Upload' },
  { href: '/scenes', label: '장면', en: 'Scenes' },
  { href: '/boards', label: '리서치 보드', en: 'Boards' },
  { href: '/compare', label: '비교', en: 'Compare' },
  { href: '/explore', label: '키워드 탐색', en: 'Explore' },
  { href: '/works', label: '작품 라이브러리', en: 'Works' },
  { href: '/cards', label: 'AI 카드뉴스', en: 'Cards' },
  { href: '/insights', label: '인사이트', en: 'Insights' },
  { href: '/sources', label: '출처', en: 'Sources' },
  { href: '/settings', label: '데이터·크레딧', en: 'Data' },
];

function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
}

export function GlobalSearch({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) pushHistory(q, 'title');
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form role="search" onSubmit={submit} className={cx('relative', className)}>
      <label htmlFor="global-search" className="sr-only">
        작품명 검색
      </label>
      <input
        id="global-search"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="작품명 검색: 주토피아, Zootopia, 센과 치히로…"
        className="h-9 w-full rounded-md border border-line-2 bg-card pl-8 pr-3 text-sm placeholder:text-muted/80 focus:border-ink focus:outline-none"
      />
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted" aria-hidden>
        ⌕
      </span>
    </form>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useAtlas();
  return (
    <div className="pointer-events-none fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2 md:bottom-6" aria-live="polite" role="status">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'pointer-events-auto flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm shadow-lg',
            t.tone === 'error' ? 'border-[#e3c2bc] bg-[#fbefec] text-danger' : t.tone === 'info' ? 'border-line-2 bg-card text-ink' : 'border-[#bcd5cb] bg-fact-bg text-fact',
          )}
        >
          <span>{t.message}</span>
          <button type="button" onClick={() => dismissToast(t.id)} aria-label="알림 닫기" className="text-muted hover:text-ink">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, error, tray } = useAtlas();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  // Static site (GitHub Pages): client-side lock screen. Checked after mount so the prerendered HTML shows nothing private.
  const [staticGate, setStaticGate] = useState<'checking' | 'locked' | 'open'>(IS_STATIC ? 'checking' : 'open');
  useEffect(() => {
    if (IS_STATIC) setStaticGate(isClientUnlocked() ? 'open' : 'locked');
  }, []);

  // The unlock screen stands alone: no navigation, no research data.
  if (pathname === '/unlock') return <>{children}</>;
  if (staticGate === 'checking') return <div className="min-h-screen bg-paper" aria-busy="true" />;
  if (staticGate === 'locked') {
    return (
      <PinPad
        verify={verifyClientPin}
        onSuccess={() => setStaticGate('open')}
        note="개인 연구 도구입니다. 연구 데이터는 이 기기의 브라우저에만 저장됩니다. 이 잠금 화면은 화면 가림막이며, 탭을 닫거나 12시간이 지나면 다시 잠깁니다."
      />
    );
  }

  const lock = async () => {
    if (IS_STATIC) {
      lockClient();
      setStaticGate('locked');
      return;
    }
    await fetch('/api/lock', { method: 'POST' }).catch(() => undefined);
    window.location.replace(withBase('/unlock'));
  };

  const nav = (
    <nav aria-label="주요 메뉴" className="flex flex-col gap-0.5 overflow-y-auto">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          aria-current={isActive(pathname, n.href) ? 'page' : undefined}
          className={cx(
            'flex items-center justify-between rounded-md px-3 py-2 text-sm',
            isActive(pathname, n.href) ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-2',
          )}
        >
          <span>{n.label}</span>
          <span className={cx('text-[10px] uppercase tracking-wider', isActive(pathname, n.href) ? 'text-paper/70' : 'text-muted')}>
            {n.href === '/compare' && tray.ids.length > 0 ? `${tray.ids.length} 담김` : n.en}
          </span>
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <Link href="/" className="block leading-none">
      <span className="font-serif text-lg font-bold tracking-[0.14em] text-ink">ANIMA ATLAS</span>
      <span className="mt-1 hidden text-[9.5px] uppercase tracking-[0.12em] text-muted sm:block">Animation Research &amp; Visual Intelligence Platform</span>
    </Link>
  );

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">
        본문으로 건너뛰기
      </a>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-6 border-r border-line bg-paper px-4 py-5 lg:flex">
        {brand}
        {nav}
        <div className="mt-auto flex flex-col gap-2">
          <p className="text-[11px] leading-relaxed text-muted">
            데이터는 이 브라우저(IndexedDB)에만 저장됩니다. <Link href="/settings" className="underline">JSON 백업</Link>을 권장합니다.
          </p>
          <TmdbAttribution compact />
          <button type="button" onClick={lock} className="self-start rounded-md border border-line-2 px-2.5 py-1 text-xs text-ink-2 hover:bg-paper-2">잠그기</button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:pl-60">
        <div className="flex items-center gap-3 px-4 py-2.5 md:px-6">
          <button
            type="button"
            className="shrink-0 whitespace-nowrap rounded-md border border-line-2 px-2.5 py-1.5 text-sm lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? '닫기' : '메뉴'}
          </button>
          <div className="lg:hidden">{brand}</div>
          <GlobalSearch className="ml-auto hidden w-full max-w-md md:block lg:ml-0" />
          <div className="ml-auto flex shrink-0 gap-2">
            <Link href="/capture" className="inline-flex h-9 shrink-0 whitespace-nowrap items-center rounded-md border border-ink bg-ink px-3 text-sm font-medium text-paper hover:bg-ink-2">
              + 이미지<span className="hidden sm:inline">&nbsp;올리기</span>
            </Link>
            <Link href="/boards?new=1" className="hidden h-9 items-center rounded-md border border-line-2 bg-card px-3 text-sm font-medium hover:bg-paper-2 sm:inline-flex">
              + 연구 보드
            </Link>
          </div>
        </div>
        <div className="px-4 pb-2.5 md:hidden">
          <GlobalSearch />
        </div>
        {menuOpen && (
          <div id="mobile-menu" className="border-t border-line bg-paper px-4 py-3 lg:hidden">
            {nav}
            <Link href="/boards?new=1" className="mt-2 block rounded-md border border-line-2 px-3 py-2 text-sm sm:hidden">
              + 연구 보드 만들기
            </Link>
            <button type="button" onClick={lock} className="mt-2 block w-full rounded-md border border-line-2 px-3 py-2 text-left text-sm">잠그기 (PIN 다시 입력)</button>
          </div>
        )}
      </header>

      <main id="main" className="pb-[calc(6rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-5 md:px-6 lg:pl-66 lg:pr-8">
        <div className="mx-auto max-w-7xl">
          {error ? (
            <div className="rounded-lg border border-[#e3c2bc] bg-[#fbefec] p-6 text-sm text-danger" role="alert">
              <p className="font-semibold">저장소를 열 수 없습니다.</p>
              <p className="mt-1">{error}</p>
              <p className="mt-2 text-ink-2">개인정보 보호(시크릿) 모드나 저장소 차단 설정에서는 IndexedDB를 사용할 수 없을 수 있습니다.</p>
            </div>
          ) : ready ? (
            children
          ) : (
            <div className="flex items-center gap-3 py-20 text-sm text-muted" role="status">
              <span className="h-2 w-2 animate-pulse rounded-full bg-muted" /> 연구 데이터를 불러오는 중...
            </div>
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav aria-label="하단 바로가기" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] text-center text-[11px] backdrop-blur lg:hidden">
        {[NAV[0], NAV[1], NAV[2], NAV[3], NAV[4]].map((n) => (
          <Link key={n.href} href={n.href} aria-current={isActive(pathname, n.href) ? 'page' : undefined} className={cx('py-2.5', isActive(pathname, n.href) ? 'font-semibold text-ink' : 'text-muted')}>
            {n.label}
            {n.href === '/compare' && tray.ids.length > 0 && ` (${tray.ids.length})`}
          </Link>
        ))}
      </nav>
      <Toasts />
    </div>
  );
}
