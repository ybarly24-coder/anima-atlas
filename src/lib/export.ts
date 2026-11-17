import { seedCategories } from '@seed/categories';
import { BOARD_STATUS_LABEL, EVIDENCE_LABEL, LENS_LABEL, VERIFICATION_LABEL } from './labels';
import type { AtlasData, ResearchBoard, Scene, Source } from './types';
import { formatTimecode } from './util';

const esc = (s: string | undefined | null) => (s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
const block = (s: string | undefined | null, fallback = '_(아직 작성하지 않음)_') => (s && s.trim() ? s.trim() : fallback);

function timecode(s: Scene): string {
  if (s.startSeconds == null) return '타임코드 미입력';
  const a = formatTimecode(s.startSeconds);
  const b = s.endSeconds != null ? formatTimecode(s.endSeconds) : '';
  return b ? `${a}–${b}` : a;
}

/** Markdown export following the spec's board template (PART C). */
export function boardToMarkdown(board: ResearchBoard, data: AtlasData): string {
  const workById = new Map(data.works.map((w) => [w.id, w]));
  const sourceById = new Map(data.sources.map((s) => [s.id, s]));
  const scenes = board.sceneIds.map((id) => data.scenes.find((s) => s.id === id)).filter(Boolean) as Scene[];
  const workIds = Array.from(new Set([...board.workIds, ...scenes.map((s) => s.workId)]));
  const cats = board.categoryIds.map((c) => seedCategories.find((x) => x.id === c)?.label ?? c);

  const sourceIds = new Set<string>(board.sourceIds);
  scenes.forEach((s) => s.sourceIds.forEach((id) => sourceIds.add(id)));
  const sources = Array.from(sourceIds).map((id) => sourceById.get(id)).filter(Boolean) as Source[];

  const lines: string[] = [];
  lines.push(`# ${board.title}`, '');
  lines.push(`> 상태: ${BOARD_STATUS_LABEL[board.status]} · 연구 관점: ${board.lensIds.map((l) => LENS_LABEL[l].ko).join(', ') || '-'} · 내보낸 날짜: ${new Date().toISOString().slice(0, 10)}`, '');
  lines.push('## Research Question', block(board.researchQuestion), '');
  if (board.background?.trim()) lines.push('### 연구 배경', board.background.trim(), '');
  if (board.criteria?.trim()) lines.push('### 비교 기준', board.criteria.trim(), '');
  lines.push('## Scope');
  lines.push(`- 비교 카테고리: ${cats.join(', ') || '-'}`);
  lines.push(`- 비교 작품: ${workIds.map((id) => { const w = workById.get(id); return w ? `${w.titleKo} (${w.titleEn}, ${w.releaseYear})` : id; }).join(', ') || '-'}`);
  lines.push(`- 연구 기간: ${board.scopePeriod?.trim() || '-'}`, '');

  lines.push('## Evidence — 직접 확인한 장면');
  lines.push('| 작품 | 장면/타임코드 | 검증 상태 | 관찰 사실 | 보드 메모 | 이미지·영상 출처 |');
  lines.push('|---|---|---|---|---|---|');
  if (scenes.length === 0) lines.push('| - | - | - | - | - | - |');
  for (const s of scenes) {
    const w = workById.get(s.workId);
    const media = s.externalVideoUrl ? s.externalVideoUrl : s.sceneImageAssetId ? '사용자 업로드 이미지' : '미디어 없음';
    lines.push(
      `| ${esc(w?.titleKo ?? '-')} | ${esc(`${s.seedCode ? `[${s.seedCode}] ` : ''}${s.title}`)} / ${timecode(s)} | ${VERIFICATION_LABEL[s.verificationStatus]} | ${esc(s.observation) || '_(관찰 미기록)_'} | ${esc(board.sceneNotes?.[s.id]) || '-'} | ${esc(media)} |`,
    );
  }
  lines.push('');

  lines.push('## Comparative Analysis');
  lines.push(`- 공통 패턴: ${block(board.commonalities, '-')}`);
  lines.push(`- 작품별 차이: ${block(board.differences, '-')}`);
  lines.push(`- 예외/반례: ${block(board.counterexamples, '-')}`, '');
  lines.push('## Interpretation', block(board.interpretation), '');
  lines.push('## Production Facts', block(board.productionFacts, '_(공식 제작 근거가 확인된 경우에만 기입)_'), '');
  lines.push('## Hypothesis', block(board.hypothesis), '');
  lines.push('## Insight', block(board.findings), '');
  lines.push('## Application', block(board.applications), '');
  lines.push('## Sources');
  if (sources.length === 0) lines.push('- _(연결된 출처 없음)_');
  for (const s of sources) {
    lines.push(`- [${s.code ? `${s.code} ` : ''}${s.title}](${s.url}) — ${s.publisher} · ${EVIDENCE_LABEL[s.evidenceType]} · ${VERIFICATION_LABEL[s.verificationStatus]} · 확인일 ${s.accessedAt}`);
  }
  lines.push('');
  lines.push('---', '_ANIMA ATLAS에서 내보냄. "확인됨"은 링크에 해당 정보가 실재함을 확인했다는 의미이며, 연구자의 해석이 옳다는 보증이 아닙니다._', '');
  return lines.join('\n');
}

/** Board JSON export including the referenced scenes/works/sources. */
export function boardToJson(board: ResearchBoard, data: AtlasData): string {
  const scenes = data.scenes.filter((s) => board.sceneIds.includes(s.id));
  const workIds = new Set([...board.workIds, ...scenes.map((s) => s.workId)]);
  const sourceIds = new Set([...board.sourceIds, ...scenes.flatMap((s) => s.sourceIds)]);
  return JSON.stringify(
    {
      app: 'anima-atlas',
      kind: 'board',
      exportedAt: new Date().toISOString(),
      board,
      scenes,
      works: data.works.filter((w) => workIds.has(w.id)),
      sources: data.sources.filter((s) => sourceIds.has(s.id)),
    },
    null,
    2,
  );
}

export function safeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 80) || 'board';
}
