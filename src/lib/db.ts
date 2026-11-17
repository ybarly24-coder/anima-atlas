import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { buildSeedData, SEED_VERSION, seedTags } from '@seed/index';
import type { AtlasData, Comparison, EntityStore, Insight, MediaAsset, ResearchBoard, Scene, Source, Tag, Work } from './types';
import { nowIso } from './util';

export const DB_NAME = 'anima-atlas';
export const DB_VERSION = 1;

interface MetaRecord {
  key: string;
  value: unknown;
}

interface AtlasSchema extends DBSchema {
  works: { key: string; value: Work };
  scenes: { key: string; value: Scene; indexes: { byWork: string } };
  boards: { key: string; value: ResearchBoard };
  sources: { key: string; value: Source };
  tags: { key: string; value: Tag };
  insights: { key: string; value: Insight };
  comparisons: { key: string; value: Comparison };
  assets: { key: string; value: MediaAsset };
  meta: { key: string; value: MetaRecord };
}

export type AtlasDB = IDBPDatabase<AtlasSchema>;

export const ENTITY_STORES: EntityStore[] = ['works', 'scenes', 'boards', 'sources', 'tags', 'insights', 'comparisons'];

export async function openAtlasDb(name = DB_NAME): Promise<AtlasDB> {
  return openDB<AtlasSchema>(name, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('works', { keyPath: 'id' });
      const scenes = db.createObjectStore('scenes', { keyPath: 'id' });
      scenes.createIndex('byWork', 'workId');
      db.createObjectStore('boards', { keyPath: 'id' });
      db.createObjectStore('sources', { keyPath: 'id' });
      db.createObjectStore('tags', { keyPath: 'id' });
      db.createObjectStore('insights', { keyPath: 'id' });
      db.createObjectStore('comparisons', { keyPath: 'id' });
      db.createObjectStore('assets', { keyPath: 'id' });
      db.createObjectStore('meta', { keyPath: 'key' });
    },
  });
}

export interface SeedMeta {
  version: number;
  seededAt: string;
}

/**
 * Applies seed data ONLY on first run. Once the "seed" meta record exists,
 * this never touches user data again (even if the user deleted every seed item).
 * Returns true if seeding happened.
 */
export async function ensureSeeded(db: AtlasDB): Promise<boolean> {
  const existing = await db.get('meta', 'seed');
  if (existing) return false;
  const seed = buildSeedData();
  const tx = db.transaction([...ENTITY_STORES, 'meta'], 'readwrite');
  for (const store of ENTITY_STORES) {
    const os = tx.objectStore(store);
    for (const item of seed[store]) await os.put(item as never);
  }
  await tx.objectStore('meta').put({ key: 'seed', value: { version: SEED_VERSION, seededAt: nowIso() } satisfies SeedMeta });
  await tx.done;
  return true;
}

export async function getSeedMeta(db: AtlasDB): Promise<SeedMeta | null> {
  const rec = await db.get('meta', 'seed');
  return (rec?.value as SeedMeta) ?? null;
}

export async function loadAll(db: AtlasDB): Promise<AtlasData> {
  const [works, scenes, boards, sources, tags, insights, comparisons] = await Promise.all(
    ENTITY_STORES.map((s) => db.getAll(s)),
  );
  // IndexedDB returns rows in key order; keep tags in the curated seed order (custom tags last).
  const order = new Map(seedTags.map((t, i) => [t.id, i]));
  (tags as AtlasData['tags']).sort((a, b) => (order.get(a.id) ?? 1e6) - (order.get(b.id) ?? 1e6) || a.createdAt.localeCompare(b.createdAt));
  return { works, scenes, boards, sources, tags, insights, comparisons } as AtlasData;
}

export async function putEntities<K extends EntityStore>(db: AtlasDB, store: K, items: AtlasData[K]): Promise<void> {
  const tx = db.transaction(store, 'readwrite');
  for (const item of items) await tx.store.put(item as never);
  await tx.done;
}

export async function deleteEntities(db: AtlasDB, store: EntityStore, ids: string[]): Promise<void> {
  const tx = db.transaction(store, 'readwrite');
  for (const id of ids) await tx.store.delete(id);
  await tx.done;
}

export async function putAsset(db: AtlasDB, asset: MediaAsset): Promise<void> {
  await db.put('assets', asset);
}

export async function getAsset(db: AtlasDB, id: string): Promise<MediaAsset | undefined> {
  return db.get('assets', id);
}

export async function deleteAsset(db: AtlasDB, id: string): Promise<void> {
  await db.delete('assets', id);
}

export async function getAllAssets(db: AtlasDB): Promise<MediaAsset[]> {
  return db.getAll('assets');
}

/** Replaces every entity store (used by restore "replace all" and reset). Seed flag is kept. */
export async function replaceAll(db: AtlasDB, data: AtlasData, assets?: MediaAsset[]): Promise<void> {
  const stores = [...ENTITY_STORES, ...(assets ? (['assets'] as const) : [])];
  const tx = db.transaction(stores, 'readwrite');
  for (const store of ENTITY_STORES) {
    const os = tx.objectStore(store);
    await os.clear();
    for (const item of data[store]) await os.put(item as never);
  }
  if (assets) {
    const os = tx.objectStore('assets');
    await os.clear();
    for (const a of assets) await os.put(a);
  }
  await tx.done;
}
