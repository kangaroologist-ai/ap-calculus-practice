import { describe, expect, it } from 'vitest';
import {
  MASTERY_MAX,
  MASTERY_MIN,
  PASS_THRESHOLD,
  READY_THRESHOLD,
  combinedChance,
  questionSkills,
  seedMastery,
  startMastery,
  staysInRepair,
  stepSize,
  updateMasteries,
} from '../src/mastery';
import {
  chooseNext,
  freshProgress,
  isReady,
  masteryOf,
  needsRemediation,
  stateFor,
} from '../src/progress';
import type { Config, Question } from '../src/types';

const NOW = Date.parse('2026-10-21T00:00:00.000Z');
const config = (): Config => ({
  schemaVersion: 1,
  revision: 'test-revision',
  initialUnlockedLevel: 1,
  disabledFamilies: [],
  sessionLength: 12,
});

function question(
  primarySkill: string,
  supportingSkills: string[] = [],
  requiredSkills?: string[],
): Question {
  return {
    id: `${primarySkill}-1`,
    seed: `${primarySkill}-1`,
    generatorVersion: 'test-generator',
    template: 0,
    templateKey: `${primarySkill}.0`,
    family: primarySkill,
    level: 1,
    primarySkill,
    supportingSkills,
    ...(requiredSkills ? { requiredSkills } : {}),
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
    signature: `signature-${primarySkill}`,
  };
}

describe('mastery update', () => {
  it('raises a single skill by K(1 − m) in logit space', () => {
    // logit(0.62) + 2.6 × 0.38, then the logistic.
    expect(updateMasteries([0.62], true, [0])[0]).toBeCloseTo(0.81420197, 7);
    expect(updateMasteries([0.58], true, [0])[0]).toBeCloseTo(0.80451774, 7);
    expect(stepSize(0)).toBe(2.6);
    expect(stepSize(1)).toBe(1.625);
    expect(stepSize(10)).toBe(1);
  });

  it('uses half the step for component skills and decays K with observations', () => {
    const [primary, component] = updateMasteries([0.5, 0.5], true, [0, 0]);
    expect(primary).toBeCloseTo(0.78583498, 7); // sigmoid(2.6 × 0.5)
    expect(component).toBeCloseTo(0.65701046, 7); // sigmoid(1.3 × 0.5)
    // Three earlier primary questions lower the primary step to the floor.
    const [observed] = updateMasteries([0.5, 0.5], true, [3, 0]);
    expect(observed).toBeCloseTo(0.62245933, 7); // sigmoid(1 × 0.5)
  });

  it('lowers a wrong answer by K·P(1 − m)/(1 − P)', () => {
    // P = 0.62: grad = −0.62, so logit(0.62) − 2.6 × 0.62.
    expect(updateMasteries([0.62], false, [0])[0]).toBeCloseTo(0.24555679, 7);
    // P = 0.8 × 0.5 = 0.4 for the combined question.
    const [primary, component] = updateMasteries([0.8, 0.5], false, [0, 0]);
    expect(primary).toBeCloseTo(0.73877816, 7);
    expect(component).toBeCloseTo(0.39333064, 7);
  });

  it('blames the lowest estimate most on a wrong combined answer', () => {
    const [strong, weak] = updateMasteries([0.8, 0.5], false, [0, 0]);
    expect(strong).toBeLessThan(0.8);
    expect(weak).toBeLessThan(0.5);
    expect(0.5 - weak).toBeGreaterThan(0.8 - strong);
  });

  it('clamps estimates to [0.02, 0.995]', () => {
    expect(updateMasteries([0.995], true, [0])[0]).toBe(MASTERY_MAX);
    expect(updateMasteries([0.021], false, [0])[0]).toBe(MASTERY_MIN);
  });

  it('passes L1 and L2 after one correct answer but L3+ only after two', () => {
    const one = (level: number) =>
      updateMasteries([startMastery(level)], true, [0])[0];
    expect(one(1)).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    expect(one(2)).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    expect(one(3)).toBeLessThan(PASS_THRESHOLD);
    const first3 = one(3);
    const second3 = updateMasteries([first3], true, [1])[0];
    expect(second3).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    expect(second3).toBeLessThan(READY_THRESHOLD);
  });
});

