import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AccountError,
  CODE_STOPPED_MESSAGE,
  createSyncController,
  fetchSession,
  putProgress,
  RELOAD_MESSAGE,
  SIGN_OUT_OFFLINE_MESSAGE,
  SIGN_OUT_DEAD_MESSAGE,
  SIGN_OUT_UNSAVED_MESSAGE,
  type AccountApi,
  type AccountRecord,
  type AccountStatus,
  type ConflictCopy,
  type SessionAnswer,
  type SyncHost,
} from '../src/account';
import { NewerProgressError } from '../src/migrate';
import {
  freshProgress,
  stateFor,
  type AppState,
  type Progress,
} from '../src/progress';
import { sameProgress, type SaveTimer, type SyncMark } from '../src/sync';
import {
  decodeProgress,
  encodeProgress,
  makePortableProgress,
  type PortableProgress,
} from '../src/transfer';
import type { Config } from '../src/types';

const NOW = Date.now();
const TEST_CODE = 'TESTK7QM4ZX9B2';
const config: Config = {
  schemaVersion: 1,
  revision: 'account-client-test',
  initialUnlockedLevel: 1,
  disabledFamilies: [],
  sessionLength: 12,
};

function practised(at = NOW, answers = 3): Progress {
  const p = freshProgress(config, at - 60_000);
  stateFor(p, 'power', at - 60_000).basic.streak = 1;
  p.sequence = answers;
  p.updatedAt = at;
  return p;
}

const portable = (p: Progress, exportedAt = NOW + 5_000): PortableProgress =>
  decodeProgress(encodeProgress(makePortableProgress(p, exportedAt)));

const account = (mark?: SyncMark): AccountRecord => ({
  code: TEST_CODE,
  name: 'Ada Test',
  className: 'Test class',
  classPrefix: 'TEST',
  ...(mark ? { mark } : {}),
});

