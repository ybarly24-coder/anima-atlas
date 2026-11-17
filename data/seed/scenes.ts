import type { Lens, Scene } from '../../src/lib/types';
import { SEED_TIMESTAMP } from './meta';

// Spec PART B. These are scene CANDIDATES for the researcher to find and verify.
// Seeds start with no timecode, no image, no colors, and verificationStatus = needs_review.
// tagIds are research-prompt tags ("what to look for"), not verified observations.

type Row = [
  code: string,
  workId: string,
  keyword: string,
  focusLabel: string,
  question: string,
  tagIds: string[],
  extraSourceIds?: string[],
];

const VISUAL = ['visual', 'color', 'composition', 'motion', 'mise-en-scène', 'lighting', 'space', 'art style', 'scale', 'line', 'staging', 'environment', 'art direction'];
const NARRATIVE = ['narrative', 'world', 'worldbuilding', 'emotion', 'character arc', 'character', 'symbol', 'conflict', 'world rules'];
const PRODUCTION = ['production', 'fx', 'editing'];

export function lensesFromFocus(focus: string): Lens[] {
  const parts = focus.split('+').map((p) => p.trim().toLowerCase());
  const out = new Set<Lens>();
  for (const p of parts) {
    if (VISUAL.includes(p)) out.add('visual');
    if (NARRATIVE.includes(p)) out.add('narrative');
    if (PRODUCTION.includes(p)) out.add('production');
  }
  return (['visual', 'narrative', 'production'] as Lens[]).filter((l) => out.has(l));
}

const INTO = 'work-sony-into';
const ACROSS = 'work-sony-across';
const ENCANTO = 'work-disney-encanto';
const FROZEN2 = 'work-disney-frozen2';
const MOANA = 'work-disney-moana';
const ZOOTOPIA = 'work-disney-zootopia';
const SPIRITED = 'work-ghibli-spirited';
const TOTORO = 'work-ghibli-totoro';
const MONONOKE = 'work-ghibli-mononoke';
const HOWL = 'work-ghibli-howl';
const KAGUYA = 'work-ghibli-kaguya';

