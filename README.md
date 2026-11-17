# ANIMA ATLAS

**Animation Research & Visual Intelligence Platform**: a personal workspace for collecting animated works and scenes, taking apart each scene's visual language, story structure, and production methods, and comparing works to build up research insights.

> "애니메이션을 찾는 사이트"가 아니라 "장면을 근거로 질문하고 비교하고 생각하는 리서치 도구".

Spec: `../ANIMA_ATLAS_Claude_Code_기획_리서치.md`

## v2 — Dear Mango-style search → research → archive (top priority)

Spec: `ANIMA_ATLAS_DearMango_ClaudeCode_v2.md` (v1: `ANIMA_ATLAS_Claude_Code_기획_리서치.md`)

> **Dear Mango source not confirmed.** I searched Downloads, Desktop, Documents and the common project folders, plus a Spotlight search, for "dear mango", "dear.interaction" and "디어 망고". I found no Dear Mango code. Following spec v2 item 4, I implemented its **discover → research → analyze → archive** flow independently. Dear Mango's UI and code were not copied, and no Dear Mango files exist or were modified. If you point me to the source location, I can bring the design tokens and components in line with it.

**Main user journey (all of it works in the UI)**

```
Home search "주토피아"/"Zootopia" → /search (TMDB ko+en search merged into one work + my library)
 → /search/movie/[tmdbId] poster·backdrop candidate gallery (+ Google Images links, direct upload)
 → pick an image → "이 장면 분석하기" → Scene card created automatically (work link, provenance, image_type, SHA-256 dedupe)
 → 5~8-color palette from real pixels (HEX, share, copy) + eyedropper + thirds/center/diagonal guides
 → VISUAL / NARRATIVE / PRODUCTION tabs + Observation · Evidence · Interpretation · Hypothesis · Application
 → save to a Research Board → compare 2~4 scenes → Markdown/JSON export, still there after reconnecting
```

| Search level (spec) | Implementation |
|---|---|
| A. TMDB automatic search | `GET /api/tmdb/search` (ko-KR + en-US searched together and merged by id), `GET /api/tmdb/movie/[id]` (details + images). **Posters and promotional backdrops only**, never "every scene frame". Backdrops are saved as `promotional_still` |
| B. Google Images discovery | Opens Google Images in a new tab with extra terms such as `official still`, `color script` and `production art`. Results are not pulled into the app, and the Custom Search API is not used (closed to new customers) |
| C. User-chosen images | `/capture`: drag & drop, file picker, ⌘V paste, image URL (server fetch only; internal-network addresses blocked). Stored in IndexedDB |
| D. Official production material | The existing Source library (official links and verification status) |
| E. AI-assisted analysis (optional) | **Claude app (subscription) analysis**: no API key needed. The scene page copies the image and prompt → paste into claude.ai → paste the reply back, and the 10 cards are generated (checked against the same schema; a fix-request message is offered on errors). **API auto-analysis**: the button appears only when `ANTHROPIC_API_KEY` is set, and runs after a consent dialog. Palette, composition and notes all work without AI |

## GitHub Pages 배포 (서버 없는 정적 버전)

같은 코드로 두 가지 버전을 만듭니다.

| | 맥 서버 버전 (`npm start`) | GitHub Pages 버전 (`npm run build:pages`) |
|---|---|---|
| PIN | 서버가 막는 진짜 잠금 | 화면 가림막 (PIN은 해시로만 들어감) |
| TMDB 키 | `.env.local` (서버만 사용) | **기기마다 설정 화면에서 입력** → 그 브라우저에만 저장 |
| AI 분석 | API 자동 분석 + Claude 앱 붙여넣기 | Claude 앱(구독) 붙여넣기 |
| 이미지 URL 가져오기 | 서버가 대신 가져옴 | 해당 사이트가 허용할 때만 (아니면 드래그·붙여넣기) |
| 나머지 (장면·보드·팔레트·비교·PDF 등) | 동일 | 동일 |

