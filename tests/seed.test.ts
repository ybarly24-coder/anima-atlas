import { describe, expect, it } from 'vitest';
import { buildSeedData, seedCategories } from '@seed/index';
import { primaryCategories } from '@seed/categories';

const data = buildSeedData();
const catOf = (workId: string) => data.works.find((w) => w.id === workId)!.categoryId;

describe('seed data (spec PART B / H-2, H-3)', () => {
  it('has 3 primary research categories (+ an empty OTHER overflow bucket)', () => {
    expect(primaryCategories.map((c) => c.id)).toEqual(['sony', 'disney', 'ghibli']);
    expect(seedCategories.map((c) => c.id)).toEqual(['sony', 'disney', 'ghibli', 'other']);
    expect(data.works.some((w) => w.categoryId === 'other')).toBe(false);
  });

  it('has 2 / 4 / 5 works per category', () => {
    const count = (c: string) => data.works.filter((w) => w.categoryId === c).length;
    expect([count('sony'), count('disney'), count('ghibli')]).toEqual([2, 4, 5]);
    expect(data.works).toHaveLength(11);
  });

  it('has 7 / 12 / 15 scene candidates per category', () => {
    const count = (c: string) => data.scenes.filter((s) => catOf(s.workId) === c).length;
    expect([count('sony'), count('disney'), count('ghibli')]).toEqual([7, 12, 15]);
  });

  it('scene candidates carry no fabricated timecodes / images / colors', () => {
    for (const s of data.scenes) {
      expect(s.startSeconds).toBeNull();
      expect(s.endSeconds).toBeNull();
      expect(s.sceneImageAssetId).toBeNull();
      expect(s.colors).toEqual([]);
      expect(s.verificationStatus).toBe('needs_review');
      expect(s.productionFact).toBe('');
      expect(s.observation).toBe('');
    }
  });

  it('has 9 template boards with empty conclusions', () => {
    expect(data.boards).toHaveLength(9);
    for (const b of data.boards) {
      expect(b.status).toBe('template');
      expect(b.findings).toBe('');
      expect(b.sceneIds).toHaveLength(3);
    }
  });

  it('has 25 sources (S1-S7, D1-D10, G1-G8)', () => {
    expect(data.sources).toHaveLength(25);
  });

  it('does not include Pixar', () => {
    expect(JSON.stringify(data.works).toLowerCase()).not.toContain('pixar');
  });

  it('all references resolve', () => {
    const ids = {
      works: new Set(data.works.map((w) => w.id)),
      scenes: new Set(data.scenes.map((s) => s.id)),
      sources: new Set(data.sources.map((s) => s.id)),
      tags: new Set(data.tags.map((t) => t.id)),
    };
    for (const w of data.works) w.officialSourceIds.forEach((id) => expect(ids.sources.has(id), id).toBe(true));
    for (const s of data.scenes) {
      expect(ids.works.has(s.workId)).toBe(true);
      s.tagIds.forEach((id) => expect(ids.tags.has(id), `${s.id} -> ${id}`).toBe(true));
      s.sourceIds.forEach((id) => expect(ids.sources.has(id), id).toBe(true));
      expect(s.lensIds.length).toBeGreaterThan(0);
    }
    for (const b of data.boards) b.sceneIds.forEach((id) => expect(ids.scenes.has(id), id).toBe(true));
    for (const src of data.sources) src.relatedWorkIds.forEach((id) => expect(ids.works.has(id), id).toBe(true));
    for (const c of seedCategories) c.confirmedFacts.forEach((f) => f.sourceIds.forEach((id) => expect(ids.sources.has(id), id).toBe(true)));
  });

  it('ids are unique across all entities', () => {
    const all = [...data.works, ...data.scenes, ...data.boards, ...data.sources, ...data.tags].map((x) => x.id);
    expect(new Set(all).size).toBe(all.length);
  });
});
