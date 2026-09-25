import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { freshProgress } from '../src/progress';
import { validateLocalState } from '../src/storage';
import { makePortableProgress } from '../src/transfer';
import type { AppState, Progress } from '../src/progress';
import type { Config } from '../src/types';

type StoreKey = 'current' | 'backup' | 'pre-migration';

const fakeIdb = vi.hoisted(() => {
  const records = new Map<StoreKey, unknown>();
  const options = { failPuts: new Set<StoreKey>() };
  const clone = <T>(value: T): T =>
    value === undefined ? value : structuredClone(value);

  const db = {
    async get(_store: string, key: StoreKey) {
      return clone(records.get(key));
    },
    async put(_store: string, value: unknown, key: StoreKey) {
      if (options.failPuts.has(key)) throw new Error(`injected put failure: ${key}`);
      records.set(key, clone(value));
      return key;
    },
    transaction(_store: string, _mode: string) {
      const staged = new Map<StoreKey, unknown>();
      for (const [key, value] of records) staged.set(key, clone(value));
      let aborted = false;
      let donePromise: Promise<void> | undefined;
      const tx = {
        store: {
          async get(key: StoreKey) {
            return clone(staged.get(key));
          },
          async put(value: unknown, key: StoreKey) {
            if (options.failPuts.has(key)) {
              aborted = true;
              throw new Error(`injected put failure: ${key}`);
            }
            staged.set(key, clone(value));
            return key;
          },
        },
        abort() {
          aborted = true;
        },
        get done() {
          donePromise ??= Promise.resolve().then(() => {
            if (!aborted) {
              records.clear();
              for (const [key, value] of staged) records.set(key, clone(value));
            }
          });
          return donePromise;
        },
      };
      return tx;
    },
  };

  const openDB = vi.fn(async (_name: string, _version: number, opts?: { upgrade?: (db: unknown) => void }) => {
    opts?.upgrade?.({ createObjectStore() {} });
    return db;
  });
  return { db, openDB, options, records };
});

vi.mock('idb', () => ({ openDB: fakeIdb.openDB }));

const storage = await import('../src/storage');

const NOW = Date.now();
const config: Config = {
  schemaVersion: 1,
  revision: 'storage-test',
  initialUnlockedLevel: 1,
  disabledFamilies: [],
  sessionLength: 12,
};

function appState(progress: Progress, lastImportedId?: string): AppState {
  return {
    version: 1,
    progress,
    ...(lastImportedId === undefined ? {} : { lastImportedId }),
  };
}

function snapshot(progress: Progress, exportedAt = NOW) {
  return makePortableProgress(progress, exportedAt);
}

beforeEach(async () => {
  fakeIdb.records.clear();
  fakeIdb.options.failPuts.clear();
  // Let the previous test's queued operation settle before the next test starts.
  await Promise.resolve();
});