const emptyAnswer = (): SessionAnswer => ({
  name: 'Ada Test',
  className: 'Test class',
  classPrefix: 'TEST',
  revision: 0,
  progress: undefined,
  updatedAt: null,
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('account API client', () => {
  it('normalizes the code and sends it only in the JSON body', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      jsonResponse({ ...emptyAnswer(), progress: null }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSession(' test-k7qm 4zx9 b2 ')).resolves.toEqual(
      emptyAnswer(),
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/session');
    expect(String(url)).not.toContain('TEST');
    expect(init.method).toBe('POST');
    expect(init.cache).toBe('no-store');
    expect(init.keepalive).toBeUndefined();
    expect(JSON.parse(String(init.body))).toEqual({ code: TEST_CODE });
  });

  it('decodes the online progress', async () => {
    const p = practised();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          ...emptyAnswer(),
          revision: 3,
          progress: encodeProgress(makePortableProgress(p)),
          updatedAt: p.updatedAt,
        }),
      ),
    );

    const answer = await fetchSession(TEST_CODE);
    const { exportedAt, ...decoded } = answer.progress!;
    // Export seeds the mastery fields, so compare with the portable form.
    const { exportedAt: _, ...expected } = makePortableProgress(p);
    expect(decoded).toEqual(expected);
    expect(exportedAt).toEqual(expect.any(Number));
    expect(answer.updatedAt).toBe(p.updatedAt);
  });

  it('does not call the server for a malformed code', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const error = await fetchSession('CALC').catch((e) => e);
    expect(error).toBeInstanceOf(AccountError);
    expect(error.kind).toBe('unknown-code');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps HTTP failures to typed errors', async () => {
    for (const [status, kind] of [
      [401, 'unknown-code'],
      [429, 'too-many-attempts'],
      [400, 'bad-request'],
      [413, 'bad-request'],
      [503, 'unavailable'],
    ] as const) {
      vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status })));
      const error = await fetchSession(TEST_CODE).catch((e) => e);
      expect(error).toBeInstanceOf(AccountError);
      expect(error.kind).toBe(kind);
    }
  });

  it('reports a network failure as offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    const error = await fetchSession(TEST_CODE).catch((e) => e);
    expect(error).toBeInstanceOf(AccountError);
    expect(error.kind).toBe('offline');
  });

  it('sends the base revision and progress in the body, never in the URL', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      jsonResponse({ revision: 5 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const p = practised(NOW + 1_000);

    await expect(putProgress(account({ revision: 4, updatedAt: NOW }), p)).resolves.toEqual({
      status: 'saved',
      revision: 5,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/progress');
    expect(String(url)).not.toContain(TEST_CODE);
    expect(init.method).toBe('PUT');
    expect(init.cache).toBe('no-store');
    const body = JSON.parse(String(init.body)) as {
      code: string;
      baseRevision: number;
      progress: string;
      updatedAt: number;
    };
    expect(body.code).toBe(TEST_CODE);
    expect(body.baseRevision).toBe(4);
    expect(body.updatedAt).toBe(p.updatedAt);
    const { exportedAt, ...decoded } = decodeProgress(body.progress);
    const { exportedAt: _, ...expected } = makePortableProgress(p);
    expect(decoded).toEqual(expected);
    expect(exportedAt).toEqual(expect.any(Number));
  });

  it('sets keepalive only for a page-hide save', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      jsonResponse({ revision: 1 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await putProgress(account(), practised(), true);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.keepalive).toBe(true);
  });

  it('returns the online copy on a 409 conflict', async () => {
    const online = practised(NOW + 9_000, 7);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            revision: 7,
            progress: encodeProgress(makePortableProgress(online)),
            updatedAt: online.updatedAt,
          },
          409,
        ),
      ),
    );

    const result = await putProgress(
      account({ revision: 4, updatedAt: NOW }),
      practised(NOW + 1_000),
    );
    expect(result.status).toBe('conflict');
    if (result.status !== 'conflict') return;
    expect(result.revision).toBe(7);
    expect(result.updatedAt).toBe(online.updatedAt);
    const { exportedAt, ...decoded } = result.progress!;
    const { exportedAt: _, ...expected } = makePortableProgress(online);
    expect(decoded).toEqual(expected);
    expect(exportedAt).toEqual(expect.any(Number));
  });

  it('reports a save with a replaced code as unknown-code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })));
    const error = await putProgress(account(), practised()).catch((e) => e);
    expect(error).toBeInstanceOf(AccountError);
    expect(error.kind).toBe('unknown-code');
  });
});

function fakeTimer() {
  let now = 0;
  let next = 1;
  const timers = new Map<number, { at: number; run: () => void }>();
  const timer: SaveTimer = {
    now: () => now,
    setTimeout(run, ms) {
      const id = next++;
      timers.set(id, { at: now + ms, run });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id as number);
    },
  };
  return {
    timer,
    async advance(ms: number) {
      now += ms;
      for (const [id, t] of [...timers].sort((a, b) => a[1].at - b[1].at))
        if (t.at <= now) {
          timers.delete(id);
          t.run();
        }
      await settle();
    },
  };
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function makeHost(initial: Progress) {
  let current: AppState = { version: 1, progress: initial };
  const statuses: { status: AccountStatus; message?: string }[] = [];
  const conflicts: ConflictCopy[] = [];
  const accounts: AccountRecord[] = [];
  const backups: boolean[] = [];
  let clears = 0;
  let renders = 0;
  const host: SyncHost = {
    getState: () => current,
    async replaceState(snapshot, id, keepBackup) {
      backups.push(keepBackup);
      const { exportedAt, ...progress } = snapshot;
      current = { version: 1, progress, lastImportedId: id };
      return current;
    },
    async saveAccount(record) {
      accounts.push(structuredClone(record));
    },
    async clearLocal() {
      clears++;
    },
    setStatus(status, message) {
      statuses.push({ status, message });
    },
    openConflict(online) {
      conflicts.push(online);
    },
    reportError() {},
    render() {
      renders++;
    },
  };
  return {
    host,
    statuses,
    conflicts,
    accounts,
    backups,
    get current() {
      return current;
    },
    get clears() {
      return clears;
    },
    get renders() {
      return renders;
    },
    setProgress(p: Progress) {
      current = { ...current, progress: p };
    },
  };
}

