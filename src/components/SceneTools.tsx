'use client';

import { useRef, useState } from 'react';
import { computeColorAnalysis, HUE_FAMILY_LABEL, hueFamily } from '@/lib/imports';
import { IMAGE_TYPE_LABEL, LICENSE_LABEL, PROVIDER_LABEL } from '@/lib/labels';
import { useAtlas } from '@/lib/store';
import type { ColorAnalysis, ImageType, LicenseStatus, MediaAsset } from '@/lib/types';
import { cx, formatDate, isValidUrl } from '@/lib/util';
import { Button, ExternalLink, Select, ToggleChip } from './ui';

export type Guides = { thirds: boolean; center: boolean; diagonal: boolean };

function GuidesOverlay({ g }: { g: Guides }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {g.thirds && (
        <g stroke="white" strokeOpacity="0.85" strokeWidth="0.3" vectorEffect="non-scaling-stroke">
          <line x1="33.33" y1="0" x2="33.33" y2="100" /><line x1="66.66" y1="0" x2="66.66" y2="100" />
          <line x1="0" y1="33.33" x2="100" y2="33.33" /><line x1="0" y1="66.66" x2="100" y2="66.66" />
        </g>
      )}
      {g.center && (
        <g stroke="#ffd36b" strokeOpacity="0.9" strokeWidth="0.3" vectorEffect="non-scaling-stroke">
          <line x1="50" y1="0" x2="50" y2="100" /><line x1="0" y1="50" x2="100" y2="50" />
        </g>
      )}
      {g.diagonal && (
        <g stroke="#9fe0ff" strokeOpacity="0.9" strokeWidth="0.3" vectorEffect="non-scaling-stroke">
          <line x1="0" y1="0" x2="100" y2="100" /><line x1="100" y1="0" x2="0" y2="100" />
        </g>
      )}
    </svg>
  );
}

