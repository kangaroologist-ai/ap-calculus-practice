import {
  allEnabledReady,
  chooseNext,
  finishQuestion,
  freshProgress,
  recordOutcome,
  type AppState,
  type Current,
  type Progress,
  type Session,
} from '../../src/progress';
import type { Config, Question, Verdict } from '../../src/types';

// Fixed so a simulation run is fully reproducible across machines and CI.
const NOW = Date.parse('2026-01-01T00:00:00.000Z');

const CORRECT: Verdict = { status: 'correct', evidence: 'symbolic' };
const INCORRECT: Verdict = { status: 'incorrect', feedbackCode: 'wrong-rule' };

function emptySession(config: Config): Session {
  return {
    config,
    completed: 0,
    independent: 0,
    assisted: 0,
    skipped: 0,
    finished: false,
  };
}

function newCurrent(picked: { question: Question; reason: string }): Current {
  return {
    question: picked.question,
    draft: [''],
    hintsUsed: 0,
    recorded: false,
    closed: false,
    reason: picked.reason,
  };
}

export interface SimulateOptions {
  // Called right before each question is recorded, with the question, the
  // reason chooseNext picked it, and a snapshot of progress as it stood
  // *before* this question's outcome is applied. Lets a caller (Phase 2's
  // basic/mix invariant checks, per SPEC-C7) inspect every step of a run
  // without re-implementing the loop.
  onQuestion?: (question: Question, reason: string, progressBefore: Progress) => void;
}

export interface SimulateResult {
  p: Progress;
  questions: number;
  now: number;
}

// Drives chooseNext/recordOutcome/finishQuestion exactly as the app does, from
// a fresh progress snapshot, until every enabled skill is Ready (or
// maxQuestions is exhausted). Used to prove the scheduler cannot deadlock
// (SPEC-C7) under a given config and answering strategy.
export function simulate(
  c: Config,
  isRight: (q: Question) => boolean,
  maxQuestions = 3000,
  opts: SimulateOptions = {},
): SimulateResult {
  let now = NOW;
  const p = freshProgress(c, now);
  const state: AppState = { version: 1, progress: p, session: emptySession(c) };
  for (let i = 0; i < maxQuestions; i++) {
    if (allEnabledReady(p, c)) return { p, questions: i, now };
    let picked: { question: Question; reason: string };
    try {
      picked = chooseNext(p, c, now);
    } catch (e) {
      if ((e as Error).message !== 'PRACTICE_PAUSE') throw e;
      const due = Object.values(p.skills)
        .map((s) => s.card.due)
        .filter((d) => d > now);
      if (!due.length) throw new Error('deadlock: paused with nothing due');
      now = Math.min(...due);
      continue;
    }
    opts.onQuestion?.(picked.question, picked.reason, structuredClone(p));
    const cur = newCurrent(picked);
    recordOutcome(p, cur, c, isRight(picked.question) ? CORRECT : INCORRECT, now);
    state.session!.current = cur;
    finishQuestion(state);
    now += 20_000;
  }
  throw new Error('did not converge');
}
