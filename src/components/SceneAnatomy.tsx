'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { seedCategories } from '@seed/categories';
import { EVIDENCE_FIELDS, LENSES, LENS_LABEL, LENS_QUESTIONS, LENS_SUBITEMS, VERIFICATION_LABEL } from '@/lib/labels';
import { useAssetUrl, useAtlas, useLookups } from '@/lib/store';
import type { CategoryId, Lens, Scene, VerificationStatus } from '@/lib/types';
import { cx, formatTimecode, isHexColor, isValidUrl, newId, normalizeHex, nowIso, parseTimecode } from '@/lib/util';
import { AddToBoardDialog } from './AddToBoardDialog';
import { SceneCard, SourceRow } from './Cards';
import { MediaUploader } from './MediaUploader';
import { Placeholder } from './Placeholder';
import { SourcePicker } from './SourceEditor';
import { TagPicker } from './TagPicker';
import { SceneCardNews } from './SceneCardNews';
import { ClaudeAppAnalysis } from './ClaudeAppAnalysis';
import { useServiceStatus } from './SearchAids';
import { PalettePanel, ProvenancePanel, SceneImageStage, type Guides } from './SceneTools';
import { computeColorAnalysis } from '@/lib/imports';
import type { MediaAsset } from '@/lib/types';
import { useSceneAnalysis } from '@/lib/useSceneAnalysis';
import { WorkEditor } from './WorkEditor';
import { Button, CategoryChip, ConfirmationDialog, ExternalLink, Field, KindLabel, Select, TextArea, TextInput, ToggleChip, VerificationBadge } from './ui';
import { boardHref, sceneHref, workHref } from '@/lib/routes';

export function blankScene(workId = ''): Scene {
  const now = nowIso();
  return {
    id: newId('scene'), workId, title: '', description: '', startSeconds: null, endSeconds: null, shotDescription: '',
    sceneImageAssetId: null, externalVideoUrl: null, lensIds: [], tagIds: [], colors: [], colorSource: null,
    observation: '', interpretation: '', productionFact: '', hypothesis: '', application: '',
    visualNotes: '', narrativeNotes: '', productionNotes: '', researchQuestion: '', sourceIds: [],
    verificationStatus: 'unverified', isBookmark: false, createdAt: now, updatedAt: now,
  };
}

const evidenceStyle: Record<string, string> = {
  observation: 'border-l-[#3d4f7a] bg-obs-bg/40',
  fact: 'border-l-[#2f5d50] bg-fact-bg/40',
  interpretation: 'border-l-[#8a5a12] bg-hypo-bg/40',
  hypothesis: 'border-l-[#8a5a12] bg-hypo-bg/40',
  application: 'border-l-[#7a746c] bg-paper-2/60',
};

