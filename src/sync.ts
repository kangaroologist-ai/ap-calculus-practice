import type { Progress } from "./progress";
import {
  encodeProgress,
  makePortableProgress,
  type PortableProgress,
} from "./transfer";

// Online sync rules (S5). The server orders saved copies by its own revision
// number, never by device clocks; `updatedAt` only tells whether this device
// has practised since the last sync.

// What the device remembers about its last successful sync.
export interface SyncMark {
  revision: number;
  updatedAt: number;
}

export interface OnlineCopy {
  revision: number;
  // The decoded online progress, or undefined for an account with no copy yet.
  progress: PortableProgress | undefined;
}

export type SyncAction =
  // Nothing to do.
  | "none"
  // Both copies hold the same progress: record the online revision as synced.
  | "adopt"
  // Save this device's progress online.
  | "upload"
  // Replace this device's progress with the online copy, without a prompt.
  | "download"
  // Both sides changed: the student chooses one copy.
  | "prompt";

// A device that has never answered a question has nothing worth keeping.
export const hasLearningProgress = (p: Progress): boolean =>
  p.sequence > 0 || Object.keys(p.skills).length > 0;

// Two codes of the same progress differ only in `exportedAt`, so compare the
// encoded snapshots with one shared export time.
export function sameProgress(local: Progress, online: PortableProgress) {
  const at = online.exportedAt;
  return (
    encodeProgress(makePortableProgress(local, at)) ===
    encodeProgress({ ...online, exportedAt: at })
  );
}

// `mark` is undefined on the first sign-in on this device. A 409 answer from
// the server comes here too: its online copy has a different revision.
export function decideSync(
  mark: SyncMark | undefined,
  local: Progress,
  online: OnlineCopy,
): SyncAction {
  if (!online.progress) return hasLearningProgress(local) ? "upload" : "none";
  if (!mark) {
    if (!hasLearningProgress(local)) return "download";
    return sameProgress(local, online.progress) ? "adopt" : "prompt";
  }
  const changed = local.updatedAt !== mark.updatedAt;
  if (online.revision === mark.revision) return changed ? "upload" : "none";
  if (!changed) return "download";
  return sameProgress(local, online.progress) ? "adopt" : "prompt";
}

export interface SaveTimer {
  setTimeout(run: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  now(): number;
}

const browserTimer: SaveTimer = {
  setTimeout: (run, ms) => globalThis.setTimeout(run, ms),
  clearTimeout: (handle) =>
    globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
  now: () => Date.now(),
};

export const SAVE_INTERVAL_MS = 20_000;

// Starts at most one online save per interval, and never two at once: each
// save must start from the revision that the one before it returned. A request
// during a save or inside the interval waits for one later save, which sends
// the newest state.
export function createSaveScheduler(
  save: (keepalive: boolean) => Promise<unknown>,
  timer: SaveTimer = browserTimer,
  intervalMs = SAVE_INTERVAL_MS,
) {
  let lastStart = -Infinity;
  let running = false;
  let pending = false;
  let urgent = false;
  let handle: unknown;
  const clear = () => {
    if (handle !== undefined) timer.clearTimeout(handle);
    handle = undefined;
  };
  const start = () => {
    const keepalive = urgent;
    pending = urgent = false;
    running = true;
    lastStart = timer.now();
    void save(keepalive)
      .catch(() => {})
      .finally(() => {
        running = false;
        if (pending) schedule();
      });
  };
  const schedule = () => {
    // A running save reschedules itself when it ends.
    if (running) return;
    if (handle !== undefined && !urgent) return;
    clear();
    const wait = urgent ? 0 : lastStart + intervalMs - timer.now();
    if (wait <= 0) start();
    else
      handle = timer.setTimeout(() => {
        handle = undefined;
        schedule();
      }, wait);
  };
  return {
    request() {
      pending = true;
      schedule();
    },
    // Page hide: save the waiting change now with `keepalive`, or right after
    // the running save ends.
    flush() {
      if (!pending) return;
      urgent = true;
      schedule();
    },
    cancel() {
      clear();
      pending = urgent = false;
    },
    // A save that did not come from this scheduler (on open, after sign-in)
    // still starts the interval.
    noteSave() {
      lastStart = timer.now();
    },
    get busy() {
      return pending || running;
    },
  };
}