describe('serialized local persistence and backup replacement', () => {
  it('saves and loads the current state through the storage adapter', async () => {
    const progress = freshProgress(config, NOW);
    const state = appState(progress);
    await storage.saveState(state);
    expect(await storage.loadState()).toEqual(state);
  });

  it('keeps the first pre-migration state across normalization-only commits', async () => {
    const backup = appState(freshProgress(config, NOW - 1), 'manual-backup');
    const before = appState(freshProgress(config, NOW));
    const firstAfter = appState(freshProgress(config, NOW + 1));
    const laterBefore = appState(freshProgress(config, NOW + 1));
    const laterAfter = appState(freshProgress(config, NOW + 2));
    fakeIdb.records.set('backup', backup);

    await storage.commitMigration(before, firstAfter, false);
    await storage.commitMigration(laterBefore, laterAfter, false);

    expect(fakeIdb.records.get('pre-migration')).toEqual(before);
    expect(await storage.loadState()).toEqual(laterAfter);
    expect(fakeIdb.records.get('backup')).toEqual(backup);
  });

  it('replaces pre-migration only for a format upgrade and leaves backup alone', async () => {
    const oldPreMigration = appState(freshProgress(config, NOW - 2));
    const backup = appState(freshProgress(config, NOW - 1), 'manual-backup');
    const before = JSON.parse(
      readFileSync(new URL('./fixtures/local-state-v1.json', import.meta.url), 'utf8'),
    ) as AppState;
    const after = validateLocalState(before).state;
    fakeIdb.records.set('pre-migration', oldPreMigration);
    fakeIdb.records.set('backup', backup);

    await storage.commitMigration(before, after, true);

    expect(fakeIdb.records.get('pre-migration')).toEqual(before);
    expect(await storage.loadState()).toEqual(after);
    expect(after.progress.formatVersion).toBe(2);
    expect(after.session).toBeUndefined();
    expect(fakeIdb.records.get('backup')).toEqual(backup);
  });

  it('serializes save, replace, and later save calls in order', async () => {
    const first = appState(freshProgress(config, NOW));
    await storage.saveState(first);

    const importedProgress = freshProgress(config, NOW + 1);
    const imported = await storage.replaceState(snapshot(importedProgress), 'import-a');
    expect(imported.progress.updatedAt).toBe(NOW + 1);
    expect(await storage.loadState()).toEqual(imported);

    const practicedProgress = freshProgress(config, NOW + 2);
    const practiced = appState(practicedProgress, 'import-a');
    await storage.saveState(practiced);
    expect(await storage.loadState()).toEqual(practiced);
    expect(fakeIdb.records.get('backup')).toEqual(first);
  });

  it('keeps the complete progress object when an imported snapshot is installed', async () => {
    const progress = freshProgress(config, NOW);
    progress.sequence = 7;
    progress.recentQuestionSignatures = ['q-a', 'q-b'];
    const portable = snapshot(progress);
    const result = await storage.replaceState(portable, 'full-id');
    const { exportedAt, ...expected } = portable;
    expect(result.progress).toEqual(expected);
    expect(result).not.toHaveProperty('exportedAt');
    expect(result.lastImportedId).toBe('full-id');
  });

  it('uses full progress equality in addition to the import id, avoiding FNV collision false idempotence', async () => {
    const firstProgress = freshProgress(config, NOW);
    firstProgress.sequence = 1;
    const secondProgress = freshProgress(config, NOW + 1);
    secondProgress.sequence = 2;

    await storage.replaceState(snapshot(firstProgress), 'same-fnv-id');
    const second = await storage.replaceState(snapshot(secondProgress), 'same-fnv-id');
    expect(second.progress).toEqual(secondProgress);
    expect(fakeIdb.records.get('backup')).toEqual(appState(firstProgress, 'same-fnv-id'));
  });

  it('treats an identical explicit snapshot as idempotent after a prior import', async () => {
    const progress = freshProgress(config, NOW);
    const portable = snapshot(progress);
    const first = await storage.replaceState(portable, 'snapshot-id');
    const backupAfterFirst = structuredClone(fakeIdb.records.get('backup'));
    const second = await storage.replaceState(portable, 'snapshot-id');
    expect(second).toEqual(first);
    expect(fakeIdb.records.get('backup')).toEqual(backupAfterFirst);
  });

  it('does not treat the same snapshot id as idempotent after local practice changed progress', async () => {
    const importedProgress = freshProgress(config, NOW);
    await storage.replaceState(snapshot(importedProgress), 'snapshot-id');
    const practicedProgress = freshProgress(config, NOW + 1);
    practicedProgress.sequence = 9;
    await storage.saveState(appState(practicedProgress, 'snapshot-id'));

    const restoredImport = await storage.replaceState(snapshot(importedProgress), 'snapshot-id');
    expect(restoredImport.progress).toEqual(importedProgress);
    expect(fakeIdb.records.get('backup')).toEqual(appState(practicedProgress, 'snapshot-id'));
  });

  it('restores the exact local practice state saved before an explicit re-import', async () => {
    const importedProgress = freshProgress(config, NOW);
    await storage.replaceState(snapshot(importedProgress), 'snapshot-id');
    const practicedProgress = freshProgress(config, NOW + 1);
    practicedProgress.sequence = 12;
    await storage.saveState(appState(practicedProgress, 'snapshot-id'));
    await storage.replaceState(snapshot(importedProgress), 'snapshot-id');

    const restored = await storage.restoreBackup();
    expect(restored.progress).toEqual(practicedProgress);
    expect(await storage.loadState()).toEqual(restored);
  });

  it('preserves current and backup when restore rejects an invalid backup', async () => {
    const currentProgress = freshProgress(config, NOW);
    const current = appState(currentProgress, 'current-id');
    await storage.saveState(current);
    const invalidBackup = { version: 1, progress: { formatVersion: 999 } } as unknown as AppState;
    fakeIdb.records.set('backup', invalidBackup);

    await expect(storage.restoreBackup()).rejects.toThrow(/version|supported/i);
    expect(await storage.loadState()).toEqual(current);
    expect(fakeIdb.records.get('backup')).toEqual(invalidBackup);
  });

  it('does not change current state when replacing fails while writing the backup', async () => {
    const current = appState(freshProgress(config, NOW), 'current-id');
    await storage.saveState(current);
    fakeIdb.options.failPuts.add('backup');

    await expect(
      storage.replaceState(snapshot(freshProgress(config, NOW + 1)), 'new-id'),
    ).rejects.toThrow(/injected put failure/);
    expect(await storage.loadState()).toEqual(current);
  });

  it('does not change current state when replacing fails while writing the new current value', async () => {
    const current = appState(freshProgress(config, NOW), 'current-id');
    await storage.saveState(current);
    fakeIdb.options.failPuts.add('current');

    await expect(
      storage.replaceState(snapshot(freshProgress(config, NOW + 1)), 'new-id'),
    ).rejects.toThrow(/injected put failure/);
    expect(await storage.loadState()).toEqual(current);
  });

  it('does not restore when no backup exists and leaves current untouched', async () => {
    const current = appState(freshProgress(config, NOW), 'current-id');
    await storage.saveState(current);
    await expect(storage.restoreBackup()).rejects.toThrow(/no saved backup/i);
    expect(await storage.loadState()).toEqual(current);
  });

  it('swaps current and backup atomically on restore', async () => {
    const first = appState(freshProgress(config, NOW), 'first-id');
    const secondProgress = freshProgress(config, NOW + 1);
    secondProgress.sequence = 4;
    const second = appState(secondProgress, 'second-id');
    await storage.saveState(first);
    await storage.resetState(second);

    expect(await storage.restoreBackup()).toEqual(first);
    expect(await storage.loadState()).toEqual(first);
    expect(fakeIdb.records.get('backup')).toEqual(second);
  });

  it('restores the validated, migrated backup and saves the old current in backup', async () => {
    const current = appState(freshProgress(config, NOW), 'current-id');
    const backup = JSON.parse(
      readFileSync(
        new URL('./fixtures/local-state-v1.json', import.meta.url),
        'utf8',
      ),
    ) as AppState;
    await storage.saveState(current);
    fakeIdb.records.set('backup', backup);
    const expected = storage.validateLocalState(backup).state;

    const restored = await storage.restoreBackup();

    expect(restored).toEqual(expected);
    expect(await storage.loadState()).toEqual(expected);
    expect(fakeIdb.records.get('backup')).toEqual(current);
  });

  it('serializes a failed write before a following valid write', async () => {
    const first = appState(freshProgress(config, NOW), 'first-id');
    await storage.saveState(first);
    fakeIdb.options.failPuts.add('current');
    await expect(storage.saveState(appState(freshProgress(config, NOW + 1), 'failed-id'))).rejects.toThrow();
    fakeIdb.options.failPuts.clear();
    const valid = appState(freshProgress(config, NOW + 2), 'valid-id');
    await storage.saveState(valid);
    expect(await storage.loadState()).toEqual(valid);
  });
});