- Pages 빌드는 `.tsx` 파일만 사용하므로 서버 전용 `.ts` 파일(`app/api/**`, `proxy.ts`, 옛 주소 리다이렉트)은 자동으로 빠집니다. 파일을 옮기거나 지우지 않습니다.
- 상세 화면 주소는 `/scene?id=…`, `/work?slug=…`, `/board?id=…`, `/movie?id=…` 형식입니다 (정적 사이트에서도 동작).
- 빌드 결과(`out/`)에는 TMDB 키·세션 비밀값·PIN 원문이 들어가지 않습니다 (빌드 후 직접 검사함).
- 연구 데이터는 각 기기 브라우저에만 저장되며 GitHub에 올라가지 않습니다. 기기 사이 이동은 `데이터·크레딧 → JSON 백업/복원`으로 합니다.

### 맥북에서 처음 배포하기

1. **GitHub에 빈 저장소 만들기**: github.com → New repository → 이름 `anima-atlas`, **Public**(무료 요금제에서 Pages는 공개 저장소 필요), README/.gitignore 추가하지 않음.
2. **PIN 비밀값 등록**: 저장소 → Settings → Secrets and variables → Actions → *New repository secret* → Name `APP_PIN`, Value: 원하는 4자리 숫자.
3. **Pages 켜기**: 저장소 → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
4. **코드 올리기** (터미널):
   ```bash
   cd ~/Downloads/TEST/anima-atlas
   git init -b main
   git add .
   git status            # .env.local, .claude/, node_modules/, .next/, out/ 가 목록에 없어야 함
   git commit -m "ANIMA ATLAS 첫 배포"
   git remote add origin https://github.com/<내아이디>/anima-atlas.git
   git push -u origin main
   ```
   (처음 push 때 로그인 창이 뜨면 GitHub 계정으로 로그인하거나, `brew install gh && gh auth login` 후 다시 push)
5. **배포 확인**: 저장소 → Actions 탭에서 *Deploy to GitHub Pages*가 초록색이 되면 끝 (2~3분). 주소: `https://<내아이디>.github.io/anima-atlas/`
6. **첫 접속**: PIN 입력 → `데이터·크레딧 → TMDB 키`에 키를 한 번 붙여넣기.

이후에는 코드를 고치고 `git add . && git commit -m "…" && git push` 하면 자동으로 다시 배포됩니다.

### 아이폰에서 쓰기

- Safari로 `https://<내아이디>.github.io/anima-atlas/` 접속 → PIN 입력 → 설정에서 TMDB 키 입력 (아이폰에도 한 번 필요).
- 공유 버튼 → **홈 화면에 추가** 하면 앱처럼 전체 화면으로 열립니다.
- 노치·홈 바 여백, 입력칸 확대 방지(16px), 가로 스크롤 없음이 적용되어 있습니다 (390px 폭에서 16개 화면 확인).

### 로컬에서 Pages 버전 미리 보기

```bash
NEXT_PUBLIC_BASE_PATH=/anima-atlas npm run build:pages   # .env.local 의 APP_PIN 사용
# out/ 폴더를 /anima-atlas/ 경로로 서비스해서 확인
```

## Running it

```bash
cd anima-atlas
npm install
npm run dev          # http://localhost:3000 (development)

npm run build && npm start   # production build and run
npm run typecheck            # tsc --noEmit
npm test                     # vitest (seed, search, persistence, backup, export)
```

Requirements: Node.js 20+ (tested on Node 24).

### API keys (optional; the app works without them)

`anima-atlas/.env.local` (a template is already there; the keys are used only on the server and never reach the browser, backups, or research cards):

```
TMDB_READ_ACCESS_TOKEN=   # TMDB "API Read Access Token" (preferred) - https://www.themoviedb.org/settings/api
TMDB_API_KEY=             # or the v3 API key
ANTHROPIC_API_KEY=        # optional AI-assisted analysis
```

Restart the server after adding them. Connection status is shown on `/settings` → "External services".
Without a TMDB key, the search page shows a setup guide and searches the seed/library data only.

### Setting up AI scene analysis (optional)

1. Get an API key at https://console.anthropic.com/
2. Put it in `anima-atlas/.env.local` (template already provided):
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the server (`npm start` or `npm run dev`).

Without a key, everything else works. The analyze button shows a "key required" notice, and the image is still saved as a scene.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript (strict)
- Claude API (`@anthropic-ai/sdk`, model `claude-opus-5-5`): image analysis with structured output (Zod schema). Server-side refusal fallback (`fallbacks: "default"`) is enabled
- html-to-image: saves card news as PNG
- Tailwind CSS v4 (design tokens in `src/app/globals.css`)
- IndexedDB (via the `idb` library) for persistence; images are stored as Blobs
- Vitest + fake-indexeddb for tests

