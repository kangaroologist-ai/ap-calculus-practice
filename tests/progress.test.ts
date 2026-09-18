import { describe, expect, it } from 'vitest';
import { createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import {
  ALGORITHM_VERSION,
  PARAMETERS,
  SCHEDULER_VERSION,
  chooseNext,
  freshProgress,
  isReady,
  recordHint,
  recordOutcome,
  reviveCard,
  stateFor,
  storeCard,
  unlock,
  type Current,
  type Progress,
  type SkillState,
} from '../src/progress';
import { SKILLS, CURRICULUM_VERSION } from '../src/catalog';
import { decodeProgress, encodeProgress, makePortableProgress, validateSnapshot } from '../src/transfer';
import type { Config, Question, Verdict } from '../src/types';

const NOW = Date.parse('2026-09-18T00:00:00.000Z');
const config = (overrides: Partial<Config> = {}): Config => ({
  schemaVersion: 1,
  revision: 'test-revision',
  initialUnlockedLevel: 1,
  disabledFamilies: [],
  sessionLength: 12,
  ...overrides,
});

function question(
  id: string,
  skill = 'power',
  template = 0,
  supportingSkills: string[] = [],
): Question {
  const level = SKILLS.find((item) => item.id === skill)?.level ?? 1;
  return {
    id,
    seed: id,
    generatorVersion: 'test-generator',
    template,
    family: skill,
    level,
    primarySkill: skill,
    supportingSkills,
    title: 'Test derivative',
    prompt: 'Differentiate the test function.',
    source: ['x'],
    answers: ['1'],
    labels: ['dy/dx'],
    domain: { variable: 'x', intervals: [[-2, 2]], guards: [] },
    domainText: 'all test values',
    hints: ['Use the rule.'],
    hintMath: "f'(x)",
    steps: [{ text: 'Apply the rule.', math: '1' }],
    signature: `signature-${id}`,
  };
}

function current(q: Question, hintsUsed = 0): Current {
  return {
    question: q,
    draft: [''],
    hintsUsed,
    recorded: false,
    closed: false,
    reason: 'test',
  };
}

const correct: Verdict = { status: 'correct', evidence: 'symbolic' };
const incorrect: Verdict = { status: 'incorrect', feedbackCode: 'wrong-rule' };

function readyState(templateOffset = 0, now = NOW): SkillState {
  return {
    card: storeCard(createEmptyCard(new Date(now))),
    recent: [0, 1, 0, 1, 0].map((template, index) => ({
      q: `ready-${templateOffset}-${index}`,
      template: template + (templateOffset % 2),
      correct: index !== 0,
    })),
    needsRemediation: false,
    failureStreak: 0,
    lastFailureAt: 0,
    otherSinceFailure: 0,
    extraPracticeGiven: false,
    lastSeen: 0,
  };
}

describe('local progress and FSRS boundaries', () => {
  it('creates an unmastered progress snapshot with the locked scheduler identity', () => {
    const p = freshProgress(config(), NOW);
    expect(p.unlockedLevel).toBe(1);
    expect(p.skills).toEqual({});
    expect(p.curriculumVersion).toBe(CURRICULUM_VERSION);
    expect(p.schedulerPackageVersion).toBe(SCHEDULER_VERSION);
    expect(p.fsrsAlgorithmVersion).toBe(ALGORITHM_VERSION);
    expect(p.fsrsParameters).toEqual(PARAMETERS);
  });

  it('records one unassisted due answer as one Good FSRS review', () => {
    const p = freshProgress(config(), NOW);
    const cur = current(question('good-1'));

    expect(recordOutcome(p, cur, config(), correct, NOW)).toBe(true);
    const card = reviveCard(p.skills.power.card);
    expect(card.state).toBe(State.Learning);
    expect(card.reps).toBe(1);
    expect(card.stability).toBe(2.3065);
    expect(card.difficulty).toBe(2.11810397);
    expect(card.learning_steps).toBe(1);
    expect(card.due.getTime()).toBe(NOW + 10 * 60 * 1000);
    expect(card.last_review?.getTime()).toBe(NOW);
  });

  it('does not update FSRS when the same question is submitted twice', () => {
    const p = freshProgress(config(), NOW);
    const cur = current(question('idempotent-1'));
    expect(recordOutcome(p, cur, config(), correct, NOW)).toBe(true);
    const afterFirst = structuredClone(p);
    expect(recordOutcome(p, cur, config(), correct, NOW + 1_000)).toBe(false);
    expect(p).toEqual(afterFirst);
    expect(p.skills.power.card.reps).toBe(1);
  });

  it('does not update card or evidence for invalid or inconclusive answers', () => {
    const p = freshProgress(config(), NOW);
    const invalidCurrent = current(question('invalid-1'));
    const beforeInvalid = structuredClone(p);
    expect(recordOutcome(p, invalidCurrent, config(), { status: 'invalid', message: 'bad syntax' }, NOW)).toBe(false);
    expect(p).toEqual(beforeInvalid);
    expect(invalidCurrent.recorded).toBe(false);

    const inconclusiveCurrent = current(question('inconclusive-1'));
    expect(recordOutcome(p, inconclusiveCurrent, config(), { status: 'inconclusive', message: 'not enough points' }, NOW)).toBe(false);
    expect(p).toEqual(beforeInvalid);
    expect(inconclusiveCurrent.recorded).toBe(false);
  });

  it('counts rule help before submission as assisted Again, not independent mastery', () => {
    const p = freshProgress(config(), NOW);
    const cur = current(question('hint-before-submit-1'), 1);
    expect(recordOutcome(p, cur, config(), correct, NOW)).toBe(true);
    const state = p.skills.power;
    expect(state.recent.at(-1)?.correct).toBe(false);
    expect(state.needsRemediation).toBe(true);
    expect(reviveCard(state.card).stability).toBe(0.212);
  });

  it('does not treat an input-help interaction as a teaching hint', () => {
    const p = freshProgress(config(), NOW);
    const cur = current(question('input-help-1'), 0);
    expect(recordOutcome(p, cur, config(), correct, NOW)).toBe(true);
    expect(p.skills.power.recent.at(-1)?.correct).toBe(true);
    expect(p.skills.power.needsRemediation).toBe(false);
  });

  it('records a pre-submit hint as one assisted Again and does not double-count submit', () => {
    const p = freshProgress(config(), NOW);
    const cur = current(question('hint-event-1'));
    recordHint(p, cur, config(), NOW);
    expect(cur.hintsUsed).toBe(1);
    expect(cur.recorded).toBe(true);
    expect(p.skills.power.recent.at(-1)?.correct).toBe(false);
    expect(reviveCard(p.skills.power.card).stability).toBe(0.212);
    const afterHint = structuredClone(p);
    expect(recordOutcome(p, cur, config(), correct, NOW)).toBe(false);
    expect(p).toEqual(afterHint);
  });

  it('keeps FSRS state unchanged for extra practice before due time', () => {
    const p = freshProgress(config(), NOW);
    const first = current(question('early-base-1'));
    expect(recordOutcome(p, first, config(), correct, NOW)).toBe(true);
    const beforeEarly = structuredClone(p.skills.power.card);
    const early = current(question('early-extra-1'));
    expect(recordOutcome(p, early, config(), correct, NOW + 5 * 60 * 1000)).toBe(true);
    expect(p.skills.power.card).toEqual(beforeEarly);
    expect(p.skills.power.card.reps).toBe(1);
    expect(p.skills.power.card.due).toBe(NOW + 10 * 60 * 1000);
  });

  it('updates FSRS at the exact due instant after early practice was skipped', () => {
    const p = freshProgress(config(), NOW);
    expect(recordOutcome(p, current(question('due-base-1')), config(), correct, NOW)).toBe(true);
    const due = p.skills.power.card.due;
    expect(recordOutcome(p, current(question('due-answer-1')), config(), correct, due)).toBe(true);
    expect(p.skills.power.card.reps).toBe(2);
    expect(p.skills.power.card.last_review).toBe(due);
  });

  it('schedules a due incorrect answer as Again and queues supporting diagnostics', () => {
    const p = freshProgress(config(), NOW);
    const cur = current(question('wrong-1', 'product', 0, ['sum', 'power']));
    expect(recordOutcome(p, cur, config(), incorrect, NOW)).toBe(true);
    expect(p.skills.product.needsRemediation).toBe(true);
    expect(p.skills.product.failureStreak).toBe(1);
    expect(p.pendingDiagnostics).toEqual(['sum', 'power']);
    expect(reviveCard(p.skills.product.card).stability).toBe(0.212);
  });

  it('does not schedule a second FSRS update for a retry after an incorrect answer', () => {
    const p = freshProgress(config(), NOW);
    const cur = current(question('wrong-retry-1'));
    expect(recordOutcome(p, cur, config(), incorrect, NOW)).toBe(true);
    const afterFirst = structuredClone(p);
    expect(recordOutcome(p, cur, config(), correct, NOW + 60_000)).toBe(false);
    expect(p).toEqual(afterFirst);
  });

  it('holds a remedial skill until two other skill opportunities have passed', () => {
    const p = freshProgress(config(), NOW);
    const state = stateFor(p, 'power', NOW);
    state.needsRemediation = true;
    state.otherSinceFailure = 1;
    p.pendingDiagnostics = [];
    expect(state.extraPracticeGiven).toBe(false);
    const picked = chooseNext(p, config(), NOW);
    expect(picked.question.primarySkill).not.toBe('power');
    expect(p.skills.power.extraPracticeGiven).toBe(false);
  });

  it('marks a remedial slot once the two-other-skill spacing condition is met', () => {
    const p = freshProgress(config(), NOW);
    const state = stateFor(p, 'power', NOW);
    state.needsRemediation = true;
    state.otherSinceFailure = 2;
    p.pendingDiagnostics = [];
    const picked = chooseNext(p, config(), NOW);
    expect(picked.question.primarySkill).toBe('power');
    expect(picked.reason).toBe('Rebuild this skill');
    expect(p.skills.power.extraPracticeGiven).toBe(true);
  });

  it('pauses instead of generating another question when every eligible skill is remediation-blocked', () => {
    const p = freshProgress(config(), NOW);
    p.pendingDiagnostics = [];
    for (const skill of SKILLS.filter((item) => item.level === 1)) {
      const state = stateFor(p, skill.id, NOW);
      state.needsRemediation = true;
      state.otherSinceFailure = 0;
      state.card.due = NOW + 60_000;
      state.card.last_review = NOW;
    }

    expect(() => chooseNext(p, config(), NOW)).toThrow('PRACTICE_PAUSE');
  });

  it('allows the only enabled skill to resume at the exact one-minute Again due time', () => {
    const onlyPower = config({
      disabledFamilies: SKILLS.filter((item) => item.id !== 'power').map((item) => item.id),
    });
    const p = freshProgress(onlyPower, NOW);
    expect(recordOutcome(p, current(question('only-power-again')), onlyPower, incorrect, NOW)).toBe(true);
    expect(reviveCard(p.skills.power.card).due.getTime()).toBe(NOW + 60_000);
    expect(() => chooseNext(p, onlyPower, NOW)).toThrow('PRACTICE_PAUSE');

    const resumed = chooseNext(p, onlyPower, NOW + 60_000);
    expect(resumed.question.primarySkill).toBe('power');
  });

  it('unlocks the next level only after every enabled skill is Ready', () => {
    const p = freshProgress(config(), NOW);
    for (const skill of SKILLS.filter((item) => item.level === 1)) p.skills[skill.id] = readyState(0);
    unlock(p, config());
    expect(p.unlockedLevel).toBe(2);
  });

  it('does not synthesize mastery merely because initialUnlockedLevel is higher', () => {
    const p = freshProgress(config({ initialUnlockedLevel: 3 }), NOW);
    expect(p.unlockedLevel).toBe(3);
    expect(Object.keys(p.skills)).toHaveLength(0);
  });

  it('skips a fully disabled level without treating its skills as mastered', () => {
    const disabled = SKILLS.filter((item) => item.level === 1).map((item) => item.id);
    const c = config({ disabledFamilies: disabled });
    const p = freshProgress(c, NOW);
    unlock(p, c);
    expect(p.unlockedLevel).toBe(2);
    expect(Object.keys(p.skills)).toHaveLength(0);
  });

  it('keeps an already unlocked level open after a later error', () => {
    const p = freshProgress(config(), NOW);
    p.unlockedLevel = 2;
    const cur = current(question('regression-1'));
    expect(recordOutcome(p, cur, config(), incorrect, NOW)).toBe(true);
    expect(p.unlockedLevel).toBe(2);
    expect(p.skills.power.needsRemediation).toBe(true);
    expect(isReady(p.skills.power)).toBe(false);
  });

  it('restores Ready after a new independent success and preserves the card timeline', () => {
    const p = freshProgress(config(), NOW);
    const s = stateFor(p, 'power', NOW);
    s.recent = [0, 1, 0, 1, 0].map((template, index) => ({ q: `old-${index}`, template, correct: index !== 0 }));
    s.needsRemediation = true;
    s.failureStreak = 2;
    s.card = storeCard(createEmptyCard(new Date(NOW)));
    const cur = current(question('recover-1', 'power', 1));
    expect(recordOutcome(p, cur, config(), correct, NOW)).toBe(true);
    expect(s.needsRemediation).toBe(false);
    expect(s.failureStreak).toBe(0);
    expect(isReady(s)).toBe(true);
    expect(reviveCard(s.card).reps).toBe(1);
  });

  it('keeps a latest error from appearing Ready despite four earlier correct answers', () => {
    const p = freshProgress(config(), NOW);
    const s = stateFor(p, 'power', NOW);
    s.recent = [
      { q: 'ready-a', template: 0, correct: true },
      { q: 'ready-b', template: 1, correct: true },
      { q: 'ready-c', template: 0, correct: true },
      { q: 'ready-d', template: 1, correct: true },
      { q: 'latest-error', template: 0, correct: false },
    ];
    s.needsRemediation = true;
    expect(s.recent.filter((item) => item.correct)).toHaveLength(4);
    expect(isReady(s)).toBe(false);

    expect(recordOutcome(p, current(question('recovery-success', 'power', 1)), config(), correct, NOW)).toBe(true);
    expect(s.needsRemediation).toBe(true);
    expect(isReady(s)).toBe(false);
    expect(recordOutcome(p, current(question('recovery-second', 'power', 0)), config(), correct, NOW + 1)).toBe(true);
    expect(s.needsRemediation).toBe(false);
    expect(isReady(s)).toBe(true);
  });

  it('keeps remediation active after one success when the recent evidence window is not Ready yet', () => {
    const p = freshProgress(config(), NOW);
    expect(recordOutcome(p, current(question('failure-before-recovery', 'power', 0)), config(), incorrect, NOW)).toBe(true);
    expect(p.skills.power.needsRemediation).toBe(true);

    const submitAtDue = (id: string, template: number) => {
      const now = Math.max(NOW, p.skills.power.card.due);
      expect(recordOutcome(p, current(question(id, 'power', template)), config(), correct, now)).toBe(true);
    };

    submitAtDue('recovery-one', 1);
    expect(p.skills.power.recent).toHaveLength(2);
    expect(p.skills.power.needsRemediation).toBe(true);
    expect(isReady(p.skills.power)).toBe(false);

    submitAtDue('recovery-two', 0);
    expect(p.skills.power.recent).toHaveLength(3);
    expect(p.skills.power.needsRemediation).toBe(false);
    expect(isReady(p.skills.power)).toBe(true);
  });

  it('advances after two independent template variants without changing a not-due FSRS card', () => {
    const p = freshProgress(config(), NOW);
    recordOutcome(p, current(question('constant-first', 'constant', 0)), config(), correct, NOW);
    expect(isReady(p.skills.constant)).toBe(false);
    expect(chooseNext(p, config(), NOW + 1).question.primarySkill).toBe('constant');
    const card = structuredClone(p.skills.constant.card);
    recordOutcome(p, current(question('constant-second', 'constant', 1)), config(), correct, NOW + 2);
    expect(isReady(p.skills.constant)).toBe(true);
    expect(p.skills.constant.card).toEqual(card);
    expect(chooseNext(p, config(), NOW + 3).question.primarySkill).toBe('power');
  });

  it('requires two distinct questions and two structures, not retries or repeated templates', () => {
    const p = freshProgress(config(), NOW);
    const s = stateFor(p, 'power', NOW);
    s.recent = [{q:'a', template:0, correct:true}, {q:'b', template:0, correct:true}];
    expect(isReady(s)).toBe(false);
    s.recent[1].template = 1;
    s.recent[1].q = 'a';
    expect(isReady(s)).toBe(false);
    s.recent[1].q = 'b';
    expect(isReady(s)).toBe(true);
  });

  it('pauses rather than recycling Ready skills before due, but reviews them when due', () => {
    const c = config({disabledFamilies: SKILLS.filter(s => s.id !== 'constant').map(s => s.id)});
    const p = freshProgress(c, NOW);
    recordOutcome(p, current(question('c1', 'constant', 0)), c, correct, NOW);
    recordOutcome(p, current(question('c2', 'constant', 1)), c, correct, NOW + 1);
    expect(() => chooseNext(p, c, NOW + 2)).toThrow('PRACTICE_PAUSE');
    expect(chooseNext(p, c, p.skills.constant.card.due).reason).toBe('Spaced review');
  });

  it('round-trips stored Date fields as epoch milliseconds and revives them', () => {
    const card = createEmptyCard(new Date(NOW));
    const stored = storeCard(card);
    expect(typeof stored.due).toBe('number');
    expect(stored.due).toBe(NOW);
    const revived = reviveCard(stored);
    expect(revived.due).toBeInstanceOf(Date);
    expect(revived.due.getTime()).toBe(NOW);
    expect(revived.last_review).toBeUndefined();
  });

  it('exports progress without current question, draft, or attempt history', () => {
    const p = freshProgress(config(), NOW);
    const portable = makePortableProgress(p, NOW);
    expect(portable.exportedAt).toBe(NOW);
    expect(portable).not.toHaveProperty('current');
    expect(portable).not.toHaveProperty('draft');
    expect(portable).not.toHaveProperty('attempts');
    expect(portable).toHaveProperty('fsrsParameters');
  });

  it('keeps FSRS output deterministic after encode/decode at the same clock time', () => {
    const p = freshProgress(config(), NOW);
    expect(recordOutcome(p, current(question('transfer-card-1')), config(), correct, NOW)).toBe(true);
    const decoded = decodeProgress(encodeProgress(makePortableProgress(p, Date.now())));
    const originalCard = reviveCard(p.skills.power.card);
    const importedCard = reviveCard(decoded.skills.power.card);
    const params = generatorParameters(decoded.fsrsParameters);
    const scheduler = fsrs(params);
    const reviewNow = Math.max(originalCard.due.getTime(), NOW + 11 * 60 * 1000);
    const original = scheduler.next(originalCard, new Date(reviewNow), Rating.Good);
    const imported = scheduler.next(importedCard, new Date(reviewNow), Rating.Good);
    expect(imported).toEqual(original);
  });

  it.each([
    ['format version', (p: Progress) => ({ ...p, formatVersion: 2 })],
    ['curriculum version', (p: Progress) => ({ ...p, curriculumVersion: 'future-curriculum' })],
    ['package version', (p: Progress) => ({ ...p, schedulerPackageVersion: '6.0.0' })],
    ['algorithm version', (p: Progress) => ({ ...p, fsrsAlgorithmVersion: 'future-fsrs' })],
    ['parameter set', (p: Progress) => ({ ...p, fsrsParameters: { ...p.fsrsParameters, maximum_interval: 181 } })],
  ])('rejects an incompatible %s snapshot before import', (_name, mutate) => {
    const p = freshProgress(config(), Date.now());
    const snapshot = makePortableProgress(p, Date.now());
    expect(() => validateSnapshot(mutate(snapshot))).toThrow();
  });

  it.each([
    ['missing elapsed_days', (p: Progress) => { const s = stateFor(p, 'power', NOW); delete (s.card as Partial<typeof s.card>).elapsed_days; return p; }],
    ['NaN due', (p: Progress) => { stateFor(p, 'power', NOW).card.due = Number.NaN; return p; }],
    ['infinite stability', (p: Progress) => { stateFor(p, 'power', NOW).card.stability = Number.POSITIVE_INFINITY; return p; }],
    ['unknown skill', (p: Progress) => { p.skills.unknown = readyState(); return p; }],
  ])('rejects malformed Card/progress data: %s', (_name, mutate) => {
    const p = freshProgress(config(), Date.now());
    const snapshot = makePortableProgress(mutate(p), Date.now());
    expect(() => validateSnapshot(snapshot)).toThrow();
  });
});
