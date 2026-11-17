'use client';

import { useMemo, useState } from 'react';
import { seedCategories } from '@seed/categories';
import { emptyFilters, runExplore } from '@/lib/search';
import { useAtlas, useLookups } from '@/lib/store';
import type { CategoryId } from '@/lib/types';
import { Button, Dialog, TextInput, ToggleChip, VerificationBadge } from './ui';

/** Pick scenes (or works) to add to a board / comparison. */
export function ScenePickerDialog({ open, onClose, exclude, onPick, max, mode = 'scene', title = '장면 선택' }: { open: boolean; onClose: () => void; exclude: string[]; onPick: (ids: string[]) => void; max?: number; mode?: 'scene' | 'work'; title?: string }) {
  const { data } = useAtlas();
  const { workById } = useLookups();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  const items = useMemo(() => {
    const r = runExplore(data, { ...emptyFilters(), q, categories: cat ? [cat] : [] });
    return mode === 'scene'
      ? r.scenes.filter((s) => !exclude.includes(s.id)).map((s) => ({ id: s.id, title: s.title, sub: `${workById.get(s.workId)?.titleKo ?? ''}${s.seedCode ? ` · ${s.seedCode}` : ''}`, ver: s.verificationStatus }))
      : r.works.filter((w) => !exclude.includes(w.id)).map((w) => ({ id: w.id, title: w.titleKo, sub: `${w.titleEn} · ${w.releaseYear}`, ver: undefined }));
  }, [data, q, cat, exclude, mode, workById]);

  const limit = max != null ? max : Infinity;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= limit ? p : [...p, id]));
  const done = () => {
    onPick(picked);
    setPicked([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      wide
      footer={
        <>
          <span className="mr-auto self-center text-xs text-muted">{picked.length}개 선택{max != null ? ` (최대 ${max})` : ''}</span>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={done} disabled={!picked.length}>추가</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label htmlFor="picker-q" className="sr-only">검색</label>
        <TextInput id="picker-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목·작품·태그 검색" />
        <div className="flex flex-wrap gap-1.5">
          {seedCategories.map((c) => <ToggleChip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>{c.label}</ToggleChip>)}
        </div>
        <ul className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto">
          {items.length === 0 && <li className="py-6 text-center text-sm text-muted">결과가 없습니다.</li>}
          {items.map((it) => (
            <li key={it.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-line px-3 py-2 text-sm hover:border-ink">
                <input type="checkbox" className="h-4 w-4 accent-ink" checked={picked.includes(it.id)} onChange={() => toggle(it.id)} disabled={!picked.includes(it.id) && picked.length >= limit} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{it.title}</span>
                  <span className="block truncate text-xs text-muted">{it.sub}</span>
                </span>
                {it.ver && <VerificationBadge status={it.ver} />}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