## File structure

```
anima-atlas/
├── data/seed/                 Seed research data (kept out of the UI code)
│   ├── categories.ts          3 categories: research axes, confirmed facts (with source links), research tracks
│   ├── tags.ts                59 initial tags (tagId · nameKo · nameEn · facet · definition · aliases)
│   ├── works.ts               11 works (Sony 2 / Disney 4 / Ghibli 5)
│   ├── scenes.ts              34 scene candidates (7 / 12 / 15): no timecodes, images, or colors
│   ├── boards.ts              9 example boards (templates, conclusions left empty)
│   ├── sources.ts             25 sources (S1–S7, D1–D10, G1–G8)
│   ├── meta.ts / index.ts     Seed version, buildSeedData()
├── src/lib/
│   ├── types.ts               Data model (Work, Scene, ResearchBoard, Source, Tag, MediaAsset, Insight, Comparison)
│   ├── db.ts                  IndexedDB schema, apply-seed-once, CRUD, replace-all
│   ├── store.tsx              React context: state + persistence + cascading deletes + toasts + compare tray
│   ├── search.ts              Query parser (AND/OR/+/quotes), tag synonym expansion, multi-filter search
│   ├── export.ts              Board Markdown/JSON export (follows the spec's board template)
│   ├── backup.ts              JSON backup validation, conflict analysis, merge strategies, Blob<->DataURL
│   ├── palette.ts             Canvas-based sample palette (uploaded images only)
│   ├── tmdb.ts                Server-only TMDB client (ko/en search merge, details/images, category guess)
│   ├── imports.ts             Image → Scene import (SHA-256 dedupe, real-pixel palette, provenance, hue family/warm-cool classification)
│   ├── searchHistory.ts       Recent searches (localStorage)
│   ├── aiSchema.ts            AI analysis schema (mise-en-scène, color, composition, camera, lighting, blocking, narrative, technique, takeaways, caveats)
│   ├── pdf.ts                 Dependency-free PDF writer (one JPEG per page, xref, UTF-16 title)
│   ├── auth.ts                PIN gate: session token signing/verification, constant-time comparison, brute-force lockout
│   ├── manualAnalysis.ts      Claude app (subscription) paste flow: prompt builder, JSON extraction/validation, fix-request message
│   ├── ai.ts / useSceneAnalysis.ts  Image downscaling → /api/analyze call → saves the result on the scene
│   ├── labels.ts / util.ts    Korean labels, analysis question templates, timecode/HEX/slug helpers
├── src/components/            AppShell, CategoryTabs, FilterPanel, Cards (Work/Scene/Board/Source),
│                              SceneAnatomy, WorkEditor, SourceEditor/SourcePicker, TagPicker,
│                              MediaUploader, ScenePickerDialog, AddToBoardDialog, ComparisonGrid, ui (Dialog,
│                              ConfirmationDialog, EmptyState, SourceBadge, TagChip ...), Placeholder
├── src/app/                   Routes
│   ├── page.tsx               /            Home (category tabs, Research Lenses, Explore by Question, recent items)
│   ├── search/                /search      Title search (TMDB + my library, Google Images links)
│   ├── search/movie/[id]/     TMDB work details + poster/backdrop candidates → create a scene card
│   ├── api/tmdb/              status · search · movie/[id] · image (same-origin proxy that accepts only image.tmdb.org paths)
│   ├── capture/               /capture     Direct image upload (paste / drag / URL) → scene card (+ optional AI)
│   ├── cards/                 /cards       Gallery of AI-analyzed card news
│   ├── api/analyze/           POST /api/analyze      Image → Claude analysis (server-side; the API key never reaches the browser)
│   ├── api/fetch-image/       POST /api/fetch-image  Fetch one image URL the user pasted (blocks internal-network addresses, 8MB limit)
│   ├── explore/               /explore     Unified search + multi-filters (state kept in the URL)
│   ├── works/, works/[slug]/  Work library / work detail
│   ├── scenes/, scenes/new/, scenes/[id]/   Scene library / new scene / Scene Anatomy
│   ├── boards/, boards/[id]/  Research boards
│   ├── compare/               2–4 scenes or works side by side (handwritten comparison)
│   ├── insights/              Insight Notebook (hypotheses, findings, application ideas)
│   ├── sources/               Source library (evidence level, verification status)
│   └── settings/              Data management: JSON backup/restore, tag management, "coming later" list
└── tests/                     seed / search / db (persistence, seed-once) / export-util
```

