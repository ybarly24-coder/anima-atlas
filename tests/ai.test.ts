import { afterEach, describe, expect, it } from 'vitest';
import { buildSeedData } from '@seed/index';
import { SceneAnalysisSchema } from '@/lib/aiSchema';
import { authed, sample } from './fixtures';
import { emptyFilters, runExplore } from '@/lib/search';
import { POST } from '@/app/api/analyze/route';

describe('AI analysis schema', () => {
  it('accepts a well-formed analysis', () => {
    expect(SceneAnalysisSchema.parse(sample).camera.shotSize).toBe('익스트림 롱숏');
  });

  it('rejects an invalid enum value', () => {
    expect(() => SceneAnalysisSchema.parse({ ...sample, camera: { ...sample.camera, shotSize: '아무거나' } })).toThrow();
  });
});

describe('search includes AI analysis text', () => {
  it('finds a scene by words that only appear in its AI analysis', () => {
    const data = buildSeedData();
    const s = data.scenes.find((x) => x.seedCode === 'S-G04')!;
    s.aiAnalysis = { analysis: sample, model: 'claude-opus-5-5', createdAt: '2026-11-15T00:00:00Z', imageAssetId: null };
    const r = runExplore(data, { ...emptyFilters(), q: '쓸쓸한 고요' });
    expect(r.scenes.map((x) => x.id)).toEqual([s.id]);
  });
});

describe('/api/analyze route', () => {
  const saved = { key: process.env.ANTHROPIC_API_KEY, token: process.env.ANTHROPIC_AUTH_TOKEN };
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = saved.key;
    process.env.ANTHROPIC_AUTH_TOKEN = saved.token;
  });

  it('returns 503 API_KEY_MISSING when no key is configured (no network call)', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
    const res = await POST(await authed('http://x/api/analyze', { method: 'POST', body: JSON.stringify({ imageBase64: 'AAAA', mediaType: 'image/png' }) }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('API_KEY_MISSING');
  });

  it('rejects unsupported media types before calling the API', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-not-used';
    const res = await POST(await authed('http://x/api/analyze', { method: 'POST', body: JSON.stringify({ imageBase64: 'AAAA', mediaType: 'image/svg+xml' }) }));
    expect(res.status).toBe(400);
  });
});
