import { describe, expect, it } from 'vitest';
import { jpegPagesToPdf } from '@/lib/pdf';

// A tiny but valid baseline JPEG (1x1 white pixel).
const JPEG_1PX = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='), (c) => c.charCodeAt(0));

const latin1 = (b: Uint8Array) => Array.from(b, (c) => String.fromCharCode(c)).join('');

describe('jpegPagesToPdf', () => {
  const pages = [
    { jpeg: JPEG_1PX, widthPx: 1, heightPx: 1, pageWidthPt: 540, pageHeightPt: 675 },
    { jpeg: JPEG_1PX, widthPx: 1, heightPx: 1, pageWidthPt: 540, pageHeightPt: 900 },
  ];
  const pdf = jpegPagesToPdf(pages, { title: '물 위의 기차 — 카드뉴스' });
  const text = latin1(pdf);

  it('has a valid header, trailer and one page per card', () => {
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain('/Type /Pages /Count 2');
    expect(text.match(/\/Type \/Page /g)).toHaveLength(2);
    expect(text).toContain('/MediaBox [0 0 540.00 675.00]');
    expect(text).toContain('/MediaBox [0 0 540.00 900.00]'); // a taller card gets a taller page
    expect(text.match(/\/Filter \/DCTDecode/g)).toHaveLength(2);
  });

  it('xref offsets point exactly at each object, and startxref at the xref table', () => {
    const startxref = Number(/startxref\n(\d+)/.exec(text)![1]);
    expect(text.slice(startxref, startxref + 4)).toBe('xref');
    const entries = text.slice(startxref).split('\n').slice(2).filter((l) => / 00000 n $/.test(l));
    expect(entries).toHaveLength(3 + pages.length * 3);
    entries.forEach((line, i) => {
      const off = Number(line.slice(0, 10));
      expect(text.slice(off, off + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`);
    });
  });

  it('embeds the JPEG bytes unchanged and stores a Korean title as UTF-16', () => {
    expect(text).toContain(latin1(JPEG_1PX));
    expect(text).toContain(`/Length ${JPEG_1PX.length}`);
    expect(text).toMatch(/\/Title <FEFF[0-9A-F]+>/);
  });

  it('refuses to build an empty PDF', () => {
    expect(() => jpegPagesToPdf([])).toThrow();
  });
});
