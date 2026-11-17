'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SceneAnatomy } from '@/components/SceneAnatomy';
import { EmptyState, LinkButton } from '@/components/ui';
import { useAtlas } from '@/lib/store';

function SceneDetailPageInner() {
  const id = useSearchParams().get('id') ?? '';
  const { data } = useAtlas();
  const scene = data.scenes.find((s) => s.id === decodeURIComponent(id));
  if (!scene) return <EmptyState title="장면을 찾을 수 없습니다." body="삭제되었거나 주소가 잘못되었습니다." action={<LinkButton href="/scenes">장면 라이브러리</LinkButton>} />;
  return <SceneAnatomy key={scene.id} initial={scene} />;
}

export default function SceneDetailPage() {
  return (
    <Suspense>
      <SceneDetailPageInner />
    </Suspense>
  );
}
