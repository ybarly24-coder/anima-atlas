'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { WorkCard } from '@/components/Cards';
import { CategoryTabs } from '@/components/CategoryTabs';
import { WorkEditor } from '@/components/WorkEditor';
import { Button, EmptyState, PageHeader, Select } from '@/components/ui';
import { useAtlas } from '@/lib/store';
import type { CategoryId } from '@/lib/types';
import { workHref } from '@/lib/routes';

function WorksInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { data } = useAtlas();
  const initialCat = (params.get('category') as CategoryId | null) ?? 'all';
  const [cat, setCat] = useState<CategoryId | 'all'>(initialCat);
  const [sort, setSort] = useState<'year' | 'name' | 'updated'>('year');
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (params.get('new') === '1') setEditorOpen(true);
  }, [params]);

  const works = data.works
    .filter((w) => cat === 'all' || w.categoryId === cat)
    .sort((a, b) => (sort === 'year' ? a.releaseYear - b.releaseYear : sort === 'name' ? a.titleKo.localeCompare(b.titleKo, 'ko') : b.updatedAt.localeCompare(a.updatedAt)));

  const counts = {
    all: data.works.length,
    sony: data.works.filter((w) => w.categoryId === 'sony').length,
    disney: data.works.filter((w) => w.categoryId === 'disney').length,
    ghibli: data.works.filter((w) => w.categoryId === 'ghibli').length,
  };

  return (
    <div>
      <PageHeader eyebrow="Work Library" title="작품" sub="카테고리 → 작품 → 장면 → 분석의 단위로 연구 자료를 묶습니다." right={<Button variant="primary" onClick={() => setEditorOpen(true)}>+ 작품 추가</Button>} />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <CategoryTabs
          value={cat}
          counts={counts}
          onChange={(c) => {
            setCat(c);
            router.replace(c === 'all' ? '/works' : `/works?category=${c}`, { scroll: false });
          }}
        />
        <label className="flex items-center gap-2 whitespace-nowrap text-xs text-muted">
          정렬
          <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-8 w-auto text-xs">
            <option value="year">작품 연도</option>
            <option value="name">이름</option>
            <option value="updated">최근 수정</option>
          </Select>
        </label>
      </div>
      {works.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {works.map((w) => <WorkCard key={w.id} work={w} />)}
        </div>
      ) : (
        <EmptyState title="이 카테고리에 작품이 없습니다." action={<Button variant="primary" onClick={() => setEditorOpen(true)}>+ 작품 추가</Button>} />
      )}
      <WorkEditor
        open={editorOpen}
        defaultCategory={cat === 'all' ? undefined : cat}
        onClose={() => {
          setEditorOpen(false);
          if (params.get('new')) router.replace('/works', { scroll: false });
        }}
        onSaved={(w) => router.push(workHref(w.slug))}
      />
    </div>
  );
}

export default function WorksPage() {
  return (
    <Suspense>
      <WorksInner />
    </Suspense>
  );
}
