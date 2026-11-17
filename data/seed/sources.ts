import type { CategoryId, EvidenceType, Source, SourceType, VerificationStatus } from '../../src/lib/types';
import { SEED_TIMESTAMP, SOURCE_ACCESSED_AT } from './meta';

type Row = {
  code: string;
  categoryId: CategoryId;
  title: string;
  publisher: string;
  url: string;
  sourceType: SourceType;
  evidenceType: EvidenceType;
  verificationStatus: VerificationStatus;
  relatedWorkIds: string[];
  notes: string;
  altSearchHint: string;
};

// Spec PART F. "verified" = the info was confirmed to exist at the link, NOT that any interpretation is correct.
const rows: Row[] = [
  {
    code: 'S1', categoryId: 'sony', publisher: 'Sony Pictures Imageworks',
    title: 'Spider-Man: Into the Spider-Verse',
    url: 'https://www.imageworks.com/node/1371',
    sourceType: 'official_process', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-sony-into'],
    notes: '시각 언어·드로잉 FX·렌더링·합성. 코믹북 인쇄 미학, 표정 선화, 손그림 효과, 비사실적 렌더링, 할프톤·해칭, 모션 블러·피사계 심도의 다른 접근.',
    altSearchHint: 'Imageworks "Into the Spider-Verse" comic book look halftone',
  },
  {
    code: 'S2', categoryId: 'sony', publisher: 'Sony Pictures Animation',
    title: 'Spider-Man: Into the Spider-Verse (공식 작품 페이지)',
    url: 'https://www.sonypicturesanimation.com/projects/films/spider-man-spider-verse',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-sony-into'],
    notes: '작품 개요·감독.',
    altSearchHint: 'Sony Pictures Animation Spider-Man Into the Spider-Verse',
  },
  {
    code: 'S3', categoryId: 'sony', publisher: 'Sony Group',
    title: 'Beyond the Screen: Creators Behind Across the Spider-Verse',
    url: 'https://www.sony.com/en/brand/beyondthescreen/acrossthespiderverse/',
    sourceType: 'official_process', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-sony-across'],
    notes: 'Gwen의 수채화풍 세계(감정에 반응하는 배경), 다른 차원의 그래픽 양식, 제작 도구.',
    altSearchHint: 'Sony "Beyond the Screen" Across the Spider-Verse creators',
  },
  {
    code: 'S4', categoryId: 'sony', publisher: 'Sony Pictures Animation',
    title: 'Spider-Man: Across the Spider-Verse (공식 작품 페이지)',
    url: 'https://www.sonypicturesanimation.com/projects/films/spider-man-spider-verse-sequel',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-sony-across'],
    notes: '작품 개요·감독.',
    altSearchHint: 'Sony Pictures Animation Across the Spider-Verse',
  },
  {
    code: 'S5', categoryId: 'sony', publisher: 'Sony Pictures Imageworks',
    title: 'Spider-Man: Across the Spider-Verse (작품 및 VFX Breakdown)',
    url: 'https://www.imageworks.com/index.php/our-craft/feature-animation/movies/spider-man-across-spider-verse',
    sourceType: 'official_process', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-sony-across'],
    notes: '작품 관련 스틸·제작 해설 영상.',
    altSearchHint: 'Imageworks Across the Spider-Verse breakdown',
  },
  {
    code: 'S6', categoryId: 'sony', publisher: 'Sony Pictures Animation (YouTube)',
    title: 'Telling a Story in Every Frame',
    url: 'https://www.youtube.com/watch?v=1Nw_c_CqPso',
    sourceType: 'official_process', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-sony-into'],
    notes: '제작진의 프레임·연출 설명 영상.',
    altSearchHint: 'Sony Pictures Animation "Telling a Story in Every Frame"',
  },
  {
    code: 'S7', categoryId: 'sony', publisher: 'Foundry (소프트웨어 제작사 자료)',
    title: "How Sony Pictures Imageworks created Spider-Verse's graphic look",
    url: 'https://www.foundry.com/insights/film-tv/graphic-look-in-comp-spiderman',
    sourceType: 'analysis', evidenceType: 'secondary', verificationStatus: 'verified',
    relatedWorkIds: ['work-sony-into'],
    notes: 'Nuke 합성(compositing) 파이프라인 설명. 코믹북 그래픽 룩을 합성 단계에서 만드는 방법. 스튜디오 공식 발표가 아닌 2차 자료.',
    altSearchHint: 'Foundry Nuke Spider-Verse graphic look comp',
  },
  {
    code: 'D1', categoryId: 'disney', publisher: 'Walt Disney Animation Studios',
    title: 'Visual Development', url: 'https://www.disneyanimation.com/process/visual-development/',
    sourceType: 'official_process', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-disney-encanto', 'work-disney-moana', 'work-disney-zootopia'],
    notes: '스토리/감독의 비전을 바탕으로 캐릭터·세계의 형태 개발. 색채·디자인·구도가 이야기의 테마를 뒷받침.',
    altSearchHint: 'disneyanimation.com process visual development',
  },
  {
    code: 'D2', categoryId: 'disney', publisher: 'Walt Disney Animation Studios',
    title: 'Story', url: 'https://www.disneyanimation.com/process/story/',
    sourceType: 'official_process', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: [],
    notes: '스토리 아티스트가 감정·타이밍·스테이징·프레이밍을 함께 설계.',
    altSearchHint: 'disneyanimation.com process story',
  },
  {
    code: 'D3', categoryId: 'disney', publisher: 'Walt Disney Animation Studios',
    title: 'Layout & Final Layout', url: 'https://www.disneyanimation.com/process/layout/',
    sourceType: 'official_process', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: [],
    notes: '캐릭터·세트·소품·카메라로 샷 구성. 스토리보드를 3D 공간으로 옮기는 작업.',
    altSearchHint: 'disneyanimation.com process layout',
  },
  {
    code: 'D4', categoryId: 'disney', publisher: 'Walt Disney Animation Studios',
    title: 'Look Development', url: 'https://www.disneyanimation.com/process/look-development/',
    sourceType: 'official_process', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-disney-frozen2'],
    notes: '재질·텍스처·색상·표면 개발. 《Frozen 2》 제작 단계별 분해 자료.',
    altSearchHint: 'disneyanimation.com process look development Frozen 2',
  },
  {
    code: 'D5', categoryId: 'disney', publisher: 'Walt Disney Animation Studios',
    title: 'Creative Development / Research', url: 'https://www.disneyanimation.com/process/creative-development/',
    sourceType: 'official_process', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: [],
    notes: '문화·역사·예술 관련 조사, 전문가 협업, 현장 방문이 제작 참고자료.',
    altSearchHint: 'disneyanimation.com process creative development research',
  },
  {
    code: 'D6', categoryId: 'disney', publisher: 'Walt Disney Animation Studios',
    title: 'Encanto', url: 'https://www.disneyanimation.com/films/encanto/',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-disney-encanto'], notes: '공식 작품 페이지·감독.', altSearchHint: 'disneyanimation.com films encanto',
  },
  {
    code: 'D7', categoryId: 'disney', publisher: 'Walt Disney Animation Studios',
    title: 'Frozen 2', url: 'https://www.disneyanimation.com/films/frozen-2/',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-disney-frozen2'], notes: '공식 작품 페이지·감독.', altSearchHint: 'disneyanimation.com films frozen 2',
  },
  {
    code: 'D8', categoryId: 'disney', publisher: 'Walt Disney Animation Studios',
    title: 'Moana', url: 'https://www.disneyanimation.com/films/moana/',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-disney-moana'], notes: '공식 작품 페이지·감독.', altSearchHint: 'disneyanimation.com films moana',
  },
  {
    code: 'D9', categoryId: 'disney', publisher: 'Walt Disney Animation Studios',
    title: 'Zootopia', url: 'https://www.disneyanimation.com/films/zootopia/',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-disney-zootopia'], notes: '공식 작품 페이지·감독.', altSearchHint: 'disneyanimation.com films zootopia',
  },
  {
    code: 'D10', categoryId: 'disney', publisher: 'Walt Disney Animation Studios',
    title: 'Feature Films 목록', url: 'https://www.disneyanimation.com/films/',
    sourceType: 'filmography', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: [], notes: 'Walt Disney Animation Studios 장편 목록.', altSearchHint: 'disneyanimation.com films',
  },
  {
    code: 'G1', categoryId: 'ghibli', publisher: 'Studio Ghibli',
    title: '공식 작품 목록', url: 'https://www.ghibli.jp/works/',
    sourceType: 'filmography', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: [], notes: '개별 작품의 개봉 연도·감독 등 기본 정보, 여러 작품의 공식 스틸컷 페이지.', altSearchHint: 'ghibli.jp works',
  },
  {
    code: 'G2', categoryId: 'ghibli', publisher: 'Studio Ghibli',
    title: 'Spirited Away / 千と千尋の神隠し', url: 'https://www.ghibli.jp/works/chihiro/',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-ghibli-spirited'], notes: '공식 작품 페이지.', altSearchHint: 'ghibli.jp works chihiro',
  },
  {
    code: 'G3', categoryId: 'ghibli', publisher: 'Studio Ghibli',
    title: 'My Neighbor Totoro / となりのトトロ', url: 'https://www.ghibli.jp/works/totoro/',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-ghibli-totoro'], notes: '공식 작품 페이지.', altSearchHint: 'ghibli.jp works totoro',
  },
  {
    code: 'G4', categoryId: 'ghibli', publisher: 'Studio Ghibli',
    title: 'Princess Mononoke / もののけ姫', url: 'https://www.ghibli.jp/works/mononoke/',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-ghibli-mononoke'], notes: '공식 작품 페이지.', altSearchHint: 'ghibli.jp works mononoke',
  },
  {
    code: 'G5', categoryId: 'ghibli', publisher: 'Studio Ghibli',
    title: "Howl's Moving Castle / ハウルの動く城", url: 'https://www.ghibli.jp/works/howl/',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-ghibli-howl'], notes: '공식 작품 페이지.', altSearchHint: 'ghibli.jp works howl',
  },
  {
    code: 'G6', categoryId: 'ghibli', publisher: 'Studio Ghibli',
    title: 'The Tale of the Princess Kaguya / かぐや姫の物語', url: 'https://www.ghibli.jp/works/kaguyahime/',
    sourceType: 'official_film', evidenceType: 'official_primary', verificationStatus: 'verified',
    relatedWorkIds: ['work-ghibli-kaguya'], notes: '공식 작품 페이지.', altSearchHint: 'ghibli.jp works kaguyahime',
  },
  {
    code: 'G7', categoryId: 'ghibli', publisher: 'British Film Institute 참고자료',
    title: 'The Tale of The Princess Kaguya: Programme Notes',
    url: 'https://bfidatadigipres.github.io/anime/2022/05/03/tale-of-the-princess-kaguya/',
    sourceType: 'analysis', evidenceType: 'secondary', verificationStatus: 'verified',
    relatedWorkIds: ['work-ghibli-kaguya'],
    notes: '배경의 수채화 느낌·거친 선화·완성되지 않은 듯한 여백의 효과 설명. 공식 스튜디오 제작 발표가 아닌 외부 분석 자료.',
    altSearchHint: 'BFI programme notes Tale of the Princess Kaguya',
  },
  {
    code: 'G8', categoryId: 'ghibli', publisher: 'Tokyo Metropolitan Government',
    title: 'Ghibli Museum 소개 및 배경 미술·스토리보드',
    url: 'https://www.tokyoupdates.metro.tokyo.lg.jp/en/post-842/',
    sourceType: 'analysis', evidenceType: 'secondary', verificationStatus: 'verified',
    relatedWorkIds: [],
    notes: '지브리 미술관의 배경 미술·스토리보드 전시 및 전통 셀 애니메이션 공정 설명. 작품별 정확한 제작 방식과 동일시하지 않는다.',
    altSearchHint: 'Tokyo Updates Ghibli Museum',
  },
];

export const seedSources: Source[] = rows.map((r) => ({
  id: `src-${r.code.toLowerCase()}`,
  code: r.code,
  title: r.title,
  url: r.url,
  publisher: r.publisher,
  accessedAt: SOURCE_ACCESSED_AT,
  sourceType: r.sourceType,
  evidenceType: r.evidenceType,
  verificationStatus: r.verificationStatus,
  relatedWorkIds: r.relatedWorkIds,
  categoryIds: [r.categoryId],
  notes: r.notes,
  altSearchHint: r.altSearchHint,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
}));
