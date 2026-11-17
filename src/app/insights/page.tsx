'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ScenePickerDialog } from '@/components/ScenePickerDialog';
import { Button, ConfirmationDialog, Dialog, EmptyState, Field, PageHeader, Select, TextArea, TextInput, ToggleChip } from '@/components/ui';
import { INSIGHT_KIND_LABEL } from '@/lib/labels';
import { useAtlas, useLookups } from '@/lib/store';
import type { Insight, InsightKind } from '@/lib/types';
import { cx, formatDate, newId, nowIso } from '@/lib/util';
import { boardHref, sceneHref, workHref } from '@/lib/routes';

const kindCls: Record<InsightKind, string> = {
  hypothesis: 'border-l-[#8a5a12]',
  finding: 'border-l-[#2f5d50]',
  application: 'border-l-[#7a746c]',
};

function InsightEditor({ open, onClose, insight }: { open: boolean; onClose: () => void; insight: Insight | null }) {
  const { data, saveInsight, notify } = useAtlas();
  const { sceneById } = useLookups();
  const blank = (): Insight => ({ id: newId('insight'), kind: 'finding', title: '', body: '', sceneIds: [], boardIds: [], workIds: [], createdAt: nowIso(), updatedAt: nowIso() });
  const [f, setF] = useState<Insight>(insight ?? blank());
  const [err, setErr] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setF(insight ?? blank());
      setErr(null);
    }
  }
  const save = async () => {
    if (!f.title.trim()) {
      setErr('제목을 입력하세요.');
      return;
    }
    await saveInsight({ ...f, title: f.title.trim() });
    notify('인사이트를 저장했습니다.');
    onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} title={insight ? '인사이트 편집' : '새 인사이트'} wide footer={<><Button onClick={onClose}>취소</Button><Button variant="primary" onClick={save}>저장</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Field label="유형" htmlFor="in-kind">
            <Select id="in-kind" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as InsightKind })}>
              {(Object.keys(INSIGHT_KIND_LABEL) as InsightKind[]).map((k) => <option key={k} value={k}>{INSIGHT_KIND_LABEL[k]}</option>)}
            </Select>
          </Field>
          <Field label="제목" htmlFor="in-title" error={err} required>
            <TextInput id="in-title" value={f.title} onChange={(e) => { setF({ ...f, title: e.target.value }); setErr(null); }} />
          </Field>
        </div>
        <Field label="내용" htmlFor="in-body" hint="가설은 검증 방법을, 발견은 근거 장면을, 적용 아이디어는 실험 방법을 함께 적으면 좋습니다.">
          <TextArea id="in-body" rows={6} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium">연결 보드</p>
          <div className="flex flex-wrap gap-1.5">
            {data.boards.map((b) => <ToggleChip key={b.id} active={f.boardIds.includes(b.id)} onClick={() => setF({ ...f, boardIds: f.boardIds.includes(b.id) ? f.boardIds.filter((x) => x !== b.id) : [...f.boardIds, b.id] })}>{b.title}</ToggleChip>)}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium">연결 작품</p>
          <div className="flex flex-wrap gap-1.5">
            {data.works.map((w) => <ToggleChip key={w.id} active={f.workIds.includes(w.id)} onClick={() => setF({ ...f, workIds: f.workIds.includes(w.id) ? f.workIds.filter((x) => x !== w.id) : [...f.workIds, w.id] })}>{w.titleKo}</ToggleChip>)}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium">근거 장면</p>
          <div className="flex flex-wrap gap-1.5">
            {f.sceneIds.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 rounded-full border border-line-2 px-2 py-0.5 text-xs">
                {sceneById.get(id)?.title ?? '삭제된 장면'}
                <button type="button" onClick={() => setF({ ...f, sceneIds: f.sceneIds.filter((x) => x !== id) })} aria-label="장면 연결 해제" className="text-muted">×</button>
              </span>
            ))}
            <Button size="sm" onClick={() => setPicker(true)}>+ 장면 연결</Button>
          </div>
        </div>
      </div>
      <ScenePickerDialog open={picker} onClose={() => setPicker(false)} exclude={f.sceneIds} onPick={(ids) => setF((x) => ({ ...x, sceneIds: [...x.sceneIds, ...ids] }))} />
    </Dialog>
  );
}

export default function InsightsPage() {
  const { data, deleteInsight, notify } = useAtlas();
  const { sceneById, boardById, workById } = useLookups();
  const [kind, setKind] = useState<InsightKind | 'all'>('all');
  const [editing, setEditing] = useState<Insight | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Insight | null>(null);
  const list = data.insights.filter((i) => kind === 'all' || i.kind === kind).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div>
      <PageHeader eyebrow="Insight Notebook" title="인사이트" sub="연구에서 얻은 가설·발견·창작 적용 아이디어를 장면·보드와 연결해 축적합니다." right={<Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>+ 인사이트</Button>} />
      <div className="mb-4 flex flex-wrap gap-1.5">
        <ToggleChip active={kind === 'all'} onClick={() => setKind('all')}>전체 {data.insights.length}</ToggleChip>
        {(Object.keys(INSIGHT_KIND_LABEL) as InsightKind[]).map((k) => <ToggleChip key={k} active={kind === k} onClick={() => setKind(k)}>{INSIGHT_KIND_LABEL[k]} {data.insights.filter((i) => i.kind === k).length}</ToggleChip>)}
      </div>
      {list.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((i) => (
            <li key={i.id} id={i.id} className={cx('flex flex-col gap-2 rounded-lg border border-line border-l-4 bg-card p-4', kindCls[i.kind])}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted">{INSIGHT_KIND_LABEL[i.kind]} · {formatDate(i.updatedAt)}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(i); setOpen(true); }}>편집</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm(i)}>삭제</Button>
                </div>
              </div>
              <p className="font-serif text-base font-semibold">{i.title}</p>
              {i.body && <p className="prose-note text-sm leading-relaxed text-ink-2">{i.body}</p>}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {i.boardIds.map((id) => boardById.get(id) && <Link key={id} href={boardHref(id)} className="rounded border border-line px-1.5 py-0.5 hover:border-ink">보드: {boardById.get(id)!.title}</Link>)}
                {i.workIds.map((id) => workById.get(id) && <Link key={id} href={workHref(workById.get(id)!.slug)} className="rounded border border-line px-1.5 py-0.5 hover:border-ink">작품: {workById.get(id)!.titleKo}</Link>)}
                {i.sceneIds.map((id) => sceneById.get(id) && <Link key={id} href={sceneHref(id)} className="rounded border border-line px-1.5 py-0.5 hover:border-ink">장면: {sceneById.get(id)!.title}</Link>)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="아직 인사이트가 없습니다." body="보드에서 비교를 마친 뒤 얻은 발견이나, 새 작품에 적용할 아이디어를 기록하세요." action={<Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>+ 인사이트</Button>} />
      )}
      <InsightEditor open={open} onClose={() => setOpen(false)} insight={editing} />
      <ConfirmationDialog open={!!confirm} title="인사이트 삭제" body={<>“{confirm?.title}”을(를) 삭제합니다.</>} onCancel={() => setConfirm(null)} onConfirm={async () => { const c = confirm!; setConfirm(null); await deleteInsight(c.id); notify('인사이트를 삭제했습니다.', 'info'); }} />
    </div>
  );
}
