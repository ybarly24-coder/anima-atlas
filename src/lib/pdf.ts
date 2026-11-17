// Minimal dependency-free PDF writer: one JPEG image per page, page sized to the image.
// JPEG data is embedded as-is (DCTDecode), so quality is exactly what the browser rendered.

export interface PdfJpegPage {
  jpeg: Uint8Array; // raw JPEG bytes
  widthPx: number; // pixel size of the JPEG
  heightPx: number;
  pageWidthPt: number; // page size in PDF points (1/72 inch)
  pageHeightPt: number;
}

const enc = new TextEncoder();

export function jpegPagesToPdf(pages: PdfJpegPage[], meta?: { title?: string }): Uint8Array<ArrayBuffer> {
  if (!pages.length) throw new Error('PDF에 넣을 페이지가 없습니다.');
  const chunks: Uint8Array[] = [];
  const offsets: number[] = []; // offsets[objNum] = byte offset
  let length = 0;
  const push = (b: Uint8Array | string) => {
    const bytes = typeof b === 'string' ? enc.encode(b) : b;
    chunks.push(bytes);
    length += bytes.length;
  };
  const startObj = (n: number) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
  };

  // Object numbering: 1 catalog, 2 pages, 3 info, then 3 objects per page (page, content, image).
  const pageObj = (i: number) => 4 + i * 3;
  const contentObj = (i: number) => 5 + i * 3;
  const imageObj = (i: number) => 6 + i * 3;
  const total = 3 + pages.length * 3;

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  startObj(1);
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  startObj(2);
  push(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] >>\nendobj\n`);

  startObj(3);
  // PDF text strings: use UTF-16BE with BOM (hex) so Korean titles survive.
  const hex = (s: string) => {
    let h = 'FEFF';
    for (const ch of s) {
      const cp = ch.codePointAt(0)!;
      if (cp > 0xffff) {
        const v = cp - 0x10000;
        h += (0xd800 + (v >> 10)).toString(16).padStart(4, '0') + (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, '0');
      } else h += cp.toString(16).padStart(4, '0');
    }
    return `<${h.toUpperCase()}>`;
  };
  push(`<< /Producer ${hex('ANIMA ATLAS')}${meta?.title ? ` /Title ${hex(meta.title)}` : ''} >>\nendobj\n`);

  pages.forEach((p, i) => {
    const w = p.pageWidthPt.toFixed(2);
    const h = p.pageHeightPt.toFixed(2);
    startObj(pageObj(i));
    push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im${i} ${imageObj(i)} 0 R >> >> /Contents ${contentObj(i)} 0 R >>\nendobj\n`);

    const content = `q\n${w} 0 0 ${h} 0 0 cm\n/Im${i} Do\nQ\n`;
    startObj(contentObj(i));
    push(`<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`);

    startObj(imageObj(i));
    push(`<< /Type /XObject /Subtype /Image /Width ${p.widthPx} /Height ${p.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`);
    push(p.jpeg);
    push('\nendstream\nendobj\n');
  });

  const xrefAt = length;
  let xref = `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= total; n++) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  push(xref);
  push(`trailer\n<< /Size ${total + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  const out = new Uint8Array(new ArrayBuffer(length));
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(',')[1] ?? '';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
