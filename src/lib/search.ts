import { seedCategories } from '@seed/categories';
import { FACET_LABEL, LENS_LABEL } from './labels';
import { HUE_FAMILY_LABEL, paletteTemperature, sceneHueFamilies, type HueFamily } from './imports';
import type { AtlasData, CategoryId, Lens, ResearchBoard, Scene, Source, Tag, VerificationStatus, Work } from './types';

export type MatchMode = 'and' | 'or';
export type ResultType = 'all' | 'works' | 'scenes' | 'boards' | 'sources' | 'insights';
export type SortKey = 'updated' | 'year' | 'name' | 'created';

export interface ParsedQuery {
  terms: string[];
  mode: MatchMode | null; // null = not specified in the query text
}

export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim();
}

/**
 * "지브리 + 여백 + 고독" -> AND of 3 terms
 * "고독 AND 롱숏"       -> AND
 * "고독 OR 자유"        -> OR
 * '"세계 규칙" 공간'    -> quoted phrase kept together
 */
export function parseQuery(q: string): ParsedQuery {
  const terms: string[] = [];
  let mode: MatchMode | null = null;
  const re = /"([^"]+)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(q))) {
    const raw = m[1] ?? m[2];
    const upper = raw.toUpperCase();
    if (upper === 'AND' || raw === '&&' || raw === '&') {
      mode = 'and';
      continue;
    }
    if (upper === 'OR' || raw === '||' || raw === '|') {
      mode = 'or';
      continue;
    }
    for (const piece of m[1] ? [raw] : raw.split('+')) {
      if (piece === '') {
        mode = mode ?? 'and';
        continue;
      }
      const t = normalize(piece);
      if (t) terms.push(t);
    }
    if (!m[1] && raw.includes('+')) mode = mode ?? 'and';
  }
  return { terms, mode };
}

/** A term group: the typed term plus synonyms (tag names/aliases that the term exactly names). */
export type TermGroup = string[];

export function matchesTerms(haystack: string, terms: Array<string | TermGroup>, mode: MatchMode): boolean {
  if (terms.length === 0) return true;
  const hit = (t: string | TermGroup) => (typeof t === 'string' ? haystack.includes(t) : t.some((x) => haystack.includes(x)));
  return mode === 'and' ? terms.every(hit) : terms.some(hit);
}

/** "외로움" -> ["외로움", "고독", "solitude", "loneliness", ...] when it exactly names a tag or alias. */
export function expandTerms(terms: string[], tags: Tag[]): TermGroup[] {
  return terms.map((term) => {
    const group = new Set([term]);
    for (const t of tags) {
      const names = [t.nameKo, t.nameEn, ...(t.aliases ?? [])].map(normalize);
      if (names.includes(term)) names.forEach((n) => group.add(n));
    }
    return Array.from(group);
  });
}

const categoryText = (id: CategoryId): string => {
  const c = seedCategories.find((x) => x.id === id);
  return c ? [c.label, c.nameKo, c.nameEn, ...c.aliases].join(' ') : id;
};

export const tagText = (t: Tag): string =>
  [t.nameKo, t.nameEn, ...(t.aliases ?? []), FACET_LABEL[t.facet], t.definition].join(' ');

const lensText = (ls: Lens[]) => ls.map((l) => `${LENS_LABEL[l].ko} ${LENS_LABEL[l].en}`).join(' ');

export interface Indexes {
  workById: Map<string, Work>;
  tagById: Map<string, Tag>;
  sceneById: Map<string, Scene>;
}

export function buildIndexes(data: AtlasData): Indexes {
  return {
    workById: new Map(data.works.map((w) => [w.id, w])),
    tagById: new Map(data.tags.map((t) => [t.id, t])),
    sceneById: new Map(data.scenes.map((s) => [s.id, s])),
  };
}

export function workHaystack(w: Work): string {
  return normalize(
    [
      w.titleKo, w.titleEn, String(w.releaseYear), w.studio, ...(w.director ?? []), ...(w.medium ?? []),
      w.synopsisKo, w.overviewKo, w.researchQuestion, ...w.researchKeywords, lensText(w.lensIds), categoryText(w.categoryId),
    ].filter(Boolean).join(' '),
  );
}

