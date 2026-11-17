'use client';

import { useAssetUrl, useLookups } from '@/lib/store';
import type { Scene } from '@/lib/types';
import { AnalysisCards } from './AnalysisCards';

/** Card news for a scene that already has an AI analysis (loads its stored image). */
export function SceneCardNews({ scene }: { scene: Scene }) {
  const { workById } = useLookups();
  const { url, asset } = useAssetUrl(scene.sceneImageAssetId ?? scene.aiAnalysis?.imageAssetId);
  if (!scene.aiAnalysis) return null;
  const w = workById.get(scene.workId);
  return (
    <AnalysisCards
      record={scene.aiAnalysis}
      imageUrl={url}
      imageBlob={asset?.blob ?? null}
      workLabel={w ? `${w.titleKo} · ${w.titleEn} (${w.releaseYear})` : undefined}
      fileBase={scene.id}
      pdfName={scene.title}
    />
  );
}
