'use client';

import { useState } from 'react';
import { FACETS, FACET_LABEL } from '@/lib/labels';
import { useAtlas } from '@/lib/store';
import type { Tag } from '@/lib/types';
import { newId, nowIso } from '@/lib/util';
import { Button, TagChip, TextInput } from './ui';

export function TagPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { data, saveTag, notify } = useAtlas();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [newName, setNewName] = useState('');
  const selected = value.map((id) => data.tags.find((t) => t.id === id)).filter(Boolean) as Tag[];
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const createTag = async () => {
    const name = newName.trim();
    if (!name) return;
    const exists = data.tags.find((t) => t.nameKo === name || t.nameEn.toLowerCase() === name.toLowerCase());
    if (exists) {
      if (!value.includes(exists.id)) onChange([...value, exists.id]);
      setNewName('');
      notify(`기존 태그 "${exists.nameKo}"를 추가했습니다.`, 'info');
      return;
    }
    const now = nowIso();
    const t: Tag = { id: newId('tag'), nameKo: name, nameEn: name, facet: 'custom', definition: '사용자 정의 태그', aliases: [], isCustom: true, createdAt: now, updatedAt: now };
    await saveTag(t);
    onChange([...value, t.id]);
    setNewName('');
    notify(`태그 "${name}"를 만들었습니다.`);
  };

  const ql = q.trim().toLowerCase();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {selected.length ? selected.map((t) => <TagChip key={t.id} tag={t} onRemove={() => toggle(t.id)} />) : <span className="text-xs text-muted">선택된 태그 없음</span>}
      </div>
      <Button size="sm" variant="ghost" className="self-start" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? '태그 선택 닫기' : '+ 태그 선택/추가'}
      </Button>
      {open && (
        <div className="flex flex-col gap-3 rounded-md border border-line bg-paper p-3">
          <label className="sr-only" htmlFor="tag-filter">태그 검색</label>
          <TextInput id="tag-filter" value={q} onChange={(e) => setQ(e.target.value)} placeholder="태그 검색 (예: 여백, close-up)" className="h-8 text-xs" />
          {FACETS.map((facet) => {
            const tags = data.tags.filter((t) => t.facet === facet).filter((t) => !ql || `${t.nameKo} ${t.nameEn} ${(t.aliases ?? []).join(' ')}`.toLowerCase().includes(ql));
            if (!tags.length) return null;
            return (
              <div key={facet}>
                <p className="mb-1 text-[11px] font-semibold text-muted">{FACET_LABEL[facet]}</p>
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => <TagChip key={t.id} tag={t} active={value.includes(t.id)} onClick={() => toggle(t.id)} />)}
                </div>
              </div>
            );
          })}
          <div className="flex gap-2 border-t border-line pt-3">
            <label className="sr-only" htmlFor="new-tag">새 태그 이름</label>
            <TextInput
              id="new-tag"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createTag();
                }
              }}
              placeholder="자유 태그 만들기"
              className="h-8 text-xs"
            />
            <Button size="sm" onClick={createTag}>만들기</Button>
          </div>
        </div>
      )}
    </div>
  );
}
