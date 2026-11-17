import { describe, expect, it } from 'vitest';
import { buildSeedData } from '@seed/index';
import { emptyFilters, parseQuery, relatedTags, runExplore } from '@/lib/search';

const data = buildSeedData();
const run = (patch: Partial<ReturnType<typeof emptyFilters>>) => runExplore(data, { ...emptyFilters(), ...patch });
const catOf = (workId: string) => data.works.find((w) => w.id === workId)!.categoryId;

describe('parseQuery', () => {
  it('handles +, AND, OR and quotes', () => {
    expect(parseQuery('지브리 + 여백 + 고독')).toEqual({ terms: ['지브리', '여백', '고독'], mode: 'and' });
    expect(parseQuery('고독 AND 롱숏')).toEqual({ terms: ['고독', '롱숏'], mode: 'and' });
    expect(parseQuery('고독 or 자유')).toEqual({ terms: ['고독', '자유'], mode: 'or' });
    expect(parseQuery('"세계 규칙" 공간')).toEqual({ terms: ['세계 규칙', '공간'], mode: null });
    expect(parseQuery('지브리+여백')).toEqual({ terms: ['지브리', '여백'], mode: 'and' });
  });
});

describe('explore scenarios (spec D5 / H-4, H-5)', () => {
  it('지브리 + 여백 + 고독 -> Ghibli scenes only, includes the train sequence', () => {
    const r = run({ q: '지브리 + 여백 + 고독' });
    expect(r.scenes.length).toBeGreaterThan(0);
    expect(r.scenes.every((s) => catOf(s.workId) === 'ghibli')).toBe(true);
    expect(r.scenes.map((s) => s.seedCode)).toContain('S-G02');
  });

  it('디즈니 + 공간 + 세계관 -> Encanto/Zootopia scenes', () => {
    const r = run({ q: '디즈니 + 공간 + 세계관' });
    const works = new Set(r.scenes.map((s) => s.workId));
    expect(r.scenes.every((s) => catOf(s.workId) === 'disney')).toBe(true);
    expect(works.has('work-disney-encanto') || works.has('work-disney-zootopia')).toBe(true);
  });

  it('소니 + 코믹북 + 합성 -> Spider-Verse official production source', () => {
    const r = run({ q: '소니 + 코믹북 + 합성' });
    expect(r.sources.map((s) => s.code)).toContain('S1');
  });

  it('외로움 -> results across multiple categories (scenes and boards)', () => {
    const r = run({ q: '외로움' });
    const cats = new Set(r.scenes.map((s) => catOf(s.workId)));
    expect(cats.size).toBeGreaterThanOrEqual(2);
    expect(r.boards.length).toBeGreaterThan(0);
  });

  it.each(['고독', '미장센', '세계관', '합성'])('Korean keyword "%s" returns results', (q) => {
    const r = run({ q });
    expect(r.scenes.length + r.works.length + r.sources.length + r.boards.length).toBeGreaterThan(0);
  });

  it.each(['Spirited Away', 'spider-verse', 'zootopia', 'Kaguya'])('English title "%s" matches a work', (q) => {
    expect(run({ q }).works.length).toBeGreaterThan(0);
  });

  it('category=ghibli AND tag filter combine', () => {
    const r = run({ categories: ['ghibli'], tagIds: ['spc-nature'] });
    expect(r.scenes.length).toBeGreaterThan(0);
    expect(r.scenes.every((s) => catOf(s.workId) === 'ghibli' && s.tagIds.includes('spc-nature'))).toBe(true);
  });

  it('category=ghibli AND keyword 공간', () => {
    const r = run({ categories: ['ghibli'], q: '공간' });
    expect(r.scenes.length).toBeGreaterThan(0);
    expect(r.scenes.every((s) => catOf(s.workId) === 'ghibli')).toBe(true);
  });

  it('tag AND vs OR', () => {
    const and = run({ tagIds: ['emo-solitude', 'cam-wide'], mode: 'and' }).scenes;
    const or = run({ tagIds: ['emo-solitude', 'cam-wide'], mode: 'or' }).scenes;
    expect(and.length).toBeGreaterThan(0);
    expect(or.length).toBeGreaterThan(and.length);
    expect(and.every((s) => s.tagIds.includes('emo-solitude') && s.tagIds.includes('cam-wide'))).toBe(true);
  });

  it('고독 AND 롱숏 resolves the 롱숏 alias to the wide-shot tag', () => {
    const r = run({ q: '고독 AND 롱숏' });
    expect(r.scenes.length).toBeGreaterThan(0);
    expect(r.scenes.every((s) => s.tagIds.includes('cam-wide'))).toBe(true);
  });

  it('category filter shows only that category works', () => {
    expect(run({ categories: ['sony'] }).works).toHaveLength(2);
    expect(run({ categories: ['disney'] }).works).toHaveLength(4);
    expect(run({ categories: ['ghibli'] }).works).toHaveLength(5);
  });

  it('nonsense query returns nothing (no fabricated results)', () => {
    const r = run({ q: 'zzqqxx없는검색어' });
    expect(r.scenes.length + r.works.length + r.boards.length + r.sources.length).toBe(0);
  });

  it('relatedTags suggests tags for an empty search', () => {
    expect(relatedTags(data.tags, '외로움').map((t) => t.id)).toContain('emo-solitude');
  });

  it('production lens + 할프톤 surfaces the Imageworks source', () => {
    const r = run({ categories: ['sony'], lenses: ['production'], q: '할프톤' });
    expect(r.sources.map((s) => s.code)).toContain('S1');
  });
});
