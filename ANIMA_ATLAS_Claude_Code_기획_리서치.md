# ANIMA ATLAS — 애니메이션 리서치 대시보드

> **Claude Code 실행용 제품 기획·개발 명세서 + 3개 카테고리 리서치 시드 데이터**  
> 버전: v1.0 · 작성일: 2026-11-15 · 기본 언어: 한국어 · 타깃: 애니메이션 제작자·연출/미학 연구자·스토리/세계관 기획자

---

## 0. Claude Code에게 전달할 최상위 작업 지시

**이 문서는 실행 명세서다. 설명만 하는 대신 실제 작동하는 웹 대시보드를 구현한다.**

1. 먼저 현재 작업 디렉터리의 파일, 패키지, 기존 기술 스택을 확인한다. 기존 프로젝트가 있다면 기존 코드를 최대한 보존하고 해당 구조에 맞춰 구현한다. 빈 프로젝트라면 `Next.js + TypeScript + Tailwind CSS`를 기본으로 시작한다. 가능한 한 기존 설치 의존성을 재활용한다.
2. 프로젝트 이름은 **ANIMA ATLAS**, 서브타이틀은 `Animation Research & Visual Intelligence Platform`. UI는 **한국어 우선**, 영어 작품명과 영문 검색어도 지원한다.
3. 사용자가 직접 애니메이션 **작품·장면·연구 보드·분석 노트**를 추가·수정·삭제하고 다시 접속해도 유지되는 **실제 동작하는 앱**을 만든다. 시드 데이터만 있는 가짜 대시보드를 만들지 말 것.
4. 최상단 **3개 리서치 카테고리 탭**을 구현한다.
   - `SONY / SPIDER-VERSE` — 핵심 작품: 《스파이더맨: 뉴 유니버스》(Spider-Man: Into the Spider-Verse, 2018). 후속 비교 작품: 《스파이더맨: 어크로스 더 유니버스》(Across the Spider-Verse, 2023).
   - `DISNEY ANIMATION` — **Walt Disney Animation Studios** 중심. 초기 버전에서는 Pixar를 섞지 않는다.
   - `STUDIO GHIBLI` — 스튜디오 지브리 작품 중심.
5. 세 카테고리 모두 `시각/연출`, `스토리/세계관`, `제작/기술`의 **3대 연구 관점**을 공통으로 지원한다. 작품과 장면에는 여러 연구 관점·태그를 동시에 붙일 수 있어야 한다.
6. 아래 **공식 출처·확인된 제작 사실**은 초기 리서치 데이터로 제공한다. **연구 질문·분석 가설·장면 후보는 확인된 사실과 시각적으로 분리**한다. 사용자가 직접 관람하고 검증하지 않은 장면에 허위 타임코드, 가짜 스틸컷, 임의 RGB 추출값, 존재하지 않는 인터뷰를 채우지 말 것.
7. 외부 이미지·영상의 저작권을 존중한다. **공식 원문 링크는 저장하되, 영상 다운로드·무단 스크래핑·영화 스틸컷의 무단 재호스팅은 하지 않는다.** 장면 이미지는 사용자가 권한을 확인해 직접 업로드하거나 허가된 자료를 지정할 때 표시한다. 그전에는 디자인된 플레이스홀더를 사용한다.
8. 완료 후 README에 실행법과 파일 구조를 기록하고, 핵심 기능(필터링·CRUD·저장·비교·내보내기)을 직접 검증한다. 구현이 어려운 기능은 구현된 것처럼 표시하지 않고 `추후 구현`으로 분리한다.

### 완료 결과물
- 실제 실행되는 반응형 웹 애플리케이션
- 3개 분류 + 작품·장면·소스·보드 시드 데이터
- 작품 상세·장면 분석·교차 비교·연구 보드 화면
- 사용자 데이터의 영속 저장
- README 및 테스트/수용 기준 충족 내역

---

## 1. 제품 정의

### 1.1 한 문장 설명
**애니메이션을 작품별로 수집하고, 장면의 시각 언어·서사 구조·제작 방식을 해부하며, 서로 다른 작품을 비교해 연구 인사이트를 축적하는 개인용 리서치 워크스페이스.**

### 1.2 해결할 문제
- 일반 이미지 아카이브는 *왜 이 장면이 효과적인지* 분석하기 어렵다.
- 한 장면의 색채, 미장센, 동작, 스토리 기능, 기술 정보를 제각기 다른 곳에 기록하게 된다.
- 서로 다른 작품에서 반복되는 연출 패턴과 반례를 찾아내기 어렵다.
- 제작 방법에 관한 **검증된 사실**, 화면에서 직접 본 **관찰**, 연구자의 **해석/가설**이 섞이기 쉽다.

### 1.3 사용자 목표 / 핵심 활동
| 사용자 역할 | 연구 질문 예시 | 자주 사용하는 기능 |
|---|---|---|
| 애니메이션 제작자 | 어떤 동작과 질감이 캐릭터를 더 살아 있게 만들까? | 움직임 태그, 제작 기술 출처, 장면 분석 |
| 연출·미학 연구자 | 고독은 색채·공간·구도로 어떻게 표현될까? | 미장센 검색, 컬러 분석, 교차 비교 |
| 스토리·세계관 기획자 | 세계의 규칙을 관객에게 설명 없이 전달하는 방법은? | 캐릭터 아크, 상징, 공간과 서사의 연결 |

### 1.4 핵심 연구 순환
`발견(Discover) → 수집(Collect) → 관찰(Observe) → 해석(Decode) → 비교(Compare) → 인사이트(Connect) → 창작 적용(Apply)`

**정보 구조상의 핵심 결정:** 카테고리는 연구 자료를 묶는 축이지만, 지식 저장 단위는 **작품(Work) → 장면(Scene) → 분석(Analysis) → 연구 보드(Board)**다.

---

## 2. 정보 구조(IA)와 라우트

```text
ANIMA ATLAS
├── /                     Home · 최근 연구, 탐색, 카테고리별 개요
├── /explore              Explore · 장면/작품 통합 검색 및 다중 필터
│   ├── ?category=sony    Sony / Spider-Verse
│   ├── ?category=disney  Disney Animation
│   └── ?category=ghibli  Studio Ghibli
├── /works                Work Library · 작품 목록
├── /works/[slug]         작품 상세 · 메타데이터, 연구 질문, 장면, 출처
├── /scenes               Scene Library · 장면 카드 갤러리
├── /scenes/[id]          Scene Anatomy · 장면 분석 상세 및 편집
├── /boards               Research Boards · 연구 주제별 보드
├── /boards/[id]          연구 질문, 연결된 장면, 비교, 결론
├── /compare              Compare · 2~4개 장면/작품 병렬 비교
├── /insights             Insight Notebook · 가설·발견·적용 아이디어
└── /sources              Source Library · 원문 출처·검증 상태
```

### 2.1 홈 화면
- 헤더: 로고 `ANIMA ATLAS` / 검색창 / `+ 장면 추가` / `+ 연구 보드`
- 첫 줄: 3개 분류 탭/카드. 각 카테고리 썸네일은 이미지 권한에 따라 플레이스홀더 사용.
- `Research Lenses`: `Visual`, `Narrative`, `Production` 토글 (복수 선택 가능).
- `Explore by Question`: `외로움을 표현하는 미장센`, `색채로 구분되는 세계`, `선으로 속도를 표현하는 방법`, `공간이 캐릭터인 애니메이션` 등의 클릭 가능한 연구 질문.
- 최근 수집 장면·최근 작업한 보드·즐겨찾기·출처 확인 필요 항목.
- 데이터가 적을 때 친절한 빈 상태(empty state)와 추가 버튼 표시.

