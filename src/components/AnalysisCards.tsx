'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AiAnalysisRecord } from '@/lib/aiSchema';
import { extractPaletteFromBlob, type PaletteColor } from '@/lib/palette';
import { cx, formatDate } from '@/lib/util';

type Section = { headline: string; points: string[] };

interface CardDef {
  key: string;
  kicker: string;
  title: string;
  body: ReactNode;
}

function Points({ points }: { points: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {points.map((p, i) => (
        <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-2">
          <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-paper">{i + 1}</span>
          <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}

function Chips({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-2 gap-1.5">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-md border border-line bg-paper px-2.5 py-1.5">
          <dt className="text-[9.5px] font-semibold uppercase tracking-wider text-muted">{k}</dt>
          <dd className="text-[13px] font-semibold text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Headline({ children }: { children: ReactNode }) {
  return <p className="font-serif text-[19px] font-semibold leading-snug text-ink">{children}</p>;
}

function sectionCard(key: string, kicker: string, title: string, s: Section, extra?: ReactNode): CardDef {
  return {
    key,
    kicker,
    title,
    body: (
      <div className="flex flex-col gap-4">
        <Headline>{s.headline}</Headline>
        {extra}
        <Points points={s.points} />
      </div>
    ),
  };
}

function ThirdsImage({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="relative overflow-hidden rounded-md border border-line">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="block max-h-40 w-full object-cover" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <g stroke="white" strokeOpacity="0.9" strokeWidth="0.4" vectorEffect="non-scaling-stroke">
          <line x1="33.33" y1="0" x2="33.33" y2="100" /><line x1="66.66" y1="0" x2="66.66" y2="100" />
          <line x1="0" y1="33.33" x2="100" y2="33.33" /><line x1="0" y1="66.66" x2="100" y2="66.66" />
        </g>
      </svg>
      <span className="absolute bottom-1 right-1 rounded bg-ink/70 px-1.5 py-0.5 text-[9px] text-paper">삼분할 가이드</span>
    </div>
  );
}

export function buildCards(rec: AiAnalysisRecord, opts: { imageUrl: string | null; workLabel?: string; palette: PaletteColor[] }): CardDef[] {
  const a = rec.analysis;
  const { imageUrl, workLabel, palette } = opts;
  return [
    {
      key: 'cover',
      kicker: 'SCENE ANALYSIS',
      title: a.title,
      body: (
        <div className="flex flex-col gap-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={a.title} className="max-h-56 w-full rounded-md border border-line object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-line-2 text-xs text-muted">이미지 없음</div>
          )}
          {workLabel && <p className="text-xs font-semibold tracking-wide text-muted">{workLabel}</p>}
          <Headline>{a.summary}</Headline>
          <p className="text-[13px] leading-relaxed text-ink-2">{a.sceneDescription}</p>
        </div>
      ),
    },
    sectionCard('mise', 'MISE-EN-SCÈNE', '미장센', a.miseEnScene),
    sectionCard(
      'color',
      'COLOR',
      '색감',
      a.color,
      <div className="flex flex-col gap-2.5">
        {palette.length > 0 && (
          <div>
            <div className="flex h-10 overflow-hidden rounded-md border border-line">
              {palette.map((p) => <div key={p.hex} style={{ background: p.hex, flex: Math.max(p.share, 0.06) }} title={p.hex} />)}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-2 font-mono text-[10px] text-muted">
              {palette.map((p) => <span key={p.hex}>{p.hex} {Math.round(p.share * 100)}%</span>)}
            </div>
            <p className="mt-0.5 text-[9.5px] text-muted">이 이미지에서 추출한 샘플 팔레트 (작품의 컬러 스크립트 아님)</p>
          </div>
        )}
        <Chips items={[['색온도', a.color.temperature], ['채도', a.color.saturation], ['대비', a.color.contrast], ['분위기', a.color.mood]]} />
      </div>,
    ),
    sectionCard(
      'composition',
      'COMPOSITION',
      '구도',
      a.composition,
      <div className="flex flex-col gap-2.5">
        {imageUrl && <ThirdsImage url={imageUrl} alt={`${a.title} 구도 가이드`} />}
        <Chips items={[['구도 원리', a.composition.framing], ['시선의 초점', a.composition.focalPoint]]} />
      </div>,
    ),
    sectionCard(
      'camera',
      'CAMERA',
      '카메라',
      a.camera,
      <Chips items={[['샷 크기', a.camera.shotSize], ['앵글', a.camera.angle], ['렌즈감(추정)', a.camera.lensFeel], ['움직임(추정)', a.camera.movementGuess]]} />,
    ),
    sectionCard('lighting', 'LIGHTING', '조명', a.lighting),
    sectionCard('blocking', 'BLOCKING', '인물·사물 위치', a.blocking),
    sectionCard('narrative', 'NARRATIVE', '서사·감정', a.narrative),
    sectionCard('technique', 'TECHNIQUE', '표현 기법', a.technique, <p className="text-[11px] text-muted">화면에서 관찰되는 표현입니다. 실제 제작 공정은 공식 출처로 확인하세요.</p>),
    {
      key: 'apply',
      kicker: 'APPLY',
      title: '내 작품에 적용하기',
      body: (
        <div className="flex flex-col gap-4">
          <Points points={a.takeaways} />
          <div className="rounded-md border border-[#ecd6ab] bg-hypo-bg/60 p-3 text-[12px] leading-relaxed text-hypo">
            <p className="mb-1 font-semibold">분석의 한계</p>
            <p>{a.caveats}</p>
          </div>
        </div>
      ),
    },
  ];
}

export function AnalysisCards({ record, imageUrl, imageBlob, workLabel, fileBase = 'scene', pdfName }: { record: AiAnalysisRecord; imageUrl: string | null; imageBlob?: Blob | null; workLabel?: string; fileBase?: string; pdfName?: string }) {
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState<null | 'png' | 'pdf'>(null);
  const [progress, setProgress] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    let cancelled = false;
    if (imageBlob) extractPaletteFromBlob(imageBlob, 6).then((p) => !cancelled && setPalette(p)).catch(() => setPalette([]));
    else setPalette([]);
    return () => {
      cancelled = true;
    };
  }, [imageBlob]);

  const cards = buildCards(record, { imageUrl, workLabel, palette });
  const total = cards.length;

  const go = useCallback((i: number) => {
    const el = scroller.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(total - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    setIndex(clamped);
  }, [total]);

  const capturing = useRef(false);
  const onScroll = () => {
    const el = scroller.current;
    if (el && !capturing.current) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  // Rendering a card to PNG can nudge the snap container; pin it back to where the user was.
  const pin = (left: number) => {
    const el = scroller.current;
    if (!el) return;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = 'auto';
    el.scrollLeft = left;
    el.style.scrollBehavior = prev;
  };

  /**
   * Render one card to an image. The on-screen card has a fixed 4:5 box with a scrolling body;
   * for export it is grown to fit its full text so nothing is clipped.
   */
  const renderCard = async (i: number, format: 'png' | 'jpeg', pixelRatio: number) => {
    const node = cardRefs.current[i];
    if (!node) return null;
    const body = node.querySelector<HTMLElement>('[data-card-body]');
    const overflow = body ? Math.max(0, body.scrollHeight - body.clientHeight) : 0;
    const width = node.offsetWidth;
    const height = node.offsetHeight + overflow;
    const lib = await import('html-to-image');
    const opts = {
      pixelRatio,
      cacheBust: false, // cache-busting appends ?ts to blob: URLs, which breaks them
      backgroundColor: '#fffdf9',
      width,
      height,
      // The on-screen card is centred with auto margins and a fixed aspect ratio; the export must not carry them.
      style: { margin: '0', height: `${height}px`, aspectRatio: 'auto' },
    };
    const dataUrl = format === 'png' ? await lib.toPng(node, opts) : await lib.toJpeg(node, { ...opts, quality: 0.92 });
    return { dataUrl, width, height };
  };

  const withPinnedScroll = async (fn: () => Promise<void>) => {
    const el = scroller.current;
    const keepLeft = el?.scrollLeft ?? 0;
    const keepIndex = index;
    capturing.current = true;
    try {
      await fn();
    } finally {
      pin(keepLeft);
      // Let any pending snap settle before index tracking resumes.
      setTimeout(() => {
        pin(keepLeft);
        capturing.current = false;
        setIndex(keepIndex);
      }, 400);
      setProgress('');
      setBusy(null);
    }
    return keepLeft;
  };

  const download = async (which: 'current' | 'all') => {
    setBusy('png');
    const keepLeft = scroller.current?.scrollLeft ?? 0;
    await withPinnedScroll(async () => {
      const targets = which === 'current' ? [index] : cards.map((_, i) => i);
      for (const i of targets) {
        const r = await renderCard(i, 'png', 2);
        pin(keepLeft);
        if (!r) continue;
        const a = document.createElement('a');
        a.href = r.dataUrl;
        a.download = `${fileBase}-${String(i + 1).padStart(2, '0')}-${cards[i].key}.png`;
        a.click();
        await new Promise((res) => setTimeout(res, 250));
        pin(keepLeft);
      }
    });
  };

  /** All cards → one PDF (one card per page, page sized to the card). */
  const downloadPdf = async () => {
    setBusy('pdf');
    const keepLeft = scroller.current?.scrollLeft ?? 0;
    await withPinnedScroll(async () => {
      const { jpegPagesToPdf, dataUrlToBytes } = await import('@/lib/pdf');
      const PAGE_WIDTH_PT = 540; // 7.5 in wide; height follows each card's proportions
      const ratio = 3;
      const pages = [];
      for (let i = 0; i < cards.length; i++) {
        setProgress(`${i + 1}/${cards.length}`);
        const r = await renderCard(i, 'jpeg', ratio);
        pin(keepLeft);
        if (!r) continue;
        pages.push({
          jpeg: dataUrlToBytes(r.dataUrl),
          widthPx: Math.round(r.width * ratio),
          heightPx: Math.round(r.height * ratio),
          pageWidthPt: PAGE_WIDTH_PT,
          pageHeightPt: (PAGE_WIDTH_PT * r.height) / r.width,
        });
      }
      const title = pdfName || record.analysis.title;
      const bytes = jpegPagesToPdf(pages, { title: `${title} — ANIMA ATLAS 카드뉴스` });
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 60)}_카드뉴스.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
  };

  return (
    <section aria-roledescription="carousel" aria-label="AI 장면 분석 카드뉴스" className="flex flex-col gap-3">
      <div
        ref={scroller}
        onScroll={onScroll}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
        }}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-xl [scrollbar-width:none] focus-visible:outline-2"
      >
        {cards.map((c, i) => (
          <div key={c.key} className="w-full shrink-0 snap-center px-0.5" aria-roledescription="slide" aria-label={`${i + 1} / ${total}: ${c.title}`}>
            <div ref={(el) => { cardRefs.current[i] = el; }} className="mx-auto flex aspect-[4/5] w-full max-w-[440px] flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-line px-5 py-2.5">
                <span className="text-[10px] font-bold tracking-[0.2em] text-muted">{c.kicker}</span>
                <span className="font-mono text-[10px] text-muted">{String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
              </div>
              <div data-card-body className="flex-1 overflow-y-auto px-5 py-4">
                <h3 className="mb-3 font-serif text-[24px] font-bold leading-tight text-ink">{c.title}</h3>
                {c.body}
              </div>
              <div className="flex items-center justify-between border-t border-line bg-paper px-5 py-2 text-[9.5px] text-muted">
                <span className="font-semibold tracking-[0.14em]">ANIMA ATLAS</span>
                <span>AI 분석 · 자동 생성 해석 · 검증 필요</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="h-8 w-8 rounded-full border border-line-2 bg-card text-sm disabled:opacity-40" aria-label="이전 카드">‹</button>
        <div className="flex gap-1.5" role="tablist" aria-label="카드 선택">
          {cards.map((c, i) => (
            <button key={c.key} type="button" role="tab" aria-selected={i === index} aria-label={`${i + 1}. ${c.title}`} onClick={() => go(i)} className={cx('h-2 rounded-full transition-all', i === index ? 'w-5 bg-ink' : 'w-2 bg-line-2 hover:bg-muted')} />
          ))}
        </div>
        <button type="button" onClick={() => go(index + 1)} disabled={index === total - 1} className="h-8 w-8 rounded-full border border-line-2 bg-card text-sm disabled:opacity-40" aria-label="다음 카드">›</button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <button type="button" onClick={downloadPdf} disabled={!!busy} className="rounded-md border border-ink bg-ink px-3 py-1.5 font-medium text-paper hover:bg-ink-2 disabled:opacity-50">{busy === 'pdf' ? `PDF 만드는 중… ${progress}` : `전체 ${total}장 PDF로 저장`}</button>
        <button type="button" onClick={() => download('current')} disabled={!!busy} className="rounded-md border border-line-2 bg-card px-3 py-1.5 hover:bg-paper-2 disabled:opacity-50">이 카드 PNG</button>
        <button type="button" onClick={() => download('all')} disabled={!!busy} className="rounded-md border border-line-2 bg-card px-3 py-1.5 hover:bg-paper-2 disabled:opacity-50">{busy === 'png' ? '저장 중…' : `전체 PNG ${total}장`}</button>
        <span className="text-muted">{record.model} · {formatDate(record.createdAt)} 분석</span>
      </div>
    </section>
  );
}
