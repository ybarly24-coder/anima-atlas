'use client';

import Link from 'next/link';
import { useState } from 'react';
import { primaryCategories } from '@seed/categories';
import { BoardCard } from '@/components/Cards';
import { ContactSheet } from '@/components/ContactSheet';
import { SearchHero } from '@/components/SearchHero';
import { EmptyState, KindLabel, LensChip, LinkButton, SectionTitle } from '@/components/ui';
import { CATEGORY_ACCENT, LENSES } from '@/lib/labels';
import { useAtlas, useLookups } from '@/lib/store';
import type { CategoryId } from '@/lib/types';
import { cx } from '@/lib/util';

const STUDIO_LABEL: Record<string, string> = { sony: 'Sony · Spider-Verse', disney: 'Disney Animation', ghibli: 'Studio Ghibli' };

const QUESTIONS: Array<{ label: string; q: string; mode?: 'or' }> = [
  { label: '외로움을 표현하는 미장센', q: '외로움' },
  { label: '색채로 구분되는 세계', q: '색온도 OR "세계 규칙" OR 수채화', mode: 'or' },
  { label: '선으로 속도를 표현하는 방법', q: '2D 드로잉 + 리듬' },
  { label: '공간이 캐릭터인 애니메이션', q: '메타포 OR 공간', mode: 'or' },
  { label: '정지와 기다림의 연출', q: '정지' },
];