function controllerFor(
  initial: Progress,
  initialAccount?: AccountRecord,
  overrides: Partial<AccountApi> = {},
) {
  const h = makeHost(initial);
  const t = fakeTimer();
  const calls = {
    session: 0,
    save: [] as { base: number; keepalive: boolean; progress: Progress }[],
  };
  const defaultSession = async (): Promise<SessionAnswer> => ({
    ...emptyAnswer(),
    revision: initialAccount?.mark?.revision ?? 0,
    progress: nativeCopy(initial),
    updatedAt: initial.updatedAt,
  });
  const defaultSave = async (
    record: AccountRecord,
  ): Promise<{ status: 'saved'; revision: number }> => ({
    status: 'saved',
    revision: (record.mark?.revision ?? 0) + 1,
  });
  const api: AccountApi = {
    async session(code) {
      calls.session++;
      return (overrides.session ?? defaultSession)(code);
    },
    async save(record, progress, keepalive) {
      calls.save.push({
        base: record.mark?.revision ?? 0,
        keepalive,
        progress,
      });
      return (overrides.save ?? defaultSave)(record, progress, keepalive);
    },
  };
  return {
    controller: createSyncController({
      host: h.host,
      initialAccount,
      api,
      timer: t.timer,
    }),
    h,
    t,
    calls,
  };
}

function nativeCopy(p: Progress): PortableProgress | undefined {
  return makePortableProgress(p);
}

