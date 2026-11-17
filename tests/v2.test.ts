import { afterEach, describe, expect, it } from 'vitest';
import { buildSeedData } from '@seed/index';
import { guessCategory, isValidTmdbPath, mergeSearch } from '@/lib/tmdb';
import { hueFamily, importImageAsScene, matchWork, sceneHueFamilies, sha256Hex, workFromTmdb } from '@/lib/imports';
import { emptyFilters, runExplore } from '@/lib/search';
import type { MediaAsset, Scene } from '@/lib/types';
import { GET as searchRoute } from '@/app/api/tmdb/search/route';
import { GET as imageRoute } from '@/app/api/tmdb/image/route';
import { GET as statusRoute } from '@/app/api/tmdb/status/route';
import { authed } from './fixtures';

const zootopiaKo = { id: 269149, title: '주토피아', original_title: 'Zootopia', original_language: 'en', release_date: '2016-02-11', poster_path: '/ko.jpg', backdrop_path: '/b.jpg', overview: '한국어 개요', genre_ids: [16, 12] };
const zootopiaEn = { ...zootopiaKo, title: 'Zootopia', poster_path: '/en.jpg', overview: 'English overview' };
const liveAction = { id: 1, title: 'Zoo', original_title: 'Zoo', release_date: '2000-01-01', genre_ids: [18] };

describe('TMDB search merge (MVP test 1: 주토피아 == Zootopia)', () => {
  it('merges ko-KR and en-US results by id, keeping both titles', () => {
    const r = mergeSearch([zootopiaKo], [zootopiaEn, liveAction]);
    expect(r.filter((x) => x.id === 269149)).toHaveLength(1);
    const z = r.find((x) => x.id === 269149)!;
    expect(z.titleKo).toBe('주토피아');
    expect(z.titleEn).toBe('Zootopia');
    expect(z.releaseYear).toBe(2016);
    expect(z.overview).toBe('한국어 개요');
  });

  it('puts animation first', () => {
    const r = mergeSearch([], [liveAction, zootopiaEn]);
    expect(r[0].id).toBe(269149);
  });

  it('guesses the research category from production companies', () => {
    expect(guessCategory(['Walt Disney Animation Studios', 'Walt Disney Pictures'])).toBe('disney');
    expect(guessCategory(['Studio Ghibli'])).toBe('ghibli');
    expect(guessCategory(['Sony Pictures Animation', 'Columbia Pictures'])).toBe('sony');
    expect(guessCategory(['Pixar', 'Walt Disney Pictures'])).toBe('other'); // Pixar is not WDAS
    expect(guessCategory(['DreamWorks Animation'])).toBe('other');
  });

  it('only accepts well-formed TMDB file paths for the image proxy', () => {
    expect(isValidTmdbPath('/abc_DEF-123.jpg')).toBe(true);
    expect(isValidTmdbPath('/../etc/passwd')).toBe(false);
    expect(isValidTmdbPath('https://evil.example/x.jpg')).toBe(false);
    expect(isValidTmdbPath('/a.jpg?x=1')).toBe(false);
  });
});

describe('TMDB routes without a key (MVP test 2: friendly fallback)', () => {
  const saved = { t: process.env.TMDB_READ_ACCESS_TOKEN, k: process.env.TMDB_API_KEY };
  afterEach(() => {
    process.env.TMDB_READ_ACCESS_TOKEN = saved.t;
    process.env.TMDB_API_KEY = saved.k;
  });

  it('search reports configured:false instead of failing', async () => {
    delete process.env.TMDB_READ_ACCESS_TOKEN;
    delete process.env.TMDB_API_KEY;
    const res = await searchRoute(await authed('http://x/api/tmdb/search?q=주토피아'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ configured: false, results: [] });
    const st = await statusRoute(await authed('http://x/api/tmdb/status'));
    expect((await st.json()).tmdb).toBe(false);
  });

  it('image proxy rejects bad paths and sizes without fetching', async () => {
    expect((await imageRoute(await authed('http://x/api/tmdb/image?path=/../x.jpg&size=w780'))).status).toBe(400);
    expect((await imageRoute(await authed('http://x/api/tmdb/image?path=/ok.jpg&size=w9999'))).status).toBe(400);
  });
});

