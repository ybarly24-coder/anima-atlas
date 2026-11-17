'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { clearHistory, pushHistory, readHistory, searchHref, type SearchHistoryItem, type SearchMode } from '@/lib/searchHistory';
import { cx } from '@/lib/util';

const MODES: Array<{ id: SearchMode; label: string; placeholder: string; hint: string }> = [
  { id: 'title', label: '작품명', placeholder: '주토피아, Zootopia, 센과 치히로...', hint: '작품을 찾고 포스터·백드롭 이미지 후보를 불러옵니다 (TMDB + 내 라이브러리)' },
  { id: 'keyword', label: '감정·연출 키워드', placeholder: '외로움, 웜톤, 미장센, 로우앵글...', hint: '태그·연구 메모·AI 분석 텍스트에서 장면을 찾습니다' },
  { id: 'mine', label: '내 자료 검색', placeholder: '내가 저장한 장면·보드·메모 검색', hint: '작품·장면·보드·출처·인사이트 전체를 검색합니다' },
];

export function SearchHero({ initialMode = 'title' }: { initialMode?: SearchMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [q, setQ] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  useEffect(() => setHistory(readHistory()), []);
  const cur = MODES.find((m) => m.id === mode)!;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setHistory(pushHistory(q, mode));
    router.push(searchHref(q, mode));
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="검색 모드" className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            type="button"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cx('rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors', mode === m.id ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-2')}
          >
            {m.label}
          </button>
        ))}
      </div>
      <form role="search" onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="hero-q" className="sr-only">어떤 애니메이션을 연구할까요?</label>
        <input
          id="hero-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={cur.placeholder}
          autoComplete="off"
          className="h-14 w-full shrink-0 rounded-xl border border-line-2 bg-card px-5 font-serif text-lg sm:w-auto sm:flex-1 placeholder:font-sans placeholder:text-base placeholder:text-muted/70 focus:border-ink focus:outline-none"
        />
        <button type="submit" className="h-14 shrink-0 rounded-xl bg-ink px-7 text-base font-semibold text-paper hover:bg-ink-2">
          연구 시작
        </button>
      </form>
      <p className="text-xs text-muted">{cur.hint}</p>
      {history.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">최근 검색</span>
          {history.map((h) => (
            <Link key={`${h.mode}:${h.q}`} href={searchHref(h.q, h.mode)} onClick={() => setHistory(pushHistory(h.q, h.mode))} className="rounded-full border border-line-2 bg-card px-2.5 py-0.5 text-xs text-ink-2 hover:border-ink">
              {h.q}
              <span className="ml-1 text-[10px] text-muted">{MODES.find((m) => m.id === h.mode)?.label}</span>
            </Link>
          ))}
          <button type="button" onClick={() => { clearHistory(); setHistory([]); }} className="text-[11px] text-muted underline underline-offset-2">
            지우기
          </button>
        </div>
      )}
    </div>
  );
}
