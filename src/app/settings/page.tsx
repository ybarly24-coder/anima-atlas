'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, ComingLater, ConfirmationDialog, Dialog, Field, PageHeader, SectionTitle, Select, TextArea, TextInput } from '@/components/ui';
import { BackupError, type ConflictReport, type MergeStrategy } from '@/lib/backup';
import { ENTITY_STORES } from '@/lib/db';
import { FACETS, FACET_LABEL } from '@/lib/labels';
import { useAtlas } from '@/lib/store';
import type { BackupFile, Tag, TagFacet } from '@/lib/types';
import { downloadText, formatDate, newId, nowIso } from '@/lib/util';
import { TMDB_LOGO_SVG, TMDB_NOTICE, useServiceStatus } from '@/components/SearchAids';
import { IS_STATIC } from '@/lib/runtime';
import { clearLocalTmdbKey, getLocalTmdbKey, setLocalTmdbKey, testTmdbKey } from '@/lib/tmdbClient';

const STORE_LABEL: Record<string, string> = { works: '작품', scenes: '장면', boards: '보드', sources: '출처', tags: '태그', insights: '인사이트', comparisons: '비교' };

function TagManager() {
  const { data, saveTag, deleteTag, notify } = useAtlas();
  const [editing, setEditing] = useState<Tag | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nameKo: '', nameEn: '', facet: 'custom' as TagFacet, definition: '', aliases: '' });
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Tag | null>(null);
  const [facet, setFacet] = useState<TagFacet | 'all'>('all');

  const openEditor = (t: Tag | null) => {
    setEditing(t);
    setForm({ nameKo: t?.nameKo ?? '', nameEn: t?.nameEn ?? '', facet: t?.facet ?? 'custom', definition: t?.definition ?? '', aliases: (t?.aliases ?? []).join(', ') });
    setErr(null);
    setOpen(true);
  };
  const save = async () => {
    const nameKo = form.nameKo.trim();
    if (!nameKo) return setErr('한국어 이름을 입력하세요.');
    if (data.tags.some((t) => t.id !== editing?.id && t.nameKo === nameKo)) return setErr('같은 이름의 태그가 이미 있습니다.');
    const now = nowIso();
    await saveTag({
      id: editing?.id ?? newId('tag'),
      nameKo,
      nameEn: form.nameEn.trim() || nameKo,
      facet: form.facet,
      definition: form.definition.trim(),
      aliases: form.aliases.split(',').map((a) => a.trim()).filter(Boolean),
      isCustom: editing ? editing.isCustom : true,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    notify('태그를 저장했습니다.');
    setOpen(false);
  };

  const tags = data.tags.filter((t) => facet === 'all' || t.facet === facet);
  const usage = (id: string) => data.scenes.filter((s) => s.tagIds.includes(id)).length;

  return (
    <section>
      <SectionTitle title="태그 관리" sub="초기 태그 세트(tagId·nameKo·nameEn·facet·definition)와 사용자 자유 태그. 별칭은 검색에 사용됩니다." right={<Button size="sm" variant="primary" onClick={() => openEditor(null)}>+ 태그</Button>} />
      <div className="mb-3 max-w-xs">
        <label htmlFor="tag-facet" className="sr-only">분류</label>
        <Select id="tag-facet" value={facet} onChange={(e) => setFacet(e.target.value as TagFacet | 'all')}>
          <option value="all">전체 분류 ({data.tags.length})</option>
          {FACETS.map((f) => <option key={f} value={f}>{FACET_LABEL[f]} ({data.tags.filter((t) => t.facet === f).length})</option>)}
        </Select>
      </div>
      <div className="relative overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr><th className="p-2.5">이름</th><th className="p-2.5">English</th><th className="p-2.5">분류</th><th className="p-2.5">정의</th><th className="p-2.5">사용</th><th className="p-2.5"><span className="sr-only">동작</span></th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tags.map((t) => (
              <tr key={t.id}>
                <td className="p-2.5 font-medium">{t.nameKo}{t.isCustom && <span className="ml-1 text-[10px] text-muted">(사용자)</span>}</td>
                <td className="p-2.5 text-ink-2">{t.nameEn}</td>
                <td className="p-2.5 text-xs text-muted">{FACET_LABEL[t.facet]}</td>
                <td className="p-2.5 text-xs text-ink-2">{t.definition}{t.aliases?.length ? <span className="text-muted"> · 별칭: {t.aliases.join(', ')}</span> : null}</td>
                <td className="p-2.5 text-xs">{usage(t.id)}</td>
                <td className="whitespace-nowrap p-2.5 text-right">
                  <Button size="sm" variant="ghost" onClick={() => openEditor(t)}>편집</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm(t)}>삭제</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? '태그 편집' : '새 태그'} footer={<><Button onClick={() => setOpen(false)}>취소</Button><Button variant="primary" onClick={save}>저장</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="한국어 이름" htmlFor="t-ko" error={err} required><TextInput id="t-ko" value={form.nameKo} onChange={(e) => { setForm({ ...form, nameKo: e.target.value }); setErr(null); }} /></Field>
          <Field label="English" htmlFor="t-en"><TextInput id="t-en" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></Field>
          <Field label="분류 (facet)" htmlFor="t-facet">
            <Select id="t-facet" value={form.facet} onChange={(e) => setForm({ ...form, facet: e.target.value as TagFacet })}>
              {FACETS.map((f) => <option key={f} value={f}>{FACET_LABEL[f]}</option>)}
            </Select>
          </Field>
          <Field label="정의" htmlFor="t-def"><TextArea id="t-def" rows={2} value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} /></Field>
          <Field label="검색 별칭 (쉼표로 구분)" htmlFor="t-alias"><TextInput id="t-alias" value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} placeholder="예: 외로움, loneliness" /></Field>
        </div>
      </Dialog>
      <ConfirmationDialog open={!!confirm} title="태그 삭제" body={<>“{confirm?.nameKo}” 태그를 삭제하면 장면 {confirm ? usage(confirm.id) : 0}개에서 제거됩니다.</>} onCancel={() => setConfirm(null)} onConfirm={async () => { const t = confirm!; setConfirm(null); await deleteTag(t.id); notify('태그를 삭제했습니다.', 'info'); }} />
    </section>
  );
}