describe('work matching & creation', () => {
  const data = buildSeedData();
  it('links a TMDB result to the seed work by title + year (no duplicate work)', () => {
    const m = { id: 269149, titleKo: '주토피아', titleEn: 'Zootopia', originalTitle: 'Zootopia', releaseYear: 2016 };
    expect(matchWork(data.works, m)?.id).toBe('work-disney-zootopia');
    const ghibli = { id: 129, titleKo: '센과 치히로의 행방불명', titleEn: 'Spirited Away', originalTitle: '千と千尋の神隠し', releaseYear: 2001 };
    expect(matchWork(data.works, ghibli)?.id).toBe('work-ghibli-spirited');
  });

  it('does not match a same-title film from a different year', () => {
    expect(matchWork(data.works, { id: 9, titleKo: '모아나', titleEn: 'Moana', originalTitle: 'Moana', releaseYear: 2026 })).toBeUndefined();
  });

  it('creates a Work that labels TMDB overview as provider metadata', () => {
    const w = workFromTmdb({ id: 1, titleKo: '테스트', titleEn: 'Test Film', originalTitle: 'Test Film', releaseYear: 2020, posterPath: '/p.jpg', overview: '줄거리', companies: ['X Studio'] }, 'other', []);
    expect(w.tmdbId).toBe(1);
    expect(w.slug).toBe('test-film');
    expect(w.synopsisKo).toContain('TMDB 제공');
  });
});

describe('colour helpers & hue filter (MVP test 6)', () => {
  it('classifies hue families', () => {
    expect(hueFamily('#C81E1E')).toBe('red');
    expect(hueFamily('#2A5BD7')).toBe('blue');
    expect(hueFamily('#F2C230')).toBe('yellow');
    expect(hueFamily('#808080')).toBe('neutral');
  });

  it('filters scenes by dominant hue family from their real palette', () => {
    const data = buildSeedData();
    const s = data.scenes.find((x) => x.seedCode === 'S-G02')!;
    s.colorAnalysis = { swatches: [{ hex: '#2A5BD7', proportion: 0.7 }, { hex: '#F2C230', proportion: 0.3 }], algorithmVersion: 't', extractedFromAssetId: 'a', createdAt: '' };
    expect(sceneHueFamilies(s)).toEqual(['blue', 'yellow']);
    const r = runExplore(data, { ...emptyFilters(), hues: ['blue'] });
    expect(r.scenes.map((x) => x.id)).toEqual([s.id]);
    // Scenes without a palette are never guessed into a hue.
    expect(runExplore(data, { ...emptyFilters(), hues: ['red'] }).scenes).toHaveLength(0);
  });
});

describe('importImageAsScene (MVP test 3 / duplicate prevention)', () => {
  it('stores provenance, never invents a palette it could not compute, and dedupes by content hash', async () => {
    const assets: MediaAsset[] = [];
    const scenes: Scene[] = [];
    const deps = {
      get scenes() { return scenes; },
      saveAssetFromFile: async (b: Blob, meta: Partial<MediaAsset> & { alt: string }) => {
        const id = `asset-${assets.length + 1}`;
        assets.push({ ...meta, id, kind: 'approved_external', urlOrLocalPath: `idb://${id}`, blob: b, createdAt: '' } as MediaAsset);
        return id;
      },
      findAssetByHash: async (h: string) => assets.find((a) => a.contentHash === h),
      saveScene: async (s: Scene) => { scenes.push(s); },
    };
    const blob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/png' });
    const input = { blob, workId: 'work-disney-zootopia', title: '주토피아 스틸 1', imageType: 'promotional_still' as const, provider: 'tmdb' as const, sourcePageUrl: 'https://www.themoviedb.org/movie/269149', originalImageUrl: 'https://image.tmdb.org/t/p/original/x.jpg', attribution: 'TMDB' };
    const first = await importImageAsScene(input, deps);
    expect(first.duplicate).toBe(false);
    // Not a decodable image in Node -> palette must be null ("분석 불가"), not fabricated.
    expect(first.paletteOk).toBe(false);
    expect(first.scene.colorAnalysis).toBeNull();
    expect(first.scene.imageType).toBe('promotional_still');
    expect(first.scene.verificationStatus).toBe('unverified');
    expect(assets[0].contentHash).toBe(await sha256Hex(blob));
    expect(assets[0].sourceProvider).toBe('tmdb');
    expect(assets[0].licenseStatus).toBe('unverified');
    const second = await importImageAsScene(input, deps);
    expect(second.duplicate).toBe(true);
    expect(second.scene.id).toBe(first.scene.id);
    expect(scenes).toHaveLength(1);
  });
});

