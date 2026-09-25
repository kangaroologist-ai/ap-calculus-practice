import { openDB } from "idb";
import type { AppState } from "./progress";
import { migrateProgress, LATEST_FORMAT } from "./migrate";
import type { PortableProgress } from "./transfer";
let dbPromise: ReturnType<typeof openDB> | undefined;
const db = () =>
  (dbPromise ??= openDB("derivative-studio", 1, {
    upgrade(db) {
      db.createObjectStore("state");
    },
  }));
export async function loadState(): Promise<AppState | undefined> {
  return (await db()).get("state", "current");
}
let writes: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = writes.then(operation);
  writes = next.catch(() => {});
  return next;
}
export function validateLocalState(s: AppState): {
  state: AppState;
  migrated: boolean;
  from: number;
} {
  if (!s || s.version !== 1)
    throw Error(
      "This saved progress version is not supported. It has not been changed.",
    );
  const { progress, from } = migrateProgress(s.progress);
  const state = { ...s, progress };
  if (from !== LATEST_FORMAT) delete state.session;
  return {
    state,
    migrated: JSON.stringify(state) !== JSON.stringify(s),
    from,
  };
}
export function commitMigration(
  before: AppState,
  after: AppState,
  formatUpgrade: boolean,
) {
  return enqueue(async () => {
    const tx = (await db()).transaction("state", "readwrite");
    const original = await tx.store.get("pre-migration");
    if (formatUpgrade || original === undefined)
      await tx.store.put(before, "pre-migration");
    await tx.store.put(after, "current");
    await tx.done;
  });
}
export function saveState(s: AppState) {
  const snapshot = structuredClone(s);
  return enqueue(async () => {
    await (await db()).put("state", snapshot, "current");
  });
}
export function replaceState(
  p: PortableProgress,
  id: string,
): Promise<AppState> {
  return enqueue(async () => {
    const d = await db(),
      tx = d.transaction("state", "readwrite"),
      old = (await tx.store.get("current")) as AppState | undefined;
    const { exportedAt, ...progress } = p;
    if (
      old?.lastImportedId === id &&
      !old.session &&
      JSON.stringify(old.progress) === JSON.stringify(progress)
    ) {
      await tx.done;
      return old;
    }
    const next: AppState = { version: 1, progress, lastImportedId: id };
    if (old) await tx.store.put(old, "backup");
    await tx.store.put(next, "current");
    await tx.done;
    return next;
  });
}
export function restoreBackup(): Promise<AppState> {
  return enqueue(async () => {
    const d = await db(),
      tx = d.transaction("state", "readwrite"),
      backup = (await tx.store.get("backup")) as AppState | undefined;
    if (!backup) {
      await tx.done;
      throw Error("There is no saved backup to restore.");
    }
    let restored: AppState;
    try {
      restored = validateLocalState(backup).state;
    } catch (error) {
      tx.abort();
      await tx.done.catch(() => {});
      throw error;
    }
    const current = await tx.store.get("current");
    await tx.store.put(restored, "current");
    if (current) await tx.store.put(current, "backup");
    await tx.done;
    return restored;
  });
}
export function resetState(s: AppState) {
  const snapshot = structuredClone(s);
  return enqueue(async () => {
    const d = await db(),
      tx = d.transaction("state", "readwrite"),
      old = await tx.store.get("current");
    if (old) await tx.store.put(old, "backup");
    await tx.store.put(snapshot, "current");
    await tx.done;
  });
}
