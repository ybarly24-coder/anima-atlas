'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SourceEditor } from '@/components/SourceEditor';
import { Button, ConfirmationDialog, EmptyState, ExternalLink, PageHeader, SourceBadge, TextInput, ToggleChip, VerificationBadge } from '@/components/ui';
import { EVIDENCE_LABEL, SOURCE_TYPE_LABEL, VERIFICATION_LABEL } from '@/lib/labels';
import { normalize } from '@/lib/search';
import { useAtlas, useLookups } from '@/lib/store';
import type { CategoryId, EvidenceType, Source, VerificationStatus } from '@/lib/types';
import { workHref } from '@/lib/routes';

function SourcesInner() {
  const params = useSearchParams();
  const { data, deleteSource, notify } = useAtlas();
  const { workById } = useLookups();
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [ev, setEv] = useState<EvidenceType[]>([]);
  const [ver, setVer] = useState<VerificationStatus[]>(() => (params.get('verification') ? (params.get('verification')!.split(',') as VerificationStatus[]) : []));
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Source | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Source | null>(null);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const list = data.sources
    .filter((s) => cat === 'all' || s.categoryIds.includes(cat))
    .filter((s) => !ev.length || ev.includes(s.evidenceType))
    .filter((s) => !ver.length || ver.includes(s.verificationStatus))
    .filter((s) => !q.trim() || normalize(`${s.code ?? ''} ${s.title} ${s.publisher} ${s.notes ?? ''} ${s.url}`).includes(normalize(q)))
    .sort((a, b) => (a.code && b.code ? a.code.localeCompare(b.code, undefined, { numeric: true }) : a.code ? -1 : b.code ? 1 : b.updatedAt.localeCompare(a.updatedAt)));

  const usage = (id: string) => ({
    works: data.works.filter((w) => w.officialSourceIds.includes(id)),
    scenes: data.scenes.filter((s) => s.sourceIds.includes(id)),
    boards: data.boards.filter((b) => b.sourceIds.includes(id)),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Source Library"
        title="출처"
        sub={<>원문 출처와 근거 수준·검증 상태. <b>확인됨</b>은 링크에 해당 정보가 실재함을 확인했다는 의미이지, 연구자의 해석이 옳다는 보증이 아닙니다.</>}
        right={<Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>+ 출처 추가</Button>}
      />
      <div className="mb-4 flex flex-col gap-3">
        <CategoryTabs value={cat} onChange={setCat} />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">근거 수준</span>
          {(Object.keys(EVIDENCE_LABEL) as EvidenceType[]).map((k) => <ToggleChip key={k} active={ev.includes(k)} onClick={() => setEv(toggle(ev, k))}>{EVIDENCE_LABEL[k]}</ToggleChip>)}
          <span className="ml-3 text-xs text-muted">검증</span>
          {(Object.keys(VERIFICATION_LABEL) as VerificationStatus[]).map((k) => <ToggleChip key={k} active={ver.includes(k)} onClick={() => setVer(toggle(ver, k))}>{VERIFICATION_LABEL[k]}</ToggleChip>)}
        </div>
        <label htmlFor="src-q" className="sr-only">출처 검색</label>
        <TextInput id="src-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목·기관·메모 검색 (예: Imageworks, 합성)" className="max-w-md" />
        <div className="flex flex-wrap gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1"><SourceBadge evidence="official_primary" /> 스튜디오/배급사 공식 자료</span>
          <span className="flex items-center gap-1"><SourceBadge evidence="secondary" /> 비평·보도·외부 분석 (공식 발언과 같은 근거 수준 아님)</span>
          <span className="flex items-center gap-1"><SourceBadge evidence="hypothesis" /> 연구자 가설</span>
        </div>
      </div>

      {list.length ? (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          <ul className="divide-y divide-line">
            {list.map((s) => {
              const u = usage(s.id);
              return (
                <li key={s.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {s.code && <span className="font-mono text-xs font-semibold">[{s.code}]</span>}
                      <SourceBadge evidence={s.evidenceType} />
                      <VerificationBadge status={s.verificationStatus} />
                      <span className="text-[11px] text-muted">{SOURCE_TYPE_LABEL[s.sourceType]}</span>
                    </div>
                    <ExternalLink href={s.url} className="font-medium">{s.title}</ExternalLink>
                    <p className="text-xs text-muted">{s.publisher} · 확인일 {s.accessedAt} · <span className="break-all">{s.url}</span></p>
                    {s.notes && <p className="text-sm leading-relaxed text-ink-2">{s.notes}</p>}
                    {s.altSearchHint && <p className="text-[11px] text-muted">대체 검색 힌트: “{s.altSearchHint}”</p>}
                    <p className="text-xs text-muted">
                      연결: 작품 {u.works.length} · 장면 {u.scenes.length} · 보드 {u.boards.length}
                      {s.relatedWorkIds.length > 0 && <> · 관련 작품: {s.relatedWorkIds.map((id) => workById.get(id)).filter(Boolean).map((w, i) => <span key={w!.id}>{i > 0 && ', '}<Link className="underline underline-offset-2" href={workHref(w!.slug)}>{w!.titleKo}</Link></span>)}</>}
                    </p>
                  </div>
                  <div className="flex gap-1 md:flex-col">
                    <Button size="sm" onClick={() => { setEditing(s); setOpen(true); }}>편집</Button>
                    <Button size="sm" variant="danger" onClick={() => setConfirm(s)}>삭제</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <EmptyState title="조건에 맞는 출처가 없습니다." action={<Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>+ 출처 추가</Button>} />
      )}

      <SourceEditor open={open} onClose={() => setOpen(false)} source={editing} />
      <ConfirmationDialog
        open={!!confirm}
        title="출처 삭제"
        body={confirm && (() => { const u = usage(confirm.id); return <>“{confirm.title}”을(를) 삭제하면 작품 {u.works.length}·장면 {u.scenes.length}·보드 {u.boards.length}개에서 연결이 해제됩니다.</>; })()}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => { const c = confirm!; setConfirm(null); await deleteSource(c.id); notify('출처를 삭제했습니다.', 'info'); }}
      />
    </div>
  );
}

export default function SourcesPage() {
  return (
    <Suspense>
      <SourcesInner />
    </Suspense>
  );
}
