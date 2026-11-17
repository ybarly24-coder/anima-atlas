'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BOARD_STATUS_LABEL } from '@/lib/labels';
import { useAtlas, useLookups } from '@/lib/store';
import type { ResearchBoard, Scene, Source, Work } from '@/lib/types';
import { cx, formatDate, formatTimecode } from '@/lib/util';
import { AddToBoardDialog } from './AddToBoardDialog';
import { Placeholder, SceneMedia } from './Placeholder';
import { CategoryChip, ExternalLink, LensChip, SourceBadge, TagChip, VerificationBadge, categoryOf } from './ui';
import { IMAGE_TYPE_LABEL, SOURCE_TYPE_LABEL } from '@/lib/labels';
import { tmdbImageUrl } from '@/lib/imports';
import { boardHref, sceneHref, workHref } from '@/lib/routes';

export function SceneCard({ scene, compact }: { scene: Scene; compact?: boolean }) {
  const { toggleSceneBookmark, toggleTray, tray } = useAtlas();
  const { workById, tagById } = useLookups();
  const [boardOpen, setBoardOpen] = useState(false);
  const work = workById.get(scene.workId);
  const tags = scene.tagIds.map((id) => tagById.get(id)).filter(Boolean) as NonNullable<ReturnType<typeof tagById.get>>[];
  const inTray = tray.mode === 'scene' && tray.ids.includes(scene.id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-card transition-shadow hover:shadow-md">
      <Link href={sceneHref(scene.id)} className="block" aria-label={`${scene.title} 장면 분석 열기`}>
        <SceneMedia assetId={scene.sceneImageAssetId} seed={scene.id} categoryId={work?.categoryId} label={scene.title} className={compact ? 'aspect-[16/8]' : 'aspect-video'} />
        {scene.colorAnalysis && (
          <div className="flex h-2" aria-label="추출 팔레트">
            {scene.colorAnalysis.swatches.map((c) => <span key={c.hex} style={{ background: c.hex, flex: Math.max(c.proportion, 0.04) }} />)}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {work && <CategoryChip id={work.categoryId} size="xs" />}
          <VerificationBadge status={scene.verificationStatus} />
          {scene.seedCode && <span className="text-[10px] font-mono text-muted">{scene.seedCode}</span>}
          {scene.sceneImageAssetId && scene.imageType && scene.imageType !== 'actual_frame' && <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted" title={IMAGE_TYPE_LABEL[scene.imageType].hint}>{IMAGE_TYPE_LABEL[scene.imageType].ko}</span>}
          {scene.aiAnalysis && <span className="rounded border border-line-2 bg-paper px-1.5 py-0.5 text-[10px] font-semibold text-ink-2" title="AI 분석 카드뉴스 있음">AI 카드</span>}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted">{work ? `${work.titleKo} · ${work.releaseYear}` : '작품 없음'}</p>
          <Link href={sceneHref(scene.id)} className="mt-0.5 block font-medium leading-snug text-ink hover:underline">
            {scene.title}
          </Link>
          {!compact && scene.researchQuestion && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-2">{scene.researchQuestion}</p>}
          <p className="mt-1 text-[11px] text-muted">{scene.startSeconds != null ? `타임코드 ${formatTimecode(scene.startSeconds)}${scene.endSeconds != null ? `–${formatTimecode(scene.endSeconds)}` : ''}` : '타임코드 미입력'}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((t) => (
            <TagChip key={t.id} tag={t} />
          ))}
          {tags.length > 3 && <span className="rounded-full px-1.5 py-0.5 text-xs text-muted">+{tags.length - 3}</span>}
        </div>
        <div className="mt-auto flex items-center gap-1 border-t border-line pt-2">
          <button
            type="button"
            onClick={() => toggleSceneBookmark(scene.id)}
            aria-pressed={scene.isBookmark}
            className={cx('rounded px-2 py-1 text-xs hover:bg-paper-2', scene.isBookmark ? 'font-semibold text-ink' : 'text-muted')}
            title="북마크"
          >
            {scene.isBookmark ? '★ 북마크됨' : '☆ 북마크'}
          </button>
          <button type="button" onClick={() => setBoardOpen(true)} className="rounded px-2 py-1 text-xs text-muted hover:bg-paper-2 hover:text-ink">
            + 보드
          </button>
          <button
            type="button"
            onClick={() => toggleTray('scene', scene.id)}
            aria-pressed={inTray}
            className={cx('ml-auto rounded px-2 py-1 text-xs hover:bg-paper-2', inTray ? 'font-semibold text-ink' : 'text-muted')}
          >
            {inTray ? '✓ 비교함' : '비교함에 담기'}
          </button>
        </div>
      </div>
      <AddToBoardDialog sceneIds={[scene.id]} open={boardOpen} onClose={() => setBoardOpen(false)} />
    </article>
  );
}

export function WorkCard({ work }: { work: Work }) {
  const { data, toggleTray, tray } = useAtlas();
  const count = data.scenes.filter((s) => s.workId === work.id).length;
  const inTray = tray.mode === 'work' && tray.ids.includes(work.id);
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-line bg-card transition-shadow hover:shadow-md">
      <Link href={workHref(work.slug)} aria-label={`${work.titleKo} 작품 상세`}>
        {!work.coverAssetId && work.tmdbPosterPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tmdbImageUrl(work.tmdbPosterPath, 'w342')} alt={`${work.titleKo} 포스터 (TMDB 제공)`} loading="lazy" className="aspect-[3/2] w-full bg-paper-2 object-cover object-top" />
        ) : (
          <SceneMedia assetId={work.coverAssetId} seed={work.id} categoryId={work.categoryId} label={work.titleKo} className="aspect-[3/2]" />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryChip id={work.categoryId} size="xs" />
          <span className="text-xs text-muted">{work.releaseYear}</span>
        </div>
        <div>
          <Link href={workHref(work.slug)} className="font-serif text-base font-semibold leading-snug hover:underline">
            {work.titleKo}
          </Link>
          <p className="text-xs text-muted">{work.titleEn}</p>
        </div>
        {work.researchQuestion && <p className="line-clamp-2 text-xs leading-relaxed text-ink-2">{work.researchQuestion}</p>}
        <div className="mt-auto flex items-center gap-1.5 border-t border-line pt-2">
          {work.lensIds.map((l) => (
            <LensChip key={l} lens={l} />
          ))}
          <span className="text-xs text-muted">장면 {count}</span>
          <button type="button" onClick={() => toggleTray('work', work.id)} aria-pressed={inTray} className={cx('ml-auto rounded px-2 py-1 text-xs hover:bg-paper-2', inTray ? 'font-semibold' : 'text-muted')}>
            {inTray ? '✓ 비교함' : '비교함'}
          </button>
        </div>
      </div>
    </article>
  );
}

export function BoardCard({ board }: { board: ResearchBoard }) {
  const { sceneById, workById } = useLookups();
  const scenes = board.sceneIds.map((id) => sceneById.get(id)).filter(Boolean) as Scene[];
  return (
    <Link href={boardHref(board.id)} className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex gap-1">
        {scenes.slice(0, 4).map((s) => (
          <SceneMedia key={s.id} assetId={s.sceneImageAssetId} seed={s.id} categoryId={workById.get(s.workId)?.categoryId} label={s.title} className="aspect-square w-1/4 rounded [&_span]:hidden" />
        ))}
        {Array.from({ length: Math.max(0, 4 - scenes.length) }).map((_, i) => (
          <div key={i} className="aspect-square w-1/4 rounded border border-dashed border-line-2" aria-hidden />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {board.seedCode && <span className="font-mono text-[10px] text-muted">{board.seedCode}</span>}
        <span className={cx('rounded border px-1.5 py-0.5 text-[10px] font-semibold', board.status === 'template' ? 'border-[#ecd6ab] bg-hypo-bg text-hypo' : 'border-line-2 bg-paper-2 text-ink-2')}>{BOARD_STATUS_LABEL[board.status]}</span>
        {board.categoryIds.map((c) => (
          <span key={c} className="text-[10px] font-semibold text-muted">{categoryOf(c).label}</span>
        ))}
      </div>
      <div>
        <p className="font-serif text-base font-semibold leading-snug">{board.title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-2">{board.researchQuestion || '연구 질문 미입력'}</p>
      </div>
      <p className="mt-auto text-[11px] text-muted">
        장면 {board.sceneIds.length}개 · 수정 {formatDate(board.updatedAt)}
      </p>
    </Link>
  );
}

export function SourceRow({ source, showWorks = true }: { source: Source; showWorks?: boolean }) {
  const { workById } = useLookups();
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-line bg-card p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {source.code && <span className="font-mono text-[11px] font-semibold text-ink-2">[{source.code}]</span>}
        <SourceBadge evidence={source.evidenceType} />
        <VerificationBadge status={source.verificationStatus} />
        <span className="text-[11px] text-muted">{SOURCE_TYPE_LABEL[source.sourceType]}</span>
      </div>
      <ExternalLink href={source.url} className="text-sm font-medium text-ink">
        {source.title}
      </ExternalLink>
      <p className="text-xs text-muted">
        {source.publisher} · 확인일 {source.accessedAt}
      </p>
      {source.notes && <p className="text-xs leading-relaxed text-ink-2">{source.notes}</p>}
      {showWorks && source.relatedWorkIds.length > 0 && (
        <p className="text-xs text-muted">
          연결 작품:{' '}
          {source.relatedWorkIds.map((id, i) => {
            const w = workById.get(id);
            return w ? (
              <span key={id}>
                {i > 0 && ', '}
                <Link href={workHref(w.slug)} className="underline underline-offset-2">{w.titleKo}</Link>
              </span>
            ) : null;
          })}
        </p>
      )}
    </div>
  );
}

export { Placeholder };
