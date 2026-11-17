import type { CategoryId, Lens, ResearchBoard } from '../../src/lib/types';
import { SEED_TIMESTAMP } from './meta';
import { sceneIdFromCode, seedScenes } from './scenes';

// Spec PART C. Boards start as templates: no conclusions are pre-filled.
type Row = [code: string, title: string, cats: CategoryId[], sceneCodes: string[], question: string, output: string, lenses: Lens[]];

const ALL: CategoryId[] = ['sony', 'disney', 'ghibli'];

const rows: Row[] = [
  ['B01', '색으로 표현하는 감정', ALL, ['S-S05', 'S-D03', 'S-G02'], '감정은 단색, 대비, 장면 간 변화 중 무엇으로 전달되는가?', '감정별 색채 비교표', ['visual', 'narrative']],
  ['B02', '고독을 만드는 미장센', ALL, ['S-S03', 'S-D07', 'S-G02'], '인물의 크기·여백·지평선이 고독/자유를 어떻게 구분하는가?', '구도 비교 보드', ['visual', 'narrative']],
  ['B03', '공간이 캐릭터가 될 때', ['disney', 'ghibli'], ['S-D01', 'S-G10', 'S-G01'], '움직이는 집과 세계관의 건축은 어떤 역할을 하는가?', '공간-행동 맵', ['visual', 'narrative']],
  ['B04', '성장의 순간을 촬영하는 방법', ALL, ['S-S03', 'S-D06', 'S-G03'], '인물의 선택은 카메라와 움직임으로 어떻게 강화되는가?', '전환점 샷 분석', ['visual', 'narrative']],
  ['B05', '느림과 정지의 연출', ['sony', 'ghibli'], ['S-S02', 'S-G02', 'S-G05'], '정적 리듬은 긴장/사색/유대에 어떻게 작동하는가?', '타이밍 관찰 노트', ['visual', 'narrative']],
  ['B06', '서로 다른 세계의 시각 규칙', ALL, ['S-S07', 'S-D10', 'S-G11'], '배경을 보자마자 어떤 세계인지 알게 하는 요소는?', '세계 규칙 지도', ['visual', 'narrative', 'production']],
  ['B07', '자연의 움직임과 물성', ['disney', 'ghibli'], ['S-D05', 'S-D08', 'S-G07'], '물·바람·숲의 움직임은 이야기에 어떤 의미를 더하는가?', '자연 모션 비교', ['visual', 'production']],
  ['B08', '2D와 3D 사이의 표현', ['sony', 'ghibli', 'disney'], ['S-S04', 'S-G15', 'S-D11'], '서로 다른 제작 방식으로 질감·선·명암을 어떻게 다루는가?', '제작기법 연구표', ['visual', 'production']],
  ['B09', '소품과 상징의 언어', ALL, ['S-S01', 'S-D02', 'S-G11'], '소품/장소가 캐릭터의 정체성·관계를 전달하는 방식은?', '시각적 상징 카드', ['visual', 'narrative']],
];

export const seedBoards: ResearchBoard[] = rows.map(([code, title, cats, codes, question, output, lenses]) => {
  const sceneIds = codes.map(sceneIdFromCode);
  const workIds = Array.from(new Set(sceneIds.map((id) => seedScenes.find((s) => s.id === id)?.workId).filter(Boolean) as string[]));
  return {
    id: `board-${code.toLowerCase()}`,
    seedCode: code,
    title,
    researchQuestion: question,
    background: '',
    criteria: '',
    scopePeriod: '',
    outputLabel: output,
    status: 'template',
    categoryIds: cats,
    lensIds: lenses,
    sceneIds,
    sceneNotes: {},
    workIds,
    commonalities: '',
    differences: '',
    counterexamples: '',
    interpretation: '',
    productionFacts: '',
    hypothesis: '',
    findings: '',
    applications: '',
    sourceIds: [],
    isBookmark: false,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  };
});
