'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { SceneAnatomy, blankScene } from '@/components/SceneAnatomy';
import { useAtlas } from '@/lib/store';

function NewSceneInner() {
  const params = useSearchParams();
  const { data } = useAtlas();
  const workParam = params.get('work') ?? '';
  const initial = useMemo(() => blankScene(data.works.some((w) => w.id === workParam) ? workParam : ''), [workParam, data.works]);
  return <SceneAnatomy initial={initial} isNew />;
}

export default function NewScenePage() {
  return (
    <Suspense>
      <NewSceneInner />
    </Suspense>
  );
}
