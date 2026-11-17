import { z } from 'zod';

// Shared between the API route (structured output) and the client (rendering cards).
// All analysis text is Korean. This is AI-generated interpretation of ONE image,
// not verified production fact.

const Section = z.object({
  headline: z.string().describe('한 줄 핵심 요약 (25자 내외)'),
  points: z.array(z.string()).describe('구체적 관찰과 해석 3~5개. 화면 위치(왼쪽 1/3, 하단 등)를 구체적으로'),
});

export const SHOT_SIZES = ['익스트림 롱숏', '롱숏', '풀숏', '미디엄숏', '미디엄 클로즈업', '클로즈업', '익스트림 클로즈업', '판단 불가'] as const;
export const ANGLES = ['아이레벨', '하이앵글', '로우앵글', '버즈아이뷰', '웜즈아이뷰', '더치앵글', '판단 불가'] as const;

export const SceneAnalysisSchema = z.object({
  title: z.string().describe('이 장면을 부를 짧은 제목 (한국어)'),
  summary: z.string().describe('장면 전체를 한두 문장으로 요약'),
  sceneDescription: z.string().describe('화면에 실제로 보이는 것의 객관적 묘사'),
  miseEnScene: Section.describe('미장센: 공간, 소품, 의상, 배경, 인물 배치의 종합'),
  color: Section.extend({
    temperature: z.enum(['웜톤', '쿨톤', '중성', '혼합']),
    saturation: z.enum(['고채도', '중채도', '저채도']),
    contrast: z.enum(['강한 대비', '중간 대비', '약한 대비']),
    mood: z.string().describe('색이 만드는 감정/분위기 한 구절'),
  }),
  composition: Section.extend({
    framing: z.string().describe('주된 구도 원리 (예: 삼분할, 중앙 구도, 대각선, 프레임 속 프레임)'),
    focalPoint: z.string().describe('시선이 가장 먼저 가는 지점과 위치'),
  }),
  camera: Section.extend({
    shotSize: z.enum(SHOT_SIZES),
    angle: z.enum(ANGLES),
    lensFeel: z.string().describe('광각/망원 느낌, 원근감, 심도 (추정)'),
    movementGuess: z.string().describe('정지 이미지에서 추정되는 카메라 움직임 또는 "판단 불가"'),
  }),
  lighting: Section.describe('광원 방향, 명암, 그림자, 빛의 질감'),
  blocking: Section.describe('인물/사물의 위치와 서로의 거리·방향 (화면 좌표로 구체적으로)'),
  narrative: Section.describe('이 장면이 전달하는 감정·관계·서사적 기능 (해석)'),
  technique: Section.describe('관찰 가능한 화면 표현/스타일 (선, 질감, 셰이딩 등). 제작사의 실제 공정이라고 단정하지 말 것'),
  takeaways: z.array(z.string()).describe('창작자가 자기 작품에 적용할 수 있는 연출 아이디어 3개'),
  suggestedTags: z.array(z.string()).describe('제공된 태그 목록 중 이 장면에 맞는 태그 이름(nameKo) 3~8개, 목록에 있는 이름만'),
  caveats: z.string().describe('이 분석의 한계 (예: 정지 이미지 한 장으로는 움직임 판단 불가, 작품 식별 불확실 등)'),
});

export type SceneAnalysis = z.infer<typeof SceneAnalysisSchema>;

export interface AiAnalysisRecord {
  analysis: SceneAnalysis;
  model: string;
  createdAt: string;
  imageAssetId: string | null;
}
