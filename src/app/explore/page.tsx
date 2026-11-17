'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { BoardCard, SceneCard, SourceRow, WorkCard } from '@/components/Cards';
import { FilterPanel } from '@/components/FilterPanel';
import { Button, EmptyState, LinkButton, PageHeader, Select, TagChip, TextInput } from '@/components/ui';
import { INSIGHT_KIND_LABEL } from '@/lib/labels';
import { emptyFilters, relatedTags, runExplore, sortItems, type ExploreFilters, type ResultType, type SortKey } from '@/lib/search';
import { useAtlas, useLookups } from '@/lib/store';
import type { CategoryId, Lens, VerificationStatus } from '@/lib/types';
import { cx } from '@/lib/util';

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

function filtersFromParams(p: URLSearchParams): { f: ExploreFilters; type: ResultType; sort: SortKey } {
  const f = emptyFilters();
  f.q = p.get('q') ?? '';
  f.mode = p.get('mode') === 'or' ? 'or' : 'and';
  f.categories = list(p.get('category')) as CategoryId[];
  f.workIds = list(p.get('work'));
  f.yearMin = p.get('yearMin') ? Number(p.get('yearMin')) : null;
  f.yearMax = p.get('yearMax') ? Number(p.get('yearMax')) : null;
  f.lenses = list(p.get('lens')) as Lens[];
  f.tagIds = list(p.get('tags'));
  f.verification = list(p.get('verification')) as VerificationStatus[];
  f.bookmarkOnly = p.get('bookmark') === '1';
  f.hues = list(p.get('hue')) as ExploreFilters['hues'];
  const type = (p.get('type') as ResultType) || 'all';
  const sort = (p.get('sort') as SortKey) || 'updated';
  return { f, type, sort };
}

function paramsFrom(f: ExploreFilters, type: ResultType, sort: SortKey): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.mode === 'or') p.set('mode', 'or');
  if (f.categories.length) p.set('category', f.categories.join(','));
  if (f.workIds.length) p.set('work', f.workIds.join(','));
  if (f.yearMin != null) p.set('yearMin', String(f.yearMin));
  if (f.yearMax != null) p.set('yearMax', String(f.yearMax));
  if (f.lenses.length) p.set('lens', f.lenses.join(','));
  if (f.tagIds.length) p.set('tags', f.tagIds.join(','));
  if (f.verification.length) p.set('verification', f.verification.join(','));
  if (f.bookmarkOnly) p.set('bookmark', '1');
  if (f.hues?.length) p.set('hue', f.hues.join(','));
  if (type !== 'all') p.set('type', type);
  if (sort !== 'updated') p.set('sort', sort);
  return p.toString();
}

