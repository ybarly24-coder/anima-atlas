import { describe, expect, it } from 'vitest';
import { buildSeedData } from '@seed/index';
import { applyAnalysis, buildFixPrompt, buildManualPrompt, extractJson, MANUAL_MODEL_LABEL, parseManualAnalysis } from '@/lib/manualAnalysis';
import { sample } from './fixtures';

const data = buildSeedData();

describe('Claude-app (subscription) paste bridge', () => {
  it('prompt carries context, enum choices and the tag list', () => {
    const p = buildManualPrompt({ workTitle: '주토피아 (Zootopia, 2016)', sceneTitle: '도시 첫 소개', tags: data.tags });
    expect(p).toContain('주토피아 (Zootopia, 2016)');
    expect(p).toContain('익스트림 롱숏 | 롱숏');
    expect(p).toContain('웜톤 | 쿨톤 | 중성 | 혼합');
    expect(p).toContain('네거티브 스페이스');
    expect(p).toContain('```json');
  });

  it('extracts JSON from a typical claude.ai reply with prose and a code fence', () => {
    const reply = `분석 결과입니다.\n\n\`\`\`json\n${JSON.stringify(sample)}\n\`\`\`\n\n도움이 되었길 바랍니다.`;
    expect(extractJson(reply)).toBe(JSON.stringify(sample));
    const r = parseManualAnalysis(reply);
    expect(r.ok).toBe(true);
  });

  it('accepts bare JSON and trims stray whitespace in enum values', () => {
    const loose = { ...sample, color: { ...sample.color, temperature: ' 쿨톤 ' } };
    const r = parseManualAnalysis(JSON.stringify(loose, null, 2));
    expect(r.ok && r.analysis.color.temperature).toBe('쿨톤');
  });

  it('explains schema problems in Korean field names and offers a fix prompt', () => {
    const bad = { ...sample, camera: { ...sample.camera, shotSize: '아주 멀리' } } as Record<string, unknown>;
    delete bad.caveats;
    const r = parseManualAnalysis(JSON.stringify(bad));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.some((i) => i.startsWith('카메라 › 샷 크기'))).toBe(true);
      expect(r.issues.some((i) => i.startsWith('한계'))).toBe(true);
      expect(buildFixPrompt(r.issues)).toContain('카메라 › 샷 크기');
    }
  });

  it('reports truncated / non-JSON replies honestly', () => {
    expect(parseManualAnalysis('그냥 텍스트 답변').ok).toBe(false);
    const cut = parseManualAnalysis('```json\n{"title": "물 위의 기차", "summary": "잘린')
    expect(cut.ok).toBe(false);
  });

  it('applies the analysis like the API path (title, known tags only, model label)', () => {
    const scene = { ...data.scenes.find((s) => s.seedCode === 'S-G02')!, sceneImageAssetId: 'asset-1' };
    const next = applyAnalysis(scene, sample, MANUAL_MODEL_LABEL, data.tags);
    expect(next.aiAnalysis?.model).toBe(MANUAL_MODEL_LABEL);
    expect(next.aiAnalysis?.imageAssetId).toBe('asset-1');
    expect(next.title).toBe(scene.title); // keeps the user's title
    expect(next.tagIds).toContain('emo-solitude');
    expect(next.tagIds).toContain('spc-negative');
    expect(next.tagIds.length).toBe(new Set(next.tagIds).size); // '없는태그' ignored, no duplicates
  });
});
