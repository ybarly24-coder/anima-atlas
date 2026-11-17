'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { analyzeConflicts, blobToDataUrl, makeBackup, mergeData, restoreAssets, validateBackup, type ConflictReport, type MergeStrategy } from './backup';
import {
  deleteAsset as dbDeleteAsset,
  deleteEntities,
  ensureSeeded,
  getAllAssets,
  getAsset,
  getSeedMeta,
  loadAll,
  openAtlasDb,
  putAsset,
  putEntities,
  replaceAll,
  type AtlasDB,
  type SeedMeta,
} from './db';
import { buildSeedData } from '@seed/index';
import type { AtlasData, BackupFile, Comparison, EntityStore, Insight, MediaAsset, ResearchBoard, Scene, Source, Tag, Work } from './types';
import { newId, nowIso } from './util';

type Change = { put?: Array<{ id: string }>; del?: string[] };
type ChangeSet = Partial<Record<EntityStore, Change>>;

export interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

export interface CompareTray {
  mode: 'scene' | 'work';
  ids: string[];
}

export const COMPARE_MAX = 4;

interface AtlasContextValue {
  ready: boolean;
  error: string | null;
  data: AtlasData;
  seedMeta: SeedMeta | null;
  saveWork(w: Work): Promise<void>;
  deleteWork(id: string): Promise<void>;
  saveScene(s: Scene): Promise<void>;
  deleteScene(id: string): Promise<void>;
  toggleSceneBookmark(id: string): Promise<void>;
  saveBoard(b: ResearchBoard): Promise<void>;
  deleteBoard(id: string): Promise<void>;
  addScenesToBoard(boardId: string, sceneIds: string[]): Promise<number>;
  saveSource(s: Source): Promise<void>;
  deleteSource(id: string): Promise<void>;
  saveTag(t: Tag): Promise<void>;
  deleteTag(id: string): Promise<void>;
  saveInsight(i: Insight): Promise<void>;
  deleteInsight(id: string): Promise<void>;
  saveComparison(c: Comparison): Promise<void>;
  deleteComparison(id: string): Promise<void>;
  saveAssetFromFile(file: Blob, meta: { alt: string; rightsNote?: string; attribution?: string } & Partial<Omit<MediaAsset, 'id' | 'blob' | 'createdAt' | 'urlOrLocalPath' | 'kind'>>): Promise<string>;
  updateAssetMeta(id: string, patch: Partial<Omit<MediaAsset, 'id' | 'blob'>>): Promise<MediaAsset | undefined>;
  /** Existing asset with the same SHA-256 content hash, if any (duplicate import detection). */
  findAssetByHash(hash: string): Promise<MediaAsset | undefined>;
  removeAsset(id: string): Promise<void>;
  loadAsset(id: string): Promise<MediaAsset | undefined>;
  exportBackup(): Promise<BackupFile>;
  previewImport(raw: unknown): ConflictReport & { file: BackupFile };
  applyImport(file: BackupFile, strategy: MergeStrategy): Promise<void>;
  resetToSeed(): Promise<void>;
  toasts: Toast[];
  notify(message: string, tone?: Toast['tone']): void;
  dismissToast(id: number): void;
  tray: CompareTray;
  toggleTray(mode: CompareTray['mode'], id: string): void;
  setTray(t: CompareTray): void;
}

const emptyData = (): AtlasData => ({ works: [], scenes: [], boards: [], sources: [], tags: [], insights: [], comparisons: [] });

const AtlasContext = createContext<AtlasContextValue | null>(null);

const TRAY_KEY = 'anima-atlas:compare-tray';