function ExploreInner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useAtlas();
  const { workById } = useLookups();
  const initial = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params]);
  const [filters, setFilters] = useState(initial.f);
  const [type, setType] = useState<ResultType>(initial.type);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [qDraft, setQDraft] = useState(initial.f.q);
  const [drawer, setDrawer] = useState(false);

  // Re-sync when the URL changes from outside (e.g. global search).
  useEffect(() => {
    setFilters(initial.f);
    setType(initial.type);
    setSort(initial.sort);
    setQDraft(initial.f.q);
  }, [initial]);

  const update = (f: ExploreFilters, t = type, s = sort) => {
    setFilters(f);
    setType(t);
    setSort(s);
    const qs = paramsFrom(f, t, s);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const results = useMemo(() => runExplore(data, filters), [data, filters]);
  const works = sortItems(results.works, sort, (w) => w.titleKo, (w) => w.releaseYear);
  const scenes = sortItems(results.scenes, sort, (s) => s.title, (s) => workById.get(s.workId)?.releaseYear);
  const boards = sortItems(results.boards, sort, (b) => b.title, () => undefined);
  const sources = sortItems(results.sources, sort, (s) => s.title, () => undefined);
  const insights = sortItems(results.insights, sort, (i) => i.title, () => undefined);
  const total = works.length + scenes.length + boards.length + sources.length + insights.length;

  const tabs: Array<{ id: ResultType; label: string; n: number }> = [
    { id: 'all', label: '전체', n: total },
    { id: 'works', label: '작품', n: works.length },
    { id: 'scenes', label: '장면', n: scenes.length },
    { id: 'boards', label: '보드', n: boards.length },
    { id: 'sources', label: '출처', n: sources.length },
    { id: 'insights', label: '인사이트', n: insights.length },
  ];

  const activeCount =
    filters.categories.length + filters.workIds.length + filters.lenses.length + filters.tagIds.length + filters.verification.length + (filters.hues?.length ?? 0) + (filters.bookmarkOnly ? 1 : 0) + (filters.yearMin != null || filters.yearMax != null ? 1 : 0);
  const show = (t: ResultType) => type === 'all' || type === t;
  const related = total === 0 ? relatedTags(data.tags, filters.q) : [];

  return (
    <div>
      <PageHeader eyebrow="Explore" title="통합 탐색" sub="작품·장면·보드·출처·인사이트를 한국어/영어로 함께 검색하고 다중 필터로 좁힙니다." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ ...filters, q: qDraft });
        }}
        className="mb-4 flex flex-wrap gap-2"
      >
        <label htmlFor="explore-q" className="sr-only">검색어</label>
        <TextInput id="explore-q" value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder='예: 지브리 + 여백 + 고독 · 고독 AND 롱숏 · "세계 규칙" · Spirited Away' className="min-w-0 flex-1 basis-64" />
        <Button type="submit" variant="primary">검색</Button>
        <Button className="lg:hidden" onClick={() => setDrawer(true)} aria-expanded={drawer} aria-controls="filter-drawer">
          필터{activeCount ? ` (${activeCount})` : ''}
        </Button>
        {(activeCount > 0 || filters.q) && (
          <Button variant="ghost" onClick={() => { setQDraft(''); update(emptyFilters(), 'all', sort); }}>
            모두 초기화
          </Button>
        )}
      </form>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label="필터">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            <FilterPanel filters={filters} onChange={(f) => update(f)} />
          </div>
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true" aria-label="필터">
            <div className="flex-1 bg-ink/40" onClick={() => setDrawer(false)} />
            <div id="filter-drawer" className="flex h-full w-[86vw] max-w-sm flex-col bg-paper">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="font-semibold">필터</p>
                <Button size="sm" variant="primary" onClick={() => setDrawer(false)}>결과 {total}개 보기</Button>
              </div>
              <div className="flex-1 overflow-y-auto px-4">
                <FilterPanel filters={filters} onChange={(f) => update(f)} />
              </div>
            </div>
          </div>
        )}

        <section aria-label="검색 결과" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="결과 유형">
              {tabs.map((t) => (
                <button key={t.id} role="tab" type="button" aria-selected={type === t.id} onClick={() => update(filters, t.id)} className={cx('rounded-md px-2.5 py-1.5 text-xs font-medium', type === t.id ? 'bg-ink text-paper' : 'bg-card text-ink-2 border border-line hover:border-ink')}>
                  {t.label} <span className="opacity-70">{t.n}</span>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 whitespace-nowrap text-xs text-muted">
              정렬
              <Select value={sort} onChange={(e) => update(filters, type, e.target.value as SortKey)} className="h-8 w-auto text-xs">
                <option value="updated">최근 수정</option>
                <option value="created">수집일</option>
                <option value="year">작품 연도</option>
                <option value="name">이름</option>
              </Select>
            </label>
          </div>

          {total === 0 ? (
            <EmptyState
              title="일치하는 결과가 없습니다."
              body={
                <div className="flex flex-col items-center gap-3">
                  <span>검색어를 바꾸거나 OR(합집합)로 바꿔 보세요. 결과를 임의로 채우지 않습니다.</span>
                  {related.length > 0 && (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-semibold">관련 태그 보기</span>
                      <div className="flex flex-wrap justify-center gap-1">
                        {related.map((t) => <TagChip key={t.id} tag={t} onClick={() => update({ ...filters, q: '', tagIds: [t.id] }, 'scenes')} />)}
                      </div>
                    </div>
                  )}
                </div>
              }
              action={<LinkButton href="/scenes/new" variant="primary">+ 새 장면 추가</LinkButton>}
            />
          ) : (
            <div className="flex flex-col gap-8">
              {show('works') && works.length > 0 && (
                <div>
                  {type === 'all' && <h2 className="mb-2 text-sm font-semibold text-ink-2">작품 {works.length}</h2>}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{works.map((w) => <WorkCard key={w.id} work={w} />)}</div>
                </div>
              )}
              {show('scenes') && scenes.length > 0 && (
                <div>
                  {type === 'all' && <h2 className="mb-2 text-sm font-semibold text-ink-2">장면 {scenes.length}</h2>}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{scenes.map((s) => <SceneCard key={s.id} scene={s} />)}</div>
                </div>
              )}
              {show('boards') && boards.length > 0 && (
                <div>
                  {type === 'all' && <h2 className="mb-2 text-sm font-semibold text-ink-2">보드 {boards.length}</h2>}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{boards.map((b) => <BoardCard key={b.id} board={b} />)}</div>
                </div>
              )}
              {show('sources') && sources.length > 0 && (
                <div>
                  {type === 'all' && <h2 className="mb-2 text-sm font-semibold text-ink-2">출처 {sources.length}</h2>}
                  <div className="grid gap-3 md:grid-cols-2">{sources.map((s) => <SourceRow key={s.id} source={s} />)}</div>
                </div>
              )}
              {show('insights') && insights.length > 0 && (
                <div>
                  {type === 'all' && <h2 className="mb-2 text-sm font-semibold text-ink-2">인사이트 {insights.length}</h2>}
                  <ul className="grid gap-3 md:grid-cols-2">
                    {insights.map((i) => (
                      <li key={i.id}>
                        <Link href={`/insights#${i.id}`} className="block rounded-md border border-line bg-card p-3 hover:border-ink">
                          <span className="text-[10px] font-semibold text-hypo">{INSIGHT_KIND_LABEL[i.kind]}</span>
                          <p className="font-medium">{i.title}</p>
                          <p className="line-clamp-2 text-xs text-ink-2">{i.body}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {type !== 'all' && tabs.find((t) => t.id === type)?.n === 0 && <EmptyState title="이 유형에는 결과가 없습니다." body="다른 결과 유형 탭을 확인하세요." />}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">불러오는 중...</p>}>
      <ExploreInner />
    </Suspense>
  );
}