const rows: Row[] = [
  // B1. SONY (7)
  ['S-S01', INTO, '마일스의 도시 일상, 그래피티', 'Visual + Narrative', '도시의 색과 낙서는 인물의 정체성을 어떻게 드러내는가?', ['spc-urban', 'nar-identity', 'spc-visual-symbol', 'col-high-sat']],
  ['S-S02', INTO, '스파이더 능력에 적응하는 장면', 'Motion + Narrative', '서툰 움직임과 능숙한 움직임을 어떤 리듬·포즈로 구분하는가?', ['mot-rhythm', 'mot-exaggeration', 'mot-hold', 'nar-coming-of-age']],
  ['S-S03', INTO, 'Leap of Faith / 도약', 'Composition + Color + Narrative', '신체 방향과 카메라 앵글이 성장의 순간을 어떻게 강화하는가?', ['cam-low', 'cam-move', 'nar-coming-of-age', 'emo-freedom', 'emo-growth']],
  ['S-S04', INTO, '차원 충돌·글리치', 'Visual + Production', '인쇄/합성 스타일과 차원 이상을 어떻게 시각적으로 구별하는가?', ['tec-halftone', 'tec-compositing', 'tec-hybrid', 'emo-anxiety', 'nar-world-rules'], ['src-s7']],
  ['S-S05', ACROSS, '그웬의 세계·가족 대화', 'Color + Narrative', '색과 배경의 변화가 감정과 연결되는가? 공식 자료[S3]와 비교해 본다.', ['tec-watercolor', 'col-temp-shift', 'nar-family', 'nar-relationship', 'emo-sadness']],
  ['S-S06', ACROSS, 'Spider-Punk의 첫 등장/액션', 'Art Style + Motion', '콜라주 같은 표현을 캐릭터의 정체성과 어떻게 연결할 수 있는가?', ['tec-hybrid', 'tec-2d', 'nar-identity', 'mot-exaggeration']],
  ['S-S07', ACROSS, '서로 다른 차원 탐색·추격', 'Worldbuilding + Production', '공간마다 다른 시각 규칙을 관객이 어떻게 학습하는가?', ['nar-world-rules', 'tec-compositing', 'cam-move', 'emo-tension']],
  // B2. DISNEY (12)
  ['S-D01', ENCANTO, '카시타(집)의 첫 등장/움직임', 'Mise-en-scène + World', '건축과 소품의 움직임으로 공간의 성격을 설명하는가?', ['spc-recurring-prop', 'nar-world-rules', 'nar-family', 'nar-metaphor', 'emo-wonder']],
  ['S-D02', ENCANTO, '미라벨의 가족 소개', 'Color + Narrative', '캐릭터별 색·의상·공간 배치가 관계를 어떻게 드러내는가?', ['nar-family', 'nar-relationship', 'col-high-sat', 'nar-belonging']],
  ['S-D03', ENCANTO, '가족 갈등 또는 회복의 장면', 'Lighting + Emotion', '공간과 조명이 관계 변화와 함께 달라지는가?', ['col-temp-shift', 'nar-relationship', 'nar-family', 'emo-bond', 'emo-anxiety']],
  ['S-D04', FROZEN2, '마법의 숲 진입', 'Space + Lighting', '안개/깊이/색 대비로 미지의 공간을 어떻게 표현하는가?', ['spc-nature', 'cam-layered', 'col-cool', 'emo-wonder', 'emo-anxiety']],
  ['S-D05', FROZEN2, '엘사의 거친 바다 여정', 'Motion + FX', '물·파도·캐릭터의 무게감이 도전의 강도를 어떻게 전달하는가?', ['mot-weight', 'tec-simulation', 'spc-nature', 'emo-tension']],
  ['S-D06', FROZEN2, '변화의 진실을 마주하는 장면', 'Color + Narrative', '전후 장면의 조명·색·구도가 어떻게 변하는가?', ['col-temp-shift', 'nar-identity', 'nar-coming-of-age', 'nar-transformation']],
  ['S-D07', MOANA, '섬에서 바다를 바라보는 순간', 'Composition + Narrative', '지평선과 인물 크기가 목표와 갈망을 어떻게 암시하는가?', ['cam-wide', 'spc-negative', 'spc-nature', 'emo-solitude', 'emo-hope']],
  ['S-D08', MOANA, '첫 항해·항해의 어려움', 'Motion + Production', '물 표면과 배의 움직임을 어떤 시각 요소로 읽는가?', ['tec-simulation', 'mot-weight', 'spc-nature', 'emo-growth']],
  ['S-D09', MOANA, '바다/섬/길 찾기의 시각적 단서', 'Worldbuilding + Color', '세계의 공간 규칙을 어떻게 학습시키는가?', ['nar-world-rules', 'spc-nature', 'spc-visual-symbol']],
  ['S-D10', ZOOTOPIA, '도시의 첫 소개', 'Mise-en-scène + World', '건축·교통·공간 구획으로 동물의 다양한 신체를 어떻게 표현하는가?', ['spc-urban', 'spc-scale', 'nar-world-rules', 'cam-layered']],
  ['S-D11', ZOOTOPIA, '지역·기후별 도시 공간', 'Art Direction + Lighting', '각 구역의 색채·재질·크기 설계 차이는?', ['spc-urban', 'col-temp-shift', 'nar-world-rules', 'tec-3d']],
  ['S-D12', ZOOTOPIA, '주디와 닉의 대화/갈등', 'Staging + Narrative', '인물의 높이·거리·배치가 관계 변화에 기여하는가?', ['nar-relationship', 'cam-high', 'cam-low', 'emo-tension']],
  // B3. GHIBLI (15)
  ['S-G01', SPIRITED, '목욕탕 첫 진입', 'Mise-en-scène + World', '건물의 깊이, 복잡성, 크기가 낯섦을 어떻게 만드는가?', ['spc-scale', 'cam-layered', 'nar-world-rules', 'emo-anxiety', 'emo-wonder']],
  ['S-G02', SPIRITED, '기차가 물 위를 지나는 시퀀스', 'Color + Space + Emotion', '정지/여백/반복되는 풍경이 분위기에 미치는 영향은?', ['spc-negative', 'mot-hold', 'emo-solitude', 'nar-repetition', 'cam-wide']],
  ['S-G03', SPIRITED, '치히로의 일과 성장', 'Character Arc + Symbol', '공간 이용 방식·몸짓에 어떤 변화가 생기는가?', ['nar-coming-of-age', 'nar-identity', 'emo-growth', 'nar-belonging']],
  ['S-G04', TOTORO, '시골집과 주변 자연 소개', 'Environment + World', '일상의 소품·빛·바람으로 생활감을 어떻게 만드는가?', ['spc-nature', 'spc-recurring-prop', 'emo-stability', 'tec-2d']],
  ['S-G05', TOTORO, '비 오는 버스 정류장', 'Lighting + Motion + Emotion', '기다림과 작은 움직임이 어떻게 캐릭터 관계를 보여주는가?', ['mot-hold', 'emo-bond', 'spc-nature', 'emo-wonder']],
  ['S-G06', TOTORO, '숲속 존재와의 조우', 'Scale + Narrative', '자연과 인물의 크기·시점 차이를 어떻게 이용하는가?', ['spc-scale', 'emo-wonder', 'spc-nature', 'cam-low']],
  ['S-G07', MONONOKE, '숲과 신성한 존재의 등장', 'Color + Space + World', '생명감과 긴장을 어떤 배경 밀도·움직임으로 표현하는가?', ['spc-nature', 'emo-tension', 'emo-wonder', 'cam-layered']],
  ['S-G08', MONONOKE, '제철소의 일상과 노동', 'Mise-en-scène + Narrative', '장소·도구·행동으로 집단의 생활 규칙을 보여주는가?', ['nar-world-rules', 'nar-belonging', 'spc-recurring-prop']],
  ['S-G09', MONONOKE, '숲과 산업의 대치', 'Composition + Conflict', '자연과 인간의 시각적 대비가 갈등을 어떻게 구조화하는가?', ['spc-nature', 'emo-tension', 'nar-metaphor', 'cam-wide']],
  ['S-G10', HOWL, '움직이는 성의 외관/이동', 'Art Style + Production', '건축물에 동물적인 움직임이 느껴지는 이유는?', ['nar-transformation', 'nar-metaphor', 'tec-2d', 'mot-weight']],
  ['S-G11', HOWL, '문을 통과하며 공간이 바뀌는 순간', 'World Rules + Editing', '전환 장치가 세계관을 얼마나 효율적으로 설명하는가?', ['nar-world-rules', 'spc-visual-symbol', 'nar-repetition']],
  ['S-G12', HOWL, '소피의 집안일/생활공간', 'Character + Space', '공간을 다루는 행동이 성격의 변화를 드러내는가?', ['spc-enclosed', 'emo-growth', 'nar-relationship', 'spc-recurring-prop']],
  ['S-G13', KAGUYA, '어린 시절 자연 속 놀이', 'Motion + Art Style', '선·색의 가벼움이 움직임의 감각을 어떻게 만드는가?', ['emo-freedom', 'tec-2d', 'tec-watercolor', 'spc-nature']],
  ['S-G14', KAGUYA, '궁중 생활의 정적 장면', 'Composition + Narrative', '화면의 여백과 반복되는 예식이 감정을 어떻게 전달하는가?', ['spc-negative', 'emo-solitude', 'spc-symmetry', 'spc-enclosed', 'nar-repetition']],
  ['S-G15', KAGUYA, '감정이 폭발하는 질주 장면', 'Line + Motion + Emotion', '선의 거칠기와 화면 밀도 변화가 감정의 강도와 함께 변하는가?', ['tec-2d', 'mot-rhythm', 'emo-freedom', 'emo-sadness'], ['src-g7']],
];

