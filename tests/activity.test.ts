import { describe, expect, it } from "vitest";
import {
  freshProgress,
  recordOutcome,
  recordHint,
  finishQuestion,
  localPracticeDay,
  todayCount,
  type Current,
  type AppState,
} from "../src/progress";
import {
  makePortableProgress,
  encodeProgress,
  decodeProgress,
  validateSnapshot,
} from "../src/transfer";
import { generateQuestion } from "../src/questions";
const config: import("../src/types").Config = {
  schemaVersion: 1,
  revision: "activity",
  initialUnlockedLevel: 1,
  disabledFamilies: [],
  sessionLength: 1,
};
const now = Date.now();
const current = (seed: string): Current => ({
  question: generateQuestion("constant", seed),
  draft: ["0"],
  hintsUsed: 0,
  recorded: false,
  closed: false,
  reason: "test",
});
const good = { status: "correct", evidence: "symbolic" } as const;
describe("continuous activity counters", () => {
  it("counts first answers once, never retries, invalid input, or inconclusive results", () => {
    const p = freshProgress(config, now),
      c = current("first");
    recordOutcome(p, c, config, { status: "invalid", message: "invalid" }, now);
    recordOutcome(
      p,
      c,
      config,
      { status: "inconclusive", message: "unknown" },
      now,
    );
    expect(todayCount(p, now)).toBe(0);
    recordOutcome(p, c, config, good, now);
    recordOutcome(p, c, config, good, now);
    expect(p.streak).toBe(1);
    expect(todayCount(p, now)).toBe(1);
    recordOutcome(
      p,
      current("wrong"),
      config,
      { status: "incorrect", feedbackCode: "wrong" },
      now,
    );
    expect(p.streak).toBe(0);
    expect(todayCount(p, now)).toBe(2);
  });
  it("teaching hints count a practiced question once and break the independent streak", () => {
    const p = freshProgress(config, now);
    p.streak = 9;
    const c = current("help");
    recordHint(p, c, config, now);
    recordHint(p, c, config, now);
    recordOutcome(p, c, config, good, now);
    expect(p.streak).toBe(0);
    expect(todayCount(p, now)).toBe(1);
  });
  it("skipping breaks streak without counting an answer and no session limit terminates practice", () => {
    const p = freshProgress(config, now);
    p.streak = 4;
    const state: AppState = {
      version: 1,
      progress: p,
      session: {
        config,
        completed: 12,
        independent: 0,
        assisted: 0,
        skipped: 0,
        finished: false,
        current: current("skip"),
      },
    };
    finishQuestion(state, true);
    finishQuestion(state, true);
    expect(state.session!.completed).toBe(13);
    expect(state.session!.finished).toBe(false);
    expect(p.streak).toBe(0);
    expect(todayCount(p, now)).toBe(0);
  });
  it("uses local calendar days, retains at most 31, and exports both counters exactly", () => {
    const p = freshProgress(config, now);
    p.streak = 10;
    const day = new Date(now);
    day.setHours(12, 0, 0, 0);
    for (let i = 35; i >= 0; i--) {
      const d = new Date(day);
      d.setDate(day.getDate() - i);
      recordOutcome(p, current(`day-${i}`), config, good, d.getTime());
    }
    expect(Object.keys(p.practiceDays!)).toHaveLength(31);
    expect(p.practiceDays![localPracticeDay(now)]).toBe(1);
    const portable = makePortableProgress(p, now);
    expect(decodeProgress(encodeProgress(portable))).toEqual(portable);
  });
  it("rejects distant future day keys and retains today if the local clock moves back", () => {
    const p = freshProgress(config, now);
    const future = new Date(now);
    future.setDate(future.getDate() + 30);
    expect(() =>
      validateSnapshot({
        ...p,
        exportedAt: now,
        practiceDays: { [localPracticeDay(future.getTime())]: 1 },
      }),
    ).toThrow();
    p.practiceDays = Object.fromEntries(
      Array.from({ length: 31 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() + i + 1);
        return [localPracticeDay(d.getTime()), 1];
      }),
    );
    recordOutcome(p, current("clock-back"), config, good, now);
    expect(todayCount(p, now)).toBe(1);
    expect(Object.keys(p.practiceDays)).toHaveLength(31);
  });
  it("accepts old snapshots without activity counters and rejects malformed new counters", () => {
    const p = freshProgress(config, now);
    delete p.streak;
    delete p.practiceDays;
    expect(validateSnapshot({ ...p, exportedAt: now }).streak).toBeUndefined();
    expect(makePortableProgress(p, now).streak).toBe(0);
    for (const streak of [-1, 1.2, Infinity])
      expect(() =>
        validateSnapshot({ ...p, streak, exportedAt: now }),
      ).toThrow();
    for (const practiceDays of [{ "2026-02-30": 1 }, { "2026-09-19": -1 }, []])
      expect(() =>
        validateSnapshot({ ...p, practiceDays, exportedAt: now }),
      ).toThrow();
  });
});
