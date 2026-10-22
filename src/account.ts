import { normalizeLoginCode } from "./account-code";
import { NewerProgressError } from "./migrate";
import type { AppState, Progress } from "./progress";
import {
  createSaveScheduler,
  decideSync,
  type SaveTimer,
  type SyncAction,
  type SyncMark,
} from "./sync";
import {
  decodeProgress,
  encodeProgress,
  makePortableProgress,
  type PortableProgress,
} from "./transfer";

// Online account client (S4, S5). This module owns the API calls and the
// sync decisions; the page owns the state, storage, and all DOM.

export interface AccountRecord {
  code: string;
  name: string;
  className: string;
  classPrefix: string;
  mark?: SyncMark;
}

export type AccountErrorKind =
  | "unknown-code"
  | "too-many-attempts"
  | "unavailable"
  | "offline"
  | "bad-request";

export class AccountError extends Error {
  readonly kind: AccountErrorKind;
  constructor(kind: AccountErrorKind) {
    super(kind);
    this.name = "AccountError";
    this.kind = kind;
  }
}

export interface SessionAnswer {
  name: string;
  className: string;
  classPrefix: string;
  revision: number;
  progress: PortableProgress | undefined;
  updatedAt: number | null;
}

export interface OnlineCopy {
  revision: number;
  progress: PortableProgress | undefined;
  updatedAt: number | null;
}

export type PutResult =
  | { status: "saved"; revision: number }
  | ({ status: "conflict" } & OnlineCopy);

export interface ConflictCopy {
  revision: number;
  progress: PortableProgress;
  updatedAt: number | null;
}

export type AccountStatus = "saved" | "saving" | "offline" | "stopped";

export const UNKNOWN_CODE_MESSAGE =
  "This code doesn't match a student. Check the code on your slip.";
export const TOO_MANY_ATTEMPTS_MESSAGE =
  "Too many attempts. Wait 10 minutes, then try again.";
export const OFFLINE_SIGN_IN_MESSAGE =
  "You're offline. Connect to the internet, then try again.";
export const UNAVAILABLE_MESSAGE =
  "Online saving is unavailable right now. Try again later.";
export const CODE_STOPPED_MESSAGE =
  "This code no longer works. Ask your teacher for a new one.";
export const RELOAD_MESSAGE = "Reload the page to update.";
export const SIGN_OUT_OFFLINE_MESSAGE =
  "You're offline. Your latest progress isn't saved online yet. Connect to the internet, then sign out.";
export const SIGN_OUT_DEAD_MESSAGE =
  "This code no longer works, so your latest progress can't be saved online. Export it first if you want to keep it, then select Remove progress and sign out.";
export const SIGN_OUT_UNSAVED_MESSAGE =
  "Your progress changed while signing out, so it's still on this device. Sign out again to finish.";

export function statusLabel(status: AccountStatus, message?: string) {
  switch (status) {
    case "saving":
      return "Saving…";
    case "offline":
      return "Offline: saved on this device";
    case "stopped":
      return message || RELOAD_MESSAGE;
    default:
      return "Saved online";
  }
}

