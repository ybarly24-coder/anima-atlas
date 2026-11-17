import { ENTITY_STORES } from './db';
import type { AtlasData, BackupFile, EntityStore, MediaAsset } from './types';

export function makeBackup(data: AtlasData, assets: BackupFile['assets']): BackupFile {
  return { app: 'anima-atlas', schemaVersion: 1, exportedAt: new Date().toISOString(), data, assets };
}

export class BackupError extends Error {}

/** Validates the structure of a parsed backup file. Throws BackupError with a Korean message. */
export function validateBackup(raw: unknown): BackupFile {
  if (!raw || typeof raw !== 'object') throw new BackupError('JSON 객체가 아닙니다.');
  const b = raw as Partial<BackupFile>;
  if (b.app !== 'anima-atlas') throw new BackupError('ANIMA ATLAS 백업 파일이 아닙니다. (app 필드 불일치)');
  if (b.schemaVersion !== 1) throw new BackupError(`지원하지 않는 스키마 버전입니다: ${String(b.schemaVersion)}`);
  if (!b.data || typeof b.data !== 'object') throw new BackupError('data 필드가 없습니다.');
  for (const store of ENTITY_STORES) {
    const arr = (b.data as Partial<AtlasData>)[store];
    if (!Array.isArray(arr)) throw new BackupError(`data.${store} 배열이 없습니다.`);
    for (const item of arr) {
      if (!item || typeof (item as { id?: unknown }).id !== 'string') throw new BackupError(`data.${store}에 id가 없는 항목이 있습니다.`);
    }
  }
  if (b.assets && !Array.isArray(b.assets)) throw new BackupError('assets 필드가 배열이 아닙니다.');
  return { ...(b as BackupFile), assets: b.assets ?? [] };
}

export interface ConflictReport {
  perStore: Record<EntityStore, { incoming: number; conflicts: number; newer: number }>;
  totalConflicts: number;
}

/** Conflict = same id exists locally. "newer" = incoming updatedAt is later than local. */
export function analyzeConflicts(current: AtlasData, incoming: AtlasData): ConflictReport {
  const perStore = {} as ConflictReport['perStore'];
  let total = 0;
  for (const store of ENTITY_STORES) {
    const local = new Map((current[store] as Array<{ id: string; updatedAt?: string }>).map((x) => [x.id, x]));
    let conflicts = 0;
    let newer = 0;
    for (const item of incoming[store] as Array<{ id: string; updatedAt?: string }>) {
      const l = local.get(item.id);
      if (l) {
        conflicts++;
        if ((item.updatedAt ?? '') > (l.updatedAt ?? '')) newer++;
      }
    }
    perStore[store] = { incoming: incoming[store].length, conflicts, newer };
    total += conflicts;
  }
  return { perStore, totalConflicts: total };
}

export type MergeStrategy = 'replace_all' | 'incoming_wins' | 'keep_local' | 'newer_wins';

export function mergeData(current: AtlasData, incoming: AtlasData, strategy: MergeStrategy): AtlasData {
  if (strategy === 'replace_all') return structuredClone(incoming);
  const out = {} as AtlasData;
  for (const store of ENTITY_STORES) {
    const map = new Map<string, { id: string; updatedAt?: string }>(
      (current[store] as Array<{ id: string; updatedAt?: string }>).map((x) => [x.id, x]),
    );
    for (const item of incoming[store] as Array<{ id: string; updatedAt?: string }>) {
      const local = map.get(item.id);
      if (!local || strategy === 'incoming_wins' || (strategy === 'newer_wins' && (item.updatedAt ?? '') > (local.updatedAt ?? ''))) {
        map.set(item.id, item);
      }
    }
    (out as unknown as Record<string, unknown[]>)[store] = Array.from(map.values());
  }
  return out;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(bin)}`;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? 'application/octet-stream';
  const bin = atob(body ?? '');
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function restoreAssets(list: BackupFile['assets']): MediaAsset[] {
  return list.map(({ dataUrl, ...rest }) => ({ ...rest, ...(dataUrl ? { blob: dataUrlToBlob(dataUrl) } : {}) }));
}
