'use client';

// Turning a chosen image (TMDB result, upload, paste) into a research Scene:
// hash for duplicate detection -> store blob with provenance -> real-pixel palette -> Scene.
import { extractPaletteFromBlob } from './palette';
import { IS_STATIC } from './runtime';
import type { CategoryId, ColorAnalysis, ImageType, MediaAsset, Scene, SourceProvider, Work } from './types';
import { newId, nowIso, uniqueSlug } from './util';

export const PALETTE_ALGORITHM = 'rgb-4bit-buckets+merge40/v1';

export async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function imageDims(blob: Blob): Promise<{ width: number; height: number } | null> {
  try {
    const bmp = await createImageBitmap(blob);
    const d = { width: bmp.width, height: bmp.height };
    bmp.close?.();
    return d;
  } catch {
    return null;
  }
}

/** Palette from actual pixels; returns null when the image cannot be decoded ("분석 불가"). */
export async function computeColorAnalysis(blob: Blob, assetId: string, count = 8): Promise<ColorAnalysis | null> {
  try {
    const pal = await extractPaletteFromBlob(blob, count);
    if (!pal.length) return null;
    const total = pal.reduce((a, p) => a + p.share, 0) || 1;
    return {
      swatches: pal.map((p) => ({ hex: p.hex, proportion: p.share / total })),
      algorithmVersion: PALETTE_ALGORITHM,
      extractedFromAssetId: assetId,
      createdAt: nowIso(),
    };
  } catch {
    return null;
  }
}

// Server mode: same-origin proxy. Static mode: TMDB's image CDN directly (it sends CORS headers, so pixels stay readable).
export const tmdbImageUrl = (path: string, size = 'w780') =>
  IS_STATIC ? `https://image.tmdb.org/t/p/${size}${path}` : `/api/tmdb/image?path=${encodeURIComponent(path)}&size=${size}`;
export const tmdbPublicImageUrl = (path: string, size = 'original') => `https://image.tmdb.org/t/p/${size}${path}`;
export const tmdbMoviePage = (id: number) => `https://www.themoviedb.org/movie/${id}`;

const norm = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '');

/** Find the local Work for a TMDB movie: by tmdbId, else by title (ko/en/original) + year (±1). */
export function matchWork(works: Work[], m: { id: number; titleKo: string; titleEn: string; originalTitle: string; releaseYear: number | null }): Work | undefined {
  const byId = works.find((w) => w.tmdbId === m.id);
  if (byId) return byId;
  const titles = [m.titleKo, m.titleEn, m.originalTitle].filter(Boolean).map(norm);
  return works.find((w) => {
    const wt = [w.titleKo, w.titleEn].map(norm);
    const titleHit = wt.some((t) => titles.includes(t));
    const yearOk = m.releaseYear == null || Math.abs(w.releaseYear - m.releaseYear) <= 1;
    return titleHit && yearOk;
  });
}

export interface TmdbMovieLike {
  id: number;
  titleKo: string;
  titleEn: string;
  originalTitle: string;
  releaseYear: number | null;
  posterPath: string | null;
  overview: string;
  companies?: string[];
  homepage?: string | null;
}