export function sceneHaystack(s: Scene, idx: Indexes): string {
  const w = idx.workById.get(s.workId);
  const tags = s.tagIds.map((id) => idx.tagById.get(id)).filter(Boolean) as Tag[];
  return normalize(
    [
      s.seedCode, s.title, s.description, s.focusLabel, s.shotDescription, s.researchQuestion,
      s.observation, s.interpretation, s.productionFact, s.hypothesis, s.application,
      s.visualNotes, s.narrativeNotes, s.productionNotes,
      w ? `${w.titleKo} ${w.titleEn} ${w.releaseYear}` : '', w ? categoryText(w.categoryId) : '',
      ...tags.map(tagText), lensText(s.lensIds),
      ...(s.aiAnalysis ? aiText(s.aiAnalysis.analysis) : []),
      ...sceneHueFamilies(s).map((h) => `${HUE_FAMILY_LABEL[h]} ${h}`),
      // Derived from real pixels only, so "웜톤" can find scenes whose palette is actually warm.
      paletteTemperature(s) === 'warm' ? '웜톤 warm tones 팔레트' : paletteTemperature(s) === 'cool' ? '쿨톤 cool tones 팔레트' : '',
    ].filter(Boolean).join(' '),
  );
}

function aiText(a: NonNullable<Scene['aiAnalysis']>['analysis']): string[] {
  const secs = [a.miseEnScene, a.color, a.composition, a.camera, a.lighting, a.blocking, a.narrative, a.technique];
  return [a.title, a.summary, a.sceneDescription, a.color.temperature, a.color.saturation, a.color.mood, a.composition.framing, a.camera.shotSize, a.camera.angle, ...secs.flatMap((x) => [x.headline, ...x.points]), ...a.takeaways];
}

export function boardHaystack(b: ResearchBoard, idx: Indexes): string {
  const scenes = b.sceneIds.map((id) => idx.sceneById.get(id)).filter(Boolean) as Scene[];
  return normalize(
    [
      b.seedCode, b.title, b.researchQuestion, b.background, b.criteria, b.outputLabel,
      b.commonalities, b.differences, b.counterexamples, b.interpretation, b.productionFacts, b.hypothesis, b.findings, b.applications,
      ...Object.values(b.sceneNotes ?? {}),
      ...b.categoryIds.map(categoryText), lensText(b.lensIds),
      ...scenes.map((s) => s.title),
    ].filter(Boolean).join(' '),
  );
}

export function sourceHaystack(s: Source, idx: Indexes): string {
  const works = s.relatedWorkIds.map((id) => idx.workById.get(id)).filter(Boolean) as Work[];
  return normalize(
    [
      s.code, s.title, s.publisher, s.url, s.notes, s.altSearchHint,
      ...s.categoryIds.map(categoryText), ...works.map((w) => `${w.titleKo} ${w.titleEn}`),
    ].filter(Boolean).join(' '),
  );
}

export interface ExploreFilters {
  q: string;
  mode: MatchMode; // used for query terms AND tag filters
  categories: CategoryId[];
  workIds: string[];
  yearMin: number | null;
  yearMax: number | null;
  lenses: Lens[];
  tagIds: string[];
  verification: VerificationStatus[];
  hues: HueFamily[];
  bookmarkOnly: boolean;
}

export const emptyFilters = (): ExploreFilters => ({
  q: '',
  mode: 'and',
  categories: [],
  workIds: [],
  yearMin: null,
  yearMax: null,
  lenses: [],
  tagIds: [],
  verification: [],
  hues: [],
  bookmarkOnly: false,
});

export interface ExploreResults {
  works: Work[];
  scenes: Scene[];
  boards: ResearchBoard[];
  sources: Source[];
  insights: AtlasData['insights'];
}

const inYear = (y: number | undefined, f: ExploreFilters) =>
  y == null || ((f.yearMin == null || y >= f.yearMin) && (f.yearMax == null || y <= f.yearMax));

const anyOverlap = <T,>(a: T[], b: T[]) => b.length === 0 || a.some((x) => b.includes(x));

/**
 * Filter semantics (documented in README):
 * - Different filter groups always combine with AND (category AND tag AND lens ...).
 * - Within the tag group and the query terms, `mode` selects AND (all) / OR (any).
 * - Within category/work/lens/verification groups, selected values combine with OR.
 * - Tag / verification / bookmark filters apply to scenes. Works & boards that have no
 *   such fields are narrowed through their scenes (a work matches if any of its scenes match).
 */