export function SceneAnatomy({ initial, isNew }: { initial: Scene; isNew?: boolean }) {
  const router = useRouter();
  const { data, saveScene, deleteScene, removeAsset, notify, toggleTray, tray, toggleSceneBookmark } = useAtlas();
  const { workById, sourceById } = useLookups();
  const [s, setS] = useState<Scene>(initial);
  const [baseline, setBaseline] = useState<Scene>(initial);
  const [catId, setCatId] = useState<CategoryId>(workById.get(initial.workId)?.categoryId ?? 'ghibli');
  const [tab, setTab] = useState<Lens>('visual');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tcStart, setTcStart] = useState(formatTimecode(initial.startSeconds));
  const [tcEnd, setTcEnd] = useState(formatTimecode(initial.endSeconds));
  const [hexDraft, setHexDraft] = useState('');
  const [guides, setGuides] = useState<Guides>({ thirds: false, center: false, diagonal: false });
  const [workEditor, setWorkEditor] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { url: imageUrl, asset } = useAssetUrl(s.sceneImageAssetId);
  const ai = useSceneAnalysis();
  const [aiConsentOpen, setAiConsentOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const services = useServiceStatus();
  const [assetOverride, setAssetOverride] = useState<MediaAsset | null>(null);
  const shownAsset = assetOverride && asset && assetOverride.id === asset.id ? assetOverride : asset;

  // A newly attached image gets its palette from real pixels automatically.
  useEffect(() => {
    if (!asset?.blob || asset.id !== s.sceneImageAssetId) return;
    if (s.colorAnalysis?.extractedFromAssetId === asset.id) return;
    let cancelled = false;
    computeColorAnalysis(asset.blob, asset.id).then(async (a) => {
      if (cancelled) return;
      setS((x) => (x.sceneImageAssetId === asset.id ? { ...x, colorAnalysis: a } : x));
      // When the image is already saved on this scene, persist the palette right away (it's derived data, not an edit).
      if (!isNew && baseline.sceneImageAssetId === asset.id && a) {
        const stored = data.scenes.find((x) => x.id === baseline.id);
        if (stored) {
          await saveScene({ ...stored, colorAnalysis: a });
          setBaseline((b) => ({ ...b, colorAnalysis: a }));
        }
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id, s.sceneImageAssetId]);

  useEffect(() => {
    setS(initial);
    setBaseline(initial);
    setTcStart(formatTimecode(initial.startSeconds));
    setTcEnd(formatTimecode(initial.endSeconds));
    // only when switching to another scene
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  const dirty = useMemo(
    () => JSON.stringify({ ...s, updatedAt: '' }) !== JSON.stringify({ ...baseline, updatedAt: '' }) || tcStart !== formatTimecode(baseline.startSeconds) || tcEnd !== formatTimecode(baseline.endSeconds),
    [s, baseline, tcStart, tcEnd],
  );

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const set = (patch: Partial<Scene>) => setS((x) => ({ ...x, ...patch }));
  const work = workById.get(s.workId);
  const worksInCat = data.works.filter((w) => w.categoryId === catId).sort((a, b) => a.releaseYear - b.releaseYear);

  const save = async () => {
    const e: Record<string, string> = {};
    if (!s.workId || !workById.get(s.workId)) e.workId = '연결할 작품을 선택하세요.';
    if (!s.title.trim()) e.title = '장면 제목을 입력하세요.';
    const start = parseTimecode(tcStart);
    const end = parseTimecode(tcEnd);
    if (Number.isNaN(start)) e.tcStart = '타임코드 형식: 1:02:03 또는 62:03';
    if (Number.isNaN(end)) e.tcEnd = '타임코드 형식: 1:02:03 또는 62:03';
    if (start != null && end != null && !Number.isNaN(start) && !Number.isNaN(end) && end < start) e.tcEnd = '끝 시점이 시작보다 빠릅니다.';
    if (end != null && start == null) e.tcStart = '끝 시점을 입력했다면 시작 시점도 입력하세요.';
    if (s.externalVideoUrl && !isValidUrl(s.externalVideoUrl)) e.externalVideoUrl = 'http(s) URL을 입력하세요.';
    setErrors(e);
    if (Object.keys(e).length) {
      notify('입력값을 확인하세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      const imageChanged = s.sceneImageAssetId !== baseline.sceneImageAssetId;
      const next: Scene = {
        ...s, title: s.title.trim(), startSeconds: start, endSeconds: end, externalVideoUrl: s.externalVideoUrl?.trim() || null,
        // An analysis describes a specific image; drop it when the image is replaced or removed.
        ...(imageChanged && s.aiAnalysis ? { aiAnalysis: null } : {}),
      };
      if (imageChanged && s.aiAnalysis) notify('이미지가 바뀌어 이전 AI 분석을 지웠습니다. 새 이미지로 다시 분석하세요.', 'info');
      await saveScene(next);
      if (baseline.sceneImageAssetId && baseline.sceneImageAssetId !== next.sceneImageAssetId && !isNew) await removeAsset(baseline.sceneImageAssetId);
      setS(next);
      setBaseline(next);
      notify(isNew ? '장면을 저장했습니다. 장면 라이브러리에서 확인할 수 있습니다.' : '장면 분석을 저장했습니다.');
      if (isNew) router.replace(sceneHref(next.id));
    } catch (err) {
      notify(`저장 실패: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addHex = () => {
    const h = normalizeHex(hexDraft);
    if (!isHexColor(h)) {
      setErrors((x) => ({ ...x, hex: '#RRGGBB 형식의 HEX를 입력하세요.' }));
      return;
    }
    setErrors((x) => ({ ...x, hex: '' }));
    if (!s.colors.includes(h)) set({ colors: [...s.colors, h].slice(0, 8), colorSource: s.colorSource ?? 'user_sampled' });
    setHexDraft('');
  };

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      notify(`${hex} 복사됨`, 'info');
    } catch {
      notify('클립보드에 접근할 수 없습니다.', 'error');
    }
  };

  const relatedScenes = isNew
    ? []
    : data.scenes
        .filter((x) => x.id !== s.id)
        .map((x) => ({ x, score: (x.workId === s.workId ? 2 : 0) + x.tagIds.filter((t) => s.tagIds.includes(t)).length }))
        .filter((r) => r.score >= 2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((r) => r.x);
  const boardsWith = data.boards.filter((b) => b.sceneIds.includes(s.id));
  const linkedSources = s.sourceIds.map((id) => sourceById.get(id)).filter(Boolean) as NonNullable<ReturnType<typeof sourceById.get>>[];
  const inTray = tray.mode === 'scene' && tray.ids.includes(s.id);
  const notesKey = `${tab}Notes` as 'visualNotes' | 'narrativeNotes' | 'productionNotes';

  return (
    <div className="flex flex-col gap-6 pb-16">
      <nav className="text-xs text-muted" aria-label="경로">
        <Link href="/scenes" className="underline underline-offset-2">장면</Link>
        {work && (<> / <Link href={workHref(work.slug)} className="underline underline-offset-2">{work.titleKo}</Link></>)} / <span>{isNew ? '새 장면' : s.title || '제목 없음'}</span>
      </nav>

      <header className="flex flex-col gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {work && <CategoryChip id={work.categoryId} />}
          <VerificationBadge status={s.verificationStatus} />
          {s.seedCode && <span className="rounded border border-[#ecd6ab] bg-hypo-bg px-1.5 py-0.5 font-mono text-[10px] font-semibold text-hypo">장면 후보 {s.seedCode}</span>}
          {s.focusLabel && <span className="text-xs text-muted">주요 분석 렌즈: {s.focusLabel}</span>}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Scene Anatomy {isNew && '· 새 장면'}</p>
        {s.researchQuestion?.trim() && <p className="font-serif text-xl leading-snug md:text-2xl">{s.researchQuestion}</p>}
        {s.seedCode && s.verificationStatus === 'needs_review' && (
          <p className="rounded-md border border-[#ecd6ab] bg-hypo-bg/60 px-3 py-2 text-xs leading-relaxed text-hypo">
            이 장면은 연구 시트의 <b>장면 후보</b>입니다. 타임코드·이미지·색값이 비어 있는 것이 정상입니다. 직접 관람한 뒤 정확한 프레임·타임코드·관찰을 입력하고 검증 상태를 바꾸세요. 분석 포인트는 관찰해야 할 질문이지 공식 제작 의도가 아닙니다.
          </p>
        )}
        {!isNew && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={async () => { await toggleSceneBookmark(s.id); setS((x) => ({ ...x, isBookmark: !x.isBookmark })); setBaseline((x) => ({ ...x, isBookmark: !x.isBookmark })); }} aria-pressed={s.isBookmark}>{s.isBookmark ? '★ 북마크됨' : '☆ 북마크'}</Button>
            <Button size="sm" onClick={() => setBoardOpen(true)}>+ 연구 보드에 추가</Button>
            <Button size="sm" onClick={() => toggleTray('scene', s.id)} aria-pressed={inTray}>{inTray ? '✓ 비교함에 담김' : '비교함에 담기'}</Button>
            {tray.mode === 'scene' && tray.ids.length >= 2 && <Link href="/compare" className="inline-flex h-8 items-center rounded-md px-2.5 text-xs underline underline-offset-2">비교 열기 ({tray.ids.length})</Link>}
            <Button size="sm" variant="danger" className="ml-auto" onClick={() => setConfirmDelete(true)}>장면 삭제</Button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* LEFT: large image + colour / composition tools + provenance */}
        <section aria-labelledby="viewer-h" className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto xl:pr-1">
          <h2 id="viewer-h" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Scene Viewer</h2>
          {imageUrl ? (
            <SceneImageStage
              url={imageUrl}
              alt={asset?.alt || s.title}
              guides={guides}
              onGuides={setGuides}
              onSample={(hex) => !s.colors.includes(hex) && set({ colors: [...s.colors, hex].slice(-12), colorSource: 'user_sampled' })}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <Placeholder seed={s.id} categoryId={work?.categoryId} label={s.title || '새 장면'} className="aspect-video rounded-lg border border-line" />
              <p className="text-xs text-muted">이미지가 없습니다. 아래 &quot;이미지 교체·추가&quot;에서 올리거나 작품 검색에서 이미지 후보를 고르세요. 가짜 스틸컷을 만들지 않습니다.</p>
            </div>
          )}
          <PalettePanel
            analysis={s.colorAnalysis}
            assetBlob={asset?.blob}
            assetId={s.sceneImageAssetId}
            manual={s.colors}
            onAnalysis={(a) => set({ colorAnalysis: a })}
            onRemoveManual={(c) => set({ colors: s.colors.filter((x) => x !== c), ...(s.colors.length === 1 ? { colorSource: null } : {}) })}
          />
          <ProvenancePanel asset={shownAsset} imageType={s.imageType ?? 'unknown'} onImageType={(t) => set({ imageType: t })} onAssetChange={setAssetOverride} />
          <details className="rounded-lg border border-line bg-card p-3" open={isNew || !imageUrl}>
            <summary className="cursor-pointer text-sm font-semibold">이미지 교체·추가 · 타임코드 · 색 직접 입력</summary>
            <div className="mt-3 flex flex-col gap-3">
              <MediaUploader currentAssetId={s.sceneImageAssetId} onChange={(id) => set({ sceneImageAssetId: id })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="시작 타임코드 (선택)" htmlFor="tc-start" error={errors.tcStart} hint="직접 관람해 확인한 경우에만 입력">
                  <TextInput id="tc-start" value={tcStart} onChange={(e) => setTcStart(e.target.value)} placeholder="예: 1:02:03" inputMode="numeric" />
                </Field>
                <Field label="끝 타임코드 (선택)" htmlFor="tc-end" error={errors.tcEnd}>
                  <TextInput id="tc-end" value={tcEnd} onChange={(e) => setTcEnd(e.target.value)} placeholder="예: 1:03:10" inputMode="numeric" />
                </Field>
              </div>
              <Field label="참조 영상 URL (선택)" htmlFor="video-url" error={errors.externalVideoUrl} hint="공식 예고편·제작 해설 등 공개 링크만. 영상은 다운로드하지 않습니다.">
                <TextInput id="video-url" type="url" value={s.externalVideoUrl ?? ''} onChange={(e) => set({ externalVideoUrl: e.target.value || null })} placeholder="https://" />
              </Field>
              {s.externalVideoUrl && isValidUrl(s.externalVideoUrl) && <ExternalLink href={s.externalVideoUrl} className="text-xs">참조 영상 열기</ExternalLink>}
              <Field label="샷 설명" htmlFor="shot-desc">
                <TextArea id="shot-desc" rows={2} value={s.shotDescription ?? ''} onChange={(e) => set({ shotDescription: e.target.value })} placeholder="예: 측면 롱숏, 인물은 화면 하단 1/3, 수평선이 화면을 가로지름" />
              </Field>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-ink-2" htmlFor="hex-input">색 직접 입력</label>
                <TextInput id="hex-input" value={hexDraft} onChange={(e) => setHexDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHex(); } }} placeholder="#3A5F7D" className="h-8 w-32 font-mono text-xs" />
                <Button size="sm" onClick={addHex}>추가</Button>
                {errors.hex && <span className="text-xs text-danger" role="alert">{errors.hex}</span>}
              </div>
            </div>
          </details>
        </section>

        {/* RIGHT: research tabs + common evidence fields + metadata */}
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="analysis-h" className="rounded-lg border border-line bg-card">
            <h2 id="analysis-h" className="px-4 pt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">연구 탭</h2>
            <div role="tablist" aria-label="분석 관점" className="mt-2 flex border-b border-line px-2">
              {LENSES.map((l) => (
                <button key={l} role="tab" type="button" aria-selected={tab === l} onClick={() => setTab(l)} className={cx('-mb-px border-b-2 px-3 py-2 text-sm font-semibold tracking-wide', tab === l ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink')}>
                  {LENS_LABEL[l].en.toUpperCase()}
                  {s[`${l}Notes` as typeof notesKey]?.trim() ? <span className="ml-1 text-[10px] text-fact">●</span> : null}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap gap-1">
                {LENS_SUBITEMS[tab].map((x) => <span key={x} className="rounded-full border border-line-2 bg-paper px-2 py-0.5 text-[11px] text-ink-2">{x}</span>)}
              </div>
              <details className="rounded-md border border-line bg-paper px-3 py-2 text-xs">
                <summary className="cursor-pointer font-medium text-ink-2">분석 질문 템플릿 ({LENS_LABEL[tab].ko})</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-ink-2">
                  {LENS_QUESTIONS[tab].map((q) => <li key={q}>{q}</li>)}
                </ol>
              </details>
              <Field label={`${LENS_LABEL[tab].ko} 노트`} htmlFor="lens-notes">
                <TextArea id="lens-notes" rows={5} value={s[notesKey] ?? ''} onChange={(e) => set({ [notesKey]: e.target.value } as Partial<Scene>)} placeholder={tab === 'production' ? '확인된 기법·툴·메이킹 출처를 적고, 추정은 "추정"이라고 표시하세요.' : '템플릿 질문에 대한 답을 자유롭게 적으세요.'} />
              </Field>
            </div>
          </section>

          <section aria-labelledby="evidence-h" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 id="evidence-h" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Evidence &amp; Thinking</h2>
              <p className="text-[11px] text-muted">본 것 · 확인된 사실 · 해석 · 가설 · 응용을 섞지 않습니다.</p>
            </div>
            {EVIDENCE_FIELDS.map((fld) => (
              <div key={fld.key} className={cx('flex flex-col gap-1.5 rounded-md border border-line border-l-4 p-3', evidenceStyle[fld.kind])}>
                <div className="flex flex-wrap items-center gap-2">
                  <KindLabel kind={fld.kind} />
                  <label htmlFor={`ev-${fld.key}`} className="text-sm font-semibold">{fld.label}</label>
                </div>
                <p className="text-[11px] leading-relaxed text-muted">{fld.hint}</p>
                <TextArea id={`ev-${fld.key}`} rows={3} value={(s[fld.key] as string) ?? ''} onChange={(e) => set({ [fld.key]: e.target.value } as Partial<Scene>)} className="bg-card" />
              </div>
            ))}
          </section>

          <section aria-labelledby="meta-h" className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4">
            <h2 id="meta-h" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">장면 정보</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="카테고리" htmlFor="sc-cat" required>
                <Select id="sc-cat" value={catId} onChange={(e) => { setCatId(e.target.value as CategoryId); set({ workId: '' }); }}>
                  {seedCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
              </Field>
              <Field label="작품" htmlFor="sc-work" error={errors.workId} required>
                <div className="flex gap-1.5">
                  <Select id="sc-work" value={s.workId} onChange={(e) => set({ workId: e.target.value })}>
                    <option value="">작품 선택</option>
                    {worksInCat.map((w) => <option key={w.id} value={w.id}>{w.titleKo} ({w.releaseYear})</option>)}
                  </Select>
                  <Button size="sm" className="h-9 shrink-0" onClick={() => setWorkEditor(true)} title="새 작품 추가">+ 작품</Button>
                </div>
              </Field>
            </div>
            <Field label="장면 제목" htmlFor="sc-title" error={errors.title} required>
              <TextInput id="sc-title" value={s.title} onChange={(e) => set({ title: e.target.value })} placeholder="예: 기차가 물 위를 지나는 시퀀스" />
            </Field>
            <Field label="장면 설명" htmlFor="sc-desc">
              <TextArea id="sc-desc" rows={2} value={s.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
            </Field>
            <Field label="연구 질문" htmlFor="sc-q">
              <TextArea id="sc-q" rows={2} value={s.researchQuestion ?? ''} onChange={(e) => set({ researchQuestion: e.target.value })} />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium">연구 관점 (복수 선택)</p>
              <div className="flex flex-wrap gap-1.5">
                {LENSES.map((l) => (
                  <label key={l} className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line-2 px-2.5 py-1 text-xs">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-ink" checked={s.lensIds.includes(l)} onChange={() => set({ lensIds: s.lensIds.includes(l) ? s.lensIds.filter((x) => x !== l) : LENSES.filter((x) => x === l || s.lensIds.includes(x)) })} />
                    {LENS_LABEL[l].en} · {LENS_LABEL[l].ko}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">태그 <span className="text-xs font-normal text-muted">(감정·미장센·기법 등)</span></p>
              <TagPicker value={s.tagIds} onChange={(tagIds) => set({ tagIds })} />
            </div>
            <Field label="검증 상태" htmlFor="sc-ver" hint="확인됨: 직접 관람·출처로 확인 / 부분 확인: 일부만 확인 / 확인 전·검토 필요">
              <Select id="sc-ver" value={s.verificationStatus} onChange={(e) => set({ verificationStatus: e.target.value as VerificationStatus })}>
                {(Object.keys(VERIFICATION_LABEL) as VerificationStatus[]).map((v) => <option key={v} value={v}>{VERIFICATION_LABEL[v]}</option>)}
              </Select>
            </Field>
          </section>
        </div>
      </div>

      {!isNew && (
        <section aria-labelledby="ai-h" className="rounded-xl border border-line bg-card p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 id="ai-h" className="font-serif text-lg font-semibold">AI 보조 분석 · 카드뉴스 <span className="text-xs font-normal text-muted">(선택)</span></h2>
              <p className="text-xs text-muted">AI가 미장센·색감·구도·카메라·조명·위치·서사에 대한 관찰과 해석을 <b>제안</b>합니다. 제작 사실·타임코드·감독 의도는 확인하지 않습니다. 컬러·구도·메모는 AI 없이도 쓸 수 있습니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={manualOpen ? 'secondary' : 'primary'}
                size="sm"
                disabled={!baseline.sceneImageAssetId}
                title={!baseline.sceneImageAssetId ? '이미지를 등록하고 저장한 뒤 분석할 수 있습니다' : ''}
                onClick={() => {
                  if (dirty) {
                    notify('변경 사항을 먼저 저장한 뒤 분석하세요.', 'info');
                    return;
                  }
                  setManualOpen(!manualOpen);
                }}
                aria-expanded={manualOpen}
              >
                {manualOpen ? '닫기' : s.aiAnalysis ? 'Claude 앱으로 다시 분석' : 'Claude 앱으로 분석 (구독)'}
              </Button>
              {services?.ai && (
                <Button
                  size="sm"
                  disabled={ai.running || !baseline.sceneImageAssetId}
                  onClick={() => {
                    if (dirty) {
                      notify('변경 사항을 먼저 저장한 뒤 분석하세요.', 'info');
                      return;
                    }
                    setAiConsentOpen(true);
                  }}
                >
                  {ai.running ? 'API 분석 중… (30초~1분)' : 'API로 자동 분석'}
                </Button>
              )}
            </div>
          </div>
          {!baseline.sceneImageAssetId && <p className="mb-3 text-xs text-muted">이미지를 등록하고 저장하면 분석할 수 있습니다.</p>}
          {manualOpen && baseline.sceneImageAssetId && (
            <div className="mb-4">
              <ClaudeAppAnalysis
                scene={baseline}
                onApplied={(next) => {
                  setS(next);
                  setBaseline(next);
                  setManualOpen(false);
                }}
              />
            </div>
          )}
          {ai.error && <p className="mb-3 rounded-md border border-[#e3c2bc] bg-[#fbefec] px-3 py-2 text-sm text-danger" role="alert">{ai.error.message}</p>}
          {s.aiAnalysis ? <SceneCardNews scene={s} /> : null}
        </section>
      )}
      <ConfirmationDialog
        open={aiConsentOpen}
        title="이미지를 AI 분석에 보낼까요?"
        danger={false}
        confirmLabel="전송하고 분석"
        body={<>이 장면 이미지(긴 변 1568px 이하로 축소)와 작품 제목·장면 메모를 Anthropic API로 전송합니다. 분석 결과는 &quot;AI 자동 생성 해석&quot;으로만 표시되며 Evidence(확인된 사실) 칸에 들어가지 않습니다. API 키가 필요하고 1회 약 10센트 내외의 비용이 듭니다.</>}
        onCancel={() => setAiConsentOpen(false)}
        onConfirm={async () => {
          setAiConsentOpen(false);
          const next = await ai.run(baseline);
          if (next) {
            setS(next);
            setBaseline(next);
          }
        }}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">공식 출처 / 외부 링크</h2>
          <SourcePicker value={s.sourceIds} onChange={(sourceIds) => set({ sourceIds })} defaultWorkId={s.workId} />
          <p className="mt-2 text-[11px] text-muted">작품 전체에 관한 공정 설명이 이 장면에 적용됐다는 증거는 아닙니다. 연결 자체는 사실의 근거 범위를 넓히지 않습니다.</p>
        </div>
        {!isNew && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-2 text-sm font-semibold">이 장면이 포함된 연구 보드</h2>
              {boardsWith.length ? (
                <ul className="flex flex-wrap gap-2">{boardsWith.map((b) => <li key={b.id}><Link href={boardHref(b.id)} className="block rounded-md border border-line bg-card px-3 py-1.5 text-sm hover:border-ink">{b.title}</Link></li>)}</ul>
              ) : (
                <p className="text-xs text-muted">아직 어떤 보드에도 없습니다.</p>
              )}
            </div>
            {linkedSources.length > 0 && (
              <div className="grid gap-2">{linkedSources.slice(0, 3).map((src) => <SourceRow key={src.id} source={src} showWorks={false} />)}</div>
            )}
          </div>
        )}
      </section>

      {relatedScenes.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">관련 장면 <span className="font-normal text-muted">(같은 작품 또는 공통 태그)</span></h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{relatedScenes.map((r) => <SceneCard key={r.id} scene={r} compact />)}</div>
        </section>
      )}

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-[calc(3rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-paper/95 px-4 py-2.5 backdrop-blur md:bottom-0 lg:pl-64">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
          <span className={cx('text-xs', dirty ? 'font-medium text-hypo' : 'text-muted')} aria-live="polite">{dirty ? '저장하지 않은 변경 사항이 있습니다' : isNew ? '새 장면' : '모든 변경 사항 저장됨'}</span>
          {dirty && !isNew && (
            <Button size="sm" variant="ghost" onClick={() => { setS(baseline); setTcStart(formatTimecode(baseline.startSeconds)); setTcEnd(formatTimecode(baseline.endSeconds)); setErrors({}); }}>
              되돌리기
            </Button>
          )}
          <Button variant="primary" onClick={save} disabled={saving || (!dirty && !isNew)}>{saving ? '저장 중...' : '저장'}</Button>
        </div>
      </div>

      <WorkEditor open={workEditor} onClose={() => setWorkEditor(false)} defaultCategory={catId} onSaved={(w) => { setCatId(w.categoryId); set({ workId: w.id }); }} />
      <AddToBoardDialog sceneIds={[s.id]} open={boardOpen} onClose={() => setBoardOpen(false)} />
      <ConfirmationDialog
        open={confirmDelete}
        title="장면 삭제"
        body={<>“{s.title}” 장면을 삭제합니다. 포함된 연구 보드 {boardsWith.length}개와 인사이트·비교에서 연결이 해제됩니다. 되돌릴 수 없습니다.</>}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          await deleteScene(s.id);
          notify('장면을 삭제했습니다.', 'info');
          router.push(work ? workHref(work.slug) : '/scenes');
        }}
      />
    </div>
  );
}
