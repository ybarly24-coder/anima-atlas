/**
 * Simple sample palette from a user-uploaded image (Canvas-based).
 * This is a "sample palette of the selected frame", NOT the film's color script.
 */
export interface PaletteColor {
  hex: string;
  share: number; // 0..1 share of sampled pixels
}

export function quantizePixels(rgba: Uint8ClampedArray, top = 5, step = 4): PaletteColor[] {
  // 4 bits per channel buckets (4096 bins); accumulate average color per bin.
  const bins = new Map<number, { r: number; g: number; b: number; n: number }>();
  let total = 0;
  for (let i = 0; i < rgba.length; i += 4 * step) {
    const a = rgba[i + 3];
    if (a < 128) continue;
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bin = bins.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bin.r += r; bin.g += g; bin.b += b; bin.n++;
    bins.set(key, bin);
    total++;
  }
  if (total === 0) return [];
  const sorted = Array.from(bins.values()).sort((x, y) => y.n - x.n);
  const picked: Array<{ r: number; g: number; b: number; n: number }> = [];
  for (const bin of sorted) {
    const c = { r: bin.r / bin.n, g: bin.g / bin.n, b: bin.b / bin.n, n: bin.n };
    // Merge into an existing pick if perceptually close, to avoid near-duplicates.
    const near = picked.find((p) => Math.hypot(p.r - c.r, p.g - c.g, p.b - c.b) < 40);
    if (near) { near.n += c.n; continue; }
    picked.push(c);
    if (picked.length >= top * 3) break;
  }
  return picked
    .sort((x, y) => y.n - x.n)
    .slice(0, top)
    .map((c) => ({ hex: toHex(c.r, c.g, c.b), share: c.n / total }));
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export async function extractPaletteFromBlob(blob: Blob, top = 5): Promise<PaletteColor[]> {
  const bitmap = await createImageBitmap(blob);
  const max = 200;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas를 사용할 수 없습니다.');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return quantizePixels(ctx.getImageData(0, 0, w, h).data, top, 1);
}