## AI scene analysis and card news

1. **Get the image in** (`/capture`): find a scene on Google, then do one of:
   - capture it (⌘⇧4) and press ⌘V on the page
   - drag the image onto the drop area
   - paste the image URL (right-click → "Copy Image Address")
   The app does not search or scrape Google automatically; the user picks each image.
2. **Analyze**: choose the work and confirm "personal research use", then click "저장하고 AI 분석". The image is saved as a scene first, so a failed analysis loses nothing.
3. **Card news (10 cards)**: cover · mise-en-scène · color (palette extracted from the actual image + temperature/saturation/contrast) · composition (thirds guide) · camera (shot size/angle/lens feel) · lighting · character/object placement · story/emotion · techniques · applying it to your own work (+ limits of the analysis). Swipe, arrow keys, dots. **Save all 10 cards as one PDF** (one card per page, 540pt wide; a page with long text grows taller so nothing is cut off), or as individual PNGs.
4. The scene page's "AI로 분석하기" button can analyze or re-analyze any scene's image. `/cards` collects every analysis.

**Principles**: AI output is always labeled "AI 분석 · 자동 생성 해석 · 검증 필요" and is never mixed into the user's 5 evidence fields (observation, official fact, etc.). Production methods are written only as "what can be seen on screen". When the image changes, the old analysis is removed automatically. AI-suggested tags are applied only if they exist in the tag list. The text of AI analyses is included in search.

**Cost and privacy**: one analysis is roughly a few cents (images are downscaled to a long side of 1568px or less before sending). The image goes to the Anthropic API only at analysis time; saved images stay in this browser.

## v2 data model additions

- `Work.tmdbId / tmdbPosterPath / officialUrl`: a TMDB result is linked to an existing work by title + year (±1), so `주토피아` and `Zootopia` resolve to the same work without duplicates
- `MediaAsset` (spec ImageAsset): `sourceProvider (tmdb/manual_upload/official_link)`, `sourcePageUrl`, `originalImageUrl`, `licenseStatus (unverified/checked/restricted)`, `attribution`, `width/height/aspectRatio`, `contentHash (SHA-256)`, `importedAt`, `workId`
- `Scene.imageType`: `actual_frame / promotional_still / poster / concept_art / unknown`
- `Scene.colorAnalysis`: `swatches[{hex, proportion}]`, `algorithmVersion`, `extractedFromAssetId`, `createdAt`. **Created only from real pixels.** If the image can't be read, the scene shows "분석 불가" (cannot analyze)
- `VerificationStatus` gains `partial`. The `other` category is a holding area for imported works outside the 3 studios, such as Pixar; its tab shows only when it contains a work
- Filters: hue family (computed from the real palette), emotion/narrative/technique tags, verification status. `웜톤`/`쿨톤` search also matches scenes whose real palette is warm or cool

### Storage choice: IndexedDB (client-only) vs SQLite

| | IndexedDB (chosen) | SQLite (local server) |
|---|---|---|
| Image blobs | Stored directly as Blobs | Needs files plus path management |
| Install/run | Just `npm start`, no extra setup | Needs a DB file, migrations, and a server API |
| Sharing/sync | No (one browser on one device) | One DB can be shared on the same PC |
| Backup | JSON (images included as base64) | Copy the DB file |

This is a personal tool for one person, so IndexedDB was chosen for simple install and Blob storage. If cross-device use becomes necessary, SQLite or a cloud backend would be the next step.

## Access PIN (security)

- When the app opens, the **4-digit PIN** must be typed on the keyboard. Typing the fourth digit submits it automatically.
- The PIN lives in `.env.local` as `APP_PIN`, never in source code. To change it, edit that value and restart the server.
- **Server-side enforcement**:
  - The `src/proxy.ts` (Next 16 Proxy) layer handles every page and API. Pages redirect to `/unlock?next=…` and APIs return 401.
  - Every API route checks the session again on its own, because Next docs say Proxy must not be the only authorization layer.