const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/** Large scene image with non-destructive composition overlays and a click-to-sample eyedropper. */
export function SceneImageStage({ url, alt, guides, onGuides, onSample }: { url: string; alt: string; guides: Guides; onGuides: (g: Guides) => void; onSample: (hex: string) => void }) {
  const [sampling, setSampling] = useState(false);
  const [last, setLast] = useState<{ hex: string; x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!sampling) return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const nx = Math.floor(((e.clientX - rect.left) / rect.width) * img.naturalWidth);
    const ny = Math.floor(((e.clientY - rect.top) / rect.height) * img.naturalHeight);
    let c = canvasRef.current;
    if (!c || c.width !== img.naturalWidth) {
      c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d', { willReadFrequently: true })?.drawImage(img, 0, 0);
      canvasRef.current = c;
    }
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    // Average a 3x3 neighbourhood so a single noisy pixel doesn't decide the colour.
    const x0 = Math.max(0, nx - 1), y0 = Math.max(0, ny - 1);
    const d = ctx.getImageData(x0, y0, Math.min(3, c.width - x0), Math.min(3, c.height - y0)).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    const hex = toHex(r / n, g / n, b / n);
    setLast({ hex, x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
    onSample(hex);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-lg border border-line bg-paper-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} onClick={pick} className={cx('block h-auto w-full select-none', sampling && 'cursor-crosshair')} draggable={false} />
        <GuidesOverlay g={guides} />
        {last && sampling && (
          <span className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${last.x}%`, top: `${last.y}%`, background: last.hex }} aria-hidden />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted">구도선</span>
        <ToggleChip active={guides.thirds} onClick={() => onGuides({ ...guides, thirds: !guides.thirds })}>삼분할</ToggleChip>
        <ToggleChip active={guides.center} onClick={() => onGuides({ ...guides, center: !guides.center })}>중심선</ToggleChip>
        <ToggleChip active={guides.diagonal} onClick={() => onGuides({ ...guides, diagonal: !guides.diagonal })}>대각선</ToggleChip>
        <span className="mx-1 h-4 w-px bg-line-2" aria-hidden />
        <ToggleChip active={sampling} onClick={() => setSampling(!sampling)} title="이미지를 클릭해 그 지점의 색을 내 샘플에 추가">
          {sampling ? '◉ 스포이트 켜짐 — 이미지를 클릭' : '스포이트 (색 샘플러)'}
        </ToggleChip>
        {last && sampling && <span className="font-mono text-[11px] text-ink-2">{last.hex} 추가됨</span>}
      </div>
      <p className="text-[11px] text-muted">오버레이는 원본 이미지를 바꾸지 않는 분석 보조 도구이며 &apos;좋은 구도&apos;를 판정하지 않습니다.</p>
    </div>
  );
}

/** Auto palette from real pixels (5~8 colours, HEX + share + copy) and user-sampled colours. */
export function PalettePanel({
  analysis, assetBlob, assetId, manual, onAnalysis, onRemoveManual,
}: {
  analysis: ColorAnalysis | null | undefined;
  assetBlob: Blob | null | undefined;
  assetId: string | null | undefined;
  manual: string[];
  onAnalysis: (a: ColorAnalysis | null) => void;
  onRemoveManual: (hex: string) => void;
}) {
  const { notify } = useAtlas();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      notify(`${hex} 복사됨`, 'info');
    } catch {
      notify('클립보드에 접근할 수 없습니다.', 'error');
    }
  };
  const rerun = async () => {
    if (!assetBlob || !assetId) return;
    setBusy(true);
    const a = await computeColorAnalysis(assetBlob, assetId);
    setFailed(!a);
    onAnalysis(a);
    setBusy(false);
  };
  const stale = analysis && assetId && analysis.extractedFromAssetId !== assetId;

  return (
    <div className="rounded-lg border border-line bg-card p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">컬러 분석 <span className="font-normal text-muted">· 이 이미지의 샘플 팔레트</span></p>
        {assetBlob && <Button size="sm" variant="ghost" onClick={rerun} disabled={busy}>{busy ? '추출 중…' : analysis ? '다시 추출' : '팔레트 추출'}</Button>}
      </div>
      {!assetId ? (
        <p className="text-xs text-muted">이미지가 없어 컬러 분석을 할 수 없습니다. 색값을 지어내지 않습니다.</p>
      ) : analysis && !stale ? (
        <>
          <div className="flex h-12 overflow-hidden rounded-md border border-line" role="img" aria-label={`팔레트: ${analysis.swatches.map((s) => s.hex).join(', ')}`}>
            {analysis.swatches.map((s) => <div key={s.hex} style={{ background: s.hex, flex: Math.max(s.proportion, 0.03) }} />)}
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {analysis.swatches.map((s) => (
              <li key={s.hex}>
                <button type="button" onClick={() => copy(s.hex)} className="flex w-full items-center gap-2 rounded border border-line bg-paper px-1.5 py-1 text-left hover:border-ink" title="HEX 복사">
                  <span className="h-6 w-6 shrink-0 rounded border border-line-2" style={{ background: s.hex }} aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-mono text-[11px]">{s.hex}</span>
                    <span className="block text-[10px] text-muted">{Math.round(s.proportion * 100)}% · {HUE_FAMILY_LABEL[hueFamily(s.hex)]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] text-muted">실제 픽셀에서 계산 · {analysis.algorithmVersion} · {formatDate(analysis.createdAt)} · 작품의 컬러 스크립트가 아님</p>
        </>
      ) : (
        <p className="rounded border border-dashed border-line-2 px-3 py-2 text-xs text-muted">
          {failed || analysis === null ? '분석 불가 — 이미지 픽셀을 읽지 못했습니다. 다른 파일로 다시 시도하세요.' : stale ? '이미지가 바뀌었습니다. "팔레트 추출"로 새 이미지를 분석하세요.' : '아직 추출하지 않았습니다.'}
        </p>
      )}
      <div className="mt-3 border-t border-line pt-2">
        <p className="mb-1 text-xs font-semibold text-ink-2">내가 찍은 색 <span className="font-normal text-muted">(스포이트·직접 입력)</span></p>
        {manual.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {manual.map((c) => (
              <li key={c} className="flex items-center gap-1 rounded border border-line bg-paper px-1.5 py-0.5">
                <span className="h-4 w-4 rounded-sm border border-line-2" style={{ background: c }} aria-hidden />
                <button type="button" onClick={() => copy(c)} className="font-mono text-[11px] hover:underline">{c}</button>
                <button type="button" onClick={() => onRemoveManual(c)} className="text-xs text-muted hover:text-danger" aria-label={`${c} 제거`}>×</button>
              </li>
            ))}
          </ul>
        ) : <p className="text-[11px] text-muted">스포이트를 켜고 이미지를 클릭하면 여기에 쌓입니다.</p>}
      </div>
    </div>
  );
}

/** Provenance / rights record for the scene image (spec v2 ImageAsset). */
export function ProvenancePanel({ asset, imageType, onImageType, onAssetChange }: { asset: MediaAsset | null; imageType: ImageType; onImageType: (t: ImageType) => void; onAssetChange: (a: MediaAsset) => void }) {
  const { updateAssetMeta, notify } = useAtlas();
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3 text-xs">
      <p className="text-sm font-semibold">이미지 출처 · 권리</p>
      <label className="flex flex-col gap-1">
        <span className="text-ink-2">이미지 종류</span>
        <Select value={imageType} onChange={(e) => onImageType(e.target.value as ImageType)} className="h-8 text-xs">
          {(Object.keys(IMAGE_TYPE_LABEL) as ImageType[]).map((k) => <option key={k} value={k}>{IMAGE_TYPE_LABEL[k].ko} — {IMAGE_TYPE_LABEL[k].hint}</option>)}
        </Select>
      </label>
      {asset ? (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
          <dt className="text-muted">제공</dt><dd>{asset.sourceProvider ? PROVIDER_LABEL[asset.sourceProvider] : '직접 업로드'}</dd>
          {asset.sourcePageUrl && isValidUrl(asset.sourcePageUrl) && (<><dt className="text-muted">출처 페이지</dt><dd className="min-w-0 truncate"><ExternalLink href={asset.sourcePageUrl}>{asset.sourcePageUrl}</ExternalLink></dd></>)}
          {asset.originalImageUrl && isValidUrl(asset.originalImageUrl) && asset.originalImageUrl !== asset.sourcePageUrl && (<><dt className="text-muted">원본 이미지</dt><dd className="min-w-0 truncate"><ExternalLink href={asset.originalImageUrl}>{asset.originalImageUrl}</ExternalLink></dd></>)}
          {asset.attribution && (<><dt className="text-muted">표기</dt><dd>{asset.attribution}</dd></>)}
          {asset.width ? (<><dt className="text-muted">크기</dt><dd>{asset.width}×{asset.height}</dd></>) : null}
          {asset.contentHash && (<><dt className="text-muted">해시</dt><dd className="font-mono text-[10px]" title={asset.contentHash}>{asset.contentHash.slice(0, 16)}…</dd></>)}
          {asset.importedAt && (<><dt className="text-muted">가져온 날</dt><dd>{formatDate(asset.importedAt)}</dd></>)}
          <dt className="self-center text-muted">권리 상태</dt>
          <dd>
            <Select
              value={asset.licenseStatus ?? 'unverified'}
              onChange={async (e) => {
                const next = await updateAssetMeta(asset.id, { licenseStatus: e.target.value as LicenseStatus });
                if (next) {
                  onAssetChange(next);
                  notify('권리 상태를 저장했습니다.');
                }
              }}
              className="h-7 text-xs"
            >
              {(Object.keys(LICENSE_LABEL) as LicenseStatus[]).map((k) => <option key={k} value={k}>{LICENSE_LABEL[k]}</option>)}
            </Select>
          </dd>
        </dl>
      ) : (
        <p className="text-muted">등록된 이미지가 없습니다.</p>
      )}
      <p className="text-[10px] leading-relaxed text-muted">제공자(TMDB 등) 표시 요건과 이미지 원권리자의 권리는 별개입니다. 개인 연구용이라도 재배포는 허용되지 않을 수 있습니다.</p>
    </div>
  );
}