function applyChanges(prev: AtlasData, changes: ChangeSet): AtlasData {
  const next = { ...prev };
  for (const [store, ch] of Object.entries(changes) as Array<[EntityStore, Change]>) {
    let arr = prev[store] as Array<{ id: string }>;
    if (ch.del?.length) {
      const del = new Set(ch.del);
      arr = arr.filter((x) => !del.has(x.id));
    }
    if (ch.put?.length) {
      const map = new Map(arr.map((x) => [x.id, x]));
      for (const item of ch.put) map.set(item.id, item);
      arr = Array.from(map.values());
    }
    (next as unknown as Record<string, unknown>)[store] = arr;
  }
  return next;
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const dbRef = useRef<AtlasDB | null>(null);
  const dataRef = useRef<AtlasData>(emptyData());
  const [data, setData] = useState<AtlasData>(emptyData);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedMeta, setSeedMeta] = useState<SeedMeta | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tray, setTrayState] = useState<CompareTray>({ mode: 'scene', ids: [] });
  const toastId = useRef(0);

  const setAll = useCallback((d: AtlasData) => {
    dataRef.current = d;
    setData(d);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof indexedDB === 'undefined') throw new Error('이 브라우저는 IndexedDB를 지원하지 않습니다.');
        const db = await openAtlasDb();
        dbRef.current = db;
        await ensureSeeded(db);
        const [all, meta] = await Promise.all([loadAll(db), getSeedMeta(db)]);
        if (cancelled) return;
        setAll(all);
        setSeedMeta(meta);
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    try {
      const raw = localStorage.getItem(TRAY_KEY);
      if (raw) {
        const t = JSON.parse(raw) as CompareTray;
        if (t && Array.isArray(t.ids)) setTrayState({ mode: t.mode === 'work' ? 'work' : 'scene', ids: t.ids.slice(0, COMPARE_MAX) });
      }
    } catch {
      /* per-viewer convenience only */
    }
    return () => {
      cancelled = true;
    };
  }, [setAll]);

  const notify = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const commit = useCallback(
    async (changes: ChangeSet) => {
      const db = dbRef.current;
      if (!db) throw new Error('데이터베이스가 준비되지 않았습니다.');
      for (const [store, ch] of Object.entries(changes) as Array<[EntityStore, Change]>) {
        if (ch.del?.length) await deleteEntities(db, store, ch.del);
        if (ch.put?.length) await putEntities(db, store, ch.put as never);
      }
      setAll(applyChanges(dataRef.current, changes));
    },
    [setAll],
  );

  const loadAsset = useCallback(async (id: string) => (dbRef.current ? getAsset(dbRef.current, id) : undefined), []);

  const touch = <T extends { updatedAt: string }>(x: T): T => ({ ...x, updatedAt: nowIso() });

  const persistTray = (t: CompareTray) => {
    setTrayState(t);
    try {
      localStorage.setItem(TRAY_KEY, JSON.stringify(t));
    } catch {
      /* ignore */
    }
  };

  const value = useMemo<AtlasContextValue>(() => {
    const d = () => dataRef.current;

    const removeSceneRefs = (sceneIds: string[]): ChangeSet => {
      const set = new Set(sceneIds);
      const boards = d().boards
        .filter((b) => b.sceneIds.some((id) => set.has(id)))
        .map((b) => {
          const notes = { ...b.sceneNotes };
          sceneIds.forEach((id) => delete notes[id]);
          return touch({ ...b, sceneIds: b.sceneIds.filter((id) => !set.has(id)), sceneNotes: notes });
        });
      const insights = d().insights
        .filter((i) => i.sceneIds.some((id) => set.has(id)))
        .map((i) => touch({ ...i, sceneIds: i.sceneIds.filter((id) => !set.has(id)) }));
      const comparisons = d().comparisons
        .filter((c) => c.mode === 'scene' && c.itemIds.some((id) => set.has(id)))
        .map((c) => touch({ ...c, itemIds: c.itemIds.filter((id) => !set.has(id)) }));
      return { boards: { put: boards }, insights: { put: insights }, comparisons: { put: comparisons } };
    };

    return {
      ready,
      error,
      data,
      seedMeta,
      toasts,
      notify,
      dismissToast,
      tray,
      setTray: persistTray,
      toggleTray(mode, id) {
        const cur = tray.mode === mode ? tray.ids : [];
        if (cur.includes(id)) {
          persistTray({ mode, ids: cur.filter((x) => x !== id) });
          return;
        }
        if (cur.length >= COMPARE_MAX) {
          notify(`비교함에는 최대 ${COMPARE_MAX}개까지 담을 수 있습니다.`, 'error');
          return;
        }
        if (tray.mode !== mode && tray.ids.length) notify('비교 유형이 바뀌어 비교함을 새로 시작합니다.', 'info');
        persistTray({ mode, ids: [...cur, id] });
      },

      async saveWork(w) {
        await commit({ works: { put: [touch(w)] } });
      },
      async deleteWork(id) {
        const sceneIds = d().scenes.filter((s) => s.workId === id).map((s) => s.id);
        const refs = removeSceneRefs(sceneIds);
        const boards = (refs.boards?.put as ResearchBoard[]) ?? [];
        const boardMap = new Map(boards.map((b) => [b.id, b]));
        d().boards.forEach((b) => {
          if (b.workIds.includes(id)) {
            const base = boardMap.get(b.id) ?? b;
            boardMap.set(b.id, touch({ ...base, workIds: base.workIds.filter((x) => x !== id) }));
          }
        });
        const sources = d().sources.filter((s) => s.relatedWorkIds.includes(id)).map((s) => touch({ ...s, relatedWorkIds: s.relatedWorkIds.filter((x) => x !== id) }));
        const insightMap = new Map(((refs.insights?.put as Insight[]) ?? []).map((i) => [i.id, i]));
        d().insights.forEach((i) => {
          if (i.workIds.includes(id)) {
            const base = insightMap.get(i.id) ?? i;
            insightMap.set(i.id, touch({ ...base, workIds: base.workIds.filter((x) => x !== id) }));
          }
        });
        const comparisons = new Map(((refs.comparisons?.put as Comparison[]) ?? []).map((c) => [c.id, c]));
        d().comparisons.forEach((c) => {
          if (c.mode === 'work' && c.itemIds.includes(id)) comparisons.set(c.id, touch({ ...c, itemIds: c.itemIds.filter((x) => x !== id) }));
        });
        const assetIds = d().scenes.filter((s) => s.workId === id && s.sceneImageAssetId).map((s) => s.sceneImageAssetId!) as string[];
        await commit({
          works: { del: [id] },
          scenes: { del: sceneIds },
          boards: { put: Array.from(boardMap.values()) },
          sources: { put: sources },
          insights: { put: Array.from(insightMap.values()) },
          comparisons: { put: Array.from(comparisons.values()) },
        });
        for (const a of assetIds) await dbDeleteAsset(dbRef.current!, a);
        if (tray.mode === 'work' || sceneIds.length) persistTray({ ...tray, ids: tray.ids.filter((x) => x !== id && !sceneIds.includes(x)) });
      },

      async saveScene(s) {
        await commit({ scenes: { put: [touch(s)] } });
      },
      async deleteScene(id) {
        const scene = d().scenes.find((s) => s.id === id);
        await commit({ scenes: { del: [id] }, ...removeSceneRefs([id]) });
        if (scene?.sceneImageAssetId) await dbDeleteAsset(dbRef.current!, scene.sceneImageAssetId);
        if (tray.ids.includes(id)) persistTray({ ...tray, ids: tray.ids.filter((x) => x !== id) });
      },
      async toggleSceneBookmark(id) {
        const s = d().scenes.find((x) => x.id === id);
        if (!s) return;
        const next: Scene = { ...s, isBookmark: !s.isBookmark };
        await commit({ scenes: { put: [next] } });
      },

      async saveBoard(b) {
        await commit({ boards: { put: [touch(b)] } });
      },
      async deleteBoard(id) {
        const insights = d().insights.filter((i) => i.boardIds.includes(id)).map((i) => touch({ ...i, boardIds: i.boardIds.filter((x) => x !== id) }));
        await commit({ boards: { del: [id] }, insights: { put: insights } });
      },
      async addScenesToBoard(boardId, sceneIds) {
        const b = d().boards.find((x) => x.id === boardId);
        if (!b) return 0;
        const add = sceneIds.filter((id) => !b.sceneIds.includes(id));
        if (!add.length) return 0;
        const workIds = new Set(b.workIds);
        const cats = new Set(b.categoryIds);
        add.forEach((sid) => {
          const s = d().scenes.find((x) => x.id === sid);
          const w = s && d().works.find((x) => x.id === s.workId);
          if (w) {
            workIds.add(w.id);
            cats.add(w.categoryId);
          }
        });
        await commit({
          boards: {
            put: [touch({ ...b, sceneIds: [...b.sceneIds, ...add], workIds: Array.from(workIds), categoryIds: Array.from(cats), status: b.status === 'template' ? 'in_progress' : b.status })],
          },
        });
        return add.length;
      },

      async saveSource(s) {
        await commit({ sources: { put: [touch(s)] } });
      },
      async deleteSource(id) {
        const works = d().works.filter((w) => w.officialSourceIds.includes(id)).map((w) => touch({ ...w, officialSourceIds: w.officialSourceIds.filter((x) => x !== id) }));
        const scenes = d().scenes.filter((s) => s.sourceIds.includes(id)).map((s) => touch({ ...s, sourceIds: s.sourceIds.filter((x) => x !== id) }));
        const boards = d().boards.filter((b) => b.sourceIds.includes(id)).map((b) => touch({ ...b, sourceIds: b.sourceIds.filter((x) => x !== id) }));
        await commit({ sources: { del: [id] }, works: { put: works }, scenes: { put: scenes }, boards: { put: boards } });
      },

      async saveTag(t) {
        await commit({ tags: { put: [touch(t)] } });
      },
      async deleteTag(id) {
        const scenes = d().scenes.filter((s) => s.tagIds.includes(id)).map((s) => touch({ ...s, tagIds: s.tagIds.filter((x) => x !== id) }));
        await commit({ tags: { del: [id] }, scenes: { put: scenes } });
      },

      async saveInsight(i) {
        await commit({ insights: { put: [touch(i)] } });
      },
      async deleteInsight(id) {
        await commit({ insights: { del: [id] } });
      },
      async saveComparison(c) {
        await commit({ comparisons: { put: [touch(c)] } });
      },
      async deleteComparison(id) {
        await commit({ comparisons: { del: [id] } });
      },

      async saveAssetFromFile(file, meta) {
        const id = newId('asset');
        const now = nowIso();
        await putAsset(dbRef.current!, {
          sourceProvider: 'manual_upload',
          licenseStatus: 'unverified',
          importedAt: now,
          ...meta,
          id,
          kind: meta.sourceProvider === 'tmdb' ? 'approved_external' : 'user_upload',
          urlOrLocalPath: `idb://${id}`,
          blob: file,
          mimeType: file.type,
          createdAt: now,
        });
        return id;
      },
      async updateAssetMeta(id, patch) {
        const db = dbRef.current;
        if (!db) return undefined;
        const cur = await getAsset(db, id);
        if (!cur) return undefined;
        const next = { ...cur, ...patch, id: cur.id, blob: cur.blob };
        await putAsset(db, next);
        return next;
      },
      async findAssetByHash(hash) {
        if (!dbRef.current || !hash) return undefined;
        return (await getAllAssets(dbRef.current)).find((a) => a.contentHash === hash);
      },
      async removeAsset(id) {
        await dbDeleteAsset(dbRef.current!, id);
      },
      loadAsset,

      async exportBackup() {
        const assets = await getAllAssets(dbRef.current!);
        const packed = await Promise.all(
          assets.map(async ({ blob, ...rest }) => ({ ...rest, ...(blob ? { dataUrl: await blobToDataUrl(blob) } : {}) })),
        );
        return makeBackup(d(), packed);
      },
      previewImport(raw) {
        const file = validateBackup(raw);
        return { ...analyzeConflicts(d(), file.data), file };
      },
      async applyImport(file, strategy) {
        const merged = mergeData(d(), file.data, strategy);
        const db = dbRef.current!;
        const incomingAssets = restoreAssets(file.assets);
        if (strategy === 'replace_all') {
          await replaceAll(db, merged, incomingAssets);
        } else {
          await replaceAll(db, merged);
          const existing = new Set((await getAllAssets(db)).map((a) => a.id));
          for (const a of incomingAssets) {
            if (!existing.has(a.id) || strategy === 'incoming_wins' || strategy === 'newer_wins') await putAsset(db, a);
          }
        }
        setAll(await loadAll(db));
      },
      async resetToSeed() {
        const db = dbRef.current!;
        await replaceAll(db, buildSeedData(), []);
        setAll(await loadAll(db));
        persistTray({ mode: 'scene', ids: [] });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, error, data, seedMeta, toasts, tray, commit, notify, dismissToast, setAll, loadAsset]);

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

export function useAtlas(): AtlasContextValue {
  const ctx = useContext(AtlasContext);
  if (!ctx) throw new Error('useAtlas must be used inside <AtlasProvider>');
  return ctx;
}

/** Object URL for a stored user-upload asset (revoked automatically). */
export function useAssetUrl(assetId: string | null | undefined): { url: string | null; asset: MediaAsset | null } {
  const { loadAsset, ready } = useAtlas();
  const [state, setState] = useState<{ url: string | null; asset: MediaAsset | null }>({ url: null, asset: null });
  useEffect(() => {
    if (!assetId || !ready) {
      setState({ url: null, asset: null });
      return;
    }
    let url: string | null = null;
    let cancelled = false;
    loadAsset(assetId).then((a) => {
      if (cancelled || !a) return;
      if (a.blob) url = URL.createObjectURL(a.blob);
      else if (a.kind === 'approved_external') url = a.urlOrLocalPath;
      setState({ url, asset: a });
    });
    return () => {
      cancelled = true;
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [assetId, ready, loadAsset]);
  return state;
}

/** Common lookups. */
export function useLookups() {
  const { data } = useAtlas();
  return useMemo(
    () => ({
      workById: new Map(data.works.map((w) => [w.id, w])),
      sceneById: new Map(data.scenes.map((s) => [s.id, s])),
      tagById: new Map(data.tags.map((t) => [t.id, t])),
      sourceById: new Map(data.sources.map((s) => [s.id, s])),
      boardById: new Map(data.boards.map((b) => [b.id, b])),
    }),
    [data],
  );
}