- **Session**:
  - On success, the server issues an HttpOnly cookie that page JavaScript cannot read.
  - It is signed with HMAC-SHA256 using `APP_SESSION_SECRET`, a random 64-character value.
  - It ends when the browser closes or after 12 hours. The sidebar's "잠그기" (lock) button ends it immediately.
  - Changing `APP_SESSION_SECRET` logs out every session.
- **Brute-force protection**: after 5 wrong attempts from one IP the client is locked out, starting at 30 seconds and doubling up to 15 minutes. There is also a global limit. The PIN is compared in constant time.
- If `APP_PIN` or `APP_SESSION_SECRET` is missing, the app does not open (fail closed).
- **Limits**:
  - The server runs over HTTP, so on another device on the same Wi-Fi (`http://192.168.x.x:3000`) the PIN travels unencrypted. Use it only on networks you trust.
  - Failure counts live in memory and reset when the server restarts.
  - Research data stays in IndexedDB in the browser that unlocked the app. The PIN protects access to the app; it does not encrypt data already stored on the device.

## Storage, and its limits

- All data is stored in **this browser's IndexedDB** (database name `anima-atlas`). It is personal and per device: other browsers or devices do not sync.
- Clearing browser data, or closing a private/incognito window, can erase it. **Back up regularly from `/settings` → "전체 JSON 백업 내려받기".** Uploaded images are included in the backup as base64.
- **Seed data is applied only on first run** (marked by the `meta.seed` record). After that, edits and deletions are never restored by a refresh or an app update. Going back to the seed requires an explicit "초기 시드 상태로 재설정" in `/settings`.
- When restoring, the app reports ID conflicts by item type, then lets you choose: keep whichever is newer (recommended), overwrite from the file, keep current data, or replace everything.

## Search and filter rules

- Query syntax: `지브리 + 여백 + 고독` (AND), `고독 AND 롱숏`, `고독 OR 자유`, `"세계 규칙"` (exact phrase).
- Tag synonyms are expanded automatically: e.g. `외로움` → 고독/solitude, `롱숏` → 와이드숏, `세계관` → 세계 규칙.
- Category aliases are searchable: 소니 · 스파이더버스 · 디즈니 · 지브리 and their English names.
- Different filter groups always combine with AND. Inside the tag group, the AND/OR toggle applies. Inside the category, work, lens, and verification groups, selected values combine with OR.
- Tag, verification, and bookmark filters apply to scenes. Works and boards are shown when they contain a matching scene.
- When nothing matches, the page shows related tags and a "새 장면 추가" button. Results are never made up.

## Research ethics built into the data

