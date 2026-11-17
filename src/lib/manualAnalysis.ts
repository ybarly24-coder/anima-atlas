// "Analyze with the Claude app" bridge: works with a Claude subscription (claude.ai), no API key.
// The app builds a prompt, the user pastes it + the image into claude.ai, then pastes the JSON reply back.
// The reply is validated against the same schema the API route uses, so cards render identically.
import { ANGLES, SceneAnalysisSchema, SHOT_SIZES, type AiAnalysisRecord, type SceneAnalysis } from './aiSchema';
import type { Scene, Tag } from './types';

export const MANUAL_MODEL_LABEL = 'claude.ai (구독 · 수동 붙여넣기)';

const TEMPLATE = {
  title: '이 장면을 부를 짧은 제목',
  summary: '장면 전체 요약 1~2문장',
  sceneDescription: '화면에 실제로 보이는 것의 객관적 묘사',
  miseEnScene: { headline: '한 줄 핵심 (25자 내외)', points: ['관찰/해석 1', '관찰/해석 2', '관찰/해석 3'] },
  color: { headline: '…', points: ['…'], temperature: '웜톤 | 쿨톤 | 중성 | 혼합', saturation: '고채도 | 중채도 | 저채도', contrast: '강한 대비 | 중간 대비 | 약한 대비', mood: '색이 만드는 분위기 한 구절' },
  composition: { headline: '…', points: ['…'], framing: '주된 구도 원리 (예: 삼분할, 중앙 구도, 대각선)', focalPoint: '시선이 가장 먼저 가는 지점과 위치' },
  camera: { headline: '…', points: ['…'], shotSize: SHOT_SIZES.join(' | '), angle: ANGLES.join(' | '), lensFeel: '광각/망원 느낌, 원근감, 심도 (추정)', movementGuess: '추정 카메라 움직임 또는 "판단 불가"' },
  lighting: { headline: '…', points: ['…'] },
  blocking: { headline: '인물·사물 위치', points: ['화면 좌표로 구체적으로'] },
  narrative: { headline: '…', points: ['…'] },
  technique: { headline: '화면에서 관찰되는 표현', points: ['…'] },
  takeaways: ['창작 적용 아이디어 1', '아이디어 2', '아이디어 3'],
  suggestedTags: ['아래 태그 목록에서만 3~8개'],
  caveats: '이 분석의 한계',
};

export function buildManualPrompt(ctx: { workTitle?: string; sceneTitle?: string; note?: string; tags: Tag[] }): string {
  const lines = [
    '당신은 애니메이션 연출·촬영·미술을 가르치는 분석가입니다. 첨부한 애니메이션 장면 이미지 한 장을 분석해 주세요.',
    '',
    '[맥락]',
    ctx.workTitle ? `- 작품(사용자 지정): ${ctx.workTitle}` : '- 작품: 지정되지 않음 (작품을 단정하지 말 것)',
    ctx.sceneTitle ? `- 장면 메모 제목: ${ctx.sceneTitle}` : null,
    ctx.note ? `- 사용자 메모: ${ctx.note}` : null,
    '',
    '[원칙]',
    '- 화면에 실제로 보이는 것(관찰)과 해석을 구분하고, 해석에는 "~로 보인다", "~를 암시한다"를 쓰세요.',
    '- 위치는 구체적으로 (화면 왼쪽 1/3, 하단 수평선 아래, 전경/중경/배경 등).',
    '- 제작사의 실제 공정·감독 의도·타임코드·인터뷰를 사실처럼 지어내지 마세요. technique는 "화면에서 관찰되는 표현"으로만.',
    '- 정지 이미지로 판단할 수 없는 것(카메라 움직임, 앞뒤 맥락)은 "판단 불가" 또는 추정이라고 밝히세요.',
    '- points는 각 3~5개, 한두 문장씩. 모든 텍스트는 한국어.',
    '',
    '[출력 형식 — 중요]',
    '아래 구조의 JSON 하나만 ```json 코드 블록으로 답하세요. 키 이름은 그대로 두고 값만 채우세요.',
    '"A | B | C"로 표시된 값은 그중 정확히 하나를 골라 그대로 쓰세요.',
    '',
    '```json',
    JSON.stringify(TEMPLATE, null, 2),
    '```',
    '',
    `[suggestedTags에 쓸 수 있는 태그 목록] ${ctx.tags.map((t) => t.nameKo).join(', ')}`,
  ];
  return lines.filter((l) => l !== null).join('\n');
}

