import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { deleteEntities, ensureSeeded, loadAll, openAtlasDb, putEntities, replaceAll } from '@/lib/db';
import { analyzeConflicts, makeBackup, mergeData, validateBackup, BackupError } from '@/lib/backup';

let n = 0;
const freshDb = () => openAtlasDb(`atlas-test-${++n}`);

describe('IndexedDB persistence (spec 4.1 / H-6, H-7, H-14)', () => {
  it('seeds only on first run', async () => {
    const db = await freshDb();
    expect(await ensureSeeded(db)).toBe(true);
    expect(await ensureSeeded(db)).toBe(false);
    const all = await loadAll(db);
    expect(all.works).toHaveLength(11);
    expect(all.scenes).toHaveLength(34);
    expect(all.boards).toHaveLength(9);
  });

  it('user edits and deletions survive a "restart" (reopen + ensureSeeded)', async () => {
    const name = `atlas-restart-${Date.now()}`;
    let db = await openAtlasDb(name);
    await ensureSeeded(db);
    let all = await loadAll(db);
    const scene = all.scenes.find((s) => s.seedCode === 'S-G02')!;
    await putEntities(db, 'scenes', [{ ...scene, observation: '직접 관찰: 수평선이 화면 중앙', startSeconds: 4000, updatedAt: new Date().toISOString() }]);
    await deleteEntities(db, 'works', ['work-sony-into']);
    db.close();

    db = await openAtlasDb(name);
    expect(await ensureSeeded(db)).toBe(false);
    all = await loadAll(db);
    const again = all.scenes.find((s) => s.id === scene.id)!;
    expect(again.observation).toBe('직접 관찰: 수평선이 화면 중앙');
    expect(again.startSeconds).toBe(4000);
    expect(all.works.find((w) => w.id === 'work-sony-into')).toBeUndefined();
  });

  it('new scene + board with multiple scenes persists', async () => {
    const name = `atlas-board-${Date.now()}`;
    let db = await openAtlasDb(name);
    await ensureSeeded(db);
    const now = new Date().toISOString();
    await putEntities(db, 'scenes', [{
      id: 'scene-user-1', workId: 'work-ghibli-totoro', title: '사용자 장면', startSeconds: null, endSeconds: null, lensIds: ['visual'], tagIds: [], colors: [],
      sourceIds: [], verificationStatus: 'unverified', isBookmark: false, createdAt: now, updatedAt: now,
    }]);
    await putEntities(db, 'boards', [{
      id: 'board-user-1', title: '내 보드', researchQuestion: 'Q', status: 'in_progress', categoryIds: ['ghibli'], lensIds: [], sceneIds: ['scene-user-1', 'scene-s-g02'],
      sceneNotes: {}, workIds: [], commonalities: '', differences: '', counterexamples: '', findings: '', applications: '', sourceIds: [], createdAt: now, updatedAt: now,
    }]);
    db.close();
    db = await openAtlasDb(name);
    await ensureSeeded(db);
    const all = await loadAll(db);
    expect(all.scenes.some((s) => s.id === 'scene-user-1')).toBe(true);
    expect(all.boards.find((b) => b.id === 'board-user-1')!.sceneIds).toEqual(['scene-user-1', 'scene-s-g02']);
  });

  it('backup -> replace -> restore round-trip', async () => {
    const db = await freshDb();
    await ensureSeeded(db);
    const before = await loadAll(db);
    const file = validateBackup(JSON.parse(JSON.stringify(makeBackup(before, []))));
    await replaceAll(db, { works: [], scenes: [], boards: [], sources: [], tags: [], insights: [], comparisons: [] });
    expect((await loadAll(db)).works).toHaveLength(0);
    await replaceAll(db, mergeData(await loadAll(db), file.data, 'replace_all'));
    const after = await loadAll(db);
    expect(after.scenes).toHaveLength(before.scenes.length);
    expect(after.sources).toHaveLength(before.sources.length);
  });
});

describe('backup validation & merge', () => {
  it('rejects non-atlas files', () => {
    expect(() => validateBackup({ foo: 1 })).toThrow(BackupError);
    expect(() => validateBackup({ app: 'anima-atlas', schemaVersion: 1, data: { works: [] } })).toThrow(/scenes/);
  });

  it('detects conflicts and merges by strategy', () => {
    const base = { works: [], scenes: [], boards: [], sources: [], tags: [], insights: [], comparisons: [] };
    const local = { ...base, insights: [{ id: 'i1', kind: 'finding' as const, title: 'local', body: '', sceneIds: [], boardIds: [], workIds: [], createdAt: '2026-01-01', updatedAt: '2026-02-01' }] };
    const incoming = { ...base, insights: [{ ...local.insights[0], title: 'incoming', updatedAt: '2026-03-01' }, { ...local.insights[0], id: 'i2', title: 'new' }] };
    const report = analyzeConflicts(local, incoming);
    expect(report.totalConflicts).toBe(1);
    expect(report.perStore.insights.newer).toBe(1);
    expect(mergeData(local, incoming, 'keep_local').insights.find((i) => i.id === 'i1')!.title).toBe('local');
    expect(mergeData(local, incoming, 'newer_wins').insights.find((i) => i.id === 'i1')!.title).toBe('incoming');
    expect(mergeData(local, incoming, 'incoming_wins').insights).toHaveLength(2);
  });
});