- Scene candidates start with `startSeconds/endSeconds = null`, `sceneImageAssetId = null`, `colors = []`, and `verificationStatus = needs_review`. The UI shows "타임코드 미입력" and an "이미지 없음 · 플레이스홀더" placeholder.
- **Confirmed facts** (green), **analysis framing / hypotheses** (amber), and **direct observations** (blue) have their own labels and colors. A scene's evidence is recorded in 5 separate fields: observation, official production fact, interpretation, hypothesis, and creative application.
- Sources are labeled by evidence level: official primary source, secondary source, direct observation, researcher hypothesis. "확인됨" means only that the information exists at the link.
- No video downloads, no scraping, and no re-hosting of stills. Images can be uploaded only after the user ticks a rights-confirmation checkbox and enters alt text, and they stay in local IndexedDB.
- Palette extraction runs only on images the user uploaded, and is labeled "선택한 프레임의 샘플 팔레트" (not the film's color script).
- Comparisons start as **user-written comparisons**. The "기록된 데이터" above each cell only shows tags, sources, and notes already saved on that item. There are no AI features.

## Feature status

| Feature | Status |
|---|---|
| 3 category tabs + 3 research lens toggles | Done |
| Work / scene / board / source / tag / insight / comparison CRUD + persistence | Done |
| Scene Anatomy (Viewer, Visual/Narrative/Production tabs with question templates, 5 evidence fields) | Done |
| Unified search (Korean/English, AND/OR, synonyms) + multi-filters + result type switch + sorting | Done |
| Add scenes to boards (from cards, scene detail, or the board), reorder (drag + ↑/↓), per-scene board notes | Done |
| Compare 2–4 scenes or works, save it, export Markdown | Done |
| Board Markdown/JSON export, full JSON backup/restore (with conflict check) | Done |
| Image upload (rights confirmation) + composition guides (thirds/center/diagonal) | Done |
| Manual HEX palette + Top 5 auto-extraction from uploaded images | Done |
| Mobile layout (menu, filter drawer, bottom nav, fixed save bar) | Done |
| Capture (paste/drag/URL) → Claude AI analysis → 10-card news, PNG saving, card news gallery | Done (an API key is required to actually run analysis) |
| v2: search-first home, TMDB search/image candidates (when a key is set), Google Images links, scene cards from image choice, SHA-256 dedupe, real-pixel 5~8-color palette, eyedropper, provenance/rights panel, image_type, hue-family filter, recent searches | Done (the live TMDB call is verified with mocked-response tests only, because no key is set; see Verification) |
| CSV export, per-work color timeline, frame/timecode editor, semantic search, batch AI analysis of many scenes, cloud sync | **Coming later** (listed in `/settings` and not shown as working) |

## Verification

- `npm run typecheck` passes
- `npm test`: **86 tests pass** (adds the Pages lock screen PIN check/lockout/expiry, query-string detail URLs, and TMDB key type detection). GitHub Pages build: 22 static pages, no secrets in `out/`, browser-direct TMDB search → backdrop import → real palette, 16 pages with no horizontal scroll at 390px
- Earlier: 81 tests (adds the PIN gate: token tampering/expiry, open-redirect protection, lockout after 5 failures, proxy redirect/401, HttpOnly session cookie, API re-checks)
- PIN manual QA: `/scenes` → `/unlock?next=/scenes`, typing a wrong PIN shows an error, typing the correct PIN returns to `/scenes`, the cookie is not visible to JS, and the lock button blocks access again (API 401)
- Earlier: 71 tests (adds PDF structure checks: page count/size, exact xref offsets, JPEG bytes unchanged). Opened the real downloaded card-news PDF with macOS `sips`: 10 pages, cover not cut off
- Earlier: 67 tests (adds the paste flow: prompt contents, code-block extraction, whitespace trimming, Korean-language error messages, cut-off replies, tag application).
- Claude-app analysis manual QA: real TMDB Zootopia backdrop → pasted the answer in the prompt's format → 10 cards and 6 tags applied, labeled 'claude.ai (구독 · 수동 붙여넣기)'
- Earlier: 61 tests. v2 added: ko/en TMDB result merge, category guess (Pixar → other), image-proxy path validation, no-key fallback routes, work matching by title + year, details/images parsing with a mocked TMDB response, SHA-256 dedupe, recording "cannot analyze" instead of inventing a palette, hue-family filter, palette-based warm-tone search
- v2 manual QA (Playwright, no TMDB key): home search → "주토피아" → setup guide + local results + Google links / `Zootopia` resolves to the same work / paste image → scene card + exact real palette (53% · 37% · 5% · 4%) / eyedropper sample #2F4F6F / research-tab, Evidence and sampled-color notes persist after reload / compare a Zootopia (Disney) and a Spirited Away (Ghibli) scene on one board
- **Not verified**: the real TMDB API call and the poster/backdrop gallery screen were not tested with live data because no key is set. After adding a key, check `/search?q=주토피아` first
- Earlier: 47 tests (adds AI schema validation, search over AI text, and the missing-key and bad-image guards in `/api/analyze`)
- Earlier test run: 42 tests passed (seed counts 2/4/5 and 7/12/15, no fabricated data in seeds, reference integrity, spec D5 search scenarios, AND/OR, seed-once and persistence across restarts, backup merge, Markdown template)
- `npm run build` production build passes
- Manual QA (Playwright, desktop 1440px and mobile 390px):
  - Home Ghibli tab → shows only the 5 Ghibli works
  - S-G02: entered timecode, observation, and verification status → kept after reload
  - New-scene form validation errors → new scene saved → added to board B02 → reordered and noted → kept after reload
  - Board → compare scenes → saved comparison with a cell note → reopened
  - Image upload refused without rights confirmation → uploaded → Top 5 palette extracted → kept after reload
  - JSON backup → reset to seed → restore (conflict report shown) → user data and image restored
  - Board Markdown export output checked; mobile filter drawer checked
