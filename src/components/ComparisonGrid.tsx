'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLookups } from '@/lib/store';
import type { Comparison, Scene, Source, Tag, TagFacet, Work } from '@/lib/types';
import { SceneMedia } from './Placeholder';
import { CategoryChip, SourceBadge, TagChip, VerificationBadge } from './ui';
import { sceneHref, workHref } from '@/lib/routes';

export const SCENE_ROWS = [
  { key: 'color', label: '색채' },
  { key: 'lighting', label: '조명' },
  { key: 'mise', label: '미장센' },
  { key: 'composition', label: '구도' },
  { key: 'motion', label: '동작' },
  { key: 'visualNarrative', label: '시각적 서사' },
  { key: 'production', label: '제작 방법' },
  { key: 'sources', label: '확인 출처' },
  { key: 'memo', label: '연구 메모' },
] as const;

export const WORK_ROWS = [
  { key: 'basic', label: '기본 정보' },
  { key: 'question', label: '연구 질문' },
  { key: 'color', label: '색채' },
  { key: 'mise', label: '미장센·공간' },
  { key: 'visualNarrative', label: '시각적 서사' },
  { key: 'production', label: '제작 방법' },
  { key: 'sources', label: '확인 출처' },
  { key: 'memo', label: '연구 메모' },
] as const;

const cellKey = (itemId: string, row: string) => `${itemId}::${row}`;

function TagsOf({ scene, facet, tagById }: { scene: Scene; facet: TagFacet; tagById: Map<string, Tag> }) {
  const tags = scene.tagIds.map((id) => tagById.get(id)).filter((t): t is Tag => !!t && t.facet === facet);
  if (!tags.length) return null;
  return <div className="flex flex-wrap gap-1">{tags.map((t) => <TagChip key={t.id} tag={t} />)}</div>;
}

function SourcesList({ ids, sourceById }: { ids: string[]; sourceById: Map<string, Source> }) {
  const list = ids.map((id) => sourceById.get(id)).filter(Boolean) as Source[];
  if (!list.length) return <span className="text-muted">연결된 출처 없음</span>;
  return (
    <ul className="flex flex-col gap-1">
      {list.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center gap-1">
          <SourceBadge evidence={s.evidenceType} />
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{s.code ? `[${s.code}] ` : ''}{s.title}</a>
        </li>
      ))}
    </ul>
  );
}

function Ref({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="mb-1.5 flex flex-col gap-1 rounded border border-line bg-paper px-2 py-1.5 text-[11px] leading-relaxed text-ink-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted">기록된 데이터</span>
      {children}
    </div>
  );
}

function sceneRef(row: string, s: Scene, tagById: Map<string, Tag>, sourceById: Map<string, Source>): ReactNode {
  switch (row) {
    case 'color':
      return s.colorAnalysis || s.colors.length || s.tagIds.some((t) => tagById.get(t)?.facet === 'color') ? (
        <>
          {s.colorAnalysis && (
            <div>
              <div className="flex h-4 overflow-hidden rounded-sm border border-line">{s.colorAnalysis.swatches.map((c) => <span key={c.hex} title={`${c.hex} ${Math.round(c.proportion * 100)}%`} style={{ background: c.hex, flex: Math.max(c.proportion, 0.04) }} />)}</div>
              <span className="font-mono text-[10px] text-muted">{s.colorAnalysis.swatches.slice(0, 4).map((c) => `${c.hex} ${Math.round(c.proportion * 100)}%`).join(' · ')}</span>
            </div>
          )}
          {s.colors.length > 0 && (
            <div className="flex flex-wrap gap-1">{s.colors.map((c) => <span key={c} className="flex items-center gap-1 font-mono"><span className="h-3 w-3 rounded-sm border border-line-2" style={{ background: c }} />{c}</span>)}</div>
          )}
          <TagsOf scene={s} facet="color" tagById={tagById} />
        </>
      ) : null;
    case 'mise':
      return s.tagIds.some((t) => tagById.get(t)?.facet === 'space') ? <TagsOf scene={s} facet="space" tagById={tagById} /> : null;
    case 'composition':
      return s.shotDescription || s.tagIds.some((t) => tagById.get(t)?.facet === 'camera') ? (<>{s.shotDescription && <span>{s.shotDescription}</span>}<TagsOf scene={s} facet="camera" tagById={tagById} /></>) : null;
    case 'motion':
      return s.tagIds.some((t) => tagById.get(t)?.facet === 'motion') ? <TagsOf scene={s} facet="motion" tagById={tagById} /> : null;
    case 'visualNarrative':
      return s.researchQuestion || s.tagIds.some((t) => tagById.get(t)?.facet === 'narrative') ? (<>{s.researchQuestion && <span>Q. {s.researchQuestion}</span>}<TagsOf scene={s} facet="narrative" tagById={tagById} /></>) : null;
    case 'production':
      return s.productionFact || s.tagIds.some((t) => tagById.get(t)?.facet === 'technique') ? (<>{s.productionFact && <span>공식 제작 사실: {s.productionFact}</span>}<TagsOf scene={s} facet="technique" tagById={tagById} /></>) : null;
    case 'sources':
      return <SourcesList ids={s.sourceIds} sourceById={sourceById} />;
    case 'memo':
      return s.observation || s.interpretation ? (<>{s.observation && <span>관찰: {s.observation}</span>}{s.interpretation && <span>해석: {s.interpretation}</span>}</>) : null;
    default:
      return null;
  }
}

