'use client';

import { seedCategories } from '@seed/categories';
import { CATEGORY_ACCENT, LENSES, LENS_LABEL } from '@/lib/labels';
import type { CategoryId, Lens } from '@/lib/types';
import { cx } from '@/lib/util';
import { useAtlas } from '@/lib/store';

export function CategoryTabs({ value, onChange, counts, allowAll = true }: { value: CategoryId | 'all'; onChange: (v: CategoryId | 'all') => void; counts?: Partial<Record<CategoryId | 'all', number>>; allowAll?: boolean }) {
  const { data } = useAtlas();
  // 'other' is an overflow bucket: only show its tab once something lives there.
  const hasOther = data.works.some((w) => w.categoryId === 'other');
  const items: Array<{ id: CategoryId | 'all'; label: string }> = [
    ...(allowAll ? [{ id: 'all' as const, label: '전체' }] : []),
    ...seedCategories.filter((c) => c.id !== 'other' || hasOther || value === 'other').map((c) => ({ id: c.id, label: c.label })),
  ];
  return (
    <div role="tablist" aria-label="리서치 카테고리" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line [scrollbar-width:none]">
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={cx(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold tracking-[0.08em] transition-colors md:text-sm',
              active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {it.id !== 'all' && <span className={cx('h-2 w-2 rounded-full', CATEGORY_ACCENT[it.id].dot)} aria-hidden />}
            {it.label}
            {counts?.[it.id] != null && <span className="rounded bg-paper-2 px-1.5 text-[10px] font-medium text-ink-2">{counts[it.id]}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function LensToggles({ value, onChange, label = 'Research Lenses' }: { value: Lens[]; onChange: (v: Lens[]) => void; label?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      {LENSES.map((l) => {
        const active = value.includes(l);
        return (
          <button
            key={l}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? value.filter((x) => x !== l) : [...value, l])}
            className={cx('rounded-full border px-3 py-1 text-xs font-medium', active ? 'border-ink bg-ink text-paper' : 'border-line-2 bg-card text-ink-2 hover:border-ink')}
          >
            {LENS_LABEL[l].en} <span className="opacity-70">· {LENS_LABEL[l].ko}</span>
          </button>
        );
      })}
      {value.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="text-xs text-muted underline underline-offset-2">
          해제
        </button>
      )}
    </div>
  );
}
