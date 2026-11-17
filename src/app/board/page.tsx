'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { seedCategories } from '@seed/categories';
import { SceneMedia } from '@/components/Placeholder';
import { ScenePickerDialog } from '@/components/ScenePickerDialog';
import { SourcePicker } from '@/components/SourceEditor';
import { Button, CategoryChip, ConfirmationDialog, EmptyState, Field, KindLabel, LinkButton, Select, TextArea, TextInput, ToggleChip, VerificationBadge } from '@/components/ui';
import { boardToJson, boardToMarkdown, safeFilename } from '@/lib/export';
import { BOARD_STATUS_LABEL, LENSES, LENS_LABEL } from '@/lib/labels';
import { COMPARE_MAX, useAtlas, useLookups } from '@/lib/store';
import type { BoardStatus, ResearchBoard, Scene } from '@/lib/types';
import { cx, downloadText, formatTimecode } from '@/lib/util';
import { sceneHref } from '@/lib/routes';

const ANALYSIS_FIELDS: Array<{ key: keyof ResearchBoard; label: string; kind: 'observation' | 'interpretation' | 'fact' | 'hypothesis' | 'application' | 'analysis'; hint?: string }> = [
  { key: 'commonalities', label: '공통 패턴', kind: 'analysis' },
  { key: 'differences', label: '작품별 차이', kind: 'analysis' },
  { key: 'counterexamples', label: '예외/반례', kind: 'analysis' },
  { key: 'interpretation', label: '해석', kind: 'interpretation', hint: '왜 그렇게 보이는가? 복수 해석 가능' },
  { key: 'productionFacts', label: '제작 사실', kind: 'fact', hint: '공식 제작 근거가 확인된 경우에만 기입하고 출처를 연결하세요.' },
  { key: 'hypothesis', label: '가설', kind: 'hypothesis', hint: '다른 작품·장면으로 검증 가능한 가설' },
  { key: 'findings', label: '결론 / 인사이트', kind: 'analysis', hint: '1~2문장 요약' },
  { key: 'applications', label: '창작 적용', kind: 'application', hint: '새 작품 제작에 적용할 연출 실험' },
];