### 2.2 통합 탐색 화면
- 왼쪽 필터, 오른쪽 이미지 중심 카드 그리드. 모바일은 필터 드로어.
- 필터: 카테고리, 작품, 연도, 3대 연구 관점, 태그, 감정, 공간, 색 온도, 샷 크기, 카메라, 제작 방식, 검증 단계, 북마크.
- 한국어/영어 작품명 및 한글 연구 메모를 함께 검색한다.
- `전체 / 작품 / 장면 / 보드 / 출처` 결과 유형 전환.
- **합집합/교집합** 검색 옵션 제공. 예: `고독 AND 롱숏`.
- 결과 정렬: 최근 수정, 작품 연도, 이름, 수집일.

### 2.3 장면 분석(Scene Anatomy)
화면을 3영역으로 구분:
1. **Scene Viewer** — 사용자가 허용된 스틸컷 업로드 또는 참조 URL/영상 타임코드 저장; 미디어가 없으면 플레이스홀더.
2. **Analysis Tabs** — `Visual`, `Narrative`, `Production` + 핵심 태그/노트.
3. **Evidence & Thinking** — `직접 관찰`, `공식 제작 사실`, `내 해석`, `검증할 가설`, `창작 적용`의 개별 필드.

하단: 관련 장면·이 장면이 포함된 연구 보드·공식 출처/외부 링크.

### 2.4 연구 보드(Research Board)
- 보드 제목, 핵심 질문, 연구 배경, 비교 기준.
- 카드 드래그 정렬이 가능하면 제공; 어려우면 위/아래 이동 버튼부터 구현.
- 한 장면은 여러 보드에 재사용 가능.
- 장면끼리 `공통점`, `차이점`, `반례`, `해석`, `결론`을 메모.
- 보드 내보내기: **Markdown 기본**, JSON 추가.

### 2.5 비교(Compare)
- 2~4개 장면 또는 작품을 선택.
- 비교 행: 색채, 조명, 미장센, 구도, 동작, 시각적 서사, 제작 방법, 확인 출처, 연구 메모.
- 같은 장면에서도 서로 다른 해석을 허용.
- 자동 작성 AI 요약이 없다면 `사용자 수기 비교`로 시작. 허위 AI 분석 기능을 붙이지 말 것.

---

## 3. 공통 연구 분류 체계(Taxonomy)

### 3.1 3대 연구 관점

| 관점 | 하위 요소 | 분석할 질문 |
|---|---|---|
| **VISUAL / 시각·연출** | Color, Mise-en-scène, Composition, Lighting, Cinematography, Motion, Art Style, Visual Symbol | 어떻게 보이고 움직이며, 관객에게 무엇을 느끼게 하는가? |
| **NARRATIVE / 스토리·세계관** | Story Structure, Character Arc, Conflict, World Rules, Symbol, Emotion Curve, Visual Storytelling | 이야기를 어떻게 구성하고 정보·감정을 전달하는가? |
| **PRODUCTION / 제작·기술** | 2D/3D/Stop-motion/Hybrid, Storyboard, Layout, Rigging, Rendering, Compositing, FX, Sound/Timing | 어떤 제작 방식과 파이프라인이 표현을 가능하게 했는가? |

**개념 주의:** 미장센은 공간·인물 배치·조명·색채 등을 포함하는 포괄 개념이다. 앱에서는 필터 편의상 하위 요소들을 독립 태그로 두되, 상호 배타적인 것으로 다루지 않는다.

### 3.2 통일 태그 초기 세트

| 분류 | 태그 예시 |
|---|---|
| 감정 | 고독, 불안, 경이, 자유, 슬픔, 희망, 긴장, 안정, 성장, 유대 |
| 색채 | 웜톤, 쿨톤, 고채도, 저채도, 보색 대비, 단색 중심, 색온도 변화, 컬러 스크립트 |
| 공간·미장센 | 네거티브 스페이스, 거대 스케일, 폐쇄 공간, 자연, 도시, 반복 소품, 대칭, 시각적 상징 |
| 구도·카메라 | 와이드숏, 클로즈업, 로우앵글, 하이앵글, 중앙 구도, 레이어드 뎁스, 카메라 이동 |
| 모션 | 온 투즈(on twos), 과장 동작, 정지/휴지, 스미어, 속도선, 무게감, 리듬 변화 |
| 서사 | 성장 서사, 정체성, 가족, 소속감, 관계 변화, 세계 규칙, 메타포, 변신, 반복·변주 |
| 기술 | 2D 드로잉, 3D CG, 하이브리드, 할프톤, 해칭, 수채화풍, 리깅, 셰이딩, 합성, 시뮬레이션 |

초기 태그는 `tagId`, `nameKo`, `nameEn`, `facet`, `definition`을 갖고, 사용자가 자유 태그를 추가할 수 있어야 한다.

### 3.3 장면 분석 질문 템플릿

**VISUAL**
1. 화면에서 가장 먼저 보이는 요소는 무엇인가? (명도·크기·배치)
2. 지배적인 색상과 색 대비는 무엇인가? 동일 작품 전후 장면과 어떻게 달라지는가?
3. 인물과 배경의 면적·거리·깊이는 어떻게 구성되는가?
4. 조명과 그림자가 정보·감정·상징에 기여하는 방식은?
5. 움직임의 속도/정지/프레임 간격은 감정이나 행동에 어떤 리듬을 만드는가?

**NARRATIVE**
1. 장면 이전에 캐릭터가 원하던 것과 장면 이후 바뀐 것은?
2. 이 장면의 사건·갈등·전환점은?
3. 대사 없이 전달되는 정보는 무엇인가?
4. 반복되는 장소, 소품, 색, 형태가 상징으로 작용하는가?
5. 관객이 세계관 규칙을 어떤 행동이나 결과로 학습하는가?

**PRODUCTION**
1. 실제로 확인 가능한 제작 방식은 무엇인가? 출처는?
2. 그림체/재질/움직임을 만들기 위해 어떤 파이프라인이 쓰였는가?
3. 관찰 가능한 **화면 효과**와 제작사의 **기술적 구현 사실**을 구분했는가?
4. 비슷한 효과를 작은 팀이 재현한다면 어떤 기법을 실험할 수 있는가? (재현안은 가설)

---

## 4. 데이터 설계

### 4.1 핵심 엔터티

```ts
type CategoryId = 'sony' | 'disney' | 'ghibli';
type Lens = 'visual' | 'narrative' | 'production';
type EvidenceType = 'official_primary' | 'secondary' | 'direct_observation' | 'hypothesis';
type VerificationStatus = 'verified' | 'needs_review' | 'unverified';

type Work = {
  id: string; slug: string; categoryId: CategoryId;
  titleKo: string; titleEn: string; releaseYear: number;
  studio: string; director?: string[]; medium?: string[];
  synopsisKo?: string; overviewKo?: string;
  researchKeywords: string[]; lensIds: Lens[];
  officialSourceIds: string[]; coverAssetId?: string | null;
  createdAt: string; updatedAt: string;
};

type Scene = {
  id: string; workId: string; title: string;
  description?: string;
  // 시드 데이터는 처음에 타임코드를 추정하지 않는다.
  startSeconds: number | null; endSeconds: number | null;
  shotDescription?: string; sceneImageAssetId?: string | null;
  externalVideoUrl?: string | null;
  lensIds: Lens[]; tagIds: string[];
  colors: string[]; // 실제 샘플링되었을 때만 HEX 입력
  colorSource?: 'user_sampled' | 'auto_extracted' | null;
  observation?: string; interpretation?: string;
  productionFact?: string; hypothesis?: string; application?: string;
  researchQuestion?: string; sourceIds: string[];
  verificationStatus: VerificationStatus;
  isBookmark: boolean; createdAt: string; updatedAt: string;
};

type ResearchBoard = {
  id: string; title: string; researchQuestion: string;
  categoryIds: CategoryId[]; lensIds: Lens[];
  sceneIds: string[]; workIds: string[];
  commonalities: string; differences: string;
  counterexamples: string; findings: string;
  applications: string; sourceIds: string[];
  createdAt: string; updatedAt: string;
};

type Source = {
  id: string; title: string; url: string;
  publisher: string; accessedAt: string;
  sourceType: 'official_film' | 'official_process' | 'interview' | 'analysis' | 'filmography';
  evidenceType: EvidenceType;
  verificationStatus: VerificationStatus;
  relatedWorkIds: string[];
  notes?: string;
};

type MediaAsset = {
  id: string; kind: 'user_upload' | 'approved_external' | 'placeholder';
  urlOrLocalPath: string; alt: string;
  rightsNote?: string; attribution?: string;
};
```

