'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SceneMedia } from '@/components/Placeholder';
import { SceneCardNews } from '@/components/SceneCardNews';
import { Dialog, EmptyState, LinkButton, PageHeader } from '@/components/ui';
import { useAtlas, useLookups } from '@/lib/store';
import type { CategoryId, Scene } from '@/lib/types';
import { formatDate } from '@/lib/util';
import { sceneHref } from '@/lib/routes';

export default function CardsPage() {
  const { data } = useAtlas();
  const { workById } = useLookups();
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [open, setOpen] = useState<Scene | null>(null);

  const analyzed = data.scenes
    .filter((s) => s.aiAnalysis)
    .filter((s) => cat === 'all' || workById.get(s.workId)?.categoryId === cat)
    .sort((a, b) => (b.aiAnalysis!.createdAt).localeCompare(a.aiAnalysis!.createdAt));

  return (
    <div>
      <PageHeader eyebrow="Card News" title="AI 분석 카드뉴스" sub="AI가 분석한 장면들을 카드뉴스로 모아봅니다. 카드를 눌러 넘겨 보거나 PNG로 저장하세요." right={<LinkButton href="/capture" variant="primary">+ 캡처해서 분석</LinkButton>} />
      <div className="mb-4"><CategoryTabs value={cat} onChange={setCat} /></div>
      {analyzed.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {analyzed.map((s) => {
            const w = workById.get(s.workId);
            const a = s.aiAnalysis!.analysis;
            return (
              <button key={s.id} type="button" onClick={() => setOpen(s)} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-card text-left transition-shadow hover:shadow-md">
                <SceneMedia assetId={s.sceneImageAssetId} seed={s.id} categoryId={w?.categoryId} label={s.title} className="aspect-[4/5] [&_img]:transition-transform group-hover:[&_img]:scale-[1.02]" />
                <div className="flex flex-col gap-1 p-3">
                  <span className="text-[10px] font-semibold tracking-wide text-muted">{w?.titleKo} · {formatDate(s.aiAnalysis!.createdAt)}</span>
                  <span className="font-serif text-sm font-semibold leading-snug">{s.title}</span>
                  <span className="line-clamp-2 text-xs text-ink-2">{a.summary}</span>
                  <span className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted">
                    <span className="rounded border border-line px-1">{a.camera.shotSize}</span>
                    <span className="rounded border border-line px-1">{a.camera.angle}</span>
                    <span className="rounded border border-line px-1">{a.color.temperature}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState title="아직 AI로 분석한 장면이 없습니다." body="장면 이미지를 캡처해 붙여넣으면 AI가 분석해 카드뉴스를 만듭니다." action={<LinkButton href="/capture" variant="primary">캡처해서 분석하기</LinkButton>} />
      )}
      <Dialog open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} wide>
        {open && (
          <div className="flex flex-col gap-3">
            <SceneCardNews scene={data.scenes.find((s) => s.id === open.id) ?? open} />
            <Link href={sceneHref(open.id)} className="self-center text-xs underline underline-offset-2">장면 상세·메모 열기</Link>
          </div>
        )}
      </Dialog>
    </div>
  );
}
