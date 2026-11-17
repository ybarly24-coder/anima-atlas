'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { seedCategories } from '@seed/categories';
import { AnalysisCards } from '@/components/AnalysisCards';
import { WorkEditor } from '@/components/WorkEditor';
import { Button, Field, LinkButton, PageHeader, Select, TextArea, TextInput } from '@/components/ui';
import { AnalyzeError, fetchImageFromUrl } from '@/lib/ai';
import { useAssetUrl, useAtlas } from '@/lib/store';
import type { CategoryId, Scene } from '@/lib/types';
import { useSceneAnalysis } from '@/lib/useSceneAnalysis';
import { importImageAsScene } from '@/lib/imports';
import { IS_STATIC } from '@/lib/runtime';
import { IMAGE_TYPE_LABEL } from '@/lib/labels';
import type { ImageType } from '@/lib/types';
import { cx, isValidUrl, newId, nowIso } from '@/lib/util';
import { sceneHref } from '@/lib/routes';

const LAST_WORK_KEY = 'anima-atlas:last-capture-work';
const MAX_BYTES = 8 * 1024 * 1024;

export default function CapturePage() {
  return (
    <Suspense>
      <CaptureInner />
    </Suspense>
  );
}

function CaptureInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { data, saveAssetFromFile, saveScene, notify, loadAsset, findAssetByHash } = useAtlas();
  const { run, running, error, clearError } = useSceneAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [fetching, setFetching] = useState(false);
  const [catId, setCatId] = useState<CategoryId>('ghibli');
  const [workId, setWorkId] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [rightsOk, setRightsOk] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [imageType, setImageType] = useState<ImageType>('unknown');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [workEditor, setWorkEditor] = useState(false);
  const [saved, setSaved] = useState<Scene | null>(null);
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const liveScene = saved ? data.scenes.find((s) => s.id === saved.id) ?? saved : null;
  const { url: savedUrl } = useAssetUrl(liveScene?.sceneImageAssetId);

  // Preselect ?work=, else restore last used work (per-viewer convenience).
  useEffect(() => {
    try {
      const last = params.get('work') || localStorage.getItem(LAST_WORK_KEY);
      const w = last && data.works.find((x) => x.id === last);
      if (w) {
        setCatId(w.categoryId);
        setWorkId(w.id);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accept = (f: File | null | undefined, fromUrl = '') => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setErrors((e) => ({ ...e, image: '이미지 파일만 사용할 수 있습니다.' }));
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrors((e) => ({ ...e, image: '8MB 이하 이미지를 사용하세요.' }));
      return;
    }
    setErrors((e) => ({ ...e, image: '' }));
    setFile(f);
    setSourceUrl(fromUrl);
    setSaved(null);
    clearError();
  };

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Global paste: screenshot in clipboard -> Cmd/Ctrl+V anywhere on this page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      const items = Array.from(e.clipboardData?.items ?? []);
      const img = items.find((i) => i.kind === 'file' && i.type.startsWith('image/'));
      if (img) {
        e.preventDefault();
        const f = img.getAsFile();
        if (f) accept(new File([f], `clipboard-${Date.now()}.${(f.type.split('/')[1] ?? 'png')}`, { type: f.type }));
        return;
      }
      // Pasted text that looks like an image URL, when not typing in a field.
      const text = e.clipboardData?.getData('text')?.trim();
      if (text && isValidUrl(text) && !(target && ['INPUT', 'TEXTAREA'].includes(target.tagName))) {
        setUrlDraft(text);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) return accept(f);
    // Dragging an image straight from a web page gives a URL instead of a file.
    const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    const html = e.dataTransfer.getData('text/html');
    const src = /<img[^>]+src="([^"]+)"/i.exec(html)?.[1];
    const url = (src && isValidUrl(src) ? src : uri)?.trim();
    if (url && isValidUrl(url)) await importUrl(url);
  };

  const importUrl = async (url: string) => {
    setFetching(true);
    setErrors((e) => ({ ...e, url: '' }));
    try {
      const f = await fetchImageFromUrl(url);
      accept(f, url);
      setUrlDraft('');
    } catch (err) {
      setErrors((e) => ({ ...e, url: err instanceof AnalyzeError ? err.message : String(err) }));
    } finally {
      setFetching(false);
    }
  };

  const worksInCat = data.works.filter((w) => w.categoryId === catId).sort((a, b) => a.releaseYear - b.releaseYear);

  const submit = async (analyze: boolean) => {
    const e: Record<string, string> = {};
    if (!file) e.image = '이미지를 붙여넣거나, 끌어다 놓거나, URL로 가져오세요.';
    if (!workId) e.workId = '작품을 선택하세요. 목록에 없으면 "+ 작품"으로 추가하세요.';
    if (!rightsOk) e.rights = '연구 목적 사용 확인이 필요합니다.';
    if (analyze && !aiConsent) e.ai = 'AI 분석을 하려면 이미지 전송에 동의해야 합니다.';
    setErrors(e);
    if (Object.keys(e).length || !file) return;

    try {
      localStorage.setItem(LAST_WORK_KEY, workId);
    } catch {
      /* ignore */
    }
    const r = await importImageAsScene(
      {
        blob: file,
        workId,
        title: title.trim() || (analyze ? '분석 중인 장면' : '제목 없는 장면'),
        description: note.trim(),
        imageType,
        provider: sourceUrl ? 'official_link' : 'manual_upload',
        sourcePageUrl: sourceUrl || null,
        originalImageUrl: sourceUrl || null,
        attribution: sourceUrl || '사용자 캡처/업로드',
      },
      { scenes: data.scenes, saveAssetFromFile, findAssetByHash, saveScene },
    );
    const scene = r.scene;
    if (r.duplicate) notify('이미 저장한 같은 이미지입니다. 기존 장면 카드를 사용합니다.', 'info');
    else if (!r.paletteOk) notify('이미지를 읽지 못해 팔레트는 "분석 불가"로 표시됩니다.', 'error');
    setSaved(scene);
    setSavedBlob(file);
    if (analyze && !scene.aiAnalysis) await run(scene, { useAiTitle: !title.trim(), note: note.trim() });
    else if (!analyze) {
      if (!r.duplicate && r.paletteOk) notify('장면 카드를 만들고 실제 이미지에서 팔레트를 추출했습니다.');
      router.push(sceneHref(scene.id));
    }
  };

  const retry = async () => {
    if (!liveScene) return;
    if (!savedBlob && liveScene.sceneImageAssetId) {
      const a = await loadAsset(liveScene.sceneImageAssetId);
      if (a?.blob) setSavedBlob(a.blob);
    }
    await run(liveScene, { useAiTitle: liveScene.title === '분석 중인 장면' });
  };

  const reset = () => {
    setFile(null);
    setSourceUrl('');
    setTitle('');
    setNote('');
    setSaved(null);
    setSavedBlob(null);
    clearError();
  };

  const work = liveScene ? data.works.find((w) => w.id === liveScene.workId) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Upload · Paste · URL"
        title="이미지 직접 올리기"
        sub="구글 등에서 찾은 장면을 캡처해 붙여넣거나 끌어다 놓으면 장면 카드가 만들어지고, 실제 이미지 픽셀에서 팔레트를 추출합니다. AI 분석 카드뉴스는 선택 사항입니다."
        right={<LinkButton href="/cards">카드뉴스 모아보기</LinkButton>}
      />

      {!liveScene?.aiAnalysis && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cx(
                'relative flex min-h-[300px] flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed p-6 text-center transition-colors',
                dragOver ? 'border-ink bg-paper-2' : 'border-line-2 bg-card',
              )}
            >
              {preview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="붙여넣은 장면 미리보기" className="max-h-[420px] w-full rounded-md object-contain" />
                  <Button size="sm" variant="ghost" onClick={() => setFile(null)} disabled={running}>다른 이미지로 바꾸기</Button>
                </>
              ) : (
                <>
                  <p className="font-serif text-xl font-semibold">여기에 장면 이미지를 넣으세요</p>
                  <ul className="flex flex-col gap-1 text-sm text-ink-2">
                    <li><kbd className="rounded border border-line-2 bg-paper px-1.5 font-mono text-xs">⌘⇧4</kbd> 로 캡처 → 이 페이지에서 <kbd className="rounded border border-line-2 bg-paper px-1.5 font-mono text-xs">⌘V</kbd></li>
                    <li>구글 이미지 결과에서 이미지를 이 영역으로 끌어다 놓기</li>
                    <li>이미지 파일 선택 또는 아래에 이미지 URL 붙여넣기</li>
                  </ul>
                  <Button onClick={() => fileInput.current?.click()}>파일 선택</Button>
                </>
              )}
              {fetching && <div className="absolute inset-0 flex items-center justify-center bg-card/80 text-sm">이미지를 가져오는 중...</div>}
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ''; }} aria-label="이미지 파일 선택" />
            </div>
            {errors.image && <p className="text-sm text-danger" role="alert">{errors.image}</p>}
            <Field label="이미지 URL로 가져오기" htmlFor="img-url" error={errors.url} hint="이미지에서 우클릭 → '이미지 주소 복사'한 주소를 넣으세요. 웹페이지 주소는 가져올 수 없습니다.">
              <div className="flex gap-2">
                <TextInput id="img-url" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="https://.../image.jpg" />
                <Button onClick={() => urlDraft.trim() && importUrl(urlDraft.trim())} disabled={fetching || !urlDraft.trim()}>가져오기</Button>
              </div>
            </Field>
            {sourceUrl && <p className="truncate text-xs text-muted">출처 URL: {sourceUrl}</p>}
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-line bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="카테고리" htmlFor="cap-cat" required>
                <Select id="cap-cat" value={catId} onChange={(e) => { setCatId(e.target.value as CategoryId); setWorkId(''); }}>
                  {seedCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
              </Field>
              <Field label="작품" htmlFor="cap-work" error={errors.workId} required>
                <div className="flex gap-1.5">
                  <Select id="cap-work" value={workId} onChange={(e) => setWorkId(e.target.value)}>
                    <option value="">작품 선택</option>
                    {worksInCat.map((w) => <option key={w.id} value={w.id}>{w.titleKo} ({w.releaseYear})</option>)}
                  </Select>
                  <Button size="sm" className="h-9 shrink-0" onClick={() => setWorkEditor(true)}>+ 작품</Button>
                </div>
              </Field>
            </div>
            <Field label="장면 제목 (선택)" htmlFor="cap-title" hint="비워 두면 AI가 제목을 붙입니다.">
              <TextInput id="cap-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 기차가 물 위를 지나는 장면" />
            </Field>
            <Field label="메모 (선택)" htmlFor="cap-note" hint="AI에게 맥락으로 전달됩니다. 예: 영화 후반, 치히로가 혼자 떠나는 장면">
              <TextArea id="cap-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Field label="이미지 종류" htmlFor="cap-type" hint="구글 등에서 찾은 이미지는 실제 프레임인지 홍보용 스틸인지 확실하지 않으면 '알 수 없음'으로 두세요.">
              <Select id="cap-type" value={imageType} onChange={(e) => setImageType(e.target.value as ImageType)}>
                {(Object.keys(IMAGE_TYPE_LABEL) as ImageType[]).map((k) => <option key={k} value={k}>{IMAGE_TYPE_LABEL[k].ko} — {IMAGE_TYPE_LABEL[k].hint}</option>)}
              </Select>
            </Field>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-ink" checked={rightsOk} onChange={(e) => setRightsOk(e.target.checked)} />
              <span>개인 연구·학습 목적으로만 사용하며 재배포하지 않겠습니다. 이미지는 이 브라우저(IndexedDB)에만 저장됩니다.</span>
            </label>
            {errors.rights && <p className="-mt-2 text-xs text-danger" role="alert">{errors.rights}</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => submit(false)} disabled={running || fetching || !!saved}>장면 카드 만들기 (팔레트 자동 분석)</Button>
            </div>
            {IS_STATIC ? (
              <p className="rounded-md border border-line bg-paper p-3 text-[11px] leading-relaxed text-muted"><b>AI 분석</b>은 장면 카드를 만든 뒤 장면 페이지의 <b>Claude 앱으로 분석</b>(구독 claude.ai, API 키 불필요)을 사용하세요.</p>
            ) : (
            <div className="flex flex-col gap-2 rounded-md border border-line bg-paper p-3">
              <p className="text-xs font-semibold text-ink-2">선택 · AI 보조 분석</p>
              <p className="text-[11px] leading-relaxed text-muted"><b>Claude 구독(claude.ai)</b>으로 분석하려면 위 &quot;장면 카드 만들기&quot; 후 장면 페이지의 <b>Claude 앱으로 분석</b>을 누르세요 (API 키 불필요). 아래는 API 키가 있을 때의 자동 분석입니다.</p>
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-ink" checked={aiConsent} onChange={(e) => setAiConsent(e.target.checked)} />
                <span>이 이미지를 분석을 위해 Anthropic API로 전송하는 것에 동의합니다. (API 키 필요 · AI는 관찰/해석을 <b>제안</b>할 뿐 제작 사실을 확인하지 않습니다)</span>
              </label>
              {errors.ai && <p className="text-xs text-danger" role="alert">{errors.ai}</p>}
              <Button onClick={() => submit(true)} disabled={running || fetching || !!saved} className="self-start">
                {running ? 'AI가 분석하는 중... (30초~1분)' : '장면 카드 + AI 분석'}
              </Button>
            </div>
            )}
            {running && (
              <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-2" role="status">
                <span className="h-2 w-2 animate-pulse rounded-full bg-ink" /> 미장센 · 색감 · 구도 · 카메라 · 조명 · 위치 · 서사를 분석하고 있습니다.
              </div>
            )}
            {error && saved && (
              <div className="flex flex-col gap-2 rounded-md border border-[#e3c2bc] bg-[#fbefec] p-3 text-sm text-danger" role="alert">
                <p>{error.message}</p>
                <p className="text-xs text-ink-2">이미지는 장면으로 이미 저장되었습니다. 문제를 해결한 뒤 다시 시도하거나 장면 페이지에서 분석할 수 있습니다.</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={retry} disabled={running}>다시 분석</Button>
                  <LinkButton size="sm" href={sceneHref(saved.id)}>장면 페이지로</LinkButton>
                </div>
              </div>
            )}
            {saved && !error && !running && !liveScene?.aiAnalysis && (
              <div className="flex gap-2 text-sm">
                <LinkButton size="sm" href={sceneHref(saved.id)}>저장된 장면 열기</LinkButton>
                <Button size="sm" variant="primary" onClick={reset}>다음 이미지</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {liveScene?.aiAnalysis && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-2">
              <span className="font-semibold">{liveScene.title}</span> · {work?.titleKo} — 장면으로 저장됐고 태그 {liveScene.tagIds.length}개가 추천·적용되었습니다.
            </p>
            <div className="flex gap-2">
              <LinkButton size="sm" href={sceneHref(liveScene.id)}>장면 상세·메모</LinkButton>
              <Button size="sm" variant="primary" onClick={reset}>다음 이미지 분석</Button>
            </div>
          </div>
          <AnalysisCards record={liveScene.aiAnalysis} imageUrl={savedUrl ?? preview} imageBlob={savedBlob} workLabel={work ? `${work.titleKo} · ${work.titleEn} (${work.releaseYear})` : undefined} fileBase={liveScene.id} pdfName={liveScene.title} />
        </div>
      )}

      <p className="text-xs text-muted">
        AI 분석은 이미지 한 장에 대한 <b>자동 생성 해석</b>이며 공식 제작 사실이 아닙니다. 확인한 내용은 <Link href="/scenes" className="underline">장면 페이지</Link>의 &quot;직접 관찰/공식 제작 사실&quot; 칸에 따로 기록하세요.
      </p>

      <WorkEditor open={workEditor} onClose={() => setWorkEditor(false)} defaultCategory={catId} onSaved={(w) => { setCatId(w.categoryId); setWorkId(w.id); }} />
    </div>
  );
}