function BoardDetailPageInner() {
  const id = useSearchParams().get('id') ?? '';
  const router = useRouter();
  const { data, saveBoard, deleteBoard, notify, setTray } = useAtlas();
  const { sceneById, workById } = useLookups();
  const stored = data.boards.find((b) => b.id === decodeURIComponent(id));
  const [b, setB] = useState<ResearchBoard | null>(stored ?? null);
  const [baseline, setBaseline] = useState<ResearchBoard | null>(stored ?? null);
  const [picker, setPicker] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (stored && (!b || stored.id !== b.id)) {
      setB(stored);
      setBaseline(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored?.id]);

  // Keep local draft in sync when scenes are added from elsewhere (e.g. AddToBoard) while not dirty.
  const dirty = useMemo(() => !!b && !!baseline && JSON.stringify({ ...b, updatedAt: '' }) !== JSON.stringify({ ...baseline, updatedAt: '' }), [b, baseline]);
  useEffect(() => {
    if (stored && !dirty && baseline && stored.updatedAt !== baseline.updatedAt) {
      setB(stored);
      setBaseline(stored);
    }
  }, [stored, dirty, baseline]);

  if (!b || !stored) return <EmptyState title="보드를 찾을 수 없습니다." action={<LinkButton href="/boards">연구 보드 목록</LinkButton>} />;

  const set = (patch: Partial<ResearchBoard>) => setB((x) => (x ? { ...x, ...patch } : x));
  const scenes = b.sceneIds.map((sid) => sceneById.get(sid)).filter(Boolean) as Scene[];

  const move = (from: number, to: number) => {
    if (to < 0 || to >= b.sceneIds.length) return;
    const ids = [...b.sceneIds];
    const [x] = ids.splice(from, 1);
    ids.splice(to, 0, x);
    set({ sceneIds: ids });
  };

  const save = async () => {
    if (!b.title.trim()) {
      setTitleError('보드 제목을 입력하세요.');
      notify('보드 제목을 입력하세요.', 'error');
      return;
    }
    const workIds = Array.from(new Set([...scenes.map((s) => s.workId)]));
    const cats = Array.from(new Set([...b.categoryIds, ...workIds.map((w) => workById.get(w)?.categoryId).filter(Boolean)])) as ResearchBoard['categoryIds'];
    const next = { ...b, title: b.title.trim(), workIds, categoryIds: cats };
    await saveBoard(next);
    const saved = { ...next, updatedAt: new Date().toISOString() };
    setB(saved);
    setBaseline(saved);
    notify('연구 보드를 저장했습니다.');
  };

  const exportMd = () => {
    downloadText(`${safeFilename(b.title)}.md`, boardToMarkdown(b, data), 'text/markdown');
    if (dirty) notify('저장하지 않은 변경도 포함해 내보냈습니다. 저장을 잊지 마세요.', 'info');
  };
  const exportJson = () => downloadText(`${safeFilename(b.title)}.json`, boardToJson(b, data), 'application/json');

  return (
    <div className="flex flex-col gap-6 pb-16">
      <nav className="text-xs text-muted" aria-label="경로">
        <Link href="/boards" className="underline underline-offset-2">연구 보드</Link> / <span>{b.title || '제목 없음'}</span>
      </nav>

      <header className="flex flex-col gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {b.seedCode && <span className="font-mono text-xs text-muted">{b.seedCode}</span>}
          {b.categoryIds.map((c) => <CategoryChip key={c} id={c} size="xs" />)}
          {b.outputLabel && <span className="text-xs text-muted">산출물: {b.outputLabel}</span>}
        </div>
        <Field label="보드 제목" htmlFor="b-title" error={titleError} required>
          <TextInput id="b-title" value={b.title} onChange={(e) => { set({ title: e.target.value }); setTitleError(null); }} className="font-serif text-lg" />
        </Field>
        <Field label="Research Question · 핵심 연구 질문" htmlFor="b-q">
          <TextArea id="b-q" rows={2} value={b.researchQuestion} onChange={(e) => set({ researchQuestion: e.target.value })} className="font-serif text-base" />
        </Field>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="상태" htmlFor="b-status">
            <Select id="b-status" value={b.status} onChange={(e) => set({ status: e.target.value as BoardStatus })} className="w-44">
              {(Object.keys(BOARD_STATUS_LABEL) as BoardStatus[]).map((s) => <option key={s} value={s}>{BOARD_STATUS_LABEL[s]}</option>)}
            </Select>
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium">연구 관점</p>
            <div className="flex flex-wrap gap-1.5">
              {LENSES.map((l) => <ToggleChip key={l} active={b.lensIds.includes(l)} onClick={() => set({ lensIds: b.lensIds.includes(l) ? b.lensIds.filter((x) => x !== l) : [...b.lensIds, l] })}>{LENS_LABEL[l].en}</ToggleChip>)}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">카테고리</p>
            <div className="flex flex-wrap gap-1.5">
              {seedCategories.map((c) => <ToggleChip key={c.id} active={b.categoryIds.includes(c.id)} onClick={() => set({ categoryIds: b.categoryIds.includes(c.id) ? b.categoryIds.filter((x) => x !== c.id) : [...b.categoryIds, c.id] })}>{c.label}</ToggleChip>)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={exportMd}>Markdown 내보내기</Button>
          <Button size="sm" onClick={exportJson}>JSON 내보내기</Button>
          <Button
            size="sm"
            disabled={scenes.length < 2}
            onClick={() => {
              setTray({ mode: 'scene', ids: b.sceneIds.slice(0, COMPARE_MAX) });
              router.push('/compare');
            }}
            title={scenes.length < 2 ? '장면이 2개 이상 필요합니다' : ''}
          >
            이 보드 장면 비교{scenes.length > COMPARE_MAX ? ` (앞 ${COMPARE_MAX}개)` : ''}
          </Button>
          <Button size="sm" variant="danger" className="ml-auto" onClick={() => setConfirm(true)}>보드 삭제</Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Field label="연구 배경" htmlFor="b-bg"><TextArea id="b-bg" value={b.background ?? ''} onChange={(e) => set({ background: e.target.value })} /></Field>
        <Field label="비교 기준" htmlFor="b-crit"><TextArea id="b-crit" value={b.criteria ?? ''} onChange={(e) => set({ criteria: e.target.value })} placeholder="예: 인물 면적 비율, 지평선 위치, 색온도" /></Field>
        <Field label="연구 기간" htmlFor="b-period"><TextArea id="b-period" value={b.scopePeriod ?? ''} onChange={(e) => set({ scopePeriod: e.target.value })} placeholder="예: 2026-11 ~ 2026-12" /></Field>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg font-semibold">연결된 장면 {scenes.length}</h2>
            <p className="text-xs text-muted">드래그하거나 ↑/↓ 버튼으로 순서를 바꿀 수 있습니다. 한 장면은 여러 보드에서 재사용됩니다.</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setPicker(true)}>+ 장면 추가</Button>
        </div>
        {scenes.length ? (
          <ol className="flex flex-col gap-2">
            {scenes.map((s, i) => {
              const w = workById.get(s.workId);
              return (
                <li
                  key={s.id}
                  draggable
                  onDragStart={() => setDragId(s.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragId && dragId !== s.id) move(b.sceneIds.indexOf(dragId), i);
                    setDragId(null);
                  }}
                  onDragEnd={() => setDragId(null)}
                  className={cx('grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[auto_160px_1fr_1.2fr]', dragId === s.id ? 'border-ink opacity-60' : 'border-line')}
                >
                  <div className="flex items-center gap-1 md:flex-col md:justify-center">
                    <span className="cursor-grab select-none px-1 text-muted" aria-hidden title="드래그하여 이동">⋮⋮</span>
                    <Button size="sm" variant="ghost" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`${s.title} 위로 이동`}>↑</Button>
                    <Button size="sm" variant="ghost" onClick={() => move(i, i + 1)} disabled={i === scenes.length - 1} aria-label={`${s.title} 아래로 이동`}>↓</Button>
                  </div>
                  <Link href={sceneHref(s.id)}><SceneMedia assetId={s.sceneImageAssetId} seed={s.id} categoryId={w?.categoryId} label={s.title} className="aspect-video rounded" /></Link>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {w && <CategoryChip id={w.categoryId} size="xs" />}
                      <VerificationBadge status={s.verificationStatus} />
                    </div>
                    <Link href={sceneHref(s.id)} className="mt-1 block font-medium hover:underline">{i + 1}. {s.title}</Link>
                    <p className="text-xs text-muted">{w?.titleKo} · {s.startSeconds != null ? formatTimecode(s.startSeconds) : '타임코드 미입력'}</p>
                    {s.observation?.trim() ? <p className="mt-1 line-clamp-3 text-xs text-ink-2"><KindLabel kind="observation" /> {s.observation}</p> : <p className="mt-1 text-xs text-muted">직접 관찰 미기록</p>}
                    <button type="button" className="mt-2 text-xs text-danger underline underline-offset-2" onClick={() => { const notes = { ...b.sceneNotes }; delete notes[s.id]; set({ sceneIds: b.sceneIds.filter((x) => x !== s.id), sceneNotes: notes }); }}>보드에서 제거</button>
                  </div>
                  <Field label="이 보드에서의 메모" htmlFor={`note-${s.id}`}>
                    <TextArea id={`note-${s.id}`} rows={3} value={b.sceneNotes?.[s.id] ?? ''} onChange={(e) => set({ sceneNotes: { ...b.sceneNotes, [s.id]: e.target.value } })} placeholder="비교 기준에 따른 관찰·해석" />
                  </Field>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState title="아직 장면이 없습니다." action={<Button variant="primary" onClick={() => setPicker(true)}>+ 장면 추가</Button>} />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-semibold">비교 분석과 결론</h2>
        {b.status === 'template' && <p className="mb-3 rounded-md border border-[#ecd6ab] bg-hypo-bg/60 px-3 py-2 text-xs text-hypo">템플릿 보드입니다. 결론은 자동으로 채우지 않습니다. 장면을 직접 관찰한 뒤 작성하세요.</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {ANALYSIS_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5 rounded-md border border-line bg-card p-3">
              <div className="flex items-center gap-2">
                <KindLabel kind={f.kind} />
                <label htmlFor={`bf-${f.key}`} className="text-sm font-medium">{f.label}</label>
              </div>
              {f.hint && <p className="text-[11px] text-muted">{f.hint}</p>}
              <TextArea id={`bf-${f.key}`} rows={3} value={(b[f.key] as string) ?? ''} onChange={(e) => set({ [f.key]: e.target.value } as Partial<ResearchBoard>)} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">보드 출처</h2>
        <p className="mb-2 text-[11px] text-muted">Markdown 내보내기에는 보드 출처와 연결된 장면들의 출처가 함께 포함됩니다.</p>
        <SourcePicker value={b.sourceIds} onChange={(sourceIds) => set({ sourceIds })} />
      </section>

      <div className="fixed inset-x-0 bottom-[calc(3rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-paper/95 px-4 py-2.5 backdrop-blur md:bottom-0 lg:pl-64">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
          <span className={cx('text-xs', dirty ? 'font-medium text-hypo' : 'text-muted')} aria-live="polite">{dirty ? '저장하지 않은 변경 사항이 있습니다' : '모든 변경 사항 저장됨'}</span>
          {dirty && <Button size="sm" variant="ghost" onClick={() => setB(baseline)}>되돌리기</Button>}
          <Button variant="primary" onClick={save} disabled={!dirty}>저장</Button>
        </div>
      </div>

      <ScenePickerDialog open={picker} onClose={() => setPicker(false)} exclude={b.sceneIds} onPick={(ids) => set({ sceneIds: [...b.sceneIds, ...ids], status: b.status === 'template' ? 'in_progress' : b.status })} title="보드에 장면 추가" />
      <ConfirmationDialog
        open={confirm}
        title="보드 삭제"
        body={<>“{b.title}” 보드를 삭제합니다. 장면 자체는 삭제되지 않습니다. 되돌릴 수 없습니다.</>}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await deleteBoard(b.id);
          notify('보드를 삭제했습니다.', 'info');
          router.push('/boards');
        }}
      />
    </div>
  );
}

export default function BoardDetailPage() {
  return (
    <Suspense>
      <BoardDetailPageInner />
    </Suspense>
  );
}
