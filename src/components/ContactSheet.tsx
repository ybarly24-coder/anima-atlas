'use client';

import Link from 'next/link';
import { useLookups } from '@/lib/store';
import type { Scene } from '@/lib/types';
import { SceneMedia } from './Placeholder';
import { sceneHref } from '@/lib/routes';

/** Film contact-sheet strip of scenes (spec v2 Home: "영화 필름 컨택트 시트처럼"). */
export function ContactSheet({ scenes, empty }: { scenes: Scene[]; empty?: React.ReactNode }) {
  const { workById } = useLookups();
  if (!scenes.length) return <>{empty}</>;
  return (
    <div className="relative overflow-x-auto rounded-lg bg-[#1c1a17] px-3 py-2 [scrollbar-width:thin]">
      <Sprockets />
      <ol className="flex gap-2 py-1.5">
        {scenes.map((s, i) => {
          const w = workById.get(s.workId);
          return (
            <li key={s.id} className="w-44 shrink-0 sm:w-52">
              <Link href={sceneHref(s.id)} className="group block focus-visible:outline-paper">
                <SceneMedia assetId={s.sceneImageAssetId} seed={s.id} categoryId={w?.categoryId} label={s.title} className="aspect-[3/2] rounded-[3px] [&_span]:hidden" />
                <div className="mt-1.5 flex items-baseline gap-1.5 text-[#e9e3d8]">
                  <span className="font-mono text-[10px] text-[#a39b8e]">{String(i + 1).padStart(2, '0')}A</span>
                  <span className="truncate text-xs font-medium group-hover:underline">{s.title}</span>
                </div>
                <p className="truncate font-mono text-[10px] text-[#a39b8e]">{w?.titleEn ?? ''}</p>
                {s.colorAnalysis && (
                  <div className="mt-1 flex h-1.5 overflow-hidden rounded-sm" aria-hidden>
                    {s.colorAnalysis.swatches.map((c) => <span key={c.hex} style={{ background: c.hex, flex: Math.max(c.proportion, 0.04) }} />)}
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
      <Sprockets />
    </div>
  );
}

function Sprockets() {
  return (
    <div className="flex gap-3 overflow-hidden" aria-hidden>
      {Array.from({ length: 60 }).map((_, i) => (
        <span key={i} className="h-2 w-3 shrink-0 rounded-[2px] bg-[#3a3631]" />
      ))}
    </div>
  );
}
