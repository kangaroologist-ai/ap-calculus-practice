import type { Question } from "./types";

// Conjunctive mastery estimate (S4): the chance that the student applies a
// skill correctly. Every graded question updates each skill it uses in logit
// space. A wrong answer blames the lowest estimate most because each skill's
// gradient scales with its own distance from certainty.
export const START_MASTERY: Readonly<Record<number, number>> = {
  1: 0.62,
  2: 0.58,
  3: 0.45,
  4: 0.4,
  5: 0.35,
  6: 0.35,
};
export const PASS_THRESHOLD = 0.8;
export const READY_THRESHOLD = 0.85;
export const WEAK_THRESHOLD = 0.6;
export const MASTERY_MIN = 0.02;
export const MASTERY_MAX = 0.995;
const K_BASE = 2.6;
const K_DECAY = 0.6;
const K_FLOOR = 1;
const COMPONENT_FACTOR = 0.5;

export const startMastery = (level: number): number =>
  START_MASTERY[level] ?? START_MASTERY[6];

export interface MasterySeed {
  level: number;
  ready: boolean;
  passed: boolean;
  repair: boolean;
}

// Old saves and imported codes carry no estimate. Seed it from the line state
// once, on first read, in the order the Spec gives.
export function seedMastery({
  level,
  ready,
  passed,
  repair,
}: MasterySeed): number {
  if (ready) return 0.92;
  if (passed) return 0.82;
  if (repair) return 0.55;
  return startMastery(level);
}

export const questionSkills = (
  q: Question,
  disabled: readonly string[],
): string[] =>
  [
    ...new Set([
      q.primarySkill,
      ...(q.requiredSkills ?? q.supportingSkills),
    ]),
  ].filter((id) => !disabled.includes(id));

export const combinedChance = (values: readonly number[]): number =>
  values.reduce((chance, m) => chance * m, 1);

export const stepSize = (observations: number): number =>
  Math.max(K_FLOOR, K_BASE / (1 + K_DECAY * observations));

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
const logit = (p: number): number => Math.log(p / (1 - p));

// `values[0]` is the primary skill unless `primaryIndex` says otherwise.
// `observations[i]` counts the earlier questions where that skill was primary.
export function updateMasteries(
  values: readonly number[],
  correct: boolean,
  observations: readonly number[] = [],
  primaryIndex = 0,
): number[] {
  const predicted = combinedChance(values);
  return values.map((m, i) => {
    const step =
      stepSize(observations[i] ?? 0) *
      (i === primaryIndex ? 1 : COMPONENT_FACTOR);
    const grad = correct ? 1 - m : (-predicted * (1 - m)) / (1 - predicted);
    return Math.min(
      MASTERY_MAX,
      Math.max(MASTERY_MIN, sigmoid(logit(m) + step * grad)),
    );
  });
}

// Weak starts repair; repair lasts until the estimate reaches the pass
// threshold again, not just the weak threshold.
export const staysInRepair = (mastery: number, repairing: boolean): boolean =>
  mastery < WEAK_THRESHOLD || (repairing && mastery < PASS_THRESHOLD);
