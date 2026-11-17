import { describe, expect, it } from 'vitest';
import { buildSeedData } from '@seed/index';
import { boardToJson, boardToMarkdown } from '@/lib/export';
import { quantizePixels } from '@/lib/palette';
import { formatTimecode, normalizeHex, parseTimecode, uniqueSlug } from '@/lib/util';

describe('board markdown export (spec 2.4 / D7 / H-10)', () => {
  const data = buildSeedData();
  const board = data.boards.find((b) => b.seedCode === 'B02')!;

  it('follows the board template sections', () => {
    const md = boardToMarkdown(board, data);
    for (const h of ['# 고독을 만드는 미장센', '## Research Question', '## Scope', '## Evidence', '## Comparative Analysis', '## Interpretation', '## Production Facts', '## Hypothesis', '## Insight', '## Application', '## Sources']) {
      expect(md).toContain(h);
    }
    expect(md).toContain('타임코드 미입력');
    expect(md).toContain('검토 필요');
    expect(md).toMatch(/\[D8 Moana\]\(https:\/\/www\.disneyanimation\.com\/films\/moana\/\)/);
  });

  it('does not invent conclusions for template boards', () => {
    const md = boardToMarkdown(board, data);
    expect(md).toContain('_(아직 작성하지 않음)_');
  });

  it('JSON export includes referenced scenes/works', () => {
    const j = JSON.parse(boardToJson(board, data));
    expect(j.scenes).toHaveLength(3);
    expect(j.works.length).toBeGreaterThanOrEqual(3);
  });
});

describe('utils', () => {
  it('timecodes', () => {
    expect(parseTimecode('1:02:03')).toBe(3723);
    expect(parseTimecode('62:03')).toBe(3723);
    expect(parseTimecode('')).toBeNull();
    expect(parseTimecode('1:99')).toBeNaN();
    expect(parseTimecode('abc')).toBeNaN();
    expect(formatTimecode(3723)).toBe('1:02:03');
    expect(formatTimecode(83)).toBe('01:23');
    expect(formatTimecode(null)).toBe('');
  });

  it('hex + slug', () => {
    expect(normalizeHex('3a5')).toBe('#33AA55');
    expect(normalizeHex('#3a5f7d')).toBe('#3A5F7D');
    expect(uniqueSlug('Spirited Away', ['spirited-away'])).toBe('spirited-away-2');
  });

  it('palette quantization returns dominant colors in order', () => {
    const px = new Uint8ClampedArray(100 * 4);
    for (let i = 0; i < 100; i++) {
      const red = i < 70;
      px.set(red ? [200, 30, 30, 255] : [20, 40, 200, 255], i * 4);
    }
    const pal = quantizePixels(px, 5, 1);
    expect(pal).toHaveLength(2);
    expect(pal[0].hex).toBe('#C81E1E');
    expect(pal[0].share).toBeCloseTo(0.7);
  });
});
