'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ComparisonGrid, SCENE_ROWS, WORK_ROWS } from '@/components/ComparisonGrid';
import { ScenePickerDialog } from '@/components/ScenePickerDialog';
import { Button, ConfirmationDialog, EmptyState, Field, LinkButton, PageHeader, TextInput } from '@/components/ui';
import { COMPARE_MAX, useAtlas, useLookups } from '@/lib/store';
import type { Comparison, CompareMode } from '@/lib/types';
import { cx, downloadText, formatDate, newId, nowIso } from '@/lib/util';

function draftFrom(mode: CompareMode, ids: string[]): Comparison {
  const now = nowIso();
  return { id: newId('cmp'), title: '', mode, itemIds: ids, cells: {}, createdAt: now, updatedAt: now };
}

function CompareInner() {
  const params = useSearchParams();
  const { data, tray, setTray, saveComparison, deleteComparison, notify } = useAtlas();
  const { sceneById, workById } = useLookups();
  const [current, setCurrent] = useState<Comparison>(() => draftFrom(tray.mode, tray.ids));
  const [baseline, setBaseline] = useState<string>('');
  const [picker, setPicker] = useState(false);
  const [confirm, setConfirm] = useState<Comparison | null>(null);
  const [titleErr, setTitleErr] = useState<string | null>(null);

  const isSaved = data.comparisons.some((c) => c.id === current.id);

  // Open a saved comparison from ?id=
  useEffect(() => {
    const id = params.get('id');
    const c = id && data.comparisons.find((x) => x.id === id);
    if (c) {
      setCurrent(c);
      setBaseline(JSON.stringify(c));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // An unsaved draft mirrors the compare tray.
  useEffect(() => {
    if (!isSaved) setCurrent((c) => (c.mode === tray.mode && c.itemIds.join() === tray.ids.join() ? c : { ...c, mode: tray.mode, itemIds: tray.ids }));
  }, [tray, isSaved]);

  const dirty = isSaved ? JSON.stringify(current) !== baseline : Object.values(current.cells).some((v) => v.trim()) || !!current.title;

  const setItems = (mode: CompareMode, ids: string[]) => {
    setCurrent((c) => ({ ...c, mode, itemIds: ids }));
    if (!isSaved) setTray({ mode, ids });
  };

  const validIds = current.itemIds.filter((id) => (current.mode === 'scene' ? sceneById.has(id) : workById.has(id)));

  const save = async () => {
    if (!current.title.trim()) {
      setTitleErr('비교 제목을 입력하세요.');
      return;
    }
    if (validIds.length < 2) {
      notify('비교하려면 2개 이상 선택하세요.', 'error');
      return;
    }
    const next = { ...current, title: current.title.trim(), itemIds: validIds, updatedAt: nowIso() };
    await saveComparison(next);
    setCurrent(next);
    setBaseline(JSON.stringify(next));
    notify('비교를 저장했습니다.');
  };

  const startNew = (mode: CompareMode = current.mode) => {
    const d = draftFrom(mode, mode === tray.mode ? tray.ids : []);
    setCurrent(d);
    setBaseline('');
  };

  const exportMd = () => {
    const rows = current.mode === 'scene' ? SCENE_ROWS : WORK_ROWS;
    const names = validIds.map((id) => (current.mode === 'scene' ? sceneById.get(id)?.title : workById.get(id)?.titleKo) ?? id);
    const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
    const lines = [`# ${current.title || '비교'}`, '', '_사용자 수기 비교 (자동 분석 아님)_', '', `| 기준 | ${names.map(esc).join(' | ')} |`, `|---|${names.map(() => '---').join('|')}|`];
    rows.forEach((r) => lines.push(`| ${r.label} | ${validIds.map((id) => esc(current.cells[`${id}::${r.key}`] ?? '')).join(' | ')} |`));
    downloadText(`${(current.title || 'comparison').replace(/\s+/g, '_')}.md`, lines.join('\n') + '\n', 'text/markdown');
  };

  const saved = useMemo(() => [...data.comparisons].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [data.comparisons]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Compare" title="비교" sub="2~4개 장면 또는 작품을 같은 기준으로 나란히 놓고 직접 비교합니다. 같은 장면도 비교마다 다른 해석을 기록할 수 있습니다." />

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="비교 유형" className="flex gap-1">
          {(['scene', 'work'] as CompareMode[]).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={current.mode === m}
              onClick={() => {
                if (current.mode === m) return;
                if (isSaved) startNew(m);
                else setItems(m, []);
              }}
              className={cx('rounded-md px-3 py-1.5 text-sm font-medium', current.mode === m ? 'bg-ink text-paper' : 'border border-line bg-card text-ink-2 hover:border-ink')}
            >
              {m === 'scene' ? '장면 비교' : '작품 비교'}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setPicker(true)} disabled={validIds.length >= COMPARE_MAX}>
          + {current.mode === 'scene' ? '장면' : '작품'} 추가 ({validIds.length}/{COMPARE_MAX})
        </Button>
        {isSaved && <Button size="sm" variant="ghost" onClick={() => startNew()}>새 비교 시작</Button>}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <Field label="비교 제목" htmlFor="cmp-title" error={titleErr}>
            <TextInput id="cmp-title" value={current.title} onChange={(e) => { setCurrent({ ...current, title: e.target.value }); setTitleErr(null); }} placeholder="예: 지평선과 고독 — Moana vs Spirited Away" />
          </Field>
        </div>
        <Button variant="primary" onClick={save} disabled={isSaved && !dirty}>{isSaved ? (dirty ? '변경 저장' : '저장됨') : '비교 저장'}</Button>
        <Button onClick={exportMd} disabled={validIds.length < 2}>Markdown 내보내기</Button>
      </div>
      {dirty && <p className="-mt-3 text-xs text-hypo" aria-live="polite">저장하지 않은 변경 사항이 있습니다.</p>}

      {validIds.length < 2 ? (
        <EmptyState
          title={`비교하려면 ${current.mode === 'scene' ? '장면' : '작품'}을 2개 이상 담으세요.`}
          body={<>현재 {validIds.length}개 선택됨. {current.mode === 'scene' ? '장면' : '작품'} 카드의 &quot;비교함에 담기&quot; 또는 위의 추가 버튼을 사용하세요.</>}
          action={<><Button variant="primary" onClick={() => setPicker(true)}>+ 추가</Button><LinkButton href={current.mode === 'scene' ? '/scenes' : '/works'}>{current.mode === 'scene' ? '장면 라이브러리' : '작품 라이브러리'}</LinkButton></>}
        />
      ) : (
        <>
          <p className="text-xs text-muted">각 칸 위의 &quot;기록된 데이터&quot;는 장면/작품에 이미 저장된 태그·출처·노트를 보여줄 뿐이며, 자동 생성된 분석이 아닙니다. 아래 칸에 사용자 수기 비교를 작성하세요.</p>
          <ComparisonGrid
            comparison={{ ...current, itemIds: validIds }}
            onCell={(k, v) => setCurrent((c) => ({ ...c, cells: { ...c.cells, [k]: v } }))}
            onRemove={(id) => setItems(current.mode, current.itemIds.filter((x) => x !== id))}
          />
        </>
      )}

      <section>
        <h2 className="mb-2 font-serif text-lg font-semibold">저장된 비교 {saved.length}</h2>
        {saved.length ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {saved.map((c) => (
              <li key={c.id} className={cx('flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2', c.id === current.id ? 'border-ink' : 'border-line')}>
                <button type="button" className="min-w-0 text-left" onClick={() => { setCurrent(c); setBaseline(JSON.stringify(c)); }}>
                  <span className="block truncate text-sm font-medium">{c.title}</span>
                  <span className="block text-xs text-muted">{c.mode === 'scene' ? '장면' : '작품'} {c.itemIds.length}개 · {formatDate(c.updatedAt)}</span>
                </button>
                <Button size="sm" variant="ghost" onClick={() => setConfirm(c)} aria-label={`${c.title} 삭제`}>삭제</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">아직 저장된 비교가 없습니다.</p>
        )}
      </section>

      <ScenePickerDialog
        open={picker}
        onClose={() => setPicker(false)}
        mode={current.mode}
        exclude={validIds}
        max={COMPARE_MAX - validIds.length}
        title={current.mode === 'scene' ? '비교할 장면 추가' : '비교할 작품 추가'}
        onPick={(ids) => setItems(current.mode, [...validIds, ...ids].slice(0, COMPARE_MAX))}
      />
      <ConfirmationDialog
        open={!!confirm}
        title="비교 삭제"
        body={<>“{confirm?.title}” 비교와 그 안의 메모를 삭제합니다.</>}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const c = confirm!;
          setConfirm(null);
          await deleteComparison(c.id);
          if (c.id === current.id) startNew();
          notify('비교를 삭제했습니다.', 'info');
        }}
      />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <CompareInner />
    </Suspense>
  );
}
