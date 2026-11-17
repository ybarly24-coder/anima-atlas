import type { BoardStatus, CategoryId, EvidenceType, InsightKind, Lens, SourceType, TagFacet, VerificationStatus } from './types';

export const LENSES: Lens[] = ['visual', 'narrative', 'production'];

export const LENS_LABEL: Record<Lens, { ko: string; en: string; short: string }> = {
  visual: { ko: '시각/연출', en: 'Visual', short: 'VIS' },
  narrative: { ko: '스토리/세계관', en: 'Narrative', short: 'NAR' },
  production: { ko: '제작/기술', en: 'Production', short: 'PRD' },
};

export const LENS_SUBITEMS: Record<Lens, string[]> = {
  visual: ['색채', '미장센', '구도', '조명', '질감', '카메라', '움직임'],
  narrative: ['상황', '갈등', '캐릭터 감정', '상징', '스토리 기능', '세계관 규칙'],
  production: ['확인된 기법', '툴', '메이킹 출처', '추정/미확인 구분'],
};

export const LENS_QUESTIONS: Record<Lens, string[]> = {
  visual: [
    '화면에서 가장 먼저 보이는 요소는 무엇인가? (명도·크기·배치)',
    '지배적인 색상과 색 대비는 무엇인가? 동일 작품 전후 장면과 어떻게 달라지는가?',
    '인물과 배경의 면적·거리·깊이는 어떻게 구성되는가?',
    '조명과 그림자가 정보·감정·상징에 기여하는 방식은?',
    '움직임의 속도/정지/프레임 간격은 감정이나 행동에 어떤 리듬을 만드는가?',
  ],
  narrative: [
    '장면 이전에 캐릭터가 원하던 것과 장면 이후 바뀐 것은?',
    '이 장면의 사건·갈등·전환점은?',
    '대사 없이 전달되는 정보는 무엇인가?',
    '반복되는 장소, 소품, 색, 형태가 상징으로 작용하는가?',
    '관객이 세계관 규칙을 어떤 행동이나 결과로 학습하는가?',
  ],
  production: [
    '실제로 확인 가능한 제작 방식은 무엇인가? 출처는?',
    '그림체/재질/움직임을 만들기 위해 어떤 파이프라인이 쓰였는가?',
    '관찰 가능한 화면 효과와 제작사의 기술적 구현 사실을 구분했는가?',
    '비슷한 효과를 작은 팀이 재현한다면 어떤 기법을 실험할 수 있는가? (재현안은 가설)',
  ],
};

export const FACET_LABEL: Record<TagFacet, string> = {
  emotion: '감정',
  color: '색채',
  space: '공간·미장센',
  camera: '구도·카메라',
  motion: '모션',
  narrative: '서사',
  technique: '기술',
  custom: '사용자 태그',
};

export const FACETS: TagFacet[] = ['emotion', 'color', 'space', 'camera', 'motion', 'narrative', 'technique', 'custom'];

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  verified: '확인됨',
  partial: '부분 확인',
  needs_review: '검토 필요',
  unverified: '확인 전',
};

export const EVIDENCE_LABEL: Record<EvidenceType, string> = {
  official_primary: '공식 1차 자료',
  secondary: '2차 자료',
  direct_observation: '직접 관찰',
  hypothesis: '연구자 가설',
};

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  official_film: '공식 작품 정보',
  official_process: '공식 제작 공정',
  interview: '인터뷰',
  analysis: '분석/해설',
  filmography: '작품 목록',
};

export const BOARD_STATUS_LABEL: Record<BoardStatus, string> = {
  template: '템플릿/검토 필요',
  in_progress: '연구 중',
  done: '정리 완료',
};

export const INSIGHT_KIND_LABEL: Record<InsightKind, string> = {
  hypothesis: '가설',
  finding: '발견',
  application: '창작 적용 아이디어',
};

/** The 3 research studios (tabs). 'other' is an overflow bucket for imported works. */
export const CATEGORY_IDS: CategoryId[] = ['sony', 'disney', 'ghibli'];

/** Calm per-category accent (used only on chips/placeholders). */
export const CATEGORY_ACCENT: Record<CategoryId, { chip: string; dot: string; hue: number }> = {
  sony: { chip: 'bg-[#f3e6e4] text-[#7a2e26] border-[#e3c9c4]', dot: 'bg-[#b5483b]', hue: 8 },
  disney: { chip: 'bg-[#e5eaf3] text-[#2c4470] border-[#c9d3e6]', dot: 'bg-[#4867a3]', hue: 220 },
  ghibli: { chip: 'bg-[#e6eee5] text-[#33552f] border-[#c8d8c5]', dot: 'bg-[#5b8a54]', hue: 110 },
  other: { chip: 'bg-[#efebe4] text-[#5a544c] border-[#d9d2c6]', dot: 'bg-[#8d857a]', hue: 35 },
};

export const IMAGE_TYPE_LABEL: Record<import('./types').ImageType, { ko: string; hint: string }> = {
  actual_frame: { ko: '실제 프레임', hint: '직접 관람해 확인한 영화 속 실제 장면' },
  promotional_still: { ko: '홍보용 스틸/백드롭', hint: '배급사 홍보 이미지. 영화 속 프레임과 다를 수 있음' },
  poster: { ko: '포스터', hint: '포스터 디자인 (장면 아님)' },
  concept_art: { ko: '콘셉트 아트', hint: '제작 과정의 아트워크' },
  unknown: { ko: '알 수 없음', hint: '출처를 확인하지 못한 이미지' },
};

export const LICENSE_LABEL: Record<import('./types').LicenseStatus, string> = {
  unverified: '권리 미확인',
  checked: '사용 조건 확인함',
  restricted: '사용 제한',
};

export const PROVIDER_LABEL: Record<import('./types').SourceProvider, string> = {
  tmdb: 'TMDB',
  manual_upload: '직접 업로드',
  official_link: '공식 링크',
};

export const EVIDENCE_FIELDS = [
  { key: 'observation', label: 'Observation · 내가 본 것', hint: '화면에서 직접 본 것만 기록합니다. (예: 인물이 화면 오른쪽 1/3에 작게 배치됨)', kind: 'observation' },
  { key: 'productionFact', label: 'Evidence · 출처 확인 사실', hint: '공식 출처로 확인된 사실만 기록하고 출처를 연결하세요. 영화 전체에 관한 공정 설명과 이 장면에 적용됐다는 증거를 구분하세요.', kind: 'fact' },
  { key: 'interpretation', label: 'Interpretation · 내 해석', hint: '관찰을 바탕으로 한 연구자의 해석입니다. 복수 해석이 가능합니다.', kind: 'interpretation' },
  { key: 'hypothesis', label: 'Hypothesis · 검증할 가설', hint: '다른 장면·작품으로 검증할 수 있는 가설.', kind: 'hypothesis' },
  { key: 'application', label: 'Application · 창작 응용', hint: '새 작품 제작에 적용해 볼 연출/제작 실험.', kind: 'application' },
] as const;

export type EvidenceFieldKey = (typeof EVIDENCE_FIELDS)[number]['key'];