const WORK_SOURCES: Record<string, string[]> = {
  [INTO]: ['src-s2', 'src-s1'],
  [ACROSS]: ['src-s4', 'src-s3'],
  [ENCANTO]: ['src-d6'],
  [FROZEN2]: ['src-d7'],
  [MOANA]: ['src-d8'],
  [ZOOTOPIA]: ['src-d9'],
  [SPIRITED]: ['src-g2'],
  [TOTORO]: ['src-g3'],
  [MONONOKE]: ['src-g4'],
  [HOWL]: ['src-g5'],
  [KAGUYA]: ['src-g6'],
};

export const sceneIdFromCode = (code: string) => `scene-${code.toLowerCase()}`;

export const seedScenes: Scene[] = rows.map(([code, workId, keyword, focus, question, tagIds, extra]) => ({
  id: sceneIdFromCode(code),
  seedCode: code,
  workId,
  title: keyword,
  description: `장면을 찾아볼 키워드: ${keyword}`,
  focusLabel: focus,
  startSeconds: null,
  endSeconds: null,
  sceneImageAssetId: null,
  externalVideoUrl: null,
  lensIds: lensesFromFocus(focus),
  tagIds,
  colors: [],
  colorSource: null,
  observation: '',
  interpretation: '',
  productionFact: '',
  hypothesis: '',
  application: '',
  visualNotes: '',
  narrativeNotes: '',
  productionNotes: '',
  researchQuestion: question,
  sourceIds: Array.from(new Set([...(WORK_SOURCES[workId] ?? []), ...(extra ?? [])])),
  verificationStatus: 'needs_review',
  isBookmark: false,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
}));