- 관계: Category 1:N Work, Work 1:N Scene, Scene N:M ResearchBoard, Work/Scene/Board N:M Source, Scene N:M Tag.
- 저장: 초기 버전은 **IndexedDB(권장)** 또는 기존 프로젝트의 데이터베이스를 사용한다. 데이터가 실제로 영속되어야 한다. 브라우저 저장소 방식이면 개인용/기기별 저장 한계를 README에 명시하고 JSON 백업·복원 기능을 제공한다.
- 데이터 시드: **최초 실행 시에만** 초기 자료를 넣는다. 사용자가 삭제/수정한 데이터를 재시작할 때 원상복구하지 말 것.
- 날짜는 ISO 8601, ID는 안정적이고 중복되지 않아야 한다.
- 작성 노트는 사용자가 직접 수정 가능하도록 하고, 분석과 출처를 별개 필드로 유지한다.
- 프론트 코드의 소스 데이터에는 리서치 텍스트를 하드코딩해 반복하지 말고 `data/seed`로 분리한다.

---

# PART A. 3개 카테고리 기초 리서치

> 아래 **[확인된 사실]**은 링크된 공식 스튜디오/배급사 자료 및 명시된 신뢰할 만한 참고자료에 근거한다.  
> **[분석 관점]**은 연구를 시작하기 위한 해석 프레임이며, 스튜디오가 공식적으로 밝힌 제작 의도가 아니다.  
> **[장면 후보]**는 사용자가 직접 작품을 시청해 정확한 프레임·타임코드·영상 출처를 입력해야 한다.

## A1. SONY / SPIDER-VERSE

**카테고리 한 줄:** 만화의 표현 언어를 움직이는 영상으로 확장한 하이브리드 애니메이션과 시각적 리듬 연구.

### 연구 축
- **Visual:** 할프톤(망점), 해칭(평행선 음영), 색면, 강한 윤곽선, 코믹 패널, 프린트 어긋남을 연상시키는 효과, 다이내믹 원근, 속도선.
- **Narrative:** 마일스의 정체성·성장, 멘토 관계, ‘누구나 가면을 쓸 수 있다’는 메시지, 멀티버스가 만들어내는 인물 간 대비.
- **Production:** 3D 기반 작업에 드로잉/선화/스타일라이즈드 렌더링/합성을 결합한 제작. 시각적 효과를 위해 기존 CG 제작 흐름을 조정.

### 확인된 제작 정보
1. Sony Pictures Imageworks는 《Into the Spider-Verse》의 시각 양식이 **코믹북 인쇄 미학**에서 영감을 받았으며, 사실적 재현보다 아티스트의 의도와 디자인을 중시했다고 설명한다. 표정 선화, 손그림 효과, 비사실적 렌더링 등이 제작 과정에 포함됐다. **[S1]**
2. Imageworks는 할프톤·해칭, 강한 그래픽 형태, 선·색의 스타일라이징을 설명하며, 기존의 전통적인 모션 블러·피사계 심도 표현을 다르게 접근한 사례도 소개한다. **[S1]**
3. 《Across the Spider-Verse》 제작 관련 Sony 자료는 Gwen의 세계에서 감정에 반응하는 **수채화 느낌의 배경**, 다른 차원의 그래픽 양식, 공간/캐릭터를 위한 디지털 도구를 설명한다. **[S3]**
4. Sony Pictures Animation은 2018년작 《Into》와 2023년작 《Across》의 영화 개요와 제작진을 공식적으로 게시하고 있다. **[S2], [S4]**

### 작품 카드