describe('sync controller', () => {
  it('does nothing when both copies match the last sync', async () => {
    const local = practised();
    const c = controllerFor(local, account({ revision: 3, updatedAt: local.updatedAt }));

    await c.controller.syncNow();

    expect(c.calls.save).toHaveLength(0);
    expect(c.h.renders).toBe(0);
    expect(c.h.statuses.at(-1)?.status).toBe('saved');
    expect(c.calls.session).toBe(1);
  });

  it('adopts a newer revision when both sides hold the same progress', async () => {
    const local = practised(NOW + 20_000, 5);
    const mark = { revision: 3, updatedAt: NOW };
    const c = controllerFor(local, account(mark), {
      session: async () => ({
        ...emptyAnswer(),
        revision: 4,
        progress: portable(local),
        updatedAt: local.updatedAt,
      }),
    });

    await c.controller.syncNow();

    expect(c.calls.save).toHaveLength(0);
    expect(c.controller.account?.mark).toEqual({
      revision: 4,
      updatedAt: local.updatedAt,
    });
    expect(c.h.statuses.at(-1)?.status).toBe('saved');
  });

  it('uploads this device copy when the online account is empty', async () => {
    const local = practised();
    const c = controllerFor(local, account(), {
      session: async () => emptyAnswer(),
    });

    await c.controller.syncNow();

    expect(c.calls.save).toHaveLength(1);
    expect(c.calls.save[0].base).toBe(0);
    expect(c.controller.account?.mark).toEqual({
      revision: 1,
      updatedAt: local.updatedAt,
    });
    expect(c.h.statuses.at(-1)?.status).toBe('saved');
  });

  it('downloads a newer online copy without a prompt when this device did not change', async () => {
    const local = practised();
    const other = practised(NOW + 60_000, 8);
    const c = controllerFor(local, account({ revision: 3, updatedAt: local.updatedAt }), {
      session: async () => ({
        ...emptyAnswer(),
        revision: 4,
        progress: portable(other),
        updatedAt: other.updatedAt,
      }),
    });

    await c.controller.syncNow();

    expect(c.calls.save).toHaveLength(0);
    expect(sameProgress(c.h.current.progress, portable(other))).toBe(true);
    expect(c.controller.account?.mark).toEqual({
      revision: 4,
      updatedAt: other.updatedAt,
    });
    expect(c.h.renders).toBe(1);
    expect(c.h.statuses.at(-1)?.status).toBe('saved');
  });

  it('opens the conflict prompt when both sides changed', async () => {
    const local = practised(NOW + 30_000, 6);
    const other = practised(NOW + 60_000, 8);
    const mark = { revision: 3, updatedAt: NOW };
    const c = controllerFor(local, account(mark), {
      session: async () => ({
        ...emptyAnswer(),
        revision: 4,
        progress: portable(other),
        updatedAt: other.updatedAt,
      }),
    });

    await c.controller.syncNow();

    expect(c.calls.save).toHaveLength(0);
    expect(c.h.conflicts).toHaveLength(1);
    expect(c.h.conflicts[0].revision).toBe(4);
    expect(c.h.conflicts[0].updatedAt).toBe(other.updatedAt);
    expect(c.h.renders).toBe(0);
  });

  it('runs one server call at a time: a save waits for the open sync', async () => {
    const local = practised();
    const newer = practised(NOW + 20_000, 6);
    const mark = { revision: 3, updatedAt: local.updatedAt };
    let release: ((answer: SessionAnswer) => void) | undefined;
    const c = controllerFor(local, account(mark), {
      session: () =>
        new Promise<SessionAnswer>((resolve) => {
          release = resolve;
        }),
    });

    const running = c.controller.syncNow();
    await settle();
    expect(c.calls.session).toBe(1);

    // An answer while the session request is open: its save must wait, or it
    // would race the sync from the same base revision.
    c.h.setProgress(newer);
    c.controller.localSaved();
    await settle();
    expect(c.calls.save).toHaveLength(0);
    expect(c.controller.status).toBe('saving');

    release!({
      ...emptyAnswer(),
      revision: 3,
      progress: portable(local),
      updatedAt: local.updatedAt,
    });
    await running;
    await settle();

    // The sync itself uploads the newer progress once; the waiting save then
    // finds nothing new to send.
    expect(c.calls.save).toHaveLength(1);
    expect(c.calls.save[0].base).toBe(3);
    expect(c.calls.save[0].progress.updatedAt).toBe(newer.updatedAt);
    expect(c.controller.account?.mark).toEqual({
      revision: 4,
      updatedAt: newer.updatedAt,
    });
    expect(c.h.conflicts).toHaveLength(0);
    expect(c.controller.status).toBe('saved');
  });

  it('shows Saving while an answer waits for the 20 s interval', async () => {
    const local = practised();
    const c = controllerFor(local, account({ revision: 3, updatedAt: local.updatedAt }));
    c.h.setProgress(practised(NOW + 1_000, 4));
    c.controller.localSaved();
    await settle();
    expect(c.calls.save).toHaveLength(1);
    expect(c.controller.status).toBe('saved');
    c.h.setProgress(practised(NOW + 2_000, 5));
    c.controller.localSaved();
    await settle();
    expect(c.calls.save).toHaveLength(1);
    expect(c.controller.status).toBe('saving');
    await c.t.advance(20_000);
    expect(c.calls.save).toHaveLength(2);
    expect(c.controller.status).toBe('saved');
  });

  it('counts a sign-in upload for the 20 s interval', async () => {
    const local = practised();
    const c = controllerFor(local, account(), {
      session: async () => ({ ...emptyAnswer(), revision: 0, progress: undefined, updatedAt: null }),
    });
    await c.controller.syncNow();
    expect(c.calls.save).toHaveLength(1);
    c.h.setProgress(practised(NOW + 1_000, 4));
    c.controller.localSaved();
    await settle();
    expect(c.calls.save).toHaveLength(1);
    await c.t.advance(20_000);
    expect(c.calls.save).toHaveLength(2);
  });

  it('turns a 409 answer into the conflict prompt', async () => {
    const local = practised(NOW + 30_000, 6);
    const other = practised(NOW + 60_000, 8);
    const mark = { revision: 3, updatedAt: NOW };
    const c = controllerFor(local, account(mark), {
      save: async () => ({
        status: 'conflict',
        revision: 4,
        progress: portable(other),
        updatedAt: other.updatedAt,
      }),
    });

    c.controller.localSaved();
    await settle();

    expect(c.calls.save).toHaveLength(1);
    expect(c.calls.save[0].base).toBe(3);
    expect(c.h.conflicts).toHaveLength(1);
    expect(c.controller.account?.mark).toEqual(mark);
  });

  it('goes offline and retries with the waiting change when the network returns', async () => {
    let offline = true;
    const local = practised(NOW + 30_000, 6);
    const c = controllerFor(local, account({ revision: 3, updatedAt: NOW }), {
      save: async () => {
        if (offline) throw new AccountError('offline');
        return { status: 'saved', revision: 4 };
      },
    });

    c.controller.localSaved();
    await settle();
    expect(c.h.statuses.at(-1)?.status).toBe('offline');
    expect(c.calls.save).toHaveLength(1);

    offline = false;
    c.controller.retry();
    await c.t.advance(20_000);
    expect(c.calls.save).toHaveLength(2);
    expect(c.h.statuses.at(-1)?.status).toBe('saved');
    expect(c.controller.account?.mark).toEqual({
      revision: 4,
      updatedAt: local.updatedAt,
    });
  });

  it('stops after a 401 and keeps this device progress', async () => {
    const local = practised(NOW + 30_000, 6);
    const c = controllerFor(local, account({ revision: 3, updatedAt: NOW }), {
      session: async () => {
        throw new AccountError('unknown-code');
      },
    });

    await c.controller.syncNow();

    expect(c.h.statuses.at(-1)).toEqual({
      status: 'stopped',
      message: CODE_STOPPED_MESSAGE,
    });
    c.controller.localSaved();
    await settle();
    expect(c.calls.save).toHaveLength(0);
    expect(c.h.current.progress).toEqual(local);
  });

  it('stops with a reload message for progress from a newer site version', async () => {
    const c = controllerFor(practised(), account({ revision: 3, updatedAt: NOW }), {
      session: async () => {
        throw new NewerProgressError(
          'This progress was saved by a newer version of the site.',
        );
      },
    });

    await c.controller.syncNow();

    expect(c.h.statuses.at(-1)).toEqual({
      status: 'stopped',
      message: RELOAD_MESSAGE,
    });
  });

  it('signs in with a normalized code and uploads local progress', async () => {
    const local = practised();
    const c = controllerFor(local, undefined, {
      session: async () => emptyAnswer(),
    });

    const answer = await c.controller.signIn(' test-k7qm 4zx9 b2 ');
    expect(c.controller.account).toMatchObject({
      code: TEST_CODE,
      name: 'Ada Test',
      className: 'Test class',
      classPrefix: 'TEST',
    });
    await c.controller.afterSignIn(answer);

    expect(c.calls.save).toHaveLength(1);
    expect(c.calls.save[0].base).toBe(0);
    expect(c.controller.account?.mark).toEqual({
      revision: 1,
      updatedAt: local.updatedAt,
    });
    expect(c.h.accounts.at(-1)?.code).toBe(TEST_CODE);
  });

  it('records an empty online copy as the baseline instead of uploading', async () => {
    const local = freshProgress(config, NOW);
    const c = controllerFor(local, undefined, {
      session: async () => emptyAnswer(),
    });

    const answer = await c.controller.signIn(TEST_CODE);
    await c.controller.afterSignIn(answer);

    expect(c.calls.save).toHaveLength(0);
    expect(c.controller.account?.mark).toEqual({
      revision: 0,
      updatedAt: local.updatedAt,
    });
    expect(c.h.statuses.at(-1)?.status).toBe('saved');
  });

  it('sends a page-hide save with keepalive', async () => {
    const local = practised(NOW + 30_000, 6);
    const c = controllerFor(local, account({ revision: 3, updatedAt: NOW }));

    c.controller.localSaved();
    await settle();
    c.h.setProgress(practised(NOW + 40_000, 7));
    c.controller.flush();
    await settle();

    expect(c.calls.save).toHaveLength(2);
    expect(c.calls.save[0].keepalive).toBe(false);
    expect(c.calls.save[1].keepalive).toBe(true);
  });

  it('keeps a page-hide save alive when the interval has already elapsed', async () => {
    const local = practised(NOW + 30_000, 6);
    const c = controllerFor(local, account({ revision: 3, updatedAt: NOW }));

    c.controller.localSaved();
    await settle();
    expect(c.calls.save[0].keepalive).toBe(false);

    await c.t.advance(20_000);
    c.h.setProgress(practised(NOW + 40_000, 7));
    c.controller.flush();
    await settle();

    expect(c.calls.save).toHaveLength(2);
    expect(c.calls.save[1].keepalive).toBe(true);
  });

  it('does not sign out while the latest change is not online', async () => {
    const local = practised(NOW + 30_000, 6);
    const c = controllerFor(local, account({ revision: 3, updatedAt: NOW }), {
      save: async () => {
        throw new AccountError('offline');
      },
    });

    await expect(c.controller.signOut()).resolves.toEqual({
      ok: false,
      message: SIGN_OUT_OFFLINE_MESSAGE,
    });
    expect(c.h.clears).toBe(0);
    expect(c.controller.account).toBeDefined();
  });

  it('saves a waiting change, then clears the device on sign out', async () => {
    const local = practised(NOW + 30_000, 6);
    const c = controllerFor(local, account({ revision: 3, updatedAt: NOW }));

    await expect(c.controller.signOut()).resolves.toEqual({ ok: true });

    expect(c.calls.save).toHaveLength(1);
    expect(c.calls.save[0].base).toBe(3);
    expect(c.h.clears).toBe(1);
    expect(c.controller.account).toBeUndefined();
  });

  it('saves once more before signing out even when nothing changed', async () => {
    const local = practised();
    const c = controllerFor(local, account({ revision: 3, updatedAt: local.updatedAt }));

    await expect(c.controller.signOut()).resolves.toEqual({ ok: true });

    expect(c.calls.save).toHaveLength(1);
    expect(c.calls.save[0].base).toBe(3);
    expect(c.h.clears).toBe(1);
  });

  it('blocks sign out when offline even if nothing changed', async () => {
    const local = practised();
    const c = controllerFor(local, account({ revision: 3, updatedAt: local.updatedAt }), {
      save: async () => {
        throw new AccountError('offline');
      },
    });

    await expect(c.controller.signOut()).resolves.toEqual({
      ok: false,
      message: SIGN_OUT_OFFLINE_MESSAGE,
    });
    expect(c.h.clears).toBe(0);
    expect(c.controller.account).toBeDefined();
  });

  it('does not clear progress that changed while the sign-out save was pending', async () => {
    const local = practised();
    const newer = practised(NOW + 30_000, 6);
    let release!: (answer: { status: 'saved'; revision: number }) => void;
    let saves = 0;
    const c = controllerFor(local, account({ revision: 3, updatedAt: local.updatedAt }), {
      save: () => {
        saves++;
        if (saves === 1)
          return new Promise<{ status: 'saved'; revision: number }>((resolve) => {
            release = resolve;
          });
        return Promise.resolve({ status: 'saved', revision: 5 });
      },
    });

    const running = c.controller.signOut();
    await settle();
    expect(c.calls.save).toHaveLength(1);

    c.h.setProgress(newer);
    c.controller.localSaved();
    expect(c.calls.save).toHaveLength(1);

    release({ status: 'saved', revision: 4 });
    await expect(running).resolves.toEqual({
      ok: false,
      message: SIGN_OUT_UNSAVED_MESSAGE,
    });
    expect(c.h.clears).toBe(0);
    expect(c.controller.account).toBeDefined();

    // The sign-out save started the 20 s interval, so the new answer waits.
    await settle();
    expect(c.calls.save).toHaveLength(1);
    await c.t.advance(20_000);
    expect(c.calls.save).toHaveLength(2);
    expect(c.calls.save[1].progress.updatedAt).toBe(newer.updatedAt);
    expect(c.controller.account?.mark).toEqual({
      revision: 5,
      updatedAt: newer.updatedAt,
    });
  });

  it('blocks sign out while a stopped account is offline, even with no local change', async () => {
    const local = practised();
    const c = controllerFor(local, account({ revision: 3, updatedAt: local.updatedAt }), {
      session: async () => {
        throw new AccountError('unknown-code');
      },
      save: async () => {
        throw new AccountError('offline');
      },
    });
    await c.controller.syncNow();
    expect(c.h.statuses.at(-1)?.status).toBe('stopped');

    await expect(c.controller.signOut()).resolves.toEqual({
      ok: false,
      message: SIGN_OUT_OFFLINE_MESSAGE,
    });
    expect(c.h.clears).toBe(0);
    expect(c.controller.account).toBeDefined();
    expect(c.calls.save).toHaveLength(1);
  });

  it('signs out a stopped account when the server is reachable and nothing changed', async () => {
    const local = practised();
    const c = controllerFor(local, account({ revision: 3, updatedAt: local.updatedAt }), {
      session: async () => {
        throw new AccountError('unknown-code');
      },
      save: async () => {
        throw new AccountError('unknown-code');
      },
    });
    await c.controller.syncNow();
    expect(c.h.statuses.at(-1)?.status).toBe('stopped');

    await expect(c.controller.signOut()).resolves.toEqual({ ok: true });
    expect(c.h.clears).toBe(1);
    expect(c.controller.account).toBeUndefined();
  });

  it('keeps a stopped account when its dead code cannot save local changes', async () => {
    const local = practised();
    const newer = practised(NOW + 30_000, 6);
    const c = controllerFor(local, account({ revision: 3, updatedAt: local.updatedAt }), {
      session: async () => {
        throw new AccountError('unknown-code');
      },
      save: async () => {
        throw new AccountError('unknown-code');
      },
    });
    await c.controller.syncNow();
    c.h.setProgress(newer);

    await expect(c.controller.signOut()).resolves.toEqual({
      ok: false,
      message: SIGN_OUT_DEAD_MESSAGE,
      discard: true,
    });
    expect(c.h.clears).toBe(0);
    expect(c.controller.account).toBeDefined();

    // The student confirmed: the replaced code can never save these answers.
    await expect(c.controller.signOut(true)).resolves.toEqual({ ok: true });
    expect(c.h.clears).toBe(1);
    expect(c.controller.account).toBeUndefined();
  });

  it('keeps the backup on a silent download and replaces it only on a chosen one', async () => {
    const local = practised();
    const other = practised(NOW + 60_000, 8);
    const c = controllerFor(local, account({ revision: 3, updatedAt: local.updatedAt }), {
      session: async () => ({
        ...emptyAnswer(),
        revision: 4,
        progress: portable(other),
        updatedAt: other.updatedAt,
      }),
    });
    await c.controller.syncNow();
    expect(c.h.backups).toEqual([false]);

    await c.controller.useOnlineCopy({
      revision: 5,
      progress: portable(practised(NOW + 90_000, 9)),
      updatedAt: NOW + 90_000,
    });
    expect(c.h.backups).toEqual([false, true]);
  });

  it('opens the conflict prompt when the sign-out save sees a newer copy', async () => {
    const local = practised(NOW + 30_000, 6);
    const other = practised(NOW + 60_000, 8);
    const c = controllerFor(local, account({ revision: 3, updatedAt: NOW }), {
      save: async () => ({
        status: 'conflict',
        revision: 4,
        progress: portable(other),
        updatedAt: other.updatedAt,
      }),
    });

    await expect(c.controller.signOut()).resolves.toEqual({
      ok: false,
      conflict: true,
    });
    expect(c.h.conflicts).toHaveLength(1);
    expect(c.h.conflicts[0].revision).toBe(4);
    expect(c.h.clears).toBe(0);
    expect(c.controller.account).toBeDefined();
  });
});
