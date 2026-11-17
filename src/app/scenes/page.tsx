'use client';

import Link from 'next/link';

import { useMemo, useState } from 'react';
import { SceneCard } from '@/components/Cards';
import { CategoryTabs, LensToggles } from '@/components/CategoryTabs';
import { EmptyState, LinkButton, PageHeader, Select, TextInput, ToggleChip } from '@/components/ui';
import { VERIFICATION_LABEL } from '@/lib/labels';
import { emptyFilters, runExplore, sortItems, type SortKey } from '@/lib/search';
import { useAtlas, useLookups } from '@/lib/store';
import type { CategoryId, Lens, VerificationStatus } from '@/lib/types';

export default function ScenesPage() {
  const { data } = useAtlas();
  const { workById } = useLookups();
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [q, setQ] = useState('');
  const [ver, setVer] = useState<VerificationStatus[]>([]);
  const [sort, setSort] = useState<SortKey>('year');

  const scenes = useMemo(() => {
    const f = { ...emptyFilters(), q, categories: cat === 'all' ? [] : [cat], lenses, verification: ver };
    return sortItems(runExplore(data, f).scenes, sort, (s) => s.title, (s) => workById.get(s.workId)?.releaseYear);
  }, [data, q, cat, lenses, ver, sort, workById]);

  const workCat = new Map(data.works.map((w) => [w.id, w.categoryId]));
  const counts = {
    all: data.scenes.length,
    sony: data.scenes.filter((s) => workCat.get(s.workId) === 'sony').length,
    disney: data.scenes.filter((s) => workCat.get(s.workId) === 'disney').length,
    ghibli: data.scenes.filter((s) => workCat.get(s.workId) === 'ghibli').length,
  };

  return (
    <div>
      <PageHeader eyebrow="Scene Library" title="장면" sub="수집한 장면과 연구 시트의 장면 후보. 카드에서 북마크·보드 추가·비교함 담기를 할 수 있습니다." right={<LinkButton href="/scenes/new" variant="primary">+ 장면 추가</LinkButton>} />
      <div className="mb-4 flex flex-col gap-3">
        <CategoryTabs value={cat} onChange={setCat} counts={counts} />
        <div className="flex flex-wrap items-center gap-3">
          <LensToggles value={lenses} onChange={setLenses} label="관점" />
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(VERIFICATION_LABEL) as VerificationStatus[]).map((v) => (
              <ToggleChip key={v} active={ver.includes(v)} onClick={() => setVer(ver.includes(v) ? ver.filter((x) => x !== v) : [...ver, v])}>{VERIFICATION_LABEL[v]}</ToggleChip>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="scene-q" className="sr-only">장면 검색</label>
          <TextInput id="scene-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="장면·작품·태그·메모 검색 (AND/OR 지원)" className="max-w-md" />
          <label className="ml-auto flex items-center gap-2 whitespace-nowrap text-xs text-muted">
            정렬
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-8 w-auto text-xs">
              <option value="year">작품 연도</option>
              <option value="updated">최근 수정</option>
              <option value="created">수집일</option>
              <option value="name">이름</option>
            </Select>
          </label>
        </div>
        <p className="text-xs text-muted">{scenes.length}개 장면 · 더 많은 필터(태그·샷·색·제작 방식 등)는 <Link href="/explore?type=scenes" className="underline">통합 탐색</Link>에서.</p>
      </div>
      {scenes.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{scenes.map((s) => <SceneCard key={s.id} scene={s} />)}</div>
      ) : (
        <EmptyState title="조건에 맞는 장면이 없습니다." action={<LinkButton href="/scenes/new" variant="primary">+ 새 장면 추가</LinkButton>} />
      )}
    </div>
  );
}