describe('getMovie parsing (mocked TMDB responses)', () => {
  it('builds Korean+English details, guesses category, puts text-free backdrops first', async () => {
    const { getMovie } = await import('@/lib/tmdb');
    process.env.TMDB_READ_ACCESS_TOKEN = 'test-token';
    const seen: string[] = [];
    const fake = (async (url: URL | string, init?: RequestInit) => {
      const u = new URL(String(url));
      seen.push(`${u.pathname}?${u.searchParams.toString()}|${(init?.headers as Record<string, string>)?.Authorization}`);
      const body = u.pathname.endsWith('/images')
        ? { backdrops: [{ file_path: '/t.jpg', width: 1920, height: 1080, aspect_ratio: 1.78, iso_639_1: 'en', vote_average: 9 }, { file_path: '/n.jpg', width: 1920, height: 1080, aspect_ratio: 1.78, iso_639_1: null, vote_average: 1 }], posters: [{ file_path: '/p.jpg', width: 1000, height: 1500, aspect_ratio: 0.67, iso_639_1: 'ko' }] }
        : u.searchParams.get('language') === 'ko-KR'
          ? { id: 269149, title: '주토피아', original_title: 'Zootopia', overview: '한국어', release_date: '2016-02-11', poster_path: '/ko.jpg', genres: [{ id: 16, name: '애니메이션' }], production_companies: [{ id: 1, name: 'Walt Disney Animation Studios' }] }
          : { id: 269149, title: 'Zootopia', original_title: 'Zootopia', original_language: 'en', overview: 'EN', release_date: '2016-02-11', runtime: 108, genres: [{ id: 16, name: 'Animation' }], production_companies: [{ id: 1, name: 'Walt Disney Animation Studios' }], homepage: 'https://movies.disney.com/zootopia' };
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;
    const m = await getMovie(269149, fake);
    delete process.env.TMDB_READ_ACCESS_TOKEN;
    expect(m.titleKo).toBe('주토피아');
    expect(m.titleEn).toBe('Zootopia');
    expect(m.categoryGuess).toBe('disney');
    expect(m.isAnimation).toBe(true);
    expect(m.images.backdrops.map((b) => b.filePath)).toEqual(['/n.jpg', '/t.jpg']);
    expect(m.images.posters).toHaveLength(1);
    expect(seen.every((x) => x.endsWith('|Bearer test-token'))).toBe(true);
    expect(seen.some((x) => x.includes('include_image_language=ko%2Cen%2Cja%2Cnull'))).toBe(true);
  });
});

describe('"웜톤" search uses the real palette (MVP test 6)', () => {
  it('finds a scene whose extracted palette is warm, and not one that is cool', async () => {
    const { paletteTemperature } = await import('@/lib/imports');
    const data = buildSeedData();
    const warm = data.scenes.find((x) => x.seedCode === 'S-D10')!;
    const cool = data.scenes.find((x) => x.seedCode === 'S-G02')!;
    warm.colorAnalysis = { swatches: [{ hex: '#E8A33D', proportion: 0.53 }, { hex: '#C4532D', proportion: 0.37 }, { hex: '#2F4F6F', proportion: 0.1 }], algorithmVersion: 't', extractedFromAssetId: 'a', createdAt: '' };
    cool.colorAnalysis = { swatches: [{ hex: '#A7CADC', proportion: 0.6 }, { hex: '#3A6B85', proportion: 0.4 }], algorithmVersion: 't', extractedFromAssetId: 'b', createdAt: '' };
    expect(paletteTemperature(warm)).toBe('warm');
    expect(paletteTemperature(cool)).toBe('cool');
    const ids = runExplore(data, { ...emptyFilters(), q: '웜톤' }).scenes.map((s) => s.id);
    expect(ids).toContain(warm.id);
    expect(ids).not.toContain(cool.id);
    // Studio filter + emotion keyword still combine
    expect(runExplore(data, { ...emptyFilters(), categories: ['ghibli'], q: '외로움' }).scenes.length).toBeGreaterThan(0);
    expect(runExplore(data, { ...emptyFilters(), categories: ['sony'], q: '미장센' }).scenes.every((s) => s.workId.startsWith('work-sony'))).toBe(true);
  });
});
