'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { seedCategories } from '@seed/categories';
import { AddToBoardDialog } from '@/components/AddToBoardDialog';
import { GoogleImageLinks, TmdbAttribution, TmdbSetupGuide } from '@/components/SearchAids';
import { Button, CategoryChip, Dialog, EmptyState, ExternalLink, Field, KindLabel, LinkButton, Select } from '@/components/ui';
import { importImageAsScene, matchWork, tmdbImageUrl, tmdbMoviePage, tmdbPublicImageUrl, workFromTmdb } from '@/lib/imports';
import { useAtlas } from '@/lib/store';
import type { TmdbImage, TmdbMovieDetail } from '@/lib/tmdb';
import { tmdbMovie } from '@/lib/tmdbClient';
import { IS_STATIC } from '@/lib/runtime';
import type { CategoryId, ImageType, Scene, Work } from '@/lib/types';
import { cx } from '@/lib/util';
import { sceneHref, workHref } from '@/lib/routes';

type Kind = 'backdrop' | 'poster';

function TmdbMoviePageInner() {
  const id = useSearchParams().get('id') ?? '';
  const router = useRouter();
  const { data, saveWork, saveScene, saveAssetFromFile, findAssetByHash, notify } = useAtlas();
  const [movie, setMovie] = useState<TmdbMovieDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'nokey' | 'error'>('loading');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Kind>('backdrop');
  const [category, setCategory] = useState<CategoryId>('other');
  const [picked, setPicked] = useState<{ img: TmdbImage; kind: Kind } | null>(null);
  const [busy, setBusy] = useState<null | 'analyze' | 'board'>(null);
  const [boardScene, setBoardScene] = useState<Scene | null>(null);

  useEffect(() => {
    let cancelled = false;
    tmdbMovie(Number(id))
      .then((m) => {
        if (cancelled) return;
        if (!m) return setState('nokey');
        setMovie(m);
        setState('ok');
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setState('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const lib = movie ? matchWork(data.works, movie) : undefined;
  useEffect(() => {
    if (movie) setCategory(lib?.categoryId ?? movie.categoryGuess);
  }, [movie, lib?.categoryId]);

  if (state === 'loading') return <p className="py-16 text-sm text-muted" role="status">TMDB에서 작품 정보와 이미지 후보를 불러오는 중…</p>;
  if (state === 'nokey') return <div className="flex flex-col gap-4"><TmdbSetupGuide /><LinkButton href="/search">검색으로 돌아가기</LinkButton></div>;
  if (state === 'error' || !movie) return <EmptyState title="작품 정보를 불러오지 못했습니다." body={error} action={<LinkButton href="/search">검색으로 돌아가기</LinkButton>} />;

  /** Make sure a local Work exists for this movie (link an existing one by title/year, or create it). */
  const ensureWork = async (): Promise<Work> => {
    if (lib) {
      if (lib.tmdbId !== movie.id || !lib.tmdbPosterPath) {
        const linked = { ...lib, tmdbId: movie.id, tmdbPosterPath: lib.tmdbPosterPath ?? movie.posterPath };
        await saveWork(linked);
        return linked;
      }
      return lib;
    }
    const w = workFromTmdb(movie, category, data.works.map((x) => x.slug));
    await saveWork(w);
    notify(`《${w.titleKo}》을(를) 라이브러리에 추가했습니다.`);
    return w;
  };

  const importPicked = async (): Promise<Scene | null> => {
    if (!picked) return null;
    const work = await ensureWork();
    const size = picked.kind === 'backdrop' ? 'w1280' : 'w780';
    // Static mode fetches TMDB's CDN directly. The preview <img> may already have cached this URL without
    // CORS headers, so bypass the cache (fresh request carrying Origin) to keep the pixels readable.
    const url = tmdbImageUrl(picked.img.filePath, size);
    const res = await fetch(IS_STATIC ? `${url}?cors=1` : url, IS_STATIC ? { mode: 'cors', cache: 'no-store' } : undefined).catch(() => null);
    if (!res) {
      notify('이미지를 가져오지 못했습니다. 잠시 후 다시 시도하세요.', 'error');
      return null;
    }
    if (!res.ok) {
      notify('이미지를 가져오지 못했습니다. 잠시 후 다시 시도하세요.', 'error');
      return null;
    }
    const blob = await res.blob();
    const imageType: ImageType = picked.kind === 'poster' ? 'poster' : 'promotional_still';
    const n = data.scenes.filter((s) => s.workId === work.id).length + 1;
    const r = await importImageAsScene(
      {
        blob,
        workId: work.id,
        title: `${work.titleKo} ${picked.kind === 'poster' ? '포스터' : '스틸'} ${n}`,
        imageType,
        provider: 'tmdb',
        sourcePageUrl: tmdbMoviePage(movie.id),
        originalImageUrl: tmdbPublicImageUrl(picked.img.filePath),
        attribution: 'TMDB 제공 이미지 · 권리는 각 작품 권리자에게 있음',
      },
      { scenes: data.scenes, saveAssetFromFile, findAssetByHash, saveScene },
    );
    if (r.duplicate) notify('이미 가져온 같은 이미지입니다. 기존 장면 카드로 이동합니다.', 'info');
    else if (!r.paletteOk) notify('장면은 저장했지만 이미지 픽셀을 읽지 못해 팔레트는 "분석 불가"입니다.', 'error');
    else notify('장면 카드를 만들고 실제 이미지에서 팔레트를 추출했습니다.');
    return r.scene;
  };

  const analyze = async () => {
    setBusy('analyze');
    try {
      const s = await importPicked();
      if (s) router.push(sceneHref(s.id));
    } finally {
      setBusy(null);
    }
  };

  const toBoard = async () => {
    setBusy('board');
    try {
      const s = await importPicked();
      if (s) {
        setPicked(null);
        setBoardScene(s);
      }
    } finally {
      setBusy(null);
    }
  };

  const images = tab === 'backdrop' ? movie.images.backdrops : movie.images.posters;
  const importedUrls = new Set(data.scenes.filter((s) => s.imageSourceUrl).map((s) => s.imageSourceUrl));

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-xs text-muted" aria-label="경로"><Link href={`/search?q=${encodeURIComponent(movie.titleKo)}`} className="underline underline-offset-2">작품 검색</Link> / <span>{movie.titleKo}</span></nav>

      <section className="grid gap-5 md:grid-cols-[180px_1fr]">
        {movie.posterPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tmdbImageUrl(movie.posterPath, 'w342')} alt={`${movie.titleKo} 포스터`} className="w-40 rounded-lg border border-line md:w-full" />
        ) : <div className="flex aspect-[2/3] w-40 items-center justify-center rounded-lg border border-line bg-paper-2 text-xs text-muted">포스터 없음</div>}
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h1 className="font-serif text-3xl font-semibold leading-tight">{movie.titleKo}</h1>
            <p className="text-ink-2">{movie.titleEn}{movie.originalTitle && movie.originalTitle !== movie.titleEn ? ` · ${movie.originalTitle}` : ''}{movie.releaseYear ? ` · ${movie.releaseYear}` : ''}{movie.runtime ? ` · ${movie.runtime}분` : ''}</p>
          </div>
          <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            {movie.companies.length > 0 && (<><dt className="text-muted">제작사</dt><dd>{movie.companies.join(', ')}</dd></>)}
            {movie.genres.length > 0 && (<><dt className="text-muted">장르</dt><dd>{movie.genres.join(', ')}</dd></>)}
          </dl>
          {movie.overview && (
            <div className="rounded-md border border-line bg-card p-3 text-sm">
              <p className="mb-1 text-[11px] font-semibold text-muted">TMDB 제공 개요 · 공식 스튜디오 자료가 아님</p>
              <p className="leading-relaxed text-ink-2">{movie.overview}</p>
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3 rounded-md border border-line bg-paper p-3">
            {lib ? (
              <p className="text-sm">
                내 라이브러리: <Link href={workHref(lib.slug)} className="font-semibold underline underline-offset-2">{lib.titleKo}</Link> <CategoryChip id={lib.categoryId} size="xs" />
                <span className="ml-1 text-xs text-muted">· 이 작품의 장면 {data.scenes.filter((s) => s.workId === lib.id).length}개</span>
              </p>
            ) : (
              <Field label="가져올 카테고리" htmlFor="imp-cat" hint={movie.categoryGuess === 'other' ? '제작사로 3개 연구 스튜디오를 판별하지 못했습니다. 맞는 곳을 고르거나 "OTHER"로 두세요. (Pixar는 Disney Animation과 별도)' : `제작사 정보로 ${seedCategories.find((c) => c.id === movie.categoryGuess)?.label}로 추정했습니다.`}>
                <Select id="imp-cat" value={category} onChange={(e) => setCategory(e.target.value as CategoryId)} className="w-60">
                  {seedCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
              </Field>
            )}
            <div className="ml-auto flex flex-wrap gap-2">
              <ExternalLink href={tmdbMoviePage(movie.id)} className="text-xs">TMDB 페이지</ExternalLink>
              {movie.homepage && <ExternalLink href={movie.homepage} className="text-xs">공식 홈페이지</ExternalLink>}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div role="tablist" aria-label="이미지 종류" className="flex gap-1">
            {(['backdrop', 'poster'] as Kind[]).map((k) => (
              <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('rounded-md px-3 py-1.5 text-sm font-medium', tab === k ? 'bg-ink text-paper' : 'border border-line bg-card text-ink-2')}>
                {k === 'backdrop' ? `백드롭 · 홍보용 스틸 ${movie.images.backdrops.length}` : `포스터 ${movie.images.posters.length}`}
              </button>
            ))}
          </div>
          <TmdbAttribution compact />
        </div>
        <p className="rounded-md border border-[#ecd6ab] bg-hypo-bg/50 px-3 py-2 text-xs leading-relaxed text-hypo">
          TMDB가 제공하는 것은 <b>포스터와 홍보용 백드롭</b>입니다. 영화의 모든 장면 프레임이 아니며, 백드롭도 실제 영화 속 프레임과 다를 수 있어 장면 카드에 &quot;홍보용 스틸&quot;로 표시됩니다. 이미지 권리는 각 작품 권리자에게 있습니다.
        </p>
        {images.length ? (
          <ul className={cx('grid gap-3', tab === 'backdrop' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6')}>
            {images.map((img) => {
              const already = importedUrls.has(tmdbPublicImageUrl(img.filePath));
              return (
                <li key={img.filePath}>
                  <button type="button" onClick={() => setPicked({ img, kind: tab })} className="group relative block w-full overflow-hidden rounded-md border border-line bg-paper-2 focus-visible:outline-2" aria-label={`${tab === 'backdrop' ? '백드롭' : '포스터'} 이미지 선택 (${img.width}×${img.height})`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tmdbImageUrl(img.filePath, tab === 'backdrop' ? 'w780' : 'w342')} alt="" loading="lazy" className={cx('w-full object-cover transition-transform group-hover:scale-[1.02]', tab === 'backdrop' ? 'aspect-video' : 'aspect-[2/3]')} />
                    <span className="absolute bottom-1 left-1 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] text-paper">{img.width}×{img.height}{img.language ? ` · ${img.language}` : ' · 텍스트 없음'}</span>
                    {already && <span className="absolute right-1 top-1 rounded bg-fact px-1.5 py-0.5 text-[10px] text-paper">가져옴</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="TMDB에 이 종류의 이미지가 없습니다." body="가짜 스틸컷을 만들지 않습니다. 구글 이미지에서 찾아 직접 올려 보세요." />
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4">
        <p className="font-semibold">원하는 장면이 없나요?</p>
        <GoogleImageLinks title={movie.titleEn || movie.titleKo} />
        <div>
          <Button
            onClick={async () => {
              const w = await ensureWork();
              router.push(`/capture?work=${w.id}`);
            }}
          >
            캡처한 이미지 직접 올리기 →
          </Button>
        </div>
      </section>

      <Dialog open={!!picked} onClose={() => !busy && setPicked(null)} title="이 이미지로 무엇을 할까요?" wide>
        {picked && (
          <div className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tmdbImageUrl(picked.img.filePath, picked.kind === 'backdrop' ? 'w1280' : 'w780')} alt={`${movie.titleKo} ${picked.kind === 'backdrop' ? '백드롭' : '포스터'}`} className="max-h-[50vh] w-full rounded-md object-contain" />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <KindLabel kind="candidate" /> {picked.kind === 'backdrop' ? '홍보용 스틸로 저장됩니다' : '포스터로 저장됩니다'} · 출처: TMDB · 권리 미확인 상태로 기록
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={analyze} disabled={!!busy}>{busy === 'analyze' ? '장면 카드 만드는 중…' : '이 장면 분석하기'}</Button>
              <Button onClick={toBoard} disabled={!!busy}>{busy === 'board' ? '저장 중…' : '비교 보드에 넣기'}</Button>
              <a href={`${tmdbMoviePage(movie.id)}/images/${picked.kind === 'backdrop' ? 'backdrops' : 'posters'}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-md border border-line-2 px-3.5 text-sm hover:bg-paper-2">자료 출처 보기 ↗</a>
            </div>
            {!lib && <p className="text-xs text-muted">이 작품은 아직 라이브러리에 없어 “{seedCategories.find((c) => c.id === category)?.label}” 카테고리로 함께 추가됩니다.</p>}
          </div>
        )}
      </Dialog>
      {boardScene && <AddToBoardDialog sceneIds={[boardScene.id]} open={!!boardScene} onClose={() => setBoardScene(null)} />}
    </div>
  );
}

export default function TmdbMoviePage() {
  return (
    <Suspense>
      <TmdbMoviePageInner />
    </Suspense>
  );
}
