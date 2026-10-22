import { describe, expect, it } from 'vitest';
import { freshProgress, stateFor, type Progress } from '../src/progress';
import {
  decideSync,
  createSaveScheduler,
  hasLearningProgress,
  sameProgress,
  type SaveTimer,
} from '../src/sync';
import {
  decodeProgress,
  encodeProgress,
  makePortableProgress,
} from '../src/transfer';
import type { Config } from '../src/types';

const NOW = Date.now();
const config: Config = {
  schemaVersion: 1,
  revision: 'sync-test',
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

// The online copy as the client sees it: encoded, stored, decoded.
const online = (p: Progress, revision: number, exportedAt = NOW + 5_000) => ({
  revision,
  progress: decodeProgress(encodeProgress(makePortableProgress(p, exportedAt))),
});
const empty = { revision: 0, progress: undefined };

describe('sameProgress', () => {
  it('ignores the export time of a round trip', () => {
    const p = practised();
    expect(sameProgress(p, online(p, 1).progress!)).toBe(true);
    expect(sameProgress(p, online(p, 1, NOW + 99_000).progress!)).toBe(true);
  });

  it('sees one more answer', () => {
    const p = practised();
    const copy = online(p, 1).progress!;
    p.sequence++;
    p.updatedAt += 1_000;
    expect(sameProgress(p, copy)).toBe(false);
  });

  it('ignores the current-question template that export drops', () => {
    const p = practised();
    const copy = online(p, 1).progress!;
    p.skills.power.lastTemplate = 'power-basic-1';
    expect(sameProgress(p, copy)).toBe(true);
  });
});

describe('hasLearningProgress', () => {
  it('is false for a device that never answered', () => {
    expect(hasLearningProgress(freshProgress(config, NOW))).toBe(false);
    expect(hasLearningProgress(practised())).toBe(true);
  });
});

describe('decideSync after an earlier sync (first table)', () => {
  const mark = { revision: 4, updatedAt: NOW };

  it('same revision, not changed: nothing', () => {
    expect(decideSync(mark, practised(NOW), online(practised(NOW), 4))).toBe(
      'none',
    );
  });

  it('same revision, changed: upload', () => {
    const local = practised(NOW + 30_000, 4);
    expect(decideSync(mark, local, online(practised(NOW), 4))).toBe('upload');
  });

  it('newer revision, not changed: download without a prompt', () => {
    const other = practised(NOW + 30_000, 6);
    expect(decideSync(mark, practised(NOW), online(other, 5))).toBe(
      'download',
    );
  });

  it('newer revision, changed: prompt', () => {
    const local = practised(NOW + 20_000, 5);
    const other = practised(NOW + 30_000, 6);
    expect(decideSync(mark, local, online(other, 5))).toBe('prompt');
  });

  it('newer revision, changed to the same progress: adopt', () => {
    const local = practised(NOW + 20_000, 5);
    expect(decideSync(mark, local, online(local, 5))).toBe('adopt');
  });

  it('does not trust device clocks: an older updatedAt online still counts as newer', () => {
    const local = practised(NOW + 20_000, 5);
    const other = practised(NOW - 3_600_000, 6);
    expect(decideSync(mark, local, online(other, 5))).toBe('prompt');
    expect(decideSync(mark, practised(NOW), online(other, 5))).toBe(
      'download',
    );
  });

  it('a draft save does not change updatedAt, so it is not a change', () => {
    const local = practised(NOW);
    // Saving the current question or draft writes AppState.session only.
    expect(local.updatedAt).toBe(mark.updatedAt);
    expect(decideSync(mark, local, online(practised(NOW + 30_000, 6), 5))).toBe(
      'download',
    );
  });

  it('a 409 answer (another device saved first) gives the prompt', () => {
    // This device changed and tried to save on revision 4; the server is at 5.
    const local = practised(NOW + 20_000, 5);
    const conflict = online(practised(NOW + 10_000, 7), 5);
    expect(decideSync(mark, local, conflict)).toBe('prompt');
  });

  it('an account that the teacher emptied takes this device progress', () => {
    expect(decideSync(mark, practised(NOW), empty)).toBe('upload');
    expect(decideSync(mark, freshProgress(config, NOW), empty)).toBe('none');
  });
});

describe('decideSync on the first sign-in on this device (second table)', () => {
  it('empty account, no progress here: nothing', () => {
    expect(decideSync(undefined, freshProgress(config, NOW), empty)).toBe(
      'none',
    );
  });

  it('empty account, progress here: upload', () => {
    expect(decideSync(undefined, practised(), empty)).toBe('upload');
  });

  it('account with progress, no progress here: download', () => {
    expect(
      decideSync(undefined, freshProgress(config, NOW), online(practised(), 2)),
    ).toBe('download');
  });

  it('account with progress, progress here: prompt', () => {
    expect(
      decideSync(undefined, practised(NOW, 2), online(practised(NOW, 9), 2)),
    ).toBe('prompt');
  });

  it('account with progress, the same progress here: adopt', () => {
    const p = practised();
    expect(decideSync(undefined, p, online(p, 2))).toBe('adopt');
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
    get waiting() {
      return timers.size;
    },
  };
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function controlledSave() {
  const calls: { keepalive: boolean; done: () => void; fail: () => void }[] =
    [];
  const save = (keepalive: boolean) =>
    new Promise<void>((resolve, reject) => {
      calls.push({
        keepalive,
        done: resolve,
        fail: () => reject(Error('offline')),
      });
    });
  return { calls, save };
}

describe('createSaveScheduler (5 s wait, one save per question)', () => {
  it('saves once, 5 s after the last change', async () => {
    const t = fakeTimer();
    const s = controlledSave();
    const scheduler = createSaveScheduler(s.save, t.timer);
    scheduler.request();
    expect(s.calls).toHaveLength(0);
    await t.advance(4_999);
    expect(s.calls).toHaveLength(0);
    await t.advance(1);
    expect(s.calls).toHaveLength(1);
    expect(s.calls[0].keepalive).toBe(false);
    s.calls[0].done();
    await settle();
    expect(scheduler.busy).toBe(false);
  });

  it('makes the answer and Next of one question one save', async () => {
    const t = fakeTimer();
    const s = controlledSave();
    const scheduler = createSaveScheduler(s.save, t.timer);
    scheduler.request(); // answer recorded
    await t.advance(2_000);
    scheduler.request(); // Next
    await t.advance(4_999);
    expect(s.calls).toHaveLength(0);
    await t.advance(1);
    expect(s.calls).toHaveLength(1);
  });

  it('never runs two saves at once', async () => {
    const t = fakeTimer();
    const s = controlledSave();
    const scheduler = createSaveScheduler(s.save, t.timer);
    scheduler.request();
    await t.advance(5_000);
    scheduler.request();
    await t.advance(60_000);
    expect(s.calls).toHaveLength(1);
    s.calls[0].done();
    await settle();
    // The change made during the save waits 5 s after that save ends.
    expect(s.calls).toHaveLength(1);
    await t.advance(5_000);
    expect(s.calls).toHaveLength(2);
  });

  it('flush saves a waiting change now with keepalive', async () => {
    const t = fakeTimer();
    const s = controlledSave();
    const scheduler = createSaveScheduler(s.save, t.timer);
    scheduler.request();
    expect(t.waiting).toBe(1);
    scheduler.flush();
    expect(s.calls).toHaveLength(1);
    expect(s.calls[0].keepalive).toBe(true);
    expect(t.waiting).toBe(0);
  });

  it('flush during a save sends the waiting change right after it', async () => {
    const t = fakeTimer();
    const s = controlledSave();
    const scheduler = createSaveScheduler(s.save, t.timer);
    scheduler.request();
    await t.advance(5_000);
    scheduler.request();
    scheduler.flush();
    expect(s.calls).toHaveLength(1);
    s.calls[0].done();
    await settle();
    expect(s.calls).toHaveLength(2);
    expect(s.calls[1].keepalive).toBe(true);
  });

  it('flush with nothing waiting does nothing', () => {
    const t = fakeTimer();
    const s = controlledSave();
    const scheduler = createSaveScheduler(s.save, t.timer);
    scheduler.flush();
    expect(s.calls).toHaveLength(0);
  });

  it('a failed save does not stop later saves', async () => {
    const t = fakeTimer();
    const s = controlledSave();
    const scheduler = createSaveScheduler(s.save, t.timer);
    scheduler.request();
    await t.advance(5_000);
    s.calls[0].fail();
    await settle();
    scheduler.request();
    await t.advance(5_000);
    expect(s.calls).toHaveLength(2);
  });

  it('cancel drops the waiting save', async () => {
    const t = fakeTimer();
    const s = controlledSave();
    const scheduler = createSaveScheduler(s.save, t.timer);
    scheduler.request();
    scheduler.cancel();
    await t.advance(60_000);
    expect(s.calls).toHaveLength(0);
    expect(scheduler.busy).toBe(false);
  });
});