export type ParseResult = { ok: true; analysis: SceneAnalysis } | { ok: false; message: string; issues: string[] };

/** Pull the JSON object out of a pasted reply (code fences, surrounding prose, smart quotes). */
export function extractJson(text: string): string | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  return body.slice(start, end + 1);
}

const trimDeep = (v: unknown): unknown =>
  typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.map(trimDeep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, trimDeep(x)])) : v;

const FIELD_KO: Record<string, string> = {
  title: '제목', summary: '요약', sceneDescription: '장면 묘사', miseEnScene: '미장센', color: '색감', composition: '구도', camera: '카메라',
  lighting: '조명', blocking: '위치', narrative: '서사', technique: '표현 기법', takeaways: '창작 적용', suggestedTags: '추천 태그', caveats: '한계',
  headline: '핵심 한 줄', points: '포인트 목록', temperature: '색온도', saturation: '채도', contrast: '대비', mood: '분위기', framing: '구도 원리',
  focalPoint: '시선의 초점', shotSize: '샷 크기', angle: '앵글', lensFeel: '렌즈감', movementGuess: '카메라 움직임',
};

export function parseManualAnalysis(text: string): ParseResult {
  if (!text.trim()) return { ok: false, message: 'Claude의 답변을 붙여넣어 주세요.', issues: [] };
  const raw = extractJson(text);
  if (!raw) return { ok: false, message: 'JSON을 찾지 못했습니다. Claude 답변의 ```json 코드 블록 전체를 복사해 붙여넣으세요.', issues: [] };
  let obj: unknown;
  try {
    obj = JSON.parse(raw.replace(/[“”]/g, '"'));
  } catch (e) {
    return { ok: false, message: `JSON 형식이 깨져 있습니다 (${e instanceof Error ? e.message : String(e)}). 답변이 중간에 잘렸는지 확인하세요.`, issues: [] };
  }
  const r = SceneAnalysisSchema.safeParse(trimDeep(obj));
  if (r.success) return { ok: true, analysis: r.data };
  const issues = r.error.issues.slice(0, 12).map((i) => {
    const path = i.path.map((p) => (typeof p === 'number' ? `${p + 1}번째` : FIELD_KO[String(p)] ?? String(p))).join(' › ');
    return `${path || '전체'}: ${i.message}`;
  });
  return { ok: false, message: '일부 항목이 형식에 맞지 않습니다. 아래 "수정 요청 문구"를 Claude에게 보내면 고쳐 줍니다.', issues };
}

export function buildFixPrompt(issues: string[]): string {
  return ['방금 JSON에 형식 오류가 있습니다. 같은 분석 내용을 유지하되 아래 항목을 고쳐서, 처음 안내한 구조의 JSON 전체를 ```json 코드 블록으로 다시 보내 주세요.', '"A | B | C"로 표시된 값은 그중 정확히 하나만 쓰세요.', '', ...issues.map((i) => `- ${i}`)].join('\n');
}

/** Same result shape as the API path: title/tags/lenses applied, analysis stored as an AI record. */
export function applyAnalysis(scene: Scene, analysis: SceneAnalysis, model: string, tags: Tag[], opts?: { useAiTitle?: boolean }): Scene {
  const byName = new Map(tags.map((t) => [t.nameKo, t.id]));
  const suggested = analysis.suggestedTags.map((n) => byName.get(n)).filter((x): x is string => !!x);
  const record: AiAnalysisRecord = { analysis, model, createdAt: new Date().toISOString(), imageAssetId: scene.sceneImageAssetId ?? null };
  return {
    ...scene,
    title: opts?.useAiTitle || !scene.title.trim() ? analysis.title : scene.title,
    tagIds: Array.from(new Set([...scene.tagIds, ...suggested])),
    lensIds: scene.lensIds.length ? scene.lensIds : ['visual', 'narrative', 'production'],
    aiAnalysis: record,
  };
}
