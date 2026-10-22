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

// One question changes progress twice (the answer, then Next). Waiting this
// long after the last change makes them one online save (L2: one save per
// question, to spend few Cloudflare writes).
export const SAVE_DELAY_MS = 5_000;

// Saves once the progress has been quiet for `delayMs`, and never runs two
// saves at once: each save must start from the revision that the one before
// it returned. A change during a save waits for one later save, which sends
// the newest state.
export function createSaveScheduler(
  save: (keepalive: boolean) => Promise<unknown>,
  timer: SaveTimer = browserTimer,
  delayMs = SAVE_DELAY_MS,
) {
  let running = false;
  let pending = false;
  let urgent = false;
  let handle: unknown;
  const clear = () => {
    if (handle !== undefined) timer.clearTimeout(handle);
    handle = undefined;
  };
  const start = () => {
    clear();
    const keepalive = urgent;
    pending = urgent = false;
    running = true;
    void save(keepalive)
      .catch(() => {})
      .finally(() => {
        running = false;
        if (pending) schedule();
      });
  };
  // A running save reschedules itself when it ends.
  const schedule = () => {
    if (running) return;
    if (urgent) {
      start();
      return;
    }
    clear();
    handle = timer.setTimeout(() => {
      handle = undefined;
      if (pending && !running) start();
    }, delayMs);
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
    get busy() {
      return pending || running;
    },
  };
}
