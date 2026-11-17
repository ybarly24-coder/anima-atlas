'use client';

import { CATEGORY_ACCENT } from '@/lib/labels';
import type { CategoryId } from '@/lib/types';
import { cx, hashString } from '@/lib/util';
import { useAssetUrl } from '@/lib/store';

/** Copyright-safe CSS abstract placeholder (spec E1). Deterministic per seed string. */
export function Placeholder({ seed, categoryId, label, className }: { seed: string; categoryId?: CategoryId; label?: string; className?: string }) {
  const h = hashString(seed);
  const baseHue = categoryId ? CATEGORY_ACCENT[categoryId].hue : h % 360;
  const hue2 = (baseHue + 25 + (h % 40)) % 360;
  const angle = h % 180;
  const x = 20 + (h % 60);
  const y = 20 + ((h >> 8) % 60);
  return (
    <div
      className={cx('placeholder-art flex items-end', className)}
      style={{
        background: `radial-gradient(circle at ${x}% ${y}%, hsl(${baseHue} 22% 78%) 0%, transparent 55%), linear-gradient(${angle}deg, hsl(${baseHue} 14% 86%), hsl(${hue2} 12% 72%))`,
      }}
      role="img"
      aria-label={label ? `${label} — 이미지 없음 (플레이스홀더)` : '이미지 없음 (플레이스홀더)'}
    >
      <span className="relative z-10 m-2 rounded bg-card/80 px-1.5 py-0.5 text-[10px] font-medium text-muted">이미지 없음 · 플레이스홀더</span>
    </div>
  );
}

export function SceneMedia({ assetId, seed, categoryId, label, className, overlay }: { assetId?: string | null; seed: string; categoryId?: CategoryId; label: string; className?: string; overlay?: React.ReactNode }) {
  const { url, asset } = useAssetUrl(assetId);
  if (!assetId || !url) return <Placeholder seed={seed} categoryId={categoryId} label={label} className={className} />;
  return (
    <div className={cx('relative overflow-hidden bg-paper-2', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={asset?.alt || label} className="h-full w-full object-cover" />
      {overlay}
    </div>
  );
}
