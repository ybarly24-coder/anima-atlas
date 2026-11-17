import type { Category } from '../../src/lib/types';

// Spec PART A. "confirmedFacts" are linked to the Source library; "tracks" are analysis frames (not official intent).
export const seedCategories: Category[] = [
  {
    id: 'sony',
    label: 'SONY / SPIDER-VERSE',
    nameKo: '소니 / 스파이더버스',
    nameEn: 'Sony / Spider-Verse',
    tagline: '만화의 표현 언어를 움직이는 영상으로 확장한 하이브리드 애니메이션과 시각적 리듬 연구.',
    scopeNote: '핵심 작품: 《스파이더맨: 뉴 유니버스》(2018). 후속 비교 작품: 《스파이더맨: 어크로스 더 유니버스》(2023).',
    aliases: ['소니', 'sony', '스파이더버스', 'spider-verse', 'spiderverse', '스파이더맨', 'spider-man'],
    axes: {
      visual: '할프톤(망점), 해칭(평행선 음영), 색면, 강한 윤곽선, 코믹 패널, 프린트 어긋남을 연상시키는 효과, 다이내믹 원근, 속도선.',
      narrative: "마일스의 정체성·성장, 멘토 관계, '누구나 가면을 쓸 수 있다'는 메시지, 멀티버스가 만들어내는 인물 간 대비.",
      production: '3D 기반 작업에 드로잉/선화/스타일라이즈드 렌더링/합성을 결합한 제작. 시각적 효과를 위해 기존 CG 제작 흐름을 조정.',
    },
    confirmedFacts: [
      {
        text: 'Sony Pictures Imageworks는 《Into the Spider-Verse》의 시각 양식이 코믹북 인쇄 미학에서 영감을 받았으며, 사실적 재현보다 아티스트의 의도와 디자인을 중시했다고 설명한다. 표정 선화, 손그림 효과, 비사실적 렌더링 등이 제작 과정에 포함됐다.',
        sourceIds: ['src-s1'],
      },
      {
        text: 'Imageworks는 할프톤·해칭, 강한 그래픽 형태, 선·색의 스타일라이징을 설명하며, 기존의 전통적인 모션 블러·피사계 심도 표현을 다르게 접근한 사례도 소개한다.',
        sourceIds: ['src-s1'],
      },
      {
        text: "《Across the Spider-Verse》 제작 관련 Sony 자료는 Gwen의 세계에서 감정에 반응하는 수채화 느낌의 배경, 다른 차원의 그래픽 양식, 공간/캐릭터를 위한 디지털 도구를 설명한다.",
        sourceIds: ['src-s3'],
      },
      {
        text: 'Sony Pictures Animation은 2018년작 《Into》와 2023년작 《Across》의 영화 개요와 제작진을 공식적으로 게시하고 있다.',
        sourceIds: ['src-s2', 'src-s4'],
      },
    ],
    tracks: [
      { track: '코믹북 미학', analyze: '망점·해칭·선화·컷 분할', compare: '전통 CG vs 그림 같은 CG', output: '그래픽 표현 요소 사전' },
      { track: '색채와 정체성', analyze: '인물·세계별 배색', compare: 'Miles vs Gwen, 두 영화', output: '장면별 색채 기능 지도' },
      { track: '움직임과 성장', analyze: '동작 리듬, 빠름/느림, 정지', compare: '성장 전/후 장면', output: '모션 연구 노트' },
      { track: '도시 미장센', analyze: '그래피티, 빌딩, 도시 레이어', compare: '도시가 인물의 심리와 연결되는 방식', output: '공간·감정 보드' },
      { track: '제작 기술', analyze: '드로잉 FX, 합성, 렌더링', compare: '공식 제작 근거가 있는 기법', output: '기술 레퍼런스 카드' },
    ],
  },
  {
    id: 'disney',
    label: 'DISNEY ANIMATION',
    nameKo: '디즈니 애니메이션',
    nameEn: 'Walt Disney Animation Studios',
    tagline: '감정과 이야기의 가독성을 높이는 색채·캐릭터·공간 연출, 그리고 이를 구현하는 제작 파이프라인 연구.',
    scopeNote: 'Walt Disney Animation Studios 영화만 포함. Pixar Animation Studios는 별도 스튜디오이므로 초기 데이터에 넣지 않는다.',
    aliases: ['디즈니', 'disney', 'walt disney', 'wdas', '월트 디즈니'],
    axes: {
      visual: '컬러 스크립트, 감정에 따른 배경과 조명, 캐릭터 실루엣, 읽기 쉬운 스테이징, 장소별 시각적 세계.',
      narrative: '캐릭터의 욕망/결핍, 관계 변화, 노래나 행동과 전환점의 결합, 공간의 상징적 역할.',
      production: '연구·비주얼 디벨롭먼트·스토리보드·레이아웃·룩디벨롭먼트의 연결.',
    },
    confirmedFacts: [
      {
        text: 'Disney Animation 공식 Visual Development는 스토리/감독의 비전을 바탕으로 캐릭터와 세계의 형태를 개발하며, 색채·디자인·구도가 이야기의 테마를 뒷받침한다고 설명한다.',
        sourceIds: ['src-d1'],
      },
      { text: '공식 Story 설명은 스토리 아티스트가 감정·타이밍·스테이징·프레이밍을 함께 설계함을 보여준다.', sourceIds: ['src-d2'] },
      {
        text: '공식 Layout 설명은 캐릭터·세트·소품·카메라를 활용해 샷을 구성하고, 스토리보드를 3D 공간으로 옮기는 작업을 다룬다.',
        sourceIds: ['src-d3'],
      },
      {
        text: '공식 Look Development는 재질·텍스처·색상·표면 등을 만들고, 《Frozen 2》를 예로 제작 단계별 분해 자료를 제공한다.',
        sourceIds: ['src-d4'],
      },
      {
        text: 'Disney Animation은 문화·역사·예술 등과 관련된 조사, 전문가 협업, 현장 방문이 제작의 참고자료가 된다고 설명한다.',
        sourceIds: ['src-d5'],
      },
    ],
    tracks: [
      { track: '컬러 스크립트', analyze: '시간에 따른 색 온도·명도 변화', compare: 'Encanto / Frozen 2', output: '사건-색채 타임라인' },
      { track: '캐릭터 감정', analyze: '얼굴·몸짓·실루엣·거리', compare: 'Mirabel / Elsa / Moana', output: '행동/감정 표현 카드' },
      { track: '공간을 통한 서사', analyze: '집·숲·바다·도시의 역할', compare: '4개 작품의 장소', output: '공간 기능 비교표' },
      { track: '스토리보드와 레이아웃', analyze: '스테이징·시선·블로킹', compare: '전환점 장면', output: '샷 구조 메모' },
      { track: '룩디벨롭먼트', analyze: '질감·재질·광원·모델', compare: 'Frozen 2 중심', output: '공식 공정 참조 지도' },
    ],
  },
  {
    id: 'ghibli',
    label: 'STUDIO GHIBLI',
    nameKo: '스튜디오 지브리',
    nameEn: 'Studio Ghibli',
    tagline: '배경 미술과 일상의 공간, 자연의 존재감, 여백과 정지, 손그림 스타일 및 이야기 속 상징을 연구.',
    scopeNote:
      "'지브리의 모든 작품은 같은 수채화 기법'처럼 일반화하지 않는다. 작품과 감독에 따라 표현이 다르며, 특히 《가구야 공주 이야기》의 드로잉 표현은 별도로 분석한다.",
    aliases: ['지브리', 'ghibli', 'studio ghibli', '스튜디오 지브리', 'ジブリ'],
    axes: {
      visual: '배경·자연·날씨·건축·생활 소품, 화면의 밀도와 비어 있는 부분, 인물·장소의 대비, 수작업적인 선/색.',
      narrative: '공간을 통과하며 성장하는 인물, 현실과 환상의 경계, 자연과 인간, 일상의 반복, 사물과 장소의 상징.',
      production: '스토리보드, 배경 미술, 드로잉, 캐릭터 연기, 작품별 작화 방식과 소재.',
    },
    confirmedFacts: [
      {
        text: 'Studio Ghibli 공식 작품 목록은 개별 작품의 개봉 연도·감독 등 기본 정보를 제공하고, 여러 작품에 공식 스틸컷 페이지를 제공한다.',
        sourceIds: ['src-g1'],
      },
      {
        text: '《센과 치히로의 행방불명》은 2001년, 《이웃집 토토로》는 1988년, 《원령공주》는 1997년, 《하울의 움직이는 성》은 2004년, 《가구야 공주 이야기》는 2013년 작품이다. 감독 등 세부 정보는 각 공식 페이지 참조.',
        sourceIds: ['src-g2', 'src-g3', 'src-g4', 'src-g5', 'src-g6'],
      },
      {
        text: '영국영화협회(BFI)의 《가구야 공주 이야기》 분석 자료는 배경의 수채화 느낌·거친 선화·완성되지 않은 듯한 여백의 효과를 설명한다. (공식 스튜디오 제작 발표가 아닌 외부 분석 자료)',
        sourceIds: ['src-g7'],
      },
      {
        text: '도쿄도 공식 소개 자료는 지브리 미술관의 배경 미술·스토리보드 전시 및 전통 셀 애니메이션 공정을 설명한다. 작품별 정확한 제작 방식과 동일시하지 않는다.',
        sourceIds: ['src-g8'],
      },
    ],
    tracks: [
      { track: '배경 미술·공간', analyze: '집·목욕탕·숲·성·궁전', compare: '5개 작품의 대표 장소', output: '공간의 서사적 기능 맵' },
      { track: '자연과 스케일', analyze: '인간과 자연의 크기 차', compare: 'Totoro vs Mononoke', output: '자연 표현 비교 보드' },
      { track: '여백과 정지', analyze: '화면의 비어 있음, 정지, 기다림', compare: 'Spirited Away vs Totoro', output: '느림의 감정 전달 노트' },
      { track: '상징과 세계관', analyze: '문, 이름, 장소, 반복되는 사물', compare: 'Spirited Away / Howl', output: '세계관 규칙 사전' },
      { track: '선·수작업 스타일', analyze: '밀도·드로잉선·번짐', compare: 'Kaguya vs 기타 작품', output: '작화 표현 비교표' },
    ],
  },
  {
    // Overflow bucket: works imported via search that are not in the 3 research studios (e.g. Pixar).
    // Hidden from the category tabs until it contains a work. No seed data or confirmed facts.
    id: 'other',
    label: 'OTHER',
    nameKo: '기타 애니메이션',
    nameEn: 'Other animation',
    tagline: '3개 연구 스튜디오 밖에서 검색으로 가져온 작품.',
    scopeNote: 'Pixar 등 다른 스튜디오 작품은 여기에 보관합니다. (Pixar는 Walt Disney Animation Studios와 별도 스튜디오)',
    aliases: ['기타', 'other', '픽사', 'pixar', '드림웍스', 'dreamworks'],
    axes: { visual: '-', narrative: '-', production: '-' },
    confirmedFacts: [],
    tracks: [],
  },
];

/** The 3 research studios shown as primary tabs. */
export const primaryCategories = seedCategories.filter((c) => c.id !== 'other');