export function runExplore(data: AtlasData, f: ExploreFilters): ExploreResults {
  const idx = buildIndexes(data);
  const parsed = parseQuery(f.q);
  const mode = parsed.mode ?? f.mode;
  const terms = expandTerms(parsed.terms, data.tags);
  const tagMode = f.mode;

  const hues = f.hues ?? [];
  const sceneFiltersActive = f.tagIds.length > 0 || f.verification.length > 0 || f.bookmarkOnly || hues.length > 0;

  const scenes = data.scenes.filter((s) => {
    const w = idx.workById.get(s.workId);
    if (f.categories.length && (!w || !f.categories.includes(w.categoryId))) return false;
    if (f.workIds.length && !f.workIds.includes(s.workId)) return false;
    if (!inYear(w?.releaseYear, f)) return false;
    if (!anyOverlap(s.lensIds, f.lenses)) return false;
    if (f.tagIds.length) {
      const ok = tagMode === 'and' ? f.tagIds.every((t) => s.tagIds.includes(t)) : f.tagIds.some((t) => s.tagIds.includes(t));
      if (!ok) return false;
    }
    if (f.verification.length && !f.verification.includes(s.verificationStatus)) return false;
    if (f.bookmarkOnly && !s.isBookmark) return false;
    if (hues.length && !sceneHueFamilies(s).some((h) => hues.includes(h))) return false;
    return matchesTerms(sceneHaystack(s, idx), terms, mode);
  });

  const sceneWorkIds = new Set(scenes.map((s) => s.workId));

  const works = data.works.filter((w) => {
    if (f.categories.length && !f.categories.includes(w.categoryId)) return false;
    if (f.workIds.length && !f.workIds.includes(w.id)) return false;
    if (!inYear(w.releaseYear, f)) return false;
    if (!anyOverlap(w.lensIds, f.lenses)) return false;
    if (sceneFiltersActive && !sceneWorkIds.has(w.id)) return false;
    return matchesTerms(workHaystack(w), terms, mode);
  });

  const sceneIdSet = new Set(scenes.map((s) => s.id));
  const boards = data.boards.filter((b) => {
    if (f.categories.length && !anyOverlap(b.categoryIds, f.categories)) return false;
    if (f.workIds.length && !anyOverlap(b.workIds, f.workIds)) return false;
    if (!anyOverlap(b.lensIds, f.lenses)) return false;
    if (f.bookmarkOnly && !b.isBookmark) return false;
    if ((f.tagIds.length || f.verification.length || hues.length) && !b.sceneIds.some((id) => sceneIdSet.has(id))) return false;
    return matchesTerms(boardHaystack(b, idx), terms, mode);
  });

  const sources = data.sources.filter((s) => {
    if (f.categories.length && !anyOverlap(s.categoryIds, f.categories)) return false;
    if (f.workIds.length && !anyOverlap(s.relatedWorkIds, f.workIds)) return false;
    if (f.verification.length && !f.verification.includes(s.verificationStatus)) return false;
    if (f.tagIds.length || f.bookmarkOnly || hues.length) return false;
    return matchesTerms(sourceHaystack(s, idx), terms, mode);
  });

  const insights = data.insights.filter((i) => {
    if (f.tagIds.length || f.verification.length || f.bookmarkOnly || hues.length) return false;
    if (f.categories.length) {
      const cats = new Set<string>();
      i.workIds.forEach((id) => { const w = idx.workById.get(id); if (w) cats.add(w.categoryId); });
      i.sceneIds.forEach((id) => { const s = idx.sceneById.get(id); const w = s && idx.workById.get(s.workId); if (w) cats.add(w.categoryId); });
      if (!f.categories.some((c) => cats.has(c))) return false;
    }
    return matchesTerms(normalize(`${i.title} ${i.body}`), terms, mode);
  });

  return { works, scenes, boards, sources, insights };
}

export function sortItems<T extends { updatedAt: string; createdAt: string }>(
  items: T[],
  key: SortKey,
  getName: (t: T) => string,
  getYear: (t: T) => number | undefined,
): T[] {
  const arr = [...items];
  switch (key) {
    case 'updated':
      return arr.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case 'created':
      return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'name':
      return arr.sort((a, b) => getName(a).localeCompare(getName(b), 'ko'));
    case 'year':
      return arr.sort((a, b) => (getYear(a) ?? 0) - (getYear(b) ?? 0) || getName(a).localeCompare(getName(b), 'ko'));
  }
}

/** Tags related to a query, for the "no results" state. */
export function relatedTags(tags: Tag[], q: string, limit = 8): Tag[] {
  const { terms } = parseQuery(q);
  if (!terms.length) return [];
  return tags
    .filter((t) => {
      const h = normalize(tagText(t));
      return terms.some((term) => h.includes(term) || term.includes(normalize(t.nameKo)) || (term.length >= 2 && h.includes(term.slice(0, 2))));
    })
    .slice(0, limit);
}
