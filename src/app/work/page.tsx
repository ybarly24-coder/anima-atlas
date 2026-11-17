'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { SceneCard, SourceRow } from '@/components/Cards';
import { MediaUploader } from '@/components/MediaUploader';
import { SceneMedia } from '@/components/Placeholder';
import { SourcePicker } from '@/components/SourceEditor';
import { WorkEditor } from '@/components/WorkEditor';
import { Button, CategoryChip, ConfirmationDialog, EmptyState, KindLabel, LensChip, LinkButton, SectionTitle } from '@/components/ui';
import { useAtlas, useLookups } from '@/lib/store';
import { tmdbImageUrl } from '@/lib/imports';
import type { Source } from '@/lib/types';
import { boardHref, movieHref, workHref } from '@/lib/routes';

function WorkDetailPageInner() {
  const slug = useSearchParams().get('slug') ?? '';
  const router = useRouter();
  const { data, saveWork, deleteWork, removeAsset, notify } = useAtlas();
  const { sourceById } = useLookups();
  const work = data.works.find((w) => w.slug === decodeURIComponent(slug));
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [editSources, setEditSources] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);

  if (!work) {
    return <EmptyState title="작품을 찾을 수 없습니다." body="삭제되었거나 주소가 잘못되었습니다." action={<LinkButton href="/works">작품 목록</LinkButton>} />;
  }
  const scenes = data.scenes.filter((s) => s.workId === work.id).sort((a, b) => (a.seedCode ?? 'zz').localeCompare(b.seedCode ?? 'zz') || a.createdAt.localeCompare(b.createdAt));
  const sources = work.officialSourceIds.map((id) => sourceById.get(id)).filter(Boolean) as Source[];
  const boards = data.boards.filter((b) => b.workIds.includes(work.id) || b.sceneIds.some((id) => scenes.some((s) => s.id === id)));

  return (
    <div className="flex flex-col gap-8">
      <nav className="text-xs text-muted" aria-label="경로">
        <Link href="/works" className="underline underline-offset-2">작품</Link> / <span>{work.titleKo}</span>
      </nav>
      <section className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="flex flex-col gap-2">
          {!work.coverAssetId && work.tmdbPosterPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tmdbImageUrl(work.tmdbPosterPath, 'w342')} alt={`${work.titleKo} 포스터 (TMDB 제공)`} className="w-full max-w-[220px] rounded-lg border border-line" />
          ) : (
            <SceneMedia assetId={work.coverAssetId} seed={work.id} categoryId={work.categoryId} label={work.titleKo} className="aspect-[3/2] rounded-lg border border-line" />
          )}
          <Button size="sm" variant="ghost" onClick={() => setCoverOpen((v) => !v)} aria-expanded={coverOpen}>
            {coverOpen ? '대표 이미지 닫기' : '대표 이미지 등록/변경'}
          </Button>
          {coverOpen && (
            <MediaUploader
              label="대표 이미지"
              currentAssetId={work.coverAssetId}
              onChange={async (assetId) => {
                const prev = work.coverAssetId;
                await saveWork({ ...work, coverAssetId: assetId });
                if (prev && prev !== assetId) await removeAsset(prev);
                notify(assetId ? '대표 이미지를 저장했습니다.' : '대표 이미지를 제거했습니다.');
                setCoverOpen(false);
              }}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip id={work.categoryId} />
            <span className="text-sm text-muted">{work.releaseYear}</span>
            {work.lensIds.map((l) => <LensChip key={l} lens={l} />)}
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold leading-tight">{work.titleKo}</h1>
            <p className="text-ink-2">{work.titleEn}</p>
          </div>
          {work.researchQuestion && (
            <div className="rounded-lg border-l-4 border-ink bg-card px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">핵심 연구 질문</p>
              <p className="mt-1 font-serif text-lg leading-snug">{work.researchQuestion}</p>
            </div>
          )}
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted">스튜디오</dt><dd>{work.studio}</dd>
            {work.director?.length ? (<><dt className="text-muted">감독</dt><dd>{work.director.join(', ')}</dd></>) : null}
            {work.medium?.length ? (<><dt className="text-muted">제작 방식</dt><dd>{work.medium.join(', ')}</dd></>) : null}
          </dl>
          {work.synopsisKo && (
            <div className="rounded-md border border-[#d4e3dc] bg-fact-bg/50 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2"><KindLabel kind="fact" /><span className="text-xs text-muted">공식 개요 (출처 기반 요약)</span></div>
              <p className="leading-relaxed text-ink-2">{work.synopsisKo}</p>
              {sources.length > 0 && <p className="mt-1 text-[11px] text-muted">근거: {sources.filter((s) => s.sourceType === 'official_film').map((s) => `[${s.code ?? s.title}]`).join(' ') || '연결된 출처 참조'}</p>}
            </div>
          )}
          {(work.overviewKo || work.researchKeywords.length > 0) && (
            <div className="rounded-md border border-[#ecd6ab] bg-hypo-bg/50 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2"><KindLabel kind="analysis" /><span className="text-xs text-muted">연구를 시작하기 위한 해석 프레임 — 공식 제작 의도가 아님</span></div>
              {work.overviewKo && <p className="leading-relaxed text-ink-2">{work.overviewKo}</p>}
              {work.researchKeywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {work.researchKeywords.map((k) => <span key={k} className="rounded-full border border-[#ecd6ab] bg-card px-2 py-0.5 text-xs text-ink-2">{k}</span>)}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <LinkButton href={work.tmdbId ? movieHref(work.tmdbId) : `/search?q=${encodeURIComponent(work.titleEn || work.titleKo)}`} variant="primary">이미지 후보 찾기</LinkButton>
            <LinkButton href={`/capture?work=${work.id}`}>이미지 직접 올리기</LinkButton>
            <LinkButton href={`/scenes/new?work=${work.id}`}>+ 빈 장면 노트</LinkButton>
            <Button onClick={() => setEditOpen(true)}>작품 편집</Button>
            <Button variant="danger" onClick={() => setConfirm(true)}>삭제</Button>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title={`장면 ${scenes.length}`} sub="시드 장면은 연구자가 직접 관람하고 검증해야 할 '장면 후보'입니다." />
        {scenes.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{scenes.map((s) => <SceneCard key={s.id} scene={s} />)}</div>
        ) : (
          <EmptyState title="아직 장면이 없습니다." action={<LinkButton href={`/scenes/new?work=${work.id}`} variant="primary">+ 장면 추가</LinkButton>} />
        )}
      </section>

      {boards.length > 0 && (
        <section>
          <SectionTitle title="이 작품이 포함된 연구 보드" />
          <ul className="flex flex-wrap gap-2">
            {boards.map((b) => (
              <li key={b.id}><Link href={boardHref(b.id)} className="block rounded-md border border-line bg-card px-3 py-2 text-sm hover:border-ink">{b.title}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle title="출처" right={<Button size="sm" onClick={() => setEditSources((v) => !v)}>{editSources ? '완료' : '출처 연결 편집'}</Button>} />
        {editSources ? (
          <div className="rounded-lg border border-line bg-card p-4">
            <SourcePicker value={work.officialSourceIds} defaultWorkId={work.id} onChange={(ids) => saveWork({ ...work, officialSourceIds: ids }).then(() => notify('출처 연결을 저장했습니다.'))} />
          </div>
        ) : sources.length ? (
          <div className="grid gap-3 md:grid-cols-2">{sources.map((s) => <SourceRow key={s.id} source={s} showWorks={false} />)}</div>
        ) : (
          <EmptyState title="연결된 출처가 없습니다." />
        )}
      </section>

      <WorkEditor open={editOpen} onClose={() => setEditOpen(false)} work={work} onSaved={(w) => w.slug !== work.slug && router.replace(workHref(w.slug))} />
      <ConfirmationDialog
        open={confirm}
        title="작품 삭제"
        body={<>《{work.titleKo}》와 이 작품의 장면 {scenes.length}개가 삭제되고, 연구 보드·인사이트·출처에서 연결이 해제됩니다. 되돌릴 수 없습니다. (필요하면 먼저 JSON 백업을 받으세요.)</>}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await deleteWork(work.id);
          notify('작품을 삭제했습니다.', 'info');
          router.push('/works');
        }}
      />
    </div>
  );
}

export default function WorkDetailPage() {
  return (
    <Suspense>
      <WorkDetailPageInner />
    </Suspense>
  );
}
