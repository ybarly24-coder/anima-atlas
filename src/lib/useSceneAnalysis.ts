'use client';

import { useState } from 'react';
import { AnalyzeError, requestAnalysis, toRecord } from './ai';
import { useAtlas } from './store';
import type { Scene } from './types';

/** Runs AI analysis for a scene's stored image and saves the result on the scene. */
export function useSceneAnalysis() {
  const { data, loadAsset, saveScene, notify } = useAtlas();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);

  const run = async (scene: Scene, opts?: { useAiTitle?: boolean; note?: string }): Promise<Scene | null> => {
    setError(null);
    if (!scene.sceneImageAssetId) {
      setError({ message: '분석할 이미지가 없습니다. 먼저 이미지를 등록하세요.', code: 'NO_IMAGE' });
      return null;
    }
    const asset = await loadAsset(scene.sceneImageAssetId);
    if (!asset?.blob) {
      setError({ message: '저장된 이미지를 불러올 수 없습니다.', code: 'NO_IMAGE' });
      return null;
    }
    const work = data.works.find((w) => w.id === scene.workId);
    setRunning(true);
    try {
      const r = await requestAnalysis(
        asset.blob,
        { workTitle: work ? `${work.titleKo} (${work.titleEn}, ${work.releaseYear})` : undefined, sceneTitle: scene.title || undefined, note: opts?.note || scene.description || undefined },
        data.tags.map((t) => t.nameKo),
      );
      const byName = new Map(data.tags.map((t) => [t.nameKo, t.id]));
      const suggested = r.analysis.suggestedTags.map((n) => byName.get(n)).filter((x): x is string => !!x);
      const next: Scene = {
        ...scene,
        title: opts?.useAiTitle || !scene.title.trim() ? r.analysis.title : scene.title,
        tagIds: Array.from(new Set([...scene.tagIds, ...suggested])),
        lensIds: scene.lensIds.length ? scene.lensIds : ['visual', 'narrative', 'production'],
        aiAnalysis: toRecord(r, scene.sceneImageAssetId),
      };
      await saveScene(next);
      notify('AI 분석을 완료하고 카드뉴스를 만들었습니다.');
      return next;
    } catch (e) {
      const err = e instanceof AnalyzeError ? { message: e.message, code: e.code } : { message: e instanceof Error ? e.message : String(e), code: 'UNKNOWN' };
      setError(err);
      notify(err.message, 'error');
      return null;
    } finally {
      setRunning(false);
    }
  };

  return { run, running, error, clearError: () => setError(null) };
}
