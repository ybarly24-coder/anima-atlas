'use client';

import type { AiAnalysisRecord, SceneAnalysis } from './aiSchema';
import { IS_STATIC } from './runtime';

export class AnalyzeError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

/** Downscale to <= maxSide and re-encode as JPEG so the request stays small. */
export async function prepareImageForAnalysis(blob: Blob, maxSide = 1568): Promise<{ base64: string; mediaType: 'image/jpeg' | 'image/png' }> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new AnalyzeError('Canvas를 사용할 수 없습니다.', 'CANVAS');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  return { base64: dataUrl.split(',')[1] ?? '', mediaType: 'image/jpeg' };
}

export async function requestAnalysis(
  blob: Blob,
  context: { workTitle?: string; sceneTitle?: string; note?: string },
  tagNames: string[],
): Promise<{ analysis: SceneAnalysis; model: string }> {
  const { base64, mediaType } = await prepareImageForAnalysis(blob);
  let res: Response;
  try {
    res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mediaType, context, tagNames }),
    });
  } catch {
    throw new AnalyzeError('서버에 연결할 수 없습니다. 개발 서버/프로덕션 서버가 실행 중인지 확인하세요.', 'NETWORK');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AnalyzeError(json.message ?? `분석 실패 (HTTP ${res.status})`, json.error ?? 'HTTP');
  return json as { analysis: SceneAnalysis; model: string };
}

export function toRecord(r: { analysis: SceneAnalysis; model: string }, imageAssetId: string | null): AiAnalysisRecord {
  return { analysis: r.analysis, model: r.model, createdAt: new Date().toISOString(), imageAssetId };
}

/** Fetch an image URL through the local server (avoids CORS). */
export async function fetchImageFromUrl(url: string): Promise<File> {
  if (IS_STATIC) {
    // No server on GitHub Pages: fetch directly. Works only when the image host allows CORS.
    let res: Response;
    try {
      res = await fetch(url, { mode: 'cors' });
    } catch {
      throw new AnalyzeError('이 사이트는 다른 곳에서 이미지를 가져가는 것을 막고 있습니다. 이미지를 저장한 뒤 끌어다 놓거나, 캡처 후 붙여넣기(⌘V) 하세요.', 'FETCH');
    }
    const blob = await res.blob();
    if (!res.ok || !blob.type.startsWith('image/')) throw new AnalyzeError('이미지 파일 주소가 아닙니다. 이미지를 우클릭 → "이미지 주소 복사"한 주소를 넣거나, 캡처 후 붙여넣으세요.', 'FETCH');
    if (blob.size > 8 * 1024 * 1024) throw new AnalyzeError('8MB 이하 이미지만 가져올 수 있습니다.', 'FETCH');
    const ext = (blob.type.split('/')[1] ?? 'png').replace('jpeg', 'jpg');
    return new File([blob], `imported.${ext}`, { type: blob.type });
  }
  const res = await fetch('/api/fetch-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new AnalyzeError(j.message ?? `이미지를 가져오지 못했습니다 (HTTP ${res.status})`, 'FETCH');
  }
  const blob = await res.blob();
  const ext = (blob.type.split('/')[1] ?? 'png').replace('jpeg', 'jpg');
  return new File([blob], `imported.${ext}`, { type: blob.type });
}
