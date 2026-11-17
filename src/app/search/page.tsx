'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { SceneMedia } from '@/components/Placeholder';
import { GoogleImageLinks, TmdbAttribution, TmdbSetupGuide, useServiceStatus } from '@/components/SearchAids';
import { CategoryChip, EmptyState, LinkButton, PageHeader } from '@/components/ui';
import { matchWork, tmdbImageUrl } from '@/lib/imports';
import { parseQuery, matchesTerms, expandTerms, workHaystack } from '@/lib/search';
import { pushHistory } from '@/lib/searchHistory';
import { useAtlas } from '@/lib/store';
import type { TmdbMovieSummary } from '@/lib/tmdb';
import { tmdbSearch } from '@/lib/tmdbClient';
import { movieHref, workHref } from '@/lib/routes';


function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useAtlas();
  const status = useServiceStatus();
  const q0 = params.get('q') ?? '';
  const [q, setQ] = useState(q0);
  const [results, setResults] = useState<TmdbMovieSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setQ(q0), [q0]);

  // Debounced URL update while typing.
  const onType = (v: string) => {
    setQ(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      router.replace(v.trim() ? `${pathname}?q=${encodeURIComponent(v.trim())}` : pathname, { scroll: false });
    }, 350);
  };

  useEffect(() => {
    if (!q0.trim()) {
      setResults([]);
      return;
    }
    pushHistory(q0, 'title');
    if (!status?.tmdb) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    tmdbSearch(q0, ctrl.signal)
      .then(setResults)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q0, status?.tmdb]);

  const local = useMemo(() => {
    const parsed = parseQuery(q0);
    if (!parsed.terms.length) return [];
    const terms = expandTerms(parsed.terms, data.tags);
    return data.works.filter((w) => matchesTerms(workHaystack(w), terms, parsed.mode ?? 'and'));
  }, [q0, data.works, data.tags]);

  // Hide local works already shown as a TMDB result (same movie, linked by id or title+year).
  const tmdbLinkedIds = new Set(results.map((r) => matchWork(data.works, r)?.id).filter(Boolean) as string[]);
  const localOnly = local.filter((w) => !tmdbLinkedIds.has(w.id));
  const googleTitle = results[0]?.titleEn || local[0]?.titleEn || q0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Search / Import" title="작품 검색" sub="한글·영문 제목 모두 같은 작품으로 연결됩니다. 작품을 고르면 포스터·백드롭 이미지 후보를 볼 수 있어요." />
      <form onSubmit={(e) => { e.preventDefault(); router.replace(`${pathname}?q=${encodeURIComponent(q.trim())}`); }} className="flex gap-2">
        <label htmlFor="search-q" className="sr-only">작품명</label>
        <input id="search-q" value={q} onChange={(e) => onType(e.target.value)} placeholder="주토피아, Zootopia, Spirited Away..." autoFocus className="h-12 flex-1 rounded-xl border border-line-2 bg-card px-4 font-serif text-lg focus:border-ink focus:outline-none" />
        <button type="submit" className="h-12 rounded-xl bg-ink px-6 font-semibold text-paper">검색</button>
      </form>

      {status && !status.tmdb && <TmdbSetupGuide />}
      {q0 && <GoogleImageLinks title={googleTitle} />}

      {!q0 ? (
        <EmptyState title="작품 제목을 입력하세요." body={<>예: <Link className="underline" href="/search?q=%EC%A3%BC%ED%86%A0%ED%94%BC%EC%95%84">주토피아</Link>, <Link className="underline" href="/search?q=Spirited%20Away">Spirited Away</Link>, <Link className="underline" href="/search?q=%EC%8A%A4%ED%8C%8C%EC%9D%B4%EB%8D%94%EB%A7%A8">스파이더맨</Link></>} />
      ) : (
        <>
          {status?.tmdb && (
            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <h2 className="font-serif text-lg font-semibold">TMDB 검색 결과 {loading ? '…' : results.length}</h2>
                <TmdbAttribution compact />
              </div>
              {error && <p className="mb-3 rounded-md border border-[#e3c2bc] bg-[#fbefec] px-3 py-2 text-sm text-danger" role="alert">{error} — 아래 내 라이브러리 결과는 계속 사용할 수 있습니다.</p>}
              {loading ? (
                <p className="text-sm text-muted" role="status">TMDB에서 찾는 중…</p>
              ) : results.length ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {results.map((m) => {
                    const lib = matchWork(data.works, m);
                    return (
                      <Link key={m.id} href={movieHref(m.id)} className="group flex flex-col overflow-hidden rounded-lg border border-line bg-card hover:shadow-md">
                        {m.posterPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={tmdbImageUrl(m.posterPath, 'w342')} alt={`${m.titleKo} 포스터`} loading="lazy" className="aspect-[2/3] w-full bg-paper-2 object-cover" />
                        ) : (
                          <div className="flex aspect-[2/3] items-center justify-center bg-paper-2 text-xs text-muted">포스터 없음</div>
                        )}
                        <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                          <span className="font-serif text-sm font-semibold leading-snug group-hover:underline">{m.titleKo}</span>
                          <span className="text-xs text-muted">{m.titleEn}{m.releaseYear ? ` · ${m.releaseYear}` : ''}</span>
                          <span className="mt-1 flex flex-wrap gap-1 text-[10px]">
                            {m.isAnimation && <span className="rounded border border-line px-1 text-ink-2">애니메이션</span>}
                            {lib && <span className="rounded border border-[#bcd5cb] bg-fact-bg px-1 text-fact">내 라이브러리</span>}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                !error && <p className="text-sm text-muted">TMDB에서 일치하는 작품을 찾지 못했습니다. 철자를 바꾸거나 영문 제목으로 검색해 보세요.</p>
              )}
            </section>
          )}

          <section>
            <h2 className="mb-3 font-serif text-lg font-semibold">내 라이브러리 {localOnly.length}{status?.tmdb && local.length !== localOnly.length ? <span className="ml-2 text-xs font-normal text-muted">(TMDB 결과와 같은 작품 {local.length - localOnly.length}개는 위에 표시)</span> : null}</h2>
            {localOnly.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {localOnly.map((w) => (
                  <div key={w.id} className="flex gap-3 rounded-lg border border-line bg-card p-3">
                    <Link href={workHref(w.slug)} className="w-20 shrink-0">
                      {w.tmdbPosterPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tmdbImageUrl(w.tmdbPosterPath, 'w185')} alt={`${w.titleKo} 포스터`} className="aspect-[2/3] w-full rounded object-cover" />
                      ) : (
                        <SceneMedia assetId={w.coverAssetId} seed={w.id} categoryId={w.categoryId} label={w.titleKo} className="aspect-[2/3] rounded [&_span]:hidden" />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-col gap-1">
                      <CategoryChip id={w.categoryId} size="xs" />
                      <Link href={workHref(w.slug)} className="font-serif font-semibold leading-snug hover:underline">{w.titleKo}</Link>
                      <span className="text-xs text-muted">{w.titleEn} · {w.releaseYear}</span>
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                        <LinkButton size="sm" href={workHref(w.slug)}>작품 연구 노트</LinkButton>
                        {w.tmdbId ? <LinkButton size="sm" href={movieHref(w.tmdbId)}>이미지 후보</LinkButton> : null}
                        <LinkButton size="sm" href={`/capture?work=${w.id}`}>이미지 올리기</LinkButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{status?.tmdb ? '위 TMDB 결과 외에 라이브러리에만 있는 작품은 없습니다.' : '내 라이브러리에서 일치하는 작품을 찾지 못했습니다.'} 키워드로 장면을 찾으려면 <Link className="underline" href={`/explore?q=${encodeURIComponent(q0)}`}>통합 탐색</Link>을 사용하세요.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
