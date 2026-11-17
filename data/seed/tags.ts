import type { Tag, TagFacet } from '../../src/lib/types';
import { SEED_TIMESTAMP } from './meta';

type T = [id: string, nameKo: string, nameEn: string, definition: string, aliases?: string[]];

const groups: Record<Exclude<TagFacet, 'custom'>, T[]> = {
  emotion: [
    ['emo-solitude', '고독', 'Solitude', '인물이 세계나 타인과 분리되어 있다고 느껴지는 감정 상태.', ['외로움', 'loneliness', 'lonely']],
    ['emo-anxiety', '불안', 'Anxiety', '확실하지 않은 위협이나 변화에 대한 긴장된 감정.'],
    ['emo-wonder', '경이', 'Wonder', '낯설고 거대한 대상 앞에서 느끼는 놀라움과 경탄.', ['awe']],
    ['emo-freedom', '자유', 'Freedom', '제약에서 벗어나는 해방감이나 개방감.'],
    ['emo-sadness', '슬픔', 'Sadness', '상실·이별·좌절과 연결된 감정.'],
    ['emo-hope', '희망', 'Hope', '앞으로의 가능성에 대한 기대.'],
    ['emo-tension', '긴장', 'Tension', '갈등이나 위험이 고조되는 상태.'],
    ['emo-stability', '안정', 'Stability', '편안함·일상성·안전감.'],
    ['emo-growth', '성장', 'Growth', '인물이 이전과 다른 상태로 나아가는 감정적 변화.'],
    ['emo-bond', '유대', 'Bond', '인물 간 정서적 연결과 신뢰.'],
  ],
  color: [
    ['col-warm', '웜톤', 'Warm tones', '붉은/주황/노란 계열이 지배적인 색 구성.'],
    ['col-cool', '쿨톤', 'Cool tones', '파랑/청록/보라 계열이 지배적인 색 구성.'],
    ['col-high-sat', '고채도', 'High saturation', '채도가 높은 강한 색.'],
    ['col-low-sat', '저채도', 'Low saturation', '회색기를 띤 차분한 색.'],
    ['col-complementary', '보색 대비', 'Complementary contrast', '색상환에서 반대되는 색끼리의 대비.'],
    ['col-mono', '단색 중심', 'Monochromatic', '한 가지 색상 계열을 중심으로 한 구성.'],
    ['col-temp-shift', '색온도 변화', 'Color temperature shift', '장면 안 또는 장면 간 색온도가 바뀌는 변화.'],
    ['col-script', '컬러 스크립트', 'Color script', '작품 전체의 시간 흐름에 따른 색 설계 문서/개념.'],
  ],
  space: [
    ['spc-negative', '네거티브 스페이스', 'Negative space', '화면 안의 비어 있는 영역, 여백.', ['여백', '빈 공간', 'empty space']],
    ['spc-scale', '거대 스케일', 'Monumental scale', '인물에 비해 매우 큰 공간·대상.', ['스케일', 'scale']],
    ['spc-enclosed', '폐쇄 공간', 'Enclosed space', '벽·천장·틀로 둘러싸인 제한된 공간.', ['실내']],
    ['spc-nature', '자연', 'Nature', '숲·바다·하늘·날씨 등 자연 환경.', ['숲', '바다', '비', '바람']],
    ['spc-urban', '도시', 'Urban', '건물·거리·교통 등 도시 환경.', ['city']],
    ['spc-recurring-prop', '반복 소품', 'Recurring prop', '여러 장면에 반복 등장하는 사물.', ['소품', 'prop']],
    ['spc-symmetry', '대칭', 'Symmetry', '좌우/상하 균형이 강조된 배치.'],
    ['spc-visual-symbol', '시각적 상징', 'Visual symbol', '형태·사물·색이 의미를 대신 전달하는 장치.', ['상징', 'symbol']],
  ],
  camera: [
    ['cam-wide', '와이드숏', 'Wide shot', '인물과 환경 전체를 넓게 보여주는 샷.', ['롱숏', 'long shot', '익스트림 롱숏']],
    ['cam-closeup', '클로즈업', 'Close-up', '얼굴·사물을 가까이 보여주는 샷.'],
    ['cam-low', '로우앵글', 'Low angle', '아래에서 올려다보는 카메라 각도.'],
    ['cam-high', '하이앵글', 'High angle', '위에서 내려다보는 카메라 각도.'],
    ['cam-center', '중앙 구도', 'Center composition', '주요 피사체를 화면 중앙에 두는 구도.'],
    ['cam-layered', '레이어드 뎁스', 'Layered depth', '전경·중경·배경 레이어로 깊이를 만드는 구성.', ['깊이', 'depth']],
    ['cam-move', '카메라 이동', 'Camera movement', '팬·트래킹·크레인 등 카메라가 움직이는 연출.', ['카메라워크']],
  ],
  motion: [
    ['mot-twos', '온 투즈(on twos)', 'On twos', '두 프레임마다 한 장의 그림을 쓰는 타이밍.', ['on twos', '투즈']],
    ['mot-exaggeration', '과장 동작', 'Exaggeration', '포즈·속도·변형을 과장한 움직임.'],
    ['mot-hold', '정지/휴지', 'Hold / Pause', '움직임을 멈추거나 느리게 해 여운을 주는 타이밍.', ['정지', '휴지', '멈춤', '느림']],
    ['mot-smear', '스미어', 'Smear', '빠른 동작을 번진 형태로 표현하는 프레임.'],
    ['mot-speedline', '속도선', 'Speed lines', '움직임 방향을 선으로 표현하는 그래픽.'],
    ['mot-weight', '무게감', 'Weight', '질량·관성이 느껴지는 움직임.'],
    ['mot-rhythm', '리듬 변화', 'Rhythm change', '빠름/느림, 정지/폭발 등 움직임 템포의 변화.', ['리듬', '타이밍', 'timing']],
  ],
  narrative: [
    ['nar-coming-of-age', '성장 서사', 'Coming-of-age', '인물이 시련을 통해 성숙해 가는 이야기 구조.'],
    ['nar-identity', '정체성', 'Identity', '자신이 누구인지에 관한 질문과 발견.'],
    ['nar-family', '가족', 'Family', '가족 구성원 간 관계와 역할.'],
    ['nar-belonging', '소속감', 'Belonging', '집단·장소에 속한다는 감각.'],
    ['nar-relationship', '관계 변화', 'Relationship change', '인물 간 관계가 이동·전환되는 과정.'],
    ['nar-world-rules', '세계 규칙', 'World rules', '작품 세계가 작동하는 규칙과 질서.', ['세계관', 'worldbuilding', '월드빌딩']],
    ['nar-metaphor', '메타포', 'Metaphor', '대상을 다른 대상으로 비유해 의미를 전달.', ['은유']],
    ['nar-transformation', '변신', 'Transformation', '외형·상태의 변화.'],
    ['nar-repetition', '반복·변주', 'Repetition & variation', '같은 요소가 변주되며 반복되는 구조.', ['반복', '변주']],
  ],
  technique: [
    ['tec-2d', '2D 드로잉', '2D drawing', '손그림/2D 작화 기반 표현.', ['손그림', '드로잉', '선화', 'line']],
    ['tec-3d', '3D CG', '3D CG', '3D 컴퓨터 그래픽 기반 표현.', ['cg']],
    ['tec-hybrid', '하이브리드', 'Hybrid', '2D와 3D 등 여러 방식을 결합한 표현.'],
    ['tec-halftone', '할프톤', 'Halftone', '인쇄 망점을 연상시키는 점 패턴.', ['망점', '코믹북', 'comic book']],
    ['tec-hatching', '해칭', 'Hatching', '평행선으로 명암을 표현하는 기법.'],
    ['tec-watercolor', '수채화풍', 'Watercolor look', '수채화처럼 번지고 투명한 색감.', ['수채화']],
    ['tec-rigging', '리깅', 'Rigging', '3D 캐릭터를 움직이기 위한 뼈대/제어 구조.'],
    ['tec-shading', '셰이딩', 'Shading', '표면의 명암·재질을 계산하는 방식.', ['렌더링', 'rendering']],
    ['tec-compositing', '합성', 'Compositing', '여러 레이어/요소를 최종 이미지로 결합.', ['컴포지팅', 'comp']],
    ['tec-simulation', '시뮬레이션', 'Simulation', '물·천·머리카락 등 물리 기반 계산.', ['fx', '이펙트']],
  ],
};

export const seedTags: Tag[] = Object.entries(groups).flatMap(([facet, rows]) =>
  rows.map(([id, nameKo, nameEn, definition, aliases]) => ({
    id,
    nameKo,
    nameEn,
    facet: facet as TagFacet,
    definition,
    aliases: aliases ?? [],
    isCustom: false,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  })),
);