#### SONY-01. 스파이더맨: 뉴 유니버스 / Spider-Man: Into the Spider-Verse (2018)
- 제작/배급 계열: Sony Pictures Animation / Sony Pictures; 영상 제작 설명: Sony Pictures Imageworks.
- 감독: Bob Persichetti, Peter Ramsey, Rodney Rothman. **[S2]**
- 공식 개요: 브루클린 청소년 마일스 모랄레스가 스파이더맨이 되는 과정과 여러 차원의 스파이더 히어로를 다루는 이야기. **[S2]**
- **[분석 관점]** 리서치 키워드: 정체성, 비주얼 과장, 시각적 리듬, 성장의 순간, 이미지 안의 정보 밀도, 도시와 그래피티.
- **핵심 연구 질문**: 평면 만화의 속도감과 감정 전달 방식을 입체적 영화 언어로 어떻게 번역하는가?
- 대표 출처: [공식 작품 페이지](https://www.sonypicturesanimation.com/projects/films/spider-man-spider-verse) · [Imageworks 제작 해설](https://www.imageworks.com/node/1371) · [공식 제작진 설명 영상](https://www.youtube.com/watch?v=1Nw_c_CqPso)

#### SONY-02. 스파이더맨: 어크로스 더 유니버스 / Spider-Man: Across the Spider-Verse (2023)
- 감독: Joaquim Dos Santos, Kemp Powers, Justin K. Thompson. **[S4]**
- 공식 개요: 마일스가 다른 차원과 Spider Society를 만나며 갈등을 겪는 이야기. **[S4]**
- **[분석 관점]** 리서치 키워드: 차원별 미술 스타일, Gwen의 감정과 색, 다층적 텍스처, 세계관을 구분하는 아트디렉션.
- **핵심 연구 질문**: 서로 다른 세계를 단순 배경 차이가 아니라 각기 다른 시각적 규칙으로 구별할 수 있는가?
- 대표 출처: [Sony Pictures Animation 공식 작품 페이지](https://www.sonypicturesanimation.com/projects/films/spider-man-spider-verse-sequel) · [Sony 제작자/도구 인터뷰](https://www.sony.com/en/brand/beyondthescreen/acrossthespiderverse/) · [Imageworks 작품과 VFX Breakdown](https://www.imageworks.com/index.php/our-craft/feature-animation/movies/spider-man-across-spider-verse)

### SONY 세부 리서치 트랙
| 트랙 | 분석할 것 | 비교 포인트 | 연구 산출물 |
|---|---|---|---|
| 코믹북 미학 | 망점·해칭·선화·컷 분할 | 전통 CG vs 그림 같은 CG | 그래픽 표현 요소 사전 |
| 색채와 정체성 | 인물·세계별 배색 | Miles vs Gwen, 두 영화 | 장면별 색채 기능 지도 |
| 움직임과 성장 | 동작 리듬, 빠름/느림, 정지 | 성장 전/후 장면 | 모션 연구 노트 |
| 도시 미장센 | 그래피티, 빌딩, 도시 레이어 | 도시가 인물의 심리와 연결되는 방식 | 공간·감정 보드 |
| 제작 기술 | 드로잉 FX, 합성, 렌더링 | 공식 제작 근거가 있는 기법 | 기술 레퍼런스 카드 |

---

## A2. DISNEY ANIMATION

**카테고리 한 줄:** 감정과 이야기의 가독성을 높이는 색채·캐릭터·공간 연출, 그리고 이를 구현하는 제작 파이프라인 연구.

**범위 정의:** `Walt Disney Animation Studios` 영화만 초기 카테고리에 포함. **Pixar Animation Studios는 별도의 스튜디오이므로 초기 데이터에 넣지 않는다.** 추후 사용자 요청 시 Pixar를 4번째 카테고리로 확장한다.

### 연구 축
- **Visual:** 컬러 스크립트, 감정에 따른 배경과 조명, 캐릭터 실루엣, 읽기 쉬운 스테이징, 장소별 시각적 세계.
- **Narrative:** 캐릭터의 욕망/결핍, 관계 변화, 노래나 행동과 전환점의 결합, 공간의 상징적 역할.
- **Production:** 연구·비주얼 디벨롭먼트·스토리보드·레이아웃·룩디벨롭먼트의 연결.

### 확인된 제작 정보
1. Disney Animation 공식 `Visual Development`는 스토리/감독의 비전을 바탕으로 캐릭터와 세계의 형태를 개발하며, **색채·디자인·구도**가 이야기의 테마를 뒷받침한다고 설명한다. **[D1]**
2. 공식 `Story` 설명은 스토리 아티스트가 감정·타이밍·스테이징·프레이밍을 함께 설계함을 보여준다. **[D2]**
3. 공식 `Layout` 설명은 캐릭터·세트·소품·카메라를 활용해 샷을 구성하고, 스토리보드를 3D 공간으로 옮기는 작업을 다룬다. **[D3]**
4. 공식 `Look Development`는 재질·텍스처·색상·표면 등을 만들고, 《Frozen 2》를 예로 제작 단계별 분해 자료를 제공한다. **[D4]**
5. Disney Animation은 문화·역사·예술 등과 관련된 조사, 전문가 협업, 현장 방문이 제작의 참고자료가 된다고 설명한다. **[D5]**

### 작품 카드

#### DISNEY-01. 엔칸토: 마법의 세계 / Encanto (2021)
- 감독: Jared Bush, Byron Howard, Charise Castro Smith. **[D6]**
- 공식 개요: 콜롬비아의 산속 마법의 집에 사는 마드리갈 가족, 특별한 능력을 받지 못한 미라벨, 위기에 놓인 가족의 마법에 관한 이야기. **[D6]**
- **[분석 관점]** 연구 키워드: 집을 인물처럼 활용하는 공간 연출, 가족 관계, 색채를 통한 캐릭터 구분, 실내 미장센.
- 연구 질문: 움직이는 집이라는 공간을 가족의 이야기와 감정을 드러내는 시각적 장치로 어떻게 활용하는가?
- 출처: [공식 작품 페이지](https://www.disneyanimation.com/films/encanto/) · [Visual Development](https://www.disneyanimation.com/process/visual-development/)

#### DISNEY-02. 겨울왕국 2 / Frozen 2 (2019)
- 감독: Chris Buck, Jennifer Lee. **[D7]**
- 공식 개요: 엘사가 자신의 능력과 과거에 관한 진실을 찾아 아렌델 밖의 숲·바다로 향한다. **[D7]**
- **[분석 관점]** 연구 키워드: 안개·바람·물·숲이라는 환경 요소, 조명과 자연 현상, 미지의 공간, 룩디벨롭먼트.
- 연구 질문: 환경이 단순 배경을 넘어 인물의 내면과 도전 과제를 표현하는 방식은?
- 출처: [공식 작품 페이지](https://www.disneyanimation.com/films/frozen-2/) · [공식 룩디벨롭먼트](https://www.disneyanimation.com/process/look-development/)

#### DISNEY-03. 모아나 / Moana (2016)
- 감독: Ron Clements, John Musker, Don Hall, Chris Williams. **[D8]**
- 공식 개요: 항해자가 되고자 하는 모아나가 바다를 건너 여정을 수행하며 자신의 정체성을 찾아가는 이야기. **[D8]**
- **[분석 관점]** 연구 키워드: 바다와 인물의 관계, 수면·반사·빛, 넓은 스케일, 바다를 통한 여정의 구체화.
- 연구 질문: 대규모 자연 환경은 캐릭터의 목표와 감정 변화를 어떻게 전달하는가?
- 출처: [공식 작품 페이지](https://www.disneyanimation.com/films/moana/) · [Visual Development](https://www.disneyanimation.com/process/visual-development/)

#### DISNEY-04. 주토피아 / Zootopia (2016)
- 감독: Byron Howard, Rich Moore, Jared Bush. **[D9]**
- 공식 개요: 다양한 동물의 거주 공간으로 이루어진 도시에서 주디 홉스가 사건을 해결해 가는 이야기. **[D9]**
- **[분석 관점]** 연구 키워드: 사회 구조가 시각화된 도시, 환경별 미술 설정, 크기/비례, 종별 행동 디자인, 세계관 정보 전달.
- 연구 질문: 도시 구획·건축·동선이 세계관 규칙을 대사 없이 어떻게 설명하는가?
- 출처: [공식 작품 페이지](https://www.disneyanimation.com/films/zootopia/) · [Visual Development](https://www.disneyanimation.com/process/visual-development/)

### DISNEY 세부 리서치 트랙
| 트랙 | 분석할 것 | 비교 포인트 | 연구 산출물 |
|---|---|---|---|
| 컬러 스크립트 | 시간에 따른 색 온도·명도 변화 | Encanto / Frozen 2 | 사건-색채 타임라인 |
| 캐릭터 감정 | 얼굴·몸짓·실루엣·거리 | Mirabel / Elsa / Moana | 행동/감정 표현 카드 |
| 공간을 통한 서사 | 집·숲·바다·도시의 역할 | 4개 작품의 장소 | 공간 기능 비교표 |
| 스토리보드와 레이아웃 | 스테이징·시선·블로킹 | 전환점 장면 | 샷 구조 메모 |
| 룩디벨롭먼트 | 질감·재질·광원·모델 | Frozen 2 중심 | 공식 공정 참조 지도 |

---

## A3. STUDIO GHIBLI

**카테고리 한 줄:** 배경 미술과 일상의 공간, 자연의 존재감, 여백과 정지, 손그림 스타일 및 이야기 속 상징을 연구.

**주의:** ‘지브리의 모든 작품은 같은 수채화 기법’처럼 일반화하지 않는다. **작품과 감독에 따라 표현이 다르며**, 특히 《가구야 공주 이야기》의 드로잉 표현은 별도로 분석한다.

### 연구 축
- **Visual:** 배경·자연·날씨·건축·생활 소품, 화면의 밀도와 비어 있는 부분, 인물·장소의 대비, 수작업적인 선/색.
- **Narrative:** 공간을 통과하며 성장하는 인물, 현실과 환상의 경계, 자연과 인간, 일상의 반복, 사물과 장소의 상징.
- **Production:** 스토리보드, 배경 미술, 드로잉, 캐릭터 연기, 작품별 작화 방식과 소재.

### 확인된 자료
1. Studio Ghibli 공식 작품 목록은 개별 작품의 개봉 연도·감독 등 기본 정보를 제공하고, 여러 작품에 **공식 스틸컷 페이지**를 제공한다. **[G1]**
2. 《센과 치히로의 행방불명》은 2001년, 《이웃집 토토로》는 1988년, 《원령공주》는 1997년, 《하울의 움직이는 성》은 2004년, 《가구야 공주 이야기》는 2013년 작품이다. 감독 등 세부 정보는 각 공식 페이지 참조. **[G2]~[G6]**
3. 영국영화협회(BFI)의 《가구야 공주 이야기》 분석 자료는 배경의 수채화 느낌·거친 선화·완성되지 않은 듯한 여백의 효과를 설명한다. **공식 스튜디오 제작 발표가 아닌 외부 분석 자료임을 표시. [G7]**
4. 도쿄도 공식 소개 자료는 지브리 미술관의 배경 미술·스토리보드 전시 및 전통 셀 애니메이션 공정을 설명한다. 작품별 정확한 제작 방식과 동일시하지 않는다. **[G8]**

### 작품 카드

#### GHIBLI-01. 센과 치히로의 행방불명 / Spirited Away (2001)
- 감독: 미야자키 하야오. **[G2]**
- **[분석 관점]** 연구 키워드: 목욕탕이라는 세계, 통로/문턱, 이름과 정체성, 먹거리·노동·계약, 열차와 여백.
- 연구 질문: 공간을 이동하는 과정만으로 낯선 세계의 질서와 주인공의 변화를 어떻게 보여주는가?
- 출처: [지브리 공식 작품 페이지](https://www.ghibli.jp/works/chihiro/)

#### GHIBLI-02. 이웃집 토토로 / My Neighbor Totoro (1988)
- 감독: 미야자키 하야오. **[G3]**
- **[분석 관점]** 연구 키워드: 시골집·숲·비·바람, 일상과 환상의 경계, 기다림, 소리 없는 교감, 자연의 스케일.
- 연구 질문: 큰 사건 없이도 공간과 움직임의 관찰만으로 몰입과 감정을 형성할 수 있을까?
- 출처: [지브리 공식 작품 페이지](https://www.ghibli.jp/works/totoro/)

#### GHIBLI-03. 원령공주 / Princess Mononoke (1997)
- 감독: 미야자키 하야오. **[G4]**
- **[분석 관점]** 연구 키워드: 숲과 제철소의 대비, 자연/산업의 질감, 인간과 비인간의 공존·충돌, 도덕적 복합성.
- 연구 질문: 공간의 밀도와 재질 대비가 갈등 구조를 어떻게 시각적으로 형성하는가?
- 출처: [지브리 공식 작품 페이지](https://www.ghibli.jp/works/mononoke/)

#### GHIBLI-04. 하울의 움직이는 성 / Howl's Moving Castle (2004)
- 감독: 미야자키 하야오. 원작: Diana Wynne Jones. **[G5]**
- **[분석 관점]** 연구 키워드: 움직이는 건축, 문과 공간 전환, 외형/내면의 관계, 소피의 변화, 기계와 생활 공간.
- 연구 질문: 건축물 자체에 성격과 움직임을 부여하면 세계관과 관계성이 어떻게 전달되는가?
- 출처: [지브리 공식 작품 페이지](https://www.ghibli.jp/works/howl/)

#### GHIBLI-05. 가구야 공주 이야기 / The Tale of the Princess Kaguya (2013)
- 감독: 다카하타 이사오. **[G6]**
- **[분석 관점]** 연구 키워드: 드로잉 선의 속도, 지워진 듯한 공간, 수채화 같은 미감, 감정 격화에 따른 선의 변화, 전통 설화.
- 연구 질문: 마무리되지 않은 듯한 선과 색의 생략은 감정의 즉시성을 높일 수 있는가?
- 출처: [지브리 공식 작품 페이지](https://www.ghibli.jp/works/kaguyahime/) · [BFI 분석 노트](https://bfidatadigipres.github.io/anime/2022/05/03/tale-of-the-princess-kaguya/)

### GHIBLI 세부 리서치 트랙
| 트랙 | 분석할 것 | 비교 포인트 | 연구 산출물 |
|---|---|---|---|
| 배경 미술·공간 | 집·목욕탕·숲·성·궁전 | 5개 작품의 대표 장소 | 공간의 서사적 기능 맵 |
| 자연과 스케일 | 인간과 자연의 크기 차 | Totoro vs Mononoke | 자연 표현 비교 보드 |
| 여백과 정지 | 화면의 비어 있음, 정지, 기다림 | Spirited Away vs Totoro | 느림의 감정 전달 노트 |
| 상징과 세계관 | 문, 이름, 장소, 반복되는 사물 | Spirited Away / Howl | 세계관 규칙 사전 |
| 선·수작업 스타일 | 밀도·드로잉선·번짐 | Kaguya vs 기타 작품 | 작화 표현 비교표 |

---

# PART B. 장면 리서치 카드 — 초기 등록 후보

> **중요:** 다음 표는 연구자가 실제 작품을 보며 **찾아보고 저장할 장면 후보**다. 특정 타임코드나 프레임의 세부 해석을 이미 검증한 것으로 취급하지 않는다.  
> 시드로 등록할 때 `startSeconds = null`, `endSeconds = null`, `verificationStatus = needs_review`, `colors = []`, `sceneImageAssetId = null`로 시작한다.  
> `분석 포인트`는 관찰해야 할 질문/검증할 가설이지 공식 제작 의도가 아니다.

## B1. SONY — 7개 장면 후보

| ID | 작품 | 장면을 찾아볼 키워드 | 주요 분석 렌즈 | 관찰/질문 |
|---|---|---|---|---|
| S-S01 | Into | 마일스의 도시 일상, 그래피티 | Visual + Narrative | 도시의 색과 낙서는 인물의 정체성을 어떻게 드러내는가? |
| S-S02 | Into | 스파이더 능력에 적응하는 장면 | Motion + Narrative | 서툰 움직임과 능숙한 움직임을 어떤 리듬·포즈로 구분하는가? |
| S-S03 | Into | Leap of Faith / 도약 | Composition + Color + Narrative | 신체 방향과 카메라 앵글이 성장의 순간을 어떻게 강화하는가? |
| S-S04 | Into | 차원 충돌·글리치 | Visual + Production | 인쇄/합성 스타일과 차원 이상을 어떻게 시각적으로 구별하는가? |
| S-S05 | Across | 그웬의 세계·가족 대화 | Color + Narrative | 색과 배경의 변화가 감정과 연결되는가? 공식 자료[S3]와 비교해 본다. |
| S-S06 | Across | Spider-Punk의 첫 등장/액션 | Art Style + Motion | 콜라주 같은 표현을 캐릭터의 정체성과 어떻게 연결할 수 있는가? |
| S-S07 | Across | 서로 다른 차원 탐색·추격 | Worldbuilding + Production | 공간마다 다른 시각 규칙을 관객이 어떻게 학습하는가? |

## B2. DISNEY — 12개 장면 후보

| ID | 작품 | 장면을 찾아볼 키워드 | 주요 분석 렌즈 | 관찰/질문 |
|---|---|---|---|---|
| S-D01 | Encanto | 카시타(집)의 첫 등장/움직임 | Mise-en-scène + World | 건축과 소품의 움직임으로 공간의 성격을 설명하는가? |
| S-D02 | Encanto | 미라벨의 가족 소개 | Color + Narrative | 캐릭터별 색·의상·공간 배치가 관계를 어떻게 드러내는가? |
| S-D03 | Encanto | 가족 갈등 또는 회복의 장면 | Lighting + Emotion | 공간과 조명이 관계 변화와 함께 달라지는가? |
| S-D04 | Frozen 2 | 마법의 숲 진입 | Space + Lighting | 안개/깊이/색 대비로 미지의 공간을 어떻게 표현하는가? |
| S-D05 | Frozen 2 | 엘사의 거친 바다 여정 | Motion + FX | 물·파도·캐릭터의 무게감이 도전의 강도를 어떻게 전달하는가? |
| S-D06 | Frozen 2 | 변화의 진실을 마주하는 장면 | Color + Narrative | 전후 장면의 조명·색·구도가 어떻게 변하는가? |
| S-D07 | Moana | 섬에서 바다를 바라보는 순간 | Composition + Narrative | 지평선과 인물 크기가 목표와 갈망을 어떻게 암시하는가? |
| S-D08 | Moana | 첫 항해·항해의 어려움 | Motion + Production | 물 표면과 배의 움직임을 어떤 시각 요소로 읽는가? |
| S-D09 | Moana | 바다/섬/길 찾기의 시각적 단서 | Worldbuilding + Color | 세계의 공간 규칙을 어떻게 학습시키는가? |
| S-D10 | Zootopia | 도시의 첫 소개 | Mise-en-scène + World | 건축·교통·공간 구획으로 동물의 다양한 신체를 어떻게 표현하는가? |
| S-D11 | Zootopia | 지역·기후별 도시 공간 | Art Direction + Lighting | 각 구역의 색채·재질·크기 설계 차이는? |
| S-D12 | Zootopia | 주디와 닉의 대화/갈등 | Staging + Narrative | 인물의 높이·거리·배치가 관계 변화에 기여하는가? |

## B3. GHIBLI — 15개 장면 후보

| ID | 작품 | 장면을 찾아볼 키워드 | 주요 분석 렌즈 | 관찰/질문 |
|---|---|---|---|---|
| S-G01 | Spirited Away | 목욕탕 첫 진입 | Mise-en-scène + World | 건물의 깊이, 복잡성, 크기가 낯섦을 어떻게 만드는가? |
| S-G02 | Spirited Away | 기차가 물 위를 지나는 시퀀스 | Color + Space + Emotion | 정지/여백/반복되는 풍경이 분위기에 미치는 영향은? |
| S-G03 | Spirited Away | 치히로의 일과 성장 | Character Arc + Symbol | 공간 이용 방식·몸짓에 어떤 변화가 생기는가? |
| S-G04 | Totoro | 시골집과 주변 자연 소개 | Environment + World | 일상의 소품·빛·바람으로 생활감을 어떻게 만드는가? |
| S-G05 | Totoro | 비 오는 버스 정류장 | Lighting + Motion + Emotion | 기다림과 작은 움직임이 어떻게 캐릭터 관계를 보여주는가? |
| S-G06 | Totoro | 숲속 존재와의 조우 | Scale + Narrative | 자연과 인물의 크기·시점 차이를 어떻게 이용하는가? |
| S-G07 | Princess Mononoke | 숲과 신성한 존재의 등장 | Color + Space + World | 생명감과 긴장을 어떤 배경 밀도·움직임으로 표현하는가? |
| S-G08 | Princess Mononoke | 제철소의 일상과 노동 | Mise-en-scène + Narrative | 장소·도구·행동으로 집단의 생활 규칙을 보여주는가? |
| S-G09 | Princess Mononoke | 숲과 산업의 대치 | Composition + Conflict | 자연과 인간의 시각적 대비가 갈등을 어떻게 구조화하는가? |
| S-G10 | Howl | 움직이는 성의 외관/이동 | Art Style + Production | 건축물에 동물적인 움직임이 느껴지는 이유는? |
| S-G11 | Howl | 문을 통과하며 공간이 바뀌는 순간 | World Rules + Editing | 전환 장치가 세계관을 얼마나 효율적으로 설명하는가? |
| S-G12 | Howl | 소피의 집안일/생활공간 | Character + Space | 공간을 다루는 행동이 성격의 변화를 드러내는가? |
| S-G13 | Kaguya | 어린 시절 자연 속 놀이 | Motion + Art Style | 선·색의 가벼움이 움직임의 감각을 어떻게 만드는가? |
| S-G14 | Kaguya | 궁중 생활의 정적 장면 | Composition + Narrative | 화면의 여백과 반복되는 예식이 감정을 어떻게 전달하는가? |
| S-G15 | Kaguya | 감정이 폭발하는 질주 장면 | Line + Motion + Emotion | 선의 거칠기와 화면 밀도 변화가 감정의 강도와 함께 변하는가? |

**총 초기 등록:** 11개 작품(SONY 2 / DISNEY 4 / GHIBLI 5), 장면 분석 후보 34개(7 / 12 / 15), 출처 라이브러리. 장면 후보는 연구용 프롬프트이므로 타임코드/이미지/색값은 비워 둔다.

---

# PART C. 예시 연구 보드 9개

> 초기 상태 `템플릿/검토 필요`로 제공. 실제 연구 결론인 듯 자동 입력하지 않는다.

| 보드 ID | 보드 이름 | 포함 카테고리 | 비교할 장면 예시 | 핵심 연구 질문 | 산출물 |
|---|---|---|---|---|---|
| B01 | 색으로 표현하는 감정 | Sony / Disney / Ghibli | S-S05, S-D03, S-G02 | 감정은 단색, 대비, 장면 간 변화 중 무엇으로 전달되는가? | 감정별 색채 비교표 |
| B02 | 고독을 만드는 미장센 | 전 카테고리 | S-S03, S-D07, S-G02 | 인물의 크기·여백·지평선이 고독/자유를 어떻게 구분하는가? | 구도 비교 보드 |
| B03 | 공간이 캐릭터가 될 때 | Disney / Ghibli | S-D01, S-G10, S-G01 | 움직이는 집과 세계관의 건축은 어떤 역할을 하는가? | 공간-행동 맵 |
| B04 | 성장의 순간을 촬영하는 방법 | Sony / Disney / Ghibli | S-S03, S-D06, S-G03 | 인물의 선택은 카메라와 움직임으로 어떻게 강화되는가? | 전환점 샷 분석 |
| B05 | 느림과 정지의 연출 | Sony / Ghibli | S-S02, S-G02, S-G05 | 정적 리듬은 긴장/사색/유대에 어떻게 작동하는가? | 타이밍 관찰 노트 |
| B06 | 서로 다른 세계의 시각 규칙 | Sony / Disney / Ghibli | S-S07, S-D10, S-G11 | 배경을 보자마자 어떤 세계인지 알게 하는 요소는? | 세계 규칙 지도 |
| B07 | 자연의 움직임과 물성 | Disney / Ghibli | S-D05, S-D08, S-G07 | 물·바람·숲의 움직임은 이야기에 어떤 의미를 더하는가? | 자연 모션 비교 |
| B08 | 2D와 3D 사이의 표현 | Sony / Ghibli / Disney | S-S04, S-G15, S-D11 | 서로 다른 제작 방식으로 질감·선·명암을 어떻게 다루는가? | 제작기법 연구표 |
| B09 | 소품과 상징의 언어 | 전 카테고리 | S-S01, S-D02, S-G11 | 소품/장소가 캐릭터의 정체성·관계를 전달하는 방식은? | 시각적 상징 카드 |

**초기 연구 보드 상세 템플릿**

```md
# [보드명]

## Research Question
[하나의 검증 가능한 질문]

## Scope
- 비교 카테고리:
- 비교 작품:
- 연구 기간:

## Evidence — 직접 확인한 장면
| 작품 | 장면/타임코드 | 관찰 사실 | 이미지·영상 출처 |
|---|---|---|---|
| ... | ... | ... | ... |

## Comparative Analysis
- 공통 패턴:
- 작품별 차이:
- 예외/반례:

## Interpretation
[왜 그렇게 보이는가? 복수 해석 가능]

## Production Facts
[공식 제작 근거가 확인된 경우에만 기입하고 URL 명시]

## Hypothesis
[추후 다른 작품·장면으로 검증 가능한 가설]

## Insight
[1~2문장 요약]

## Application
[새 작품 제작에 적용할 연출 실험]

## Sources
- [출처명](URL)
```

---

# PART D. 인터랙션 상세 명세

## D1. 신규 장면 추가
1. `+ 장면 추가` 클릭.
2. 연결할 **카테고리 및 작품** 선택. 새 작품 추가도 가능.
3. 제목/장면 설명 입력. 타임코드는 선택값.
4. 스틸컷: 파일 업로드(사용자의 권리 확인 안내) 또는 이미지 없이 계속.
5. 태그 다중 선택 + `Visual / Narrative / Production` 체크.
6. `직접 관찰`, `내 해석`, `공식 제작 사실`, `가설`, `창작 적용` 개별 입력.
7. 출처 URL 추가, 검증 상태 지정 후 저장.
8. 저장 후 `Scene Library`에서 즉시 보이고 새로고침 후에도 유지.

## D2. 장면 카드
- 플레이스홀더 또는 사용자가 등록한 미디어 썸네일.
- 작품명, 카테고리, 장면 제목, 태그 최대 3개 + 더보기, 검증 상태 표시.
- 클릭 시 분석 상세.
- 카드에서 북마크, 보드에 추가, 비교함에 담기를 할 수 있음.

## D3. 컬러 팔레트
- 사용자가 직접 업로드한 장면 이미지 또는 적법하게 사용 가능한 로컬 파일에서만 브라우저 Canvas 기반 간단한 색상 추출(후속 구현 가능).
- `Top 5` 대표색·HEX·복사 기능 제공.
- **이미지의 진짜 컬러 스크립트라는 식으로 표현하지 말 것**. `선택한 프레임의 샘플 팔레트`로 명명.
- 구현이 불가하면 수동 HEX 입력을 구현하고 자동 추출은 `Coming later` 처리.

## D4. 구성 분석 오버레이(2차)
- 사용자 등록 이미지 위에 `삼분할`, `중앙선`, `대각선` 가이드를 토글.
- 가이드는 분석 보조도구이며 자동으로 ‘좋은 구도’를 판정하지 않는다.

## D5. 통합 검색 시나리오
- `지브리 + 여백 + 고독` → 관련 장면 후보/메모 검색.
- `디즈니 + 공간 + 세계관` → Encanto/Zootopia 등 관련 장면.
- `소니 + 코믹북 + 합성` → Spider-Verse 공식 제작 소스.
- `외로움` → 3개 카테고리에 걸친 장면/보드/인사이트 동시 검색.
- 검색 결과가 없으면 `관련 태그 보기`·`새 장면 추가` 제공. 결과 조작 금지.

## D6. 출처 검증
- 출처 클릭 시 새 탭 열기.
- 출처의 종류·발행 기관·확인일·연결된 작품/장면 표시.
- **공식 확인**과 **연구자 가설**에 명확히 다른 스타일/레이블 사용.
- `확인 전` 자료는 필터링 가능하고 UI에 표시.
- 출처 URL이 접근 불가할 수 있으므로 원문 제목과 대체 검색 힌트도 유지.

## D7. 내보내기/백업
- 연구 보드별 Markdown 다운로드.
- 전체 작품/장면/보드/출처 JSON 백업 및 복원(충돌 시 확인).
- CSV 내보내기는 추후 확장.

---

# PART E. UI/UX 디자인 시스템

## E1. 디자인 키워드
- **Research Library × Film Contact Sheet × Editorial Archive**
- 컬러풀한 작품 스틸컷을 담을 수 있도록 **UI 자체는 중립적이고 차분하게** 디자인.
- 추천: `Warm off-white / Charcoal / Neutral gray` 중심. 카테고리 칩에만 차분한 차별색 허용.
- 복잡한 관리 페이지보다 큼직한 썸네일, 정돈된 서체, 넉넉한 여백.
- 기존 장면 이미지가 없는 경우 저작권 문제가 없는 **CSS 기반 추상 플레이스홀더**를 사용.

## E2. 시각적 위계
1. 가장 먼저 **연구 질문**을 읽을 수 있게 한다.
2. 작품/장면 이미지는 감상을 돕고, 텍스트/분석/출처는 항상 접근 가능하게 한다.
3. 색채의 감정적 해석은 자동 사실처럼 단정하지 않는다.
4. 장면 카드는 `카테고리 → 작품 → 장면 → 태그` 위계 유지.

## E3. 반응형
- Desktop(>=1024): 고정 사이드바 + 3~4열 그리드 + 상세 패널.
- Tablet: 사이드바 접기 + 2열 그리드.
- Mobile: 하단 탐색 또는 메뉴 버튼 + 1열 카드 + 필터 시트.
- 키보드 포커스, 이미지 alt, 명확한 레이블, 적절한 색 대비.
- 애니메이션 전환 효과는 가볍게; `prefers-reduced-motion` 존중.

## E4. 화면별 필수 컴포넌트
`AppShell`, `CategoryTabs`, `GlobalSearch`, `FilterPanel`, `WorkCard`, `SceneCard`, `SceneEditor`, `AnalysisTabs`, `SourceBadge`, `TagChip`, `ResearchBoardCard`, `ComparisonGrid`, `EmptyState`, `ExportMenu`, `ConfirmationDialog`.

---

# PART F. 공식·신뢰 출처 목록 (시드 Source Library)

> 열람 기준일: **2026-11-15**. URL은 연구의 시작점으로 저장. 영화의 장면별 타임코드나 RGB는 이 출처들만으로 확인할 수 없으므로 생성하지 않는다.

### Sony
- **[S1]** Sony Pictures Imageworks — *Spider-Man: Into the Spider-Verse* (시각 언어·드로잉 FX·렌더링·합성)  
  https://www.imageworks.com/node/1371  
  `official_process · official_primary · verified`
- **[S2]** Sony Pictures Animation — *Spider-Man: Into the Spider-Verse* (작품 개요·감독)  
  https://www.sonypicturesanimation.com/projects/films/spider-man-spider-verse  
  `official_film · official_primary · verified`
- **[S3]** Sony Group — *Beyond the Screen: Creators Behind Across the Spider-Verse* (Gwen의 수채화풍 세계, 제작 도구)  
  https://www.sony.com/en/brand/beyondthescreen/acrossthespiderverse/  
  `official_process · official_primary · verified`
- **[S4]** Sony Pictures Animation — *Spider-Man: Across the Spider-Verse* (작품 개요·감독)  
  https://www.sonypicturesanimation.com/projects/films/spider-man-spider-verse-sequel  
  `official_film · official_primary · verified`
- **[S5]** Sony Pictures Imageworks — *Across the Spider-Verse* (작품 관련 스틸·제작 해설 영상)  
  https://www.imageworks.com/index.php/our-craft/feature-animation/movies/spider-man-across-spider-verse  
  `official_process · official_primary · verified`
- **[S6]** Sony Pictures Animation YouTube — *Telling a Story in Every Frame* (제작진의 프레임·연출 설명)  
  https://www.youtube.com/watch?v=1Nw_c_CqPso  
  `official_process · official_primary · verified`
- **[S7]** Foundry — *How Sony Pictures Imageworks created Spider-Verse’s graphic look* (Nuke 합성 파이프라인 설명; 소프트웨어 제작사 자료)  
  https://www.foundry.com/insights/film-tv/graphic-look-in-comp-spiderman  
  `analysis · secondary · verified`

### Disney Animation
- **[D1]** Walt Disney Animation Studios — *Visual Development*  
  https://www.disneyanimation.com/process/visual-development/  
  `official_process · official_primary · verified`
- **[D2]** Walt Disney Animation Studios — *Story*  
  https://www.disneyanimation.com/process/story/  
  `official_process · official_primary · verified`
- **[D3]** Walt Disney Animation Studios — *Layout & Final Layout*  
  https://www.disneyanimation.com/process/layout/  
  `official_process · official_primary · verified`
- **[D4]** Walt Disney Animation Studios — *Look Development*  
  https://www.disneyanimation.com/process/look-development/  
  `official_process · official_primary · verified`
- **[D5]** Walt Disney Animation Studios — *Creative Development / Research*  
  https://www.disneyanimation.com/process/creative-development/  
  `official_process · official_primary · verified`
- **[D6]** Walt Disney Animation Studios — *Encanto*  
  https://www.disneyanimation.com/films/encanto/  
  `official_film · official_primary · verified`
- **[D7]** Walt Disney Animation Studios — *Frozen 2*  
  https://www.disneyanimation.com/films/frozen-2/  
  `official_film · official_primary · verified`
- **[D8]** Walt Disney Animation Studios — *Moana*  
  https://www.disneyanimation.com/films/moana/  
  `official_film · official_primary · verified`
- **[D9]** Walt Disney Animation Studios — *Zootopia*  
  https://www.disneyanimation.com/films/zootopia/  
  `official_film · official_primary · verified`
- **[D10]** Walt Disney Animation Studios — *Feature Films 목록*  
  https://www.disneyanimation.com/films/  
  `filmography · official_primary · verified`

### Studio Ghibli
- **[G1]** Studio Ghibli — *공식 작품 목록*  
  https://www.ghibli.jp/works/  
  `filmography · official_primary · verified`
- **[G2]** Studio Ghibli — *Spirited Away / 千と千尋の神隠し*  
  https://www.ghibli.jp/works/chihiro/  
  `official_film · official_primary · verified`
- **[G3]** Studio Ghibli — *My Neighbor Totoro / となりのトトロ*  
  https://www.ghibli.jp/works/totoro/  
  `official_film · official_primary · verified`
- **[G4]** Studio Ghibli — *Princess Mononoke / もののけ姫*  
  https://www.ghibli.jp/works/mononoke/  
  `official_film · official_primary · verified`
- **[G5]** Studio Ghibli — *Howl’s Moving Castle / ハウルの動く城*  
  https://www.ghibli.jp/works/howl/  
  `official_film · official_primary · verified`
- **[G6]** Studio Ghibli — *The Tale of the Princess Kaguya / かぐや姫の物語*  
  https://www.ghibli.jp/works/kaguyahime/  
  `official_film · official_primary · verified`
- **[G7]** British Film Institute 참고자료 — *The Tale of The Princess Kaguya: Programme Notes*  
  https://bfidatadigipres.github.io/anime/2022/05/03/tale-of-the-princess-kaguya/  
  `analysis · secondary · verified`
- **[G8]** Tokyo Metropolitan Government — *Ghibli Museum 소개 및 배경 미술·스토리보드*  
  https://www.tokyoupdates.metro.tokyo.lg.jp/en/post-842/  
  `analysis · secondary · verified`

### 출처 표기 규칙
- 앱에서 제작기술을 특정 장면에 연결할 때 **영화 전체에 관한 공식 공정 설명과 해당 장면에 적용됐다는 증거를 구분**한다.
- `verified`는 **링크에 해당 정보가 실재함을 확인했다는 의미**이지, 연구자의 해석이 옳다는 보증이 아니다.
- 작품 해설/보도·비평은 공식 제작진 발언과 같은 근거 수준이 아니다.
- URL을 UI에서 클릭 가능하게 하고 제목/기관/유형 표시.

---

# PART G. 구현 순서 / 개발 단계

## Phase 1 — 반드시 완성할 MVP

### Sprint 1. 앱 기초
- [ ] 프로젝트 구조와 공통 레이아웃/디자인 토큰/타입 정의
- [ ] 기본 라우팅: Home / Explore / Works / Scenes / Boards / Compare / Sources
- [ ] 3개 카테고리 탭과 3개 연구 관점 토글
- [ ] 한국어 UI, 영어/한국어 동시 제목 검색

### Sprint 2. 실제 데이터 모델
- [ ] 위 **11개 작품 + 34개 장면 후보 + 9개 보드 + 출처** 시드 데이터 생성
- [ ] Work/Scene/Board/Source 간 참조와 필터 기능
- [ ] 기본 CRUD + 영속 저장 + 처음 한 번만 시드 적용
- [ ] 사용자 태그 생성·수정

### Sprint 3. 리서치 기능
- [ ] 장면 분석 5개 구분 필드(관찰/해석/사실/가설/적용)
- [ ] 다중 필터와 검색(동작하는 결과)
- [ ] 장면 → 보드에 추가 및 2~4개 비교
- [ ] 출처 및 검증 상태 표시

### Sprint 4. 실사용 마무리
- [ ] Markdown 보드 내보내기
- [ ] JSON 백업/복원
- [ ] 모바일 레이아웃 + 빈 상태 + 수정/삭제 확인 모달
- [ ] 빌드·타입·핵심 테스트 확인, README 정리

## Phase 2 — 확장 기능
- [ ] 사용자가 업로드한 이미지에서만 팔레트 자동 추출
- [ ] 구도 보조 그리드 오버레이
- [ ] 연구 보드 내 장면 드래그 정렬
- [ ] 작품별 색채 타임라인(사용자가 수집한 프레임에 한함)

## Phase 3 — 실험 기능(명시적 후순위)
- [ ] 영상 프레임 탐색 및 타임코드 편집기(이용권/저작권 준수)
- [ ] 의미 기반 연구 메모 검색, 유사 장면 추천
- [ ] AI 분석 보조: 실제 연결된 모델 API와 사용자 동의가 있을 때만
- [ ] 개인/그룹 협업 및 클라우드 동기화

---

# PART H. 수용 기준(Acceptance Criteria)

### 기능
1. 홈에서 3개 카테고리 탭을 선택할 수 있고, **해당 작품만 표시**된다.
2. `sony / disney / ghibli`의 작품 수가 초기 상태에서 각각 **2 / 4 / 5**개다.
3. 장면 후보가 각각 **7 / 12 / 15**개 보이고, 모두 타임코드와 이미지가 비어 있을 때 거짓 정보를 보여주지 않는다.
4. `고독`, `미장센`, `세계관`, `합성` 등 한글 키워드 검색과 영어 작품명 검색이 된다.
5. `카테고리=ghibli AND 태그=공간`처럼 다중 필터가 작동한다.
6. 사용자가 장면 하나를 신규 생성하고 메모 수정 후 새로고침해도 보존된다.
7. 사용자가 보드 하나를 만들고 복수 장면을 연결하여 다시 접속해도 보존된다.
8. 2개 이상 장면을 선택해 비교하면 같은 기준의 항목이 나란히 보인다.
9. 공식 출처 URL을 클릭하면 원문이 열린다. 근거 수준 레이블도 보인다.
10. 연구 보드를 Markdown으로 내려받고 전체 데이터를 JSON으로 백업/복원할 수 있다.

### 데이터·윤리
11. **임의 영화 프레임 이미지를 생성하거나 무단 다운로드하여 시드에 쓰지 않는다.**
12. 공식 문서에 없는 제작 의도를 `확인된 사실`로 저장하지 않는다.
13. 분석 가설/장면 후보는 사용자가 직접 검증해 상태를 변경할 수 있다.
14. 사용자가 직접 변경한 데이터가 업데이트·새로고침으로 덮어써지지 않는다.

### 기술·품질
15. 타입 검사와 프로덕션 빌드가 통과한다.
16. 모바일 화면에서도 메뉴, 필터, 장면 추가, 보드 편집, 비교가 사용 가능하다.
17. 폼에는 적절한 라벨·오류 메시지·저장 완료 피드백이 있다.
18. 실제 적용하지 않은 기능을 동작하는 것처럼 보이게 하는 장식용 버튼이 없다.

---

## 6. 초기 사용 시나리오 (실제 QA에 활용)

### 시나리오 A — 연출 연구자
1. 홈에서 `Studio Ghibli` 선택 → `Spirited Away` 작품 상세.
2. `기차가 물 위를 지나는 시퀀스` 장면 후보 열기.
3. 실제 관람 후 타임코드 입력, 직접 관찰과 해석을 각각 기록.
4. `고독을 만드는 미장센` 보드에 추가.
5. `Sony / Spider-Verse`에서 다른 공간·구도 사례 추가 후 비교.
6. 근거와 가설을 구분해 Markdown 연구 기록으로 저장.

### 시나리오 B — 애니메이션 제작자
1. `Sony / Spider-Verse` → `제작/기술` 선택.
2. `할프톤/해칭/합성` 검색 후 공식 Imageworks 자료 열기.
3. 장면의 실제 화면 효과와 공식 제작 설명을 비교.
4. 재현 아이디어를 `창작 적용` 노트에 작성.
5. 다른 작품(《가구야 공주 이야기》 등)의 선화 표현과 비교 보드 만들기.

### 시나리오 C — 세계관 기획자
1. `Disney Animation`에서 Encanto/Zootopia를 탐색.
2. `공간이 캐릭터가 될 때` 보드를 연다.
3. `Studio Ghibli`의 Howl/Spirited Away 장면 후보를 보드에 추가.
4. `세계관 규칙을 행동이나 공간으로 설명하는 방식`을 비교.
5. 자신의 세계관 기획에 참고할 `인사이트`를 작성한다.

---

# 최종 지시: Claude Code 구현 보고 형식

작업을 완료했다면 아래 형식으로 답한다.

1. **구현 완료 기능**: 각 페이지와 CRUD/필터/비교/내보내기의 실제 작동 여부
2. **시드 데이터 현황**: 카테고리 3개, 작품 11개, 장면 후보 34개, 연구 보드 9개, 출처 수
3. **주요 파일 구조**: 라우트·데이터 모델·시드·스토리지·테스트 위치
4. **실행 방법**: 설치와 개발 서버 구동 명령
5. **검증 결과**: 타입 검사, 빌드, 수동 QA 내용
6. **남은 기능**: 실제 미구현 항목 및 제약 사항

> **프로덕트 철학:** “애니메이션을 찾는 사이트”가 아니라 “장면을 근거로 질문하고 비교하고 생각하는 리서치 도구”를 만들 것.
