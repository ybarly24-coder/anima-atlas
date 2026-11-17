'use client';

import { useEffect, useMemo, useState } from 'react';
import { seedCategories } from '@seed/categories';
import { EVIDENCE_LABEL, SOURCE_TYPE_LABEL, VERIFICATION_LABEL } from '@/lib/labels';
import { useAtlas } from '@/lib/store';
import type { CategoryId, EvidenceType, Source, SourceType, VerificationStatus } from '@/lib/types';
import { isValidUrl, newId, nowIso } from '@/lib/util';
import { Button, Dialog, Field, Select, TextArea, TextInput, ToggleChip } from './ui';

export function SourceEditor({ open, onClose, source, defaults, onSaved }: { open: boolean; onClose: () => void; source?: Source | null; defaults?: Partial<Source>; onSaved?: (s: Source) => void }) {
  const { data, saveSource, notify } = useAtlas();
  const blank = useMemo(
    () => ({
      title: '', url: '', publisher: '', accessedAt: new Date().toISOString().slice(0, 10),
      sourceType: 'analysis' as SourceType, evidenceType: 'secondary' as EvidenceType, verificationStatus: 'unverified' as VerificationStatus,
      relatedWorkIds: [] as string[], categoryIds: [] as CategoryId[], notes: '', altSearchHint: '',
    }),
    [],
  );
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF({ ...blank, ...(defaults ?? {}), ...(source ?? {}), notes: source?.notes ?? defaults?.notes ?? '', altSearchHint: source?.altSearchHint ?? '' } as typeof blank);
  }, [open, source, defaults, blank]);

  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = '출처 제목을 입력하세요.';
    if (!isValidUrl(f.url.trim())) e.url = 'http(s)로 시작하는 올바른 URL을 입력하세요.';
    if (!f.publisher.trim()) e.publisher = '발행 기관을 입력하세요.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.accessedAt)) e.accessedAt = 'YYYY-MM-DD 형식으로 입력하세요.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const now = nowIso();
    const cats = new Set<CategoryId>(f.categoryIds);
    f.relatedWorkIds.forEach((id) => {
      const w = data.works.find((x) => x.id === id);
      if (w) cats.add(w.categoryId);
    });
    const next: Source = {
      ...(source ?? {}),
      id: source?.id ?? newId('src'),
      code: source?.code,
      title: f.title.trim(),
      url: f.url.trim(),
      publisher: f.publisher.trim(),
      accessedAt: f.accessedAt,
      sourceType: f.sourceType,
      evidenceType: f.evidenceType,
      verificationStatus: f.verificationStatus,
      relatedWorkIds: f.relatedWorkIds,
      categoryIds: Array.from(cats),
      notes: f.notes.trim() || undefined,
      altSearchHint: f.altSearchHint.trim() || undefined,
      createdAt: source?.createdAt ?? now,
      updatedAt: now,
    };
    await saveSource(next);
    notify(source ? '출처를 저장했습니다.' : '출처를 추가했습니다.');
    onSaved?.(next);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={source ? '출처 편집' : '출처 추가'} wide footer={<><Button onClick={onClose}>취소</Button><Button variant="primary" onClick={save}>저장</Button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="원문 제목" htmlFor="s-title" error={errors.title} required>
            <TextInput id="s-title" value={f.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="URL" htmlFor="s-url" error={errors.url} required>
            <TextInput id="s-url" type="url" value={f.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://" />
          </Field>
        </div>
        <Field label="발행 기관" htmlFor="s-pub" error={errors.publisher} required>
          <TextInput id="s-pub" value={f.publisher} onChange={(e) => set({ publisher: e.target.value })} />
        </Field>
        <Field label="확인일" htmlFor="s-date" error={errors.accessedAt} required>
          <TextInput id="s-date" type="date" value={f.accessedAt} onChange={(e) => set({ accessedAt: e.target.value })} />
        </Field>
        <Field label="자료 유형" htmlFor="s-type">
          <Select id="s-type" value={f.sourceType} onChange={(e) => set({ sourceType: e.target.value as SourceType })}>
            {(Object.keys(SOURCE_TYPE_LABEL) as SourceType[]).map((k) => <option key={k} value={k}>{SOURCE_TYPE_LABEL[k]}</option>)}
          </Select>
        </Field>
        <Field label="근거 수준" htmlFor="s-ev" hint="스튜디오/배급사 공식 자료만 '공식 1차 자료'로 지정하세요. 비평·보도·소프트웨어사 자료는 2차 자료입니다.">
          <Select id="s-ev" value={f.evidenceType} onChange={(e) => set({ evidenceType: e.target.value as EvidenceType })}>
            {(Object.keys(EVIDENCE_LABEL) as EvidenceType[]).map((k) => <option key={k} value={k}>{EVIDENCE_LABEL[k]}</option>)}
          </Select>
        </Field>
        <Field label="검증 상태" htmlFor="s-ver" hint="'확인됨'은 링크에 해당 정보가 실재함을 확인했다는 뜻이며 해석의 정확성을 보증하지 않습니다.">
          <Select id="s-ver" value={f.verificationStatus} onChange={(e) => set({ verificationStatus: e.target.value as VerificationStatus })}>
            {(Object.keys(VERIFICATION_LABEL) as VerificationStatus[]).map((k) => <option key={k} value={k}>{VERIFICATION_LABEL[k]}</option>)}
          </Select>
        </Field>
        <Field label="대체 검색 힌트" htmlFor="s-hint" hint="URL이 사라졌을 때 원문을 다시 찾기 위한 검색어.">
          <TextInput id="s-hint" value={f.altSearchHint} onChange={(e) => set({ altSearchHint: e.target.value })} />
        </Field>
        <div className="md:col-span-2">
          <p className="mb-1.5 text-sm font-medium">카테고리</p>
          <div className="flex flex-wrap gap-1.5">
            {seedCategories.map((c) => (
              <ToggleChip key={c.id} active={f.categoryIds.includes(c.id)} onClick={() => set({ categoryIds: f.categoryIds.includes(c.id) ? f.categoryIds.filter((x) => x !== c.id) : [...f.categoryIds, c.id] })}>
                {c.label}
              </ToggleChip>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <p className="mb-1.5 text-sm font-medium">연결 작품</p>
          <div className="flex flex-wrap gap-1.5">
            {data.works.map((w) => (
              <ToggleChip key={w.id} active={f.relatedWorkIds.includes(w.id)} onClick={() => set({ relatedWorkIds: f.relatedWorkIds.includes(w.id) ? f.relatedWorkIds.filter((x) => x !== w.id) : [...f.relatedWorkIds, w.id] })}>
                {w.titleKo}
              </ToggleChip>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <Field label="메모 (원문이 다루는 내용)" htmlFor="s-notes">
            <TextArea id="s-notes" value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

/** Link/unlink sources from the library, or create a new one inline. */
export function SourcePicker({ value, onChange, defaultWorkId }: { value: string[]; onChange: (ids: string[]) => void; defaultWorkId?: string }) {
  const { data } = useAtlas();
  const [q, setQ] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const linked = value.map((id) => data.sources.find((s) => s.id === id)).filter(Boolean) as Source[];
  const work = data.works.find((w) => w.id === defaultWorkId);
  const candidates = data.sources
    .filter((s) => !value.includes(s.id))
    .filter((s) => {
      if (!q.trim()) return work ? s.relatedWorkIds.includes(work.id) || s.categoryIds.includes(work.categoryId) : true;
      const t = q.toLowerCase();
      return `${s.code ?? ''} ${s.title} ${s.publisher} ${s.notes ?? ''}`.toLowerCase().includes(t);
    })
    .slice(0, 12);

  return (
    <div className="flex flex-col gap-2">
      {linked.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {linked.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 rounded border border-line bg-card px-2.5 py-1.5 text-xs">
              <span className="min-w-0 truncate">
                {s.code && <span className="mr-1 font-mono font-semibold">[{s.code}]</span>}
                {s.title} <span className="text-muted">· {EVIDENCE_LABEL[s.evidenceType]}</span>
              </span>
              <button type="button" onClick={() => onChange(value.filter((x) => x !== s.id))} className="shrink-0 text-muted hover:text-danger" aria-label={`${s.title} 연결 해제`}>
                해제
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">연결된 출처가 없습니다.</p>
      )}
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="source-picker-q">출처 검색</label>
        <TextInput id="source-picker-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="출처 라이브러리 검색 (예: Imageworks, D4)" className="h-8 text-xs" />
        <Button size="sm" onClick={() => setEditorOpen(true)}>+ 새 출처</Button>
      </div>
      {candidates.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {candidates.map((s) => (
            <button key={s.id} type="button" onClick={() => onChange([...value, s.id])} className="rounded border border-dashed border-line-2 px-2 py-1 text-left text-[11px] text-ink-2 hover:border-ink">
              + {s.code ? `[${s.code}] ` : ''}
              {s.title}
            </button>
          ))}
        </div>
      )}
      <SourceEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        defaults={work ? { relatedWorkIds: [work.id], categoryIds: [work.categoryId] } : undefined}
        onSaved={(s) => onChange([...value, s.id])}
      />
    </div>
  );
}