export function signInFailureMessage(error: unknown) {
  if (error instanceof NewerProgressError) return RELOAD_MESSAGE;
  if (error instanceof AccountError) {
    if (error.kind === "unknown-code") return UNKNOWN_CODE_MESSAGE;
    if (error.kind === "too-many-attempts") return TOO_MANY_ATTEMPTS_MESSAGE;
    if (error.kind === "offline") return OFFLINE_SIGN_IN_MESSAGE;
  }
  return UNAVAILABLE_MESSAGE;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

async function jsonObject(response: Response) {
  try {
    const value: unknown = await response.json();
    return isRecord(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function errorKind(status: number): AccountErrorKind {
  if (status === 401) return "unknown-code";
  if (status === 429) return "too-many-attempts";
  if (status === 400 || status === 413) return "bad-request";
  return "unavailable";
}

// The code always travels in the JSON body, never in the URL.
async function request(
  path: string,
  method: "POST" | "PUT",
  body: unknown,
  keepalive = false,
): Promise<Response> {
  try {
    return await fetch(path, {
      method,
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      ...(keepalive ? { keepalive: true } : {}),
    });
  } catch {
    throw new AccountError("offline");
  }
}

function decodedOnlineCopy(data: Record<string, unknown> | undefined) {
  if (
    !data ||
    typeof data.revision !== "number" ||
    !Number.isSafeInteger(data.revision) ||
    !(data.progress === null || typeof data.progress === "string") ||
    !(data.updatedAt === null || typeof data.updatedAt === "number")
  )
    throw new AccountError("unavailable");
  return {
    revision: data.revision,
    progress:
      data.progress === null ? undefined : decodeProgress(data.progress),
    updatedAt: data.updatedAt as number | null,
  };
}

export async function fetchSession(input: string): Promise<SessionAnswer> {
  const code = normalizeLoginCode(input);
  if (code === null) throw new AccountError("unknown-code");
  const response = await request("/api/session", "POST", { code });
  if (!response.ok) throw new AccountError(errorKind(response.status));
  const data = await jsonObject(response);
  if (
    !data ||
    typeof data.name !== "string" ||
    typeof data.className !== "string" ||
    typeof data.classPrefix !== "string" ||
    typeof data.revision !== "number" ||
    !Number.isSafeInteger(data.revision) ||
    !(data.progress === null || typeof data.progress === "string") ||
    !(data.updatedAt === null || typeof data.updatedAt === "number")
  )
    throw new AccountError("unavailable");
  return {
    name: data.name,
    className: data.className,
    classPrefix: data.classPrefix,
    revision: data.revision,
    progress: data.progress === null ? undefined : decodeProgress(data.progress),
    updatedAt: data.updatedAt as number | null,
  };
}

export async function putProgress(
  account: AccountRecord,
  progress: Progress,
  keepalive = false,
): Promise<PutResult> {
  const snapshot = makePortableProgress(progress);
  const response = await request(
    "/api/progress",
    "PUT",
    {
      code: account.code,
      baseRevision: account.mark?.revision ?? 0,
      progress: encodeProgress(snapshot),
      updatedAt: snapshot.updatedAt,
    },
    keepalive,
  );
  if (response.status === 409) {
    const online = decodedOnlineCopy(await jsonObject(response));
    return { status: "conflict", ...online };
  }
  if (!response.ok) throw new AccountError(errorKind(response.status));
  const data = await jsonObject(response);
  if (!data || typeof data.revision !== "number")
    throw new AccountError("unavailable");
  return { status: "saved", revision: data.revision };
}

export interface SyncHost {
  getState(): AppState;
  replaceState(
    snapshot: PortableProgress,
    id: string,
    keepBackup: boolean,
  ): Promise<AppState>;
  saveAccount(record: AccountRecord): Promise<unknown>;
  clearLocal(): Promise<void>;
  setStatus(status: AccountStatus, message?: string): void;
  openConflict(online: ConflictCopy): void;
  reportError(message: string): void;
  render(): void;
}

export interface AccountApi {
  session(code: string): Promise<SessionAnswer>;
  save(
    account: AccountRecord,
    progress: Progress,
    keepalive: boolean,
  ): Promise<PutResult>;
}

export interface SyncControllerOptions {
  host: SyncHost;
  initialAccount?: AccountRecord;
  api?: AccountApi;
  timer?: SaveTimer;
}

export type SignOutResult =
  | { ok: true }
  | { ok: false; message: string }
  | { ok: false; message: string; discard: true }
  | { ok: false; conflict: true };

const defaultApi: AccountApi = { session: fetchSession, save: putProgress };

export function createSyncController({
  host,
  initialAccount,
  api = defaultApi,
  timer,
}: SyncControllerOptions) {
  let account = initialAccount ? structuredClone(initialAccount) : undefined;
  let stopped = false;
  let signingOut = false;
  let status: AccountStatus = "saved";
  let statusMessage: string | undefined;
  let inflight: Promise<void> | undefined;
  // Every server call runs alone. Two saves from one base revision would make
  // the second one a conflict with this device's own copy.
  let queue: Promise<unknown> = Promise.resolve();
  const exclusive = <T>(operation: () => Promise<T>): Promise<T> => {
    const run = queue.then(operation, operation);
    queue = run.catch(() => {});
    return run;
  };
  const sendNow = (record: AccountRecord, progress: Progress) =>
    api.save(record, progress, false);

  const changed = () =>
    !!account && host.getState().progress.updatedAt !== account.mark?.updatedAt;

  const publish = (next: AccountStatus, message?: string) => {
    status = next;
    statusMessage = message;
    if (next === "stopped") stopped = true;
    host.setStatus(next, message);
  };

  const remember = async () => {
    if (!account) return;
    try {
      await host.saveAccount(structuredClone(account));
    } catch {
      // The code and mark still work for this session.
    }
  };

  const failSync = (error: unknown) => {
    if (error instanceof NewerProgressError) {
      publish("stopped", RELOAD_MESSAGE);
      return;
    }
    if (error instanceof AccountError) {
      if (error.kind === "unknown-code") {
        publish("stopped", CODE_STOPPED_MESSAGE);
        return;
      }
      publish("offline");
      return;
    }
    publish("stopped", (error as Error)?.message || RELOAD_MESSAGE);
  };

  // Only a download that the student chose (the conflict prompt) keeps the
  // replaced copy as the backup; the silent rows replace a copy that is
  // already online or empty.
  async function download(
    online: { revision: number; progress: PortableProgress | undefined },
    keepBackup = false,
  ) {
    const record = account;
    const snapshot = online.progress;
    if (!record || !snapshot) return;
    publish("saving");
    await host.replaceState(snapshot, `online:${online.revision}`, keepBackup);
    if (account !== record) return;
    record.mark = { revision: online.revision, updatedAt: snapshot.updatedAt };
    await remember();
    publish("saved");
    host.render();
  }

  async function upload(baseRevision: number) {
    const record = account;
    if (!record || stopped) return;
    const progress = host.getState().progress;
    const sentAt = progress.updatedAt;
    const previous = record.mark;
    // putProgress reads the base revision from the mark.
    record.mark = { revision: baseRevision, updatedAt: previous?.updatedAt ?? 0 };
    publish("saving");
    let result: PutResult;
    try {
      result = await sendNow(record, progress);
    } catch (error) {
      record.mark = previous;
      failSync(error);
      return;
    }
    if (result.status === "saved") {
      record.mark = { revision: result.revision, updatedAt: sentAt };
      await remember();
      publish("saved");
      return;
    }
    record.mark = previous;
    await conflict(result);
  }

  async function apply(action: SyncAction, online: OnlineCopy) {
    const record = account;
    if (!record) return;
    switch (action) {
      // "none" on an empty account records the baseline too, so starting an
      // untouched session is not mistaken for a change worth uploading.
      case "none":
      case "adopt":
        record.mark = {
          revision: online.revision,
          updatedAt: host.getState().progress.updatedAt,
        };
        await remember();
        publish("saved");
        return;
      case "upload":
        await upload(online.revision);
        return;
      case "download":
        await download(online);
        return;
      case "prompt":
        if (online.progress)
          host.openConflict({
            revision: online.revision,
            progress: online.progress,
            updatedAt: online.updatedAt,
          });
        else await upload(online.revision);
        return;
    }
  }

  async function conflict(online: OnlineCopy) {
    const record = account;
    if (!record) return "resolved" as const;
    const action = decideSync(record.mark, host.getState().progress, {
      revision: online.revision,
      progress: online.progress,
    });
    if (action === "prompt" && online.progress) {
      host.openConflict({
        revision: online.revision,
        progress: online.progress,
        updatedAt: online.updatedAt,
      });
      return "prompt" as const;
    }
    await apply(action, online);
    return "resolved" as const;
  }

  const saveWaiting = async (keepalive: boolean) => {
    const record = account;
    if (!record || stopped) return;
    const progress = host.getState().progress;
    if (progress.updatedAt === record.mark?.updatedAt) return;
    const sentAt = progress.updatedAt;
    publish("saving");
    let result: PutResult;
    try {
      result = await api.save(record, progress, keepalive);
    } catch (error) {
      failSync(error);
      return;
    }
    if (result.status === "conflict") {
      try {
        await conflict(result);
      } catch (error) {
        failSync(error);
      }
      return;
    }
    if (account !== record) return;
    record.mark = { revision: result.revision, updatedAt: sentAt };
    await remember();
    publish("saved");
  };

  // A page-hide request may start before scheduler.flush() can mark it urgent,
  // so carry keepalive across the scheduler's own start path.
  let keepaliveNext = false;
  const scheduler = createSaveScheduler((keepalive) => {
    const urgent = keepalive || keepaliveNext;
    keepaliveNext = false;
    const running = exclusive(() => saveWaiting(urgent));
    inflight = running;
    void running.finally(() => {
      if (inflight === running) inflight = undefined;
    });
    return running;
  }, timer);

  function localSaved() {
    if (!account || stopped || signingOut || !changed()) return;
    // The newest answer is only on this device until the waiting save runs.
    publish(globalThis.navigator?.onLine === false ? "offline" : "saving");
    scheduler.request();
  }

  function retry() {
    if (!account || stopped || signingOut) return;
    if (changed()) scheduler.request();
    else void syncNow();
  }

  function flush() {
    if (!account || stopped || signingOut || !changed()) return;
    keepaliveNext = true;
    scheduler.request();
    scheduler.flush();
  }

  function syncNow() {
    return exclusive(syncOnce);
  }

  async function syncOnce() {
    const record = account;
    if (!record || stopped || signingOut) return;
    publish("saving");
    while (account === record && !stopped && !signingOut) {
      const mark = record.mark;
      let answer: SessionAnswer;
      try {
        answer = await api.session(record.code);
      } catch (error) {
        failSync(error);
        return;
      }
      if (account !== record || stopped || signingOut) return;
      record.name = answer.name;
      record.className = answer.className;
      record.classPrefix = answer.classPrefix;
      await remember();
      if (account !== record || stopped || signingOut) return;
      // A save that finished while this response was pending moved the mark
      // forward, so the response describes an older copy. Ask again rather
      // than applying it over newer progress.
      if (record.mark !== mark) continue;
      try {
        await apply(
          decideSync(record.mark, host.getState().progress, {
            revision: answer.revision,
            progress: answer.progress,
          }),
          answer,
        );
      } catch (error) {
        failSync(error);
      }
      return;
    }
  }

  async function signIn(input: string) {
    const code = normalizeLoginCode(input);
    if (code === null) throw new AccountError("unknown-code");
    const answer = await api.session(code);
    account = {
      code,
      name: answer.name,
      className: answer.className,
      classPrefix: answer.classPrefix,
    };
    stopped = false;
    publish("saved");
    await remember();
    return answer;
  }

  function afterSignIn(answer: SessionAnswer) {
    return exclusive(() => applySignIn(answer));
  }

  async function applySignIn(answer: SessionAnswer) {
    const record = account;
    if (!record) return;
    publish("saving");
    try {
      await apply(
        decideSync(record.mark, host.getState().progress, {
          revision: answer.revision,
          progress: answer.progress,
        }),
        answer,
      );
    } catch (error) {
      failSync(error);
    }
  }

  function useOnlineCopy(online: ConflictCopy) {
    return exclusive(() => downloadChosen(online));
  }

  async function downloadChosen(online: ConflictCopy) {
    try {
      await download(online, true);
    } catch (error) {
      failSync(error);
      throw error;
    }
  }

  function keepLocalCopy(online: ConflictCopy) {
    return exclusive(() => uploadChosen(online));
  }

  async function uploadChosen(online: ConflictCopy) {
    const record = account;
    if (!record || stopped) return;
    const progress = host.getState().progress;
    const sentAt = progress.updatedAt;
    const previous = record.mark;
    record.mark = { revision: online.revision, updatedAt: previous?.updatedAt ?? 0 };
    publish("saving");
    let result: PutResult;
    try {
      result = await sendNow(record, progress);
    } catch (error) {
      record.mark = previous;
      failSync(error);
      throw error;
    }
    if (result.status === "conflict") {
      record.mark = previous;
      await conflict(result);
      return;
    }
    record.mark = { revision: result.revision, updatedAt: sentAt };
    await remember();
    publish("saved");
  }

  async function saveForSignOut(): Promise<
    "saved" | "dead" | "dead-changed" | "blocked" | "changed" | "prompt"
  > {
    const record = account;
    if (!record) return "saved";
    const progress = host.getState().progress;
    const sentAt = progress.updatedAt;
    publish("saving");
    let result: PutResult;
    try {
      result = await sendNow(record, progress);
    } catch (error) {
      if (error instanceof AccountError && error.kind === "unknown-code") {
        failSync(error);
        // The server answered, so this is not an offline sign out. An
        // unchanged device already has its copy under the old code.
        // Its newest answers can never reach the server under this code.
        return changed() ? "dead-changed" : "dead";
      }
      failSync(error);
      return "blocked";
    }
    if (result.status === "conflict") {
      try {
        const outcome = await conflict(result);
        if (outcome === "prompt") return "prompt";
        // A choice that did not save this device's copy leaves it changed;
        // clearing now would lose it.
        if (stopped || account !== record) return "blocked";
        if (changed()) {
          publish("saving");
          return "changed";
        }
        return "saved";
      } catch (error) {
        failSync(error);
        return "blocked";
      }
    }
    record.mark = { revision: result.revision, updatedAt: sentAt };
    await remember();
    if (account !== record) return "blocked";
    // An answer graded while the request was pending is not in the uploaded
    // snapshot, so clearing now would erase it (and its backup).
    if (changed()) {
      publish("saving");
      return "changed";
    }
    publish("saved");
    return "saved";
  }

  // `discard`: the student confirmed removing progress that a replaced code
  // can no longer save online.
  async function signOut(discard = false): Promise<SignOutResult> {
    const record = account;
    if (!record) return { ok: true };
    signingOut = true;
    scheduler.cancel();
    keepaliveNext = false;
    let resave = false;
    try {
      if (inflight) await inflight.catch(() => {});
      // Always attempt the online save, even when sync has stopped: only that
      // request can tell offline apart from a code the teacher replaced.
      const outcome = await exclusive(saveForSignOut);
      if (outcome === "prompt") return { ok: false, conflict: true };
      if (outcome === "dead-changed" && !discard)
        return { ok: false, message: SIGN_OUT_DEAD_MESSAGE, discard: true };
      if (outcome === "changed") {
        resave = true;
        return { ok: false, message: SIGN_OUT_UNSAVED_MESSAGE };
      }
      if (outcome === "blocked")
        return { ok: false, message: SIGN_OUT_OFFLINE_MESSAGE };
      // Detach the account before clearing, so a save that finishes meanwhile
      // cannot write the record back into storage after the clear.
      account = undefined;
      try {
        await host.clearLocal();
      } catch (error) {
        account = record;
        host.reportError((error as Error)?.message || "Could not clear this device.");
        return { ok: false, message: "Could not clear this device. Try again." };
      }
      stopped = false;
      scheduler.cancel();
      publish("saved");
      return { ok: true };
    } finally {
      signingOut = false;
      if (resave && account === record && !stopped) scheduler.request();
    }
  }

  return {
    get account() {
      return account;
    },
    get status() {
      return status;
    },
    get statusMessage() {
      return statusMessage;
    },
    signIn,
    afterSignIn,
    syncNow,
    localSaved,
    retry,
    flush,
    signOut,
    useOnlineCopy,
    keepLocalCopy,
  };
}

export type SyncController = ReturnType<typeof createSyncController>;
