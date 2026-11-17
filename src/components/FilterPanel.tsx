'use client';

import { useState } from 'react';
import { seedCategories } from '@seed/categories';
import { FACETS, FACET_LABEL, LENSES, LENS_LABEL, VERIFICATION_LABEL } from '@/lib/labels';
import type { ExploreFilters } from '@/lib/search';
import { useAtlas } from '@/lib/store';
import type { VerificationStatus } from '@/lib/types';
import { cx } from '@/lib/util';
import { HUE_FAMILY_LABEL, type HueFamily } from '@/lib/imports';
import { TagChip, ToggleChip } from './ui';

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function Group({ title, children, defaultOpen = true, count }: { title: string; children: React.ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-3">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">
        <span>
          {title}
          {count ? <span className="ml-1.5 rounded bg-ink px-1.5 py-0.5 text-[10px] text-paper">{count}</span> : null}
        </span>
        <span aria-hidden className="text-muted">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-2.5 flex flex-wrap gap-1.5">{children}</div>}
    </div>
  );
}

export function FilterPanel({ filters, onChange }: { filters: ExploreFilters; onChange: (f: ExploreFilters) => void }) {
  const { data } = useAtlas();
  const set = (patch: Partial<ExploreFilters>) => onChange({ ...filters, ...patch });
  const works = data.works
    .filter((w) => filters.categories.length === 0 || filters.categories.includes(w.categoryId))
    .sort((a, b) => a.releaseYear - b.releaseYear);
  const years = Array.from(new Set(data.works.map((w) => w.releaseYear))).sort();

  return (
    <div className="text-sm">
      <div className="border-b border-line pb-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">검색어·태그 결합</p>
        <div className="flex gap-1.5" role="radiogroup" aria-label="검색 결합 방식">
          <ToggleChip active={filters.mode === 'and'} onClick={() => set({ mode: 'and' })} title="모든 조건을 만족 (교집합)">AND · 교집합</ToggleChip>
          <ToggleChip active={filters.mode === 'or'} onClick={() => set({ mode: 'or' })} title="하나라도 만족 (합집합)">OR · 합집합</ToggleChip>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">검색창에 직접 AND/OR, +를 쓰면 그 방식이 우선합니다. 서로 다른 필터 그룹끼리는 항상 AND로 결합됩니다.</p>
      </div>

      <Group title="카테고리" count={filters.categories.length}>
        {seedCategories.map((c) => (
          <ToggleChip key={c.id} active={filters.categories.includes(c.id)} onClick={() => set({ categories: toggle(filters.categories, c.id), workIds: [] })}>
            {c.label}
          </ToggleChip>
        ))}
      </Group>

      <Group title="작품" count={filters.workIds.length} defaultOpen={false}>
        {works.map((w) => (
          <ToggleChip key={w.id} active={filters.workIds.includes(w.id)} onClick={() => set({ workIds: toggle(filters.workIds, w.id) })}>
            {w.titleKo}
          </ToggleChip>
        ))}
      </Group>

      <Group title="연도" count={filters.yearMin != null || filters.yearMax != null ? 1 : 0} defaultOpen={false}>
        <div className="flex w-full items-center gap-2">
          <label className="sr-only" htmlFor="year-min">시작 연도</label>
          <select id="year-min" className="h-8 flex-1 rounded border border-line-2 bg-card px-2 text-xs" value={filters.yearMin ?? ''} onChange={(e) => set({ yearMin: e.target.value ? Number(e.target.value) : null })}>
            <option value="">처음</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-muted">–</span>
          <label className="sr-only" htmlFor="year-max">끝 연도</label>
          <select id="year-max" className="h-8 flex-1 rounded border border-line-2 bg-card px-2 text-xs" value={filters.yearMax ?? ''} onChange={(e) => set({ yearMax: e.target.value ? Number(e.target.value) : null })}>
            <option value="">끝</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </Group>

      <Group title="연구 관점" count={filters.lenses.length}>
        {LENSES.map((l) => (
          <ToggleChip key={l} active={filters.lenses.includes(l)} onClick={() => set({ lenses: toggle(filters.lenses, l) })}>
            {LENS_LABEL[l].en} · {LENS_LABEL[l].ko}
          </ToggleChip>
        ))}
      </Group>

      {FACETS.map((facet) => {
        const tags = data.tags.filter((t) => t.facet === facet);
        if (!tags.length) return null;
        const selected = tags.filter((t) => filters.tagIds.includes(t.id)).length;
        return (
          <Group key={facet} title={`태그 · ${FACET_LABEL[facet]}`} count={selected} defaultOpen={facet === 'emotion' || selected > 0}>
            {tags.map((t) => (
              <TagChip key={t.id} tag={t} active={filters.tagIds.includes(t.id)} onClick={() => set({ tagIds: toggle(filters.tagIds, t.id) })} />
            ))}
          </Group>
        );
      })}

      <Group title="색상 계열 (실제 팔레트)" count={(filters.hues ?? []).length} defaultOpen={(filters.hues ?? []).length > 0}>
        {(Object.keys(HUE_FAMILY_LABEL) as HueFamily[]).map((h) => (
          <ToggleChip key={h} active={(filters.hues ?? []).includes(h)} onClick={() => set({ hues: toggle(filters.hues ?? [], h) })}>
            {HUE_FAMILY_LABEL[h]}
          </ToggleChip>
        ))}
        <p className="w-full text-[10px] text-muted">이미지에서 추출한 팔레트의 15% 이상을 차지하는 색 계열. 팔레트가 없는 장면은 제외됩니다.</p>
      </Group>

      <Group title="검증 단계" count={filters.verification.length}>
        {(Object.keys(VERIFICATION_LABEL) as VerificationStatus[]).map((v) => (
          <ToggleChip key={v} active={filters.verification.includes(v)} onClick={() => set({ verification: toggle(filters.verification, v) })}>
            {VERIFICATION_LABEL[v]}
          </ToggleChip>
        ))}
      </Group>

      <div className="py-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={filters.bookmarkOnly} onChange={(e) => set({ bookmarkOnly: e.target.checked })} className={cx('h-4 w-4 accent-ink')} />
          북마크만 보기
        </label>
      </div>
      <p className="text-[11px] leading-relaxed text-muted">태그·검증·북마크 필터는 장면에 적용되며, 작품·보드는 일치하는 장면을 포함할 때 표시됩니다. 출처에는 태그/북마크 필터가 적용되지 않습니다.</p>
    </div>
  );
}