export function workFromTmdb(m: TmdbMovieLike, categoryId: CategoryId, existingSlugs: string[]): Work {
  const now = nowIso();
  return {
    id: newId('work'),
    slug: uniqueSlug(m.titleEn || m.originalTitle || m.titleKo, existingSlugs),
    categoryId,
    titleKo: m.titleKo || m.titleEn,
    titleEn: m.titleEn || m.originalTitle,
    releaseYear: m.releaseYear ?? new Date().getFullYear(),
    studio: (m.companies ?? []).slice(0, 3).join(', ') || '미확인',
    director: [],
    medium: [],
    // TMDB overview is provider metadata, not a studio statement; it is labelled as such in the UI.
    synopsisKo: m.overview ? `${m.overview} (TMDB 제공 개요)` : undefined,
    researchKeywords: [],
    lensIds: ['visual', 'narrative', 'production'],
    officialSourceIds: [],
    coverAssetId: null,
    tmdbId: m.id,
    tmdbPosterPath: m.posterPath,
    officialUrl: m.homepage ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export interface ImportDeps {
  scenes: Scene[];
  saveAssetFromFile: (b: Blob, meta: Partial<MediaAsset> & { alt: string }) => Promise<string>;
  findAssetByHash: (hash: string) => Promise<MediaAsset | undefined>;
  saveScene: (s: Scene) => Promise<void>;
}

export interface ImportInput {
  blob: Blob;
  workId: string;
  title: string;
  imageType: ImageType;
  provider: SourceProvider;
  sourcePageUrl?: string | null;
  originalImageUrl?: string | null;
  attribution: string;
  description?: string;
}

export type ImportResult = { scene: Scene; duplicate: boolean; paletteOk: boolean };

/** Creates (or reuses, if the exact same image was imported before) a Scene for an image. */
export async function importImageAsScene(input: ImportInput, deps: ImportDeps): Promise<ImportResult> {
  const hash = await sha256Hex(input.blob);
  const existing = await deps.findAssetByHash(hash);
  if (existing) {
    const scene = deps.scenes.find((s) => s.sceneImageAssetId === existing.id);
    if (scene) return { scene, duplicate: true, paletteOk: !!scene.colorAnalysis };
  }
  const dims = await imageDims(input.blob);
  const assetId = await deps.saveAssetFromFile(input.blob, {
    alt: input.title,
    attribution: input.attribution,
    rightsNote: input.provider === 'tmdb' ? 'TMDB 제공 이미지. 이미지 권리는 각 작품 권리자에게 있음. 개인 연구용 로컬 분석.' : '사용자가 개인 연구용으로 등록',
    workId: input.workId,
    sourceProvider: input.provider,
    sourcePageUrl: input.sourcePageUrl ?? null,
    originalImageUrl: input.originalImageUrl ?? null,
    licenseStatus: 'unverified',
    width: dims?.width,
    height: dims?.height,
    aspectRatio: dims ? dims.width / dims.height : undefined,
    contentHash: hash,
    importedAt: nowIso(),
  });
  const colorAnalysis = await computeColorAnalysis(input.blob, assetId);
  const now = nowIso();
  const scene: Scene = {
    id: newId('scene'),
    workId: input.workId,
    title: input.title,
    description: input.description ?? '',
    startSeconds: null,
    endSeconds: null,
    shotDescription: '',
    sceneImageAssetId: assetId,
    externalVideoUrl: null,
    // The specific image URL (not just the page) so the UI can show which candidates were already imported.
    imageSourceUrl: input.originalImageUrl ?? input.sourcePageUrl ?? null,
    imageType: input.imageType,
    colorAnalysis,
    lensIds: ['visual', 'narrative', 'production'],
    tagIds: [],
    colors: [],
    colorSource: null,
    observation: '', interpretation: '', productionFact: '', hypothesis: '', application: '',
    visualNotes: '', narrativeNotes: '', productionNotes: '',
    researchQuestion: '',
    sourceIds: [],
    verificationStatus: 'unverified',
    isBookmark: false,
    aiAnalysis: null,
    createdAt: now,
    updatedAt: now,
  };
  await deps.saveScene(scene);
  return { scene, duplicate: false, paletteOk: !!colorAnalysis };
}

/** Hue family of a color, for "hue family" filtering. */
export type HueFamily = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'pink' | 'neutral';

export const HUE_FAMILY_LABEL: Record<HueFamily, string> = {
  red: '빨강', orange: '주황', yellow: '노랑', green: '초록', cyan: '청록', blue: '파랑', purple: '보라', pink: '분홍', neutral: '무채색',
};

export function hueFamily(hex: string): HueFamily {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.18 || l < 0.08 || l > 0.95) return 'neutral';
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h < 15 || h >= 345) return 'red';
  if (h < 40) return 'orange';
  if (h < 65) return 'yellow';
  if (h < 160) return 'green';
  if (h < 195) return 'cyan';
  if (h < 255) return 'blue';
  if (h < 300) return 'purple';
  return 'pink';
}

/** Hue families that make up at least `min` of the image (by swatch proportion). */
export function sceneHueFamilies(scene: Pick<Scene, 'colorAnalysis' | 'colors'>, min = 0.15): HueFamily[] {
  const acc = new Map<HueFamily, number>();
  if (scene.colorAnalysis?.swatches.length) {
    for (const s of scene.colorAnalysis.swatches) acc.set(hueFamily(s.hex), (acc.get(hueFamily(s.hex)) ?? 0) + s.proportion);
  } else if (scene.colors.length) {
    for (const c of scene.colors) acc.set(hueFamily(c), (acc.get(hueFamily(c)) ?? 0) + 1 / scene.colors.length);
  }
  return Array.from(acc.entries()).filter(([, v]) => v >= min).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

const WARM: HueFamily[] = ['red', 'orange', 'yellow', 'pink'];
const COOL: HueFamily[] = ['cyan', 'blue', 'purple'];

/** Warm/cool reading of the real palette (>= 55% of chromatic area). null = no palette or mixed. */
export function paletteTemperature(scene: Pick<Scene, 'colorAnalysis'>): 'warm' | 'cool' | null {
  const sw = scene.colorAnalysis?.swatches;
  if (!sw?.length) return null;
  let warm = 0, cool = 0, chroma = 0;
  for (const s of sw) {
    const f = hueFamily(s.hex);
    if (f === 'neutral') continue;
    chroma += s.proportion;
    if (WARM.includes(f)) warm += s.proportion;
    if (COOL.includes(f)) cool += s.proportion;
  }
  if (chroma < 0.2) return null;
  if (warm / chroma >= 0.55) return 'warm';
  if (cool / chroma >= 0.55) return 'cool';
  return null;
}