describe('mastery thresholds and seeding', () => {
  it('keeps a weak skill in repair until it reaches the pass threshold', () => {
    expect(staysInRepair(0.59, false)).toBe(true);
    expect(staysInRepair(0.65, false)).toBe(false);
    expect(staysInRepair(0.65, true)).toBe(true);
    expect(staysInRepair(0.79, true)).toBe(true);
    expect(staysInRepair(0.8, true)).toBe(false);
  });

  it('seeds old line states in the Spec order', () => {
    expect(
      seedMastery({ level: 1, ready: true, passed: true, repair: false }),
    ).toBe(0.92);
    expect(
      seedMastery({ level: 3, ready: false, passed: true, repair: true }),
    ).toBe(0.82);
    expect(
      seedMastery({ level: 3, ready: false, passed: false, repair: true }),
    ).toBe(0.55);
    expect(
      seedMastery({ level: 3, ready: false, passed: false, repair: false }),
    ).toBe(0.45);
  });

  it('seeds a stored skill lazily from its lines, without creating new skills', () => {
    const p = freshProgress(config(), NOW);
    const ready = stateFor(p, 'constant', NOW);
    ready.basic = { streak: 2, passed: true, repair: false };
    ready.mix = { streak: 2, passed: true, repair: false };
    const passed = stateFor(p, 'power', NOW);
    passed.basic = { streak: 2, passed: true, repair: false };
    const repairing = stateFor(p, 'sum', NOW);
    repairing.basic = { streak: 0, passed: false, repair: true };
    const fresh = stateFor(p, 'root', NOW);

    expect(masteryOf(p, 'constant')).toBe(0.92);
    expect(masteryOf(p, 'power')).toBe(0.82);
    expect(masteryOf(p, 'sum')).toBe(0.55);
    expect(masteryOf(p, 'root')).toBe(0.62);
    expect(ready.mastery).toBe(0.92);
    expect(masteryOf(p, 'exp')).toBe(0.58);
    expect(p.skills.exp).toBeUndefined();
    expect(fresh.mastery).toBe(0.62);
  });

  it('seeds an old unpassed repair flag at 0.55, then clears repair', () => {
    const p = freshProgress(config(), NOW);
    const legacy = stateFor(p, 'sum', NOW);
    legacy.basic = { streak: 0, passed: false, repair: true };

    expect(masteryOf(p, 'sum')).toBe(0.55);
    expect(legacy.basic.repair).toBe(false);
  });

  it('keeps the old unpassed repair seed when readiness is checked first', () => {
    const p = freshProgress(config(), NOW);
    const legacy = stateFor(p, 'sum', NOW);
    legacy.basic = { streak: 0, passed: false, repair: true };

    expect(isReady(legacy)).toBe(false);
    expect(needsRemediation(legacy)).toBe(false);
    expect(masteryOf(p, 'sum')).toBe(0.55);
    expect(legacy.basic.repair).toBe(false);
  });

  it('keeps the old unpassed repair seed when the scheduler runs first', () => {
    const p = freshProgress(config(), NOW);
    const legacy = stateFor(p, 'sum', NOW);
    legacy.basic = { streak: 0, passed: false, repair: true };

    chooseNext(p, config(), NOW);
    expect(masteryOf(p, 'sum')).toBe(0.55);
    expect(legacy.basic.repair).toBe(false);
  });
});

describe('question skill sets', () => {
  it('deduplicates and drops disabled skills', () => {
    const q = question('product', ['sum', 'power'], ['sum', 'power', 'log']);
    expect(questionSkills(q, [])).toEqual(['product', 'sum', 'power', 'log']);
    expect(questionSkills(q, ['log'])).toEqual(['product', 'sum', 'power']);
    expect(combinedChance([0.8, 0.5])).toBeCloseTo(0.4, 10);
  });
});