function workRef(row: string, w: Work, sourceById: Map<string, Source>, sceneCount: number): ReactNode {
  switch (row) {
    case 'basic':
      return (<><span>{w.releaseYear} · {w.studio}</span>{w.director?.length ? <span>감독: {w.director.join(', ')}</span> : null}{w.medium?.length ? <span>제작 방식: {w.medium.join(', ')}</span> : null}<span>장면 {sceneCount}개</span></>);
    case 'question':
      return w.researchQuestion ? <span>{w.researchQuestion}</span> : null;
    case 'mise':
      return w.researchKeywords.length ? <span>키워드: {w.researchKeywords.join(', ')}</span> : null;
    case 'sources':
      return <SourcesList ids={w.officialSourceIds} sourceById={sourceById} />;
    default:
      return null;
  }
}

export function ComparisonGrid({ comparison, onCell, onRemove }: { comparison: Comparison; onCell: (key: string, value: string) => void; onRemove: (id: string) => void }) {
  const { sceneById, workById, tagById, sourceById } = useLookups();
  const { mode, itemIds } = comparison;
  const rows = mode === 'scene' ? SCENE_ROWS : WORK_ROWS;
  const cols = itemIds.length;

  return (
    <div className="relative overflow-x-auto rounded-lg border border-line bg-card">
      <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
        <caption className="sr-only">항목 비교표 (사용자 수기 비교)</caption>
        <colgroup>
          <col className="w-28 md:w-36" />
          {itemIds.map((id) => <col key={id} style={{ width: `${100 / cols}%` }} />)}
        </colgroup>
        <thead>
          <tr className="border-b border-line align-top">
            <th scope="col" className="p-3 text-left text-xs font-semibold text-muted">비교 기준</th>
            {itemIds.map((id) => {
              if (mode === 'scene') {
                const s = sceneById.get(id);
                const w = s && workById.get(s.workId);
                return (
                  <th key={id} scope="col" className="p-3 text-left font-normal">
                    {s ? (
                      <div className="flex flex-col gap-1.5">
                        <SceneMedia assetId={s.sceneImageAssetId} seed={s.id} categoryId={w?.categoryId} label={s.title} className="aspect-video rounded" />
                        <div className="flex flex-wrap gap-1">{w && <CategoryChip id={w.categoryId} size="xs" />}<VerificationBadge status={s.verificationStatus} /></div>
                        <Link href={sceneHref(s.id)} className="font-medium leading-snug hover:underline">{s.title}</Link>
                        <span className="text-xs text-muted">{w?.titleKo}</span>
                        <button type="button" onClick={() => onRemove(id)} className="self-start text-xs text-muted underline underline-offset-2 hover:text-danger">비교에서 제외</button>
                      </div>
                    ) : <span className="text-muted">삭제된 장면</span>}
                  </th>
                );
              }
              const w = workById.get(id);
              return (
                <th key={id} scope="col" className="p-3 text-left font-normal">
                  {w ? (
                    <div className="flex flex-col gap-1.5">
                      <SceneMedia assetId={w.coverAssetId} seed={w.id} categoryId={w.categoryId} label={w.titleKo} className="aspect-[3/2] rounded" />
                      <CategoryChip id={w.categoryId} size="xs" />
                      <Link href={workHref(w.slug)} className="font-medium hover:underline">{w.titleKo}</Link>
                      <span className="text-xs text-muted">{w.titleEn}</span>
                      <button type="button" onClick={() => onRemove(id)} className="self-start text-xs text-muted underline underline-offset-2 hover:text-danger">비교에서 제외</button>
                    </div>
                  ) : <span className="text-muted">삭제된 작품</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line align-top last:border-0">
              <th scope="row" className="bg-paper/60 p-3 text-left text-xs font-semibold text-ink-2">{r.label}</th>
              {itemIds.map((id) => {
                const scene = mode === 'scene' ? sceneById.get(id) : undefined;
                const work = mode === 'work' ? workById.get(id) : undefined;
                const ref = scene ? sceneRef(r.key, scene, tagById, sourceById) : work ? workRef(r.key, work, sourceById, 0) : null;
                const k = cellKey(id, r.key);
                return (
                  <td key={id} className="p-2">
                    <Ref>{ref}</Ref>
                    <label htmlFor={`cell-${k}`} className="sr-only">{r.label} 메모</label>
                    <textarea
                      id={`cell-${k}`}
                      rows={2}
                      value={comparison.cells[k] ?? ''}
                      onChange={(e) => onCell(k, e.target.value)}
                      placeholder="수기 비교 메모"
                      className="w-full rounded border border-line bg-card px-2 py-1.5 text-xs leading-relaxed focus:border-ink focus:outline-none"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