/** GitHub Pages: the TMDB key is entered per device and kept only in this browser (never in GitHub or the build). */
function TmdbKeyPanel() {
  const { notify } = useAtlas();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setSaved(!!getLocalTmdbKey()), []);

  const save = async () => {
    const k = draft.trim();
    if (!k) return setMsg({ ok: false, text: '키를 붙여넣으세요.' });
    setBusy(true);
    const r = await testTmdbKey(k);
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) {
      setLocalTmdbKey(k);
      setSaved(true);
      setDraft('');
      notify('TMDB 키를 이 기기에 저장했습니다.');
    }
  };

  return (
    <div id="tmdb-key" className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4 text-sm">
      <h2 className="font-semibold">TMDB 키 <span className="text-xs font-normal text-muted">· 이 기기(브라우저)에만 저장</span></h2>
      <p className="text-ink-2">상태: {saved ? <b className="text-fact">이 기기에 저장됨</b> : <b className="text-muted">없음</b>}</p>
      <p className="text-xs leading-relaxed text-muted">
        GitHub Pages 버전은 서버가 없어서 키를 사이트에 넣으면 누구나 볼 수 있게 됩니다. 그래서 키는 <b>각 기기에서 직접 한 번 입력</b>하고, 이 브라우저에만 저장합니다. GitHub·배포 파일·JSON 백업에는 들어가지 않습니다.
        키는 <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="underline">themoviedb.org/settings/api</a>에서 볼 수 있습니다 (API Read Access Token 또는 API Key).
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="tmdb-key-input" className="sr-only">TMDB 키</label>
        <TextInput id="tmdb-key-input" type="password" autoComplete="off" value={draft} onChange={(e) => { setDraft(e.target.value); setMsg(null); }} placeholder={saved ? '새 키로 바꾸려면 붙여넣기' : 'TMDB 키 붙여넣기'} />
        <Button variant="primary" onClick={save} disabled={busy} className="shrink-0">{busy ? '확인 중…' : '확인 후 저장'}</Button>
        {saved && <Button variant="danger" className="shrink-0" onClick={() => { clearLocalTmdbKey(); setSaved(false); setMsg(null); notify('이 기기에서 TMDB 키를 지웠습니다.', 'info'); }}>지우기</Button>}
      </div>
      {msg && <p className={msg.ok ? 'text-xs text-fact' : 'text-xs text-danger'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
      <p className="text-[11px] text-muted">이 기기의 브라우저 개발자 도구로는 키를 볼 수 있으니, 공용 컴퓨터에서는 사용 후 &quot;지우기&quot;를 누르세요.</p>
    </div>
  );
}

function ServicesAndCredits() {
  const status = useServiceStatus();
  const badge = (on: boolean | undefined) => (
    <span className={on ? 'rounded border border-[#bcd5cb] bg-fact-bg px-1.5 py-0.5 text-[11px] font-semibold text-fact' : 'rounded border border-line-2 bg-paper-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted'}>{status ? (on ? '설정됨' : '미설정') : '확인 중'}</span>
  );
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {IS_STATIC ? (
        <TmdbKeyPanel />
      ) : (
      <div className="rounded-lg border border-line bg-card p-4 text-sm">
        <h2 className="mb-2 font-semibold">외부 서비스 연결</h2>
        <ul className="flex flex-col gap-2 text-ink-2">
          <li className="flex flex-wrap items-center gap-2">{badge(status?.tmdb)} TMDB — 작품 검색·포스터/백드롭 (<code>TMDB_READ_ACCESS_TOKEN</code> 또는 <code>TMDB_API_KEY</code>)</li>
          <li className="flex flex-wrap items-center gap-2">{badge(status?.ai)} Anthropic — 선택적 AI 보조 분석 (<code>ANTHROPIC_API_KEY</code>)</li>
        </ul>
        <p className="mt-2 text-xs text-muted">키는 <code>anima-atlas/.env.local</code>에만 두고 서버를 재시작하세요. 키는 서버에서만 쓰이며 브라우저·백업 파일·리서치 카드에 들어가지 않습니다. 키가 없어도 시드 데이터·업로드·컬러/구도 분석·메모는 모두 동작합니다.</p>
      </div>
      )}
      <div className="rounded-lg border border-line bg-card p-4 text-sm">
        <h2 className="mb-2 font-semibold">크레딧 · About</h2>
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={TMDB_LOGO_SVG} alt="TMDB (The Movie Database)" className="h-4" />
        </a>
        <p className="mt-2 text-ink-2">{TMDB_NOTICE}</p>
        <p className="mt-1 text-xs text-muted">작품 정보와 포스터·백드롭 이미지는 TMDB가 제공합니다(비상업적 개인 연구용). 이미지의 권리는 각 작품 권리자에게 있으며, TMDB는 작품 권리자가 아닙니다.</p>
        <p className="mt-2 text-xs text-muted">ANIMA ATLAS는 Dear Mango(dear.interaction) 리서치 대시보드의 사용 흐름을 참고해 독립적으로 구현했습니다. 원본 Dear Mango 소스 코드는 이 컴퓨터에서 찾지 못해(디어 망고 소스 미확인) 코드나 UI를 그대로 복제하지 않았습니다.</p>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { data, seedMeta, exportBackup, previewImport, applyImport, resetToSeed, notify } = useAtlas();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<(ConflictReport & { file: BackupFile }) | null>(null);
  const [strategy, setStrategy] = useState<MergeStrategy>('newer_wins');
  const [importErr, setImportErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const b = await exportBackup();
      downloadText(`anima-atlas-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(b, null, 2), 'application/json');
      notify(`백업 파일을 내려받았습니다. (이미지 ${b.assets.length}개 포함)`);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    setImportErr(null);
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const p = previewImport(raw);
      setPreview(p);
      setStrategy(p.totalConflicts > 0 ? 'newer_wins' : 'incoming_wins');
    } catch (e) {
      setImportErr(e instanceof BackupError ? e.message : e instanceof SyntaxError ? 'JSON 형식이 올바르지 않습니다.' : String(e));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const doImport = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      await applyImport(preview.file, strategy);
      notify('백업을 복원했습니다.');
      setPreview(null);
    } catch (e) {
      notify(`복원 실패: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Data · Credits" title="데이터 · 크레딧" sub="백업/복원, 태그 관리, 외부 서비스 연결 상태, 크레딧." />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-card p-4">
          <h2 className="mb-1 font-semibold">저장 방식</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-2">
            <li>모든 데이터는 <b>이 브라우저의 IndexedDB</b>에 저장됩니다(개인용·기기별). 다른 기기/브라우저와 동기화되지 않습니다.</li>
            <li>브라우저 데이터 삭제, 시크릿 모드 종료 시 사라질 수 있으니 JSON 백업을 정기적으로 받으세요.</li>
            <li>초기 시드는 <b>최초 실행 시 한 번만</b> 적용됩니다{seedMeta ? ` (적용일 ${formatDate(seedMeta.seededAt)}, 시드 v${seedMeta.version})` : ''}. 이후 수정·삭제한 데이터는 새로고침/업데이트로 복구되지 않습니다.</li>
          </ul>
          <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs sm:grid-cols-7">
            {ENTITY_STORES.map((s) => (
              <div key={s} className="rounded border border-line bg-paper py-2"><dt className="text-muted">{STORE_LABEL[s]}</dt><dd className="text-base font-semibold">{data[s].length}</dd></div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4">
          <h2 className="font-semibold">JSON 백업 · 복원</h2>
          <p className="text-sm text-ink-2">작품·장면·보드·출처·태그·인사이트·비교와 업로드한 이미지를 하나의 JSON 파일로 내보내고 복원합니다.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={doExport} disabled={busy}>전체 JSON 백업 내려받기</Button>
            <Button onClick={() => fileRef.current?.click()} disabled={busy}>백업 파일에서 복원...</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} aria-label="백업 JSON 파일 선택" />
          </div>
          {importErr && <p className="text-sm text-danger" role="alert">복원할 수 없습니다: {importErr}</p>}
          <div className="mt-auto border-t border-line pt-3">
            <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>초기 시드 상태로 재설정...</Button>
            <p className="mt-1 text-[11px] text-muted">명시적으로 요청할 때만 실행됩니다. 모든 사용자 데이터가 지워집니다.</p>
          </div>
        </div>
      </section>

      <TagManager />

      <ServicesAndCredits />

      <section>
        <SectionTitle title="추후 구현" sub="아직 구현하지 않은 기능입니다. 동작하는 것처럼 표시하지 않습니다." />
        <ul className="flex flex-wrap gap-2">
          <li><ComingLater>CSV 내보내기</ComingLater></li>
          <li><ComingLater>작품별 색채 타임라인</ComingLater></li>
          <li><ComingLater>영상 프레임 탐색·타임코드 편집기</ComingLater></li>
          <li><ComingLater>의미 기반 검색·유사 장면 추천</ComingLater></li>
          <li><ComingLater>여러 장면 일괄 AI 분석</ComingLater></li>
          <li><ComingLater>자동 이미지 검색 (검색 API 필요)</ComingLater></li>
          <li><ComingLater>협업·클라우드 동기화</ComingLater></li>
          <li><ComingLater>Pixar 등 4번째 카테고리</ComingLater></li>
        </ul>
      </section>

      <Dialog
        open={!!preview}
        onClose={() => setPreview(null)}
        title="백업 복원 확인"
        wide
        footer={<><Button onClick={() => setPreview(null)}>취소</Button><Button variant={strategy === 'replace_all' ? 'danger' : 'primary'} onClick={doImport} disabled={busy}>{busy ? '복원 중...' : '복원 실행'}</Button></>}
      >
        {preview && (
          <div className="flex flex-col gap-4 text-sm">
            <p>내보낸 시각: {formatDate(preview.file.exportedAt)} · 이미지 {preview.file.assets.length}개</p>
            <table className="w-full text-xs">
              <thead className="text-left text-muted"><tr><th className="py-1">항목</th><th>파일</th><th>ID 충돌</th><th>파일 쪽이 더 최신</th></tr></thead>
              <tbody>
                {ENTITY_STORES.map((s) => (
                  <tr key={s} className="border-t border-line"><td className="py-1">{STORE_LABEL[s]}</td><td>{preview.perStore[s].incoming}</td><td className={preview.perStore[s].conflicts ? 'font-semibold text-hypo' : ''}>{preview.perStore[s].conflicts}</td><td>{preview.perStore[s].newer}</td></tr>
                ))}
              </tbody>
            </table>
            <Field label={preview.totalConflicts ? `충돌 ${preview.totalConflicts}건 처리 방식` : '복원 방식'} htmlFor="merge-strategy">
              <Select id="merge-strategy" value={strategy} onChange={(e) => setStrategy(e.target.value as MergeStrategy)}>
                <option value="newer_wins">병합 · 수정일이 더 최신인 쪽 유지 (권장)</option>
                <option value="incoming_wins">병합 · 충돌 시 파일 내용으로 덮어쓰기</option>
                <option value="keep_local">병합 · 충돌 시 현재 데이터 유지</option>
                <option value="replace_all">전체 교체 · 현재 데이터를 모두 지우고 파일로 대체</option>
              </Select>
            </Field>
            {strategy === 'replace_all' && <p className="rounded border border-[#e3c2bc] bg-[#fbefec] px-3 py-2 text-xs text-danger">현재 브라우저의 모든 데이터가 백업 파일 내용으로 교체됩니다.</p>}
          </div>
        )}
      </Dialog>

      <ConfirmationDialog
        open={confirmReset}
        title="초기 시드로 재설정"
        body="모든 작품·장면·보드·출처·태그·인사이트·비교·이미지가 삭제되고 초기 리서치 시드로 되돌아갑니다. 먼저 JSON 백업을 받으세요. 되돌릴 수 없습니다."
        confirmLabel="재설정"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => { setConfirmReset(false); await resetToSeed(); notify('초기 시드 상태로 재설정했습니다.', 'info'); }}
      />
    </div>
  );
}