export default function HomePage() {
  const { data } = useAtlas();
  const { sourceById } = useLookups();
  const [openCat, setOpenCat] = useState<CategoryId | null>(null);

  const withImage = data.scenes.filter((s) => s.sceneImageAssetId);
  const recent = [...withImage].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 12);
  const saved = data.scenes.filter((s) => s.isBookmark).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 12);
  const boards = [...data.boards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
  const workCat = new Map(data.works.map((w) => [w.id, w.categoryId]));
  const category = openCat ? primaryCategories.find((c) => c.id === openCat)! : null;

  return (
    <div className="flex flex-col gap-12">
      {/* Search-first hero */}
      <section className="flex flex-col gap-5 pt-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Discover → Collect → Observe → Decode → Compare → Apply</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight md:text-[2.6rem]">어떤 애니메이션을 연구할까요?</h1>
        </div>
        <SearchHero />
        <div className="flex flex-wrap items-center gap-2">
          {primaryCategories.map((c) => (
            <Link key={c.id} href={`/explore?category=${c.id}`} className={cx('inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium', CATEGORY_ACCENT[c.id].chip)}>
              <span className={cx('h-2 w-2 rounded-full', CATEGORY_ACCENT[c.id].dot)} aria-hidden />
              {STUDIO_LABEL[c.id]}
              <span className="text-[11px] opacity-70">{data.works.filter((w) => w.categoryId === c.id).length}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* First-run sample flow */}
      <section className="grid gap-4 rounded-xl border border-line bg-card p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Sample flow</p>
          <p className="mt-1 font-serif text-xl font-semibold">주토피아로 연구 시작해 보기</p>
          <ol className="mt-2 grid gap-1 text-sm text-ink-2 sm:grid-cols-2">
            <li>1. 작품 검색 → 포스터·백드롭 이미지 후보</li>
            <li>2. 이미지 선택 → 장면 카드 자동 생성</li>
            <li>3. 실제 픽셀에서 5~8색 팔레트 추출 · 구도선</li>
            <li>4. Visual / Narrative / Production 메모 → 보드 저장·비교</li>
          </ol>
        </div>
        <div className="flex flex-wrap gap-2 md:flex-col">
          <LinkButton href="/search?q=%EC%A3%BC%ED%86%A0%ED%94%BC%EC%95%84" variant="primary">주토피아 연구 시작 →</LinkButton>
          <LinkButton href="/capture">이미지 직접 올리기</LinkButton>
        </div>
      </section>

      {/* Contact sheets */}
      <section>
        <SectionTitle title="최근 연구" sub="이미지가 있는 장면을 최근 수정 순으로" right={<LinkButton href="/scenes" size="sm">장면 라이브러리</LinkButton>} />
        <ContactSheet
          scenes={recent}
          empty={<EmptyState title="아직 이미지를 붙인 장면이 없습니다." body="작품을 검색해 이미지 후보를 고르거나, 캡처한 이미지를 올려 첫 장면 카드를 만들어 보세요." action={<><LinkButton href="/search?q=%EC%A3%BC%ED%86%A0%ED%94%BC%EC%95%84" variant="primary">주토피아 검색</LinkButton><LinkButton href="/capture">이미지 올리기</LinkButton></>} />}
        />
      </section>

      <section>
        <SectionTitle title="저장한 장면" sub="장면 카드의 ☆ 북마크" />
        <ContactSheet scenes={saved} empty={<p className="rounded-lg border border-dashed border-line-2 p-4 text-sm text-muted">북마크한 장면이 여기에 필름처럼 모입니다.</p>} />
      </section>

      <section>
        <SectionTitle title="리서치 보드" right={<LinkButton href="/boards" size="sm">모든 보드</LinkButton>} />
        {boards.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{boards.map((b) => <BoardCard key={b.id} board={b} />)}</div>
        ) : (
          <EmptyState title="연구 보드가 없습니다." action={<LinkButton href="/boards?new=1" variant="primary">+ 연구 보드</LinkButton>} />
        )}
      </section>

      <section>
        <SectionTitle title="Explore by Question" sub="감정·연출 키워드로 기존 장면과 보드를 찾습니다." />
        <div className="flex flex-wrap gap-2">
          {QUESTIONS.map((q) => (
            <Link key={q.label} href={`/explore?q=${encodeURIComponent(q.q)}${q.mode ? `&mode=${q.mode}` : ''}`} className="rounded-full border border-line-2 bg-card px-3.5 py-1.5 text-sm text-ink-2 hover:border-ink hover:text-ink">
              {q.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Studio research overview (facts vs analysis kept apart) */}
      <section>
        <SectionTitle title="스튜디오별 리서치 개요" sub="확인된 제작 정보(출처 연결)와 연구 축(분석 관점)을 구분해 보여줍니다." />
        <div className="grid gap-3 md:grid-cols-3">
          {primaryCategories.map((c) => (
            <button key={c.id} type="button" aria-expanded={openCat === c.id} onClick={() => setOpenCat(openCat === c.id ? null : c.id)} className={cx('flex flex-col gap-2 rounded-lg border bg-card p-4 text-left hover:shadow-md', openCat === c.id ? 'border-ink' : 'border-line')}>
              <span className="font-serif text-base font-semibold tracking-wide">{c.label}</span>
              <span className="text-xs leading-relaxed text-ink-2">{c.tagline}</span>
              <span className="mt-auto text-[11px] text-muted">작품 {data.works.filter((w) => w.categoryId === c.id).length} · 장면 {data.scenes.filter((s) => workCat.get(s.workId) === c.id).length} · {openCat === c.id ? '접기' : '개요 보기'}</span>
            </button>
          ))}
        </div>
        {category && (
          <div className="mt-3 grid gap-4 rounded-lg border border-line bg-card p-4 md:grid-cols-[1.1fr_1fr] md:p-5">
            <div className="flex flex-col gap-3">
              {category.scopeNote && <p className="rounded border border-line bg-paper px-3 py-2 text-xs leading-relaxed text-ink-2">범위: {category.scopeNote}</p>}
              <div className="mb-1 flex items-center gap-2"><KindLabel kind="analysis" /><span className="text-xs font-semibold">연구 축</span></div>
              <dl className="flex flex-col gap-1.5 text-xs leading-relaxed">
                {LENSES.map((l) => (
                  <div key={l} className="flex gap-2"><dt className="shrink-0"><LensChip lens={l} /></dt><dd className="text-ink-2">{category.axes[l]}</dd></div>
                ))}
              </dl>
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-2"><KindLabel kind="fact" /><span className="text-xs font-semibold">확인된 제작 정보</span></div>
              <ol className="flex flex-col gap-2 text-xs leading-relaxed">
                {category.confirmedFacts.map((f, i) => (
                  <li key={i} className="rounded border border-[#d4e3dc] bg-fact-bg/50 px-3 py-2 text-ink-2">
                    {f.text}{' '}
                    {f.sourceIds.map((sid) => {
                      const s = sourceById.get(sid);
                      return s ? <a key={sid} href={s.url} target="_blank" rel="noopener noreferrer" className="ml-0.5 font-mono font-semibold text-fact underline underline-offset-2" title={s.title}>[{s.code}]</a> : null;
                    })}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
