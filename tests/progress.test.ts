import { describe, expect, it } from 'vitest';
import { createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import {
  ALGORITHM_VERSION,
  PARAMETERS,
  SCHEDULER_VERSION,
  chooseNext,
  finishQuestion,
  freshProgress,
  isReady,
  lineReady,
  needsRemediation,
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
import { questionFingerprint } from '../src/question-identity';
import { decodeProgress, encodeProgress, makePortableProgress, validateSnapshot } from '../src/transfer';
import type { Config, Question, Role, Verdict } from '../src/types';

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
  requiredSkills?: string[],
  role?: Role,
): Question {
  const level = SKILLS.find((item) => item.id === skill)?.level ?? 1;
  const base: Question = {
    id,
    seed: id,
    generatorVersion: 'test-generator',
    template,
    templateKey: `${skill}.${template}`,
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
    ...(role ? { role } : {}),
  };
  const built: Question = requiredSkills
    ? { ...base, requiredSkills }
    : base;
  return built;
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
  const line = (offset: number) => ({
    streak: 2,
    lastQ: `q2:${(templateOffset + offset).toString(16).padStart(8, '0')}`,
    passed: true,
    repair: false,
  });
  return {
    card: storeCard(createEmptyCard(new Date(now))),
    basic: line(1),
    mix: line(2),
    failureStreak: 0,
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

  it('does not count q1 and its q2 form as different questions on one line', () => {
    const p = freshProgress(config(), NOW);
    const q1 = 'q1:12345678aaaaaaaaaaaaaaaaaaaaaaaa';
    const q2 = questionFingerprint(q1);
    const state = stateFor(p, 'power', NOW);
    state.basic = { streak: 1, lastQ: q2, passed: false, repair: false };
    const cur = current({ ...question('mixed-q-fingerprint'), signature: q1 });

    expect(recordOutcome(p, cur, config(), correct, NOW)).toBe(true);
    expect(state.basic).toEqual({
      streak: 1,
      lastQ: q2,
      passed: false,
      repair: false,
    });
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
    expect(state.basic).toMatchObject({ streak: 0, repair: true });
    expect(needsRemediation(state)).toBe(true);
    expect(reviveCard(state.card).stability).toBe(0.212);
  });

  it('does not treat an input-help interaction as a teaching hint', () => {
    const p = freshProgress(config(), NOW);
    const cur = current(question('input-help-1'), 0);
    expect(recordOutcome(p, cur, config(), correct, NOW)).toBe(true);
    expect(p.skills.power.basic.streak).toBe(1);
    expect(needsRemediation(p.skills.power)).toBe(false);
  });

  it('records a pre-submit hint as one assisted Again and does not double-count submit', () => {
    const p = freshProgress(config(), NOW);
    const cur = current(question('hint-event-1'));
    recordHint(p, cur, config(), NOW);
    expect(cur.hintsUsed).toBe(1);
    expect(cur.recorded).toBe(true);
    expect(p.skills.power.basic).toMatchObject({ streak: 0, repair: true });
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

  it('schedules a due incorrect answer as Again and queues diagnostics for Ready supporting skills', () => {
    const p = freshProgress(config(), NOW);
    // Diagnostics are only meaningful for skills the learner has actually
    // reached Ready on; make sum and power Ready first (SPEC-S1).
    p.skills.sum = readyState(0, NOW);
    p.skills.power = readyState(1, NOW);
    const cur = current(question('wrong-1', 'product', 0, ['sum', 'power']));
    expect(recordOutcome(p, cur, config(), incorrect, NOW)).toBe(true);
    expect(needsRemediation(p.skills.product)).toBe(true);
    expect(p.skills.product.failureStreak).toBe(1);
    expect(p.pendingDiagnostics).toEqual(['sum', 'power']);
    expect(reviveCard(p.skills.product.card).stability).toBe(0.212);
  });

  it('queues a diagnostic only on the first failure of a streak, and again once a success resets it', () => {
    const c = config();
    const p = freshProgress(c, NOW);
    p.skills.sum = readyState(0, NOW);

    expect(
      recordOutcome(p, current(question('streak-1', 'product', 0, ['sum'])), c, incorrect, NOW),
    ).toBe(true);
    expect(p.skills.product.failureStreak).toBe(1);
    expect(p.pendingDiagnostics).toEqual(['sum']);

    // chooseNext consumes the queued diagnostic exactly as it does in real play.
    const picked = chooseNext(p, c, NOW);
    expect(picked.question.primarySkill).toBe('sum');
    expect(picked.reason).toBe('Targeted check');
    expect(picked.question.role).toBe('basic');
    expect(p.pendingDiagnostics).toEqual([]);

    // A second consecutive failure on the same skill must not re-queue it.
    expect(
      recordOutcome(p, current(question('streak-2', 'product', 0, ['sum'])), c, incorrect, NOW + 1),
    ).toBe(true);
    expect(p.skills.product.failureStreak).toBe(2);
    expect(p.pendingDiagnostics).toEqual([]);

    // Nor does a third.
    expect(
      recordOutcome(p, current(question('streak-3', 'product', 0, ['sum'])), c, incorrect, NOW + 2),
    ).toBe(true);
    expect(p.skills.product.failureStreak).toBe(3);
    expect(p.pendingDiagnostics).toEqual([]);

    // A success resets the streak...
    expect(
      recordOutcome(p, current(question('streak-recover', 'product', 1, ['sum'])), c, correct, NOW + 3),
    ).toBe(true);
    expect(p.skills.product.failureStreak).toBe(0);

    // ...so the next failure queues the diagnostic again.
    expect(
      recordOutcome(p, current(question('streak-4', 'product', 0, ['sum'])), c, incorrect, NOW + 4),
    ).toBe(true);
    expect(p.skills.product.failureStreak).toBe(1);
    expect(p.pendingDiagnostics).toEqual(['sum']);
  });

  it('drops required skills that are not Ready, locked, or disabled, but keeps Ready ones', () => {
    const c = config({ disabledFamilies: ['log'] });
    const p = freshProgress(c, NOW);
    p.skills.sum = readyState(0, NOW); // Ready, enabled, and unlocked.
    // power: never practiced, so not Ready. exp: level 2, but unlockedLevel is
    // still 1, so locked. log: explicitly disabled.
    const cur = current(question('mixed-fail-1', 'product', 0, ['power'], ['power', 'exp', 'log', 'sum']));
    expect(recordOutcome(p, cur, c, incorrect, NOW)).toBe(true);
    expect(p.pendingDiagnostics).toEqual(['sum']);
  });

  it('reads requiredSkills for diagnostics when present, and falls back to supportingSkills for legacy questions', () => {
    const c = config();
    const p = freshProgress(c, NOW);
    p.skills.sum = readyState(0, NOW);
    p.skills.power = readyState(1, NOW);

    // requiredSkills (SPEC-G3) takes precedence over supportingSkills.
    const withRequired = current(question('inferred-1', 'product', 0, ['power'], ['sum']));
    expect(recordOutcome(p, withRequired, c, incorrect, NOW)).toBe(true);
    expect(p.pendingDiagnostics).toEqual(['sum']);

    // A legacy question with no requiredSkills falls back to supportingSkills.
    // Use a different primary skill so its failure streak starts fresh.
    p.pendingDiagnostics = [];
    const legacy = current(question('legacy-1', 'quotient', 0, ['power']));
    expect(recordOutcome(p, legacy, c, incorrect, NOW + 60_000)).toBe(true);
    expect(p.pendingDiagnostics).toEqual(['power']);
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
    const c = config({
      disabledFamilies: SKILLS.filter((item) => !['constant', 'power'].includes(item.id)).map((item) => item.id),
    });
    const p = freshProgress(c, NOW);
    const state = stateFor(p, 'power', NOW);
    state.basic = { streak: 0, lastQ: 'q2:00000001', passed: true, repair: true };
    state.otherSinceFailure = 0;
    state.card.due = NOW + 60_000;
    state.card.last_review = NOW;
    p.pendingDiagnostics = [];
    expect(state.extraPracticeGiven).toBe(false);
    const completeOther = (id: string, now: number) => {
      const cur = current(question(id, 'constant'));
      expect(recordOutcome(p, cur, c, correct, now)).toBe(true);
      finishQuestion({
        version: 1,
        progress: p,
        session: {
          config: c,
          completed: 0,
          independent: 0,
          assisted: 0,
          skipped: 0,
          finished: false,
          current: cur,
        },
      });
    };

    completeOther('other-opportunity-1', NOW);
    expect(state.otherSinceFailure).toBe(1);
    expect(chooseNext(p, c, NOW + 1).question.primarySkill).toBe('constant');
    expect(p.skills.power.extraPracticeGiven).toBe(false);

    completeOther('other-opportunity-2', NOW + 2);
    expect(state.otherSinceFailure).toBe(2);
    const picked = chooseNext(p, c, NOW + 3);
    expect(picked.question.primarySkill).toBe('power');
    expect(picked.reason).toBe('Rebuild this skill');
    expect(p.skills.power.extraPracticeGiven).toBe(true);
  });

  it('pauses instead of generating another question when every eligible skill is remediation-blocked', () => {
    const p = freshProgress(config(), NOW);
    p.pendingDiagnostics = [];
    for (const skill of SKILLS.filter((item) => item.level === 1)) {
      const state = stateFor(p, skill.id, NOW);
      state.basic = { streak: 0, passed: false, repair: true };
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
    expect(resumed.reason).toBe('Keep building');
    expect(resumed.question.role).toBe('basic');
  });

  it('unlocks the next level when every enabled basic line has passed', () => {
    const p = freshProgress(config(), NOW);
    for (const skill of SKILLS.filter((item) => item.level === 1)) {
      p.skills[skill.id] = readyState(0);
      p.skills[skill.id].mix = { streak: 0, passed: false, repair: false };
    }
    unlock(p, config());
    expect(p.unlockedLevel).toBe(2);
    expect(SKILLS.filter((item) => item.level === 1).every((item) => p.skills[item.id].mix.passed)).toBe(false);
    expect(SKILLS.filter((item) => item.level === 1).every((item) => isReady(p.skills[item.id]))).toBe(false);
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
    p.skills.power = readyState(0, NOW);
    const cur = current(question('regression-1'));
    expect(recordOutcome(p, cur, config(), incorrect, NOW)).toBe(true);
    expect(p.unlockedLevel).toBe(2);
    expect(p.skills.power.basic.passed).toBe(true);
    expect(p.skills.power.basic.repair).toBe(true);
    expect(needsRemediation(p.skills.power)).toBe(true);
    expect(isReady(p.skills.power)).toBe(false);
  });

  it('keeps a passed basic line and unlocked level after a mixed-line miss', () => {
    const p = freshProgress(config(), NOW);
    p.unlockedLevel = 4;
    p.skills.power = readyState(0, NOW);
    const basicBefore = structuredClone(p.skills.power.basic);

    expect(
      recordOutcome(
        p,
        current(question('mixed-line-miss', 'power', 0, [], undefined, 'mix')),
        config(),
        incorrect,
        NOW,
      ),
    ).toBe(true);

    expect(p.skills.power.basic).toEqual(basicBefore);
    expect(p.skills.power.mix).toMatchObject({ streak: 0, passed: true, repair: true });
    expect(p.unlockedLevel).toBe(4);
    expect(needsRemediation(p.skills.power)).toBe(true);
  });

  it('chooses basic, mixed, repair, and due-review roles with their branch reasons', () => {
    const c = config({
      disabledFamilies: SKILLS.filter((item) => item.id !== 'power').map((item) => item.id),
    });
    const p = freshProgress(c, NOW);
    const first = chooseNext(p, c, NOW);
    expect(first.reason).toBe('New skill');
    expect(first.question.role).toBe('basic');
    expect(recordOutcome(p, current(question('basic-one')), c, correct, NOW)).toBe(true);
    expect(recordOutcome(p, current(question('basic-two')), c, correct, NOW + 1)).toBe(true);

    const mixed = chooseNext(p, c, NOW + 2);
    expect(mixed.reason).toBe('Mix it up');
    expect(mixed.question.role).toBe('mix');

    const repairing = freshProgress(c, NOW);
    const repairState = (repairing.skills.power = readyState(0, NOW));
    repairState.mix = { streak: 0, lastQ: 'q2:00000003', passed: true, repair: true };
    repairState.otherSinceFailure = 2;
    const repair = chooseNext(repairing, c, NOW + 1);
    expect(repair.reason).toBe('Rebuild this skill');
    expect(repair.question.role).toBe('mix');

    const repairingBasic = freshProgress(c, NOW);
    const basicRepairState = (repairingBasic.skills.power = readyState(0, NOW));
    basicRepairState.basic = { streak: 0, lastQ: 'q2:00000004', passed: true, repair: true };
    basicRepairState.otherSinceFailure = 2;
    const basicRepair = chooseNext(repairingBasic, c, NOW + 1);
    expect(basicRepair.reason).toBe('Rebuild this skill');
    expect(basicRepair.question.role).toBe('basic');

    const reviewing = freshProgress(c, NOW);
    reviewing.skills.power = readyState(0, NOW);
    const review = chooseNext(reviewing, c, NOW + 1);
    expect(review.reason).toBe('Spaced review');
    expect(review.question.role).toBe('mix');

    const reviewingBasic = freshProgress(c, NOW);
    stateFor(reviewingBasic, 'power', NOW).card.due = NOW;
    const basicReview = chooseNext(reviewingBasic, c, NOW + 1);
    expect(basicReview.reason).toBe('Spaced review');
    expect(basicReview.question.role).toBe('basic');
  });

  it('clears a line repair after two new independent successes and preserves the card timeline', () => {
    const p = freshProgress(config(), NOW);
    const s = (p.skills.power = readyState(0, NOW));
    s.failureStreak = 2;
    s.card = storeCard(createEmptyCard(new Date(NOW)));
    expect(recordOutcome(p, current(question('repair-miss')), config(), incorrect, NOW)).toBe(true);
    expect(s.basic).toMatchObject({ streak: 0, passed: true, repair: true });
    expect(s.mix).toMatchObject({ streak: 2, passed: true, repair: false });
    const cardAfterMiss = structuredClone(s.card);
    expect(recordOutcome(p, current(question('recover-1')), config(), correct, NOW + 1)).toBe(true);
    expect(s.basic).toMatchObject({ streak: 1, passed: true, repair: true });
    expect(needsRemediation(s)).toBe(true);
    expect(recordOutcome(p, current(question('recover-2')), config(), correct, NOW + 2)).toBe(true);
    expect(s.basic).toMatchObject({ streak: 2, passed: true, repair: false });
    expect(needsRemediation(s)).toBe(false);
    expect(s.failureStreak).toBe(0);
    expect(isReady(s)).toBe(true);
    expect(s.card).toEqual(cardAfterMiss);
  });

  it('does not let earlier successes hide a line miss before two new successes', () => {
    const p = freshProgress(config(), NOW);
    const s = (p.skills.power = readyState(0, NOW));
    expect(recordOutcome(p, current(question('latest-error')), config(), incorrect, NOW)).toBe(true);
    expect(lineReady(s.basic)).toBe(false);
    expect(s.basic.passed).toBe(true);
    expect(recordOutcome(p, current(question('recovery-success-1')), config(), correct, NOW + 1)).toBe(true);
    expect(lineReady(s.basic)).toBe(false);
    expect(s.basic.repair).toBe(true);
    expect(recordOutcome(p, current(question('recovery-success-2')), config(), correct, NOW + 2)).toBe(true);
    expect(lineReady(s.basic)).toBe(true);
  });

  it('keeps remediation active after one post-miss success', () => {
    const p = freshProgress(config(), NOW);
    expect(recordOutcome(p, current(question('failure-before-recovery', 'power', 0)), config(), incorrect, NOW)).toBe(true);
    expect(needsRemediation(p.skills.power)).toBe(true);

    const submitAtDue = (id: string, template: number) => {
      const now = Math.max(NOW, p.skills.power.card.due);
      expect(recordOutcome(p, current(question(id, 'power', template)), config(), correct, now)).toBe(true);
    };

    submitAtDue('recovery-one', 1);
    expect(p.skills.power.basic.streak).toBe(1);
    expect(p.skills.power.basic.repair).toBe(true);
    expect(needsRemediation(p.skills.power)).toBe(true);
    expect(isReady(p.skills.power)).toBe(false);

    submitAtDue('recovery-two', 0);
    expect(p.skills.power.basic.streak).toBe(2);
    expect(p.skills.power.basic.repair).toBe(false);
    expect(needsRemediation(p.skills.power)).toBe(false);
    expect(lineReady(p.skills.power.basic)).toBe(true);
  });

  it('passes a line after two independent questions without changing a not-due FSRS card', () => {
    const p = freshProgress(config(), NOW);
    recordOutcome(p, current(question('constant-first', 'constant', 0)), config(), correct, NOW);
    expect(isReady(p.skills.constant)).toBe(false);
    expect(chooseNext(p, config(), NOW + 1).question.primarySkill).toBe('constant');
    const card = structuredClone(p.skills.constant.card);
    recordOutcome(p, current(question('constant-second', 'constant', 1)), config(), correct, NOW + 2);
    expect(p.skills.constant.basic.passed).toBe(true);
    expect(lineReady(p.skills.constant.basic)).toBe(true);
    expect(isReady(p.skills.constant)).toBe(false);
    expect(p.skills.constant.card).toEqual(card);
    expect(chooseNext(p, config(), NOW + 3).question.primarySkill).toBe('power');
  });

  it('requires two distinct questions on a line but permits the same template', () => {
    const p = freshProgress(config(), NOW);
    const s = stateFor(p, 'power', NOW);
    const repeated = current(question('repeat-one', 'power', 0));
    expect(recordOutcome(p, repeated, config(), correct, NOW)).toBe(true);
    const sameQuestion = current({ ...question('repeat-two', 'power', 0), signature: repeated.question.signature });
    expect(recordOutcome(p, sameQuestion, config(), correct, NOW + 1)).toBe(true);
    expect(s.basic.streak).toBe(1);
    expect(s.basic.passed).toBe(false);

    expect(recordOutcome(p, current(question('different-question', 'power', 0)), config(), correct, NOW + 2)).toBe(true);
    expect(s.basic.streak).toBe(2);
    expect(s.basic.passed).toBe(true);
  });

  it('pauses rather than recycling Ready skills before due, but reviews them when due', () => {
    const c = config({disabledFamilies: SKILLS.filter(s => s.id !== 'constant').map(s => s.id)});
    const p = freshProgress(c, NOW);
    recordOutcome(p, current(question('c1', 'constant', 0, [], undefined, 'basic')), c, correct, NOW);
    recordOutcome(p, current(question('c2', 'constant', 1, [], undefined, 'basic')), c, correct, NOW + 1);
    recordOutcome(p, current(question('c3', 'constant', 0, [], undefined, 'mix')), c, correct, NOW + 2);
    recordOutcome(p, current(question('c4', 'constant', 1, [], undefined, 'mix')), c, correct, NOW + 3);
    expect(isReady(p.skills.constant)).toBe(true);
    expect(() => chooseNext(p, c, NOW + 4)).toThrow('PRACTICE_PAUSE');
    const review = chooseNext(p, c, p.skills.constant.card.due);
    expect(review.reason).toBe('Spaced review');
    expect(review.question.role).toBe('mix');
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
    ['format version', (p: Progress) => ({ ...p, formatVersion: 3 })],
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
