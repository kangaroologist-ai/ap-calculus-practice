import { describe, expect, it } from 'vitest';
import { SKILLS } from '../src/catalog';
import { evaluator } from '../src/math';
import { questionFingerprint } from '../src/question-identity';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Question } from '../src/types';

// SPEC-G1: every template, sampled over 200 seeds, must produce enough
// distinct questions (>= 10 distinct fingerprints) and, except for the
// always-zero `constant` family, enough distinct numeric answers (>= 6,
// evaluated at two fixed probe points) that varying the seed actually
// varies the question instead of just its cosmetic wrapper.
const PROBES = [
  { x: 0.37, y: 1.29, t: 0.41, theta: 0.53 },
  { x: 1.13, y: -0.71, t: 1.07, theta: 1.21 },
];

function answerKey(q: Question): string {
  const { calc, D } = evaluator(30);
  return JSON.stringify(
    PROBES.map((point) =>
      q.answers.map((expr) => {
        try {
          return calc(
            expr,
            Object.fromEntries(
              Object.entries(point).map(([k, v]) => [k, new D(v)]),
            ),
          )
            .toSignificantDigits(10)
            .toString();
        } catch {
          return 'undef';
        }
      }),
    ),
  );
}

describe('generated questions vary across seeds (SPEC-G1)', () => {
  it.each(
    SKILLS.flatMap((skill) =>
      TEMPLATES[skill.id].map(
        (template, i) => [skill.id, i, template.key, template.role] as const,
      ),
    ),
  )('%s template %i (%s) varies in source and answer', (id, i, key, role) => {
    const questions = Array.from({ length: 200 }, (_, k) =>
      generateQuestion(id, `variety:${id}:${i}:${k}`, {
        key,
        role,
        ok: () => true,
      }),
    );
    const fingerprints = new Set(
      questions.map((q) => questionFingerprint(q.signature)),
    );
    expect(fingerprints.size).toBeGreaterThanOrEqual(10);
    if (id !== 'constant') {
      const answers = new Set(questions.map(answerKey));
      expect(answers.size).toBeGreaterThanOrEqual(6);
    }
  });
});
