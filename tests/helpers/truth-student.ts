import { SKILLS } from '../../src/catalog';
import { random } from '../../src/math';
import type { Question } from '../../src/types';

// Truth model from the S4 research prototype (research/sim5.ts), kept as an
// assumption rather than product code: each skill has a real chance to be
// applied correctly and grows with practice. Each student has one hidden weak
// skill stuck at 0.5 until three targeted questions make it 0.75.
const LEVEL_CHANCE: Record<number, number> = {
  1: 0.9,
  2: 0.82,
  3: 0.68,
  4: 0.62,
  5: 0.58,
  6: 0.55,
};
const WEAK_POOL = [
  'power',
  'sum',
  'root',
  'exp',
  'log',
  'sin',
  'cos',
  'tan',
  'sec',
  'product',
  'quotient',
  'chain',
];
const TARGETED = ['Rebuild this skill', 'Targeted check'];

export interface TruthStudent {
  weakId: string;
  chance: Record<string, number>;
  fixed(): boolean;
  answer(question: Question, reason?: string): boolean;
}

export function student(seed: string): TruthStudent {
  const r = random(seed);
  const chance: Record<string, number> = {};
  for (const skill of SKILLS) chance[skill.id] = LEVEL_CHANCE[skill.level];
  const weakId = WEAK_POOL[Math.floor(r() * WEAK_POOL.length)];
  chance[weakId] = 0.5;
  let weakFix = 0;
  return {
    weakId,
    chance,
    fixed: () => weakFix >= 3,
    answer(question: Question, reason = '') {
      const skills = [
        ...new Set([
          question.primarySkill,
          ...(question.requiredSkills ?? question.supportingSkills),
        ]),
      ];
      const correct = skills.every((id) => r() < chance[id]);
      for (const id of skills)
        if (id !== weakId || weakFix >= 3)
          chance[id] +=
            (0.97 - chance[id]) *
            (id === question.primarySkill ? 0.3 : 0.12);
      if (
        question.primarySkill === weakId &&
        TARGETED.includes(reason) &&
        ++weakFix === 3
      )
        chance[weakId] = 0.75;
      return correct;
    },
  };
}
