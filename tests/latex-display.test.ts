import { describe, expect, it } from 'vitest';
import { grade, parseAnswer, sampleValues } from '../src/grading';
import { add, div, evaluator, fn, latex, mul, neg, pow } from '../src/math';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Expr, Question } from '../src/types';

const SEEDS = 20;
const SAMPLES = 3;

function questions(): Question[] {
  return Object.entries(TEMPLATES).flatMap(([skill, templates]) =>
    templates.flatMap((template) =>
      Array.from({ length: SEEDS }, (_, seedIndex) =>
        generateQuestion(skill, `latex-display:${template.key}:${seedIndex}`, {
          key: template.key,
          ok: () => true,
        }),
      ),
    ),
  );
}

describe('natural display of products and negative terms', () => {
  it('drops the multiplication dot before a letter, power or command', () => {
    expect(latex(mul(15, pow('x', 8)))).toBe('15x^{8}');
    expect(latex(mul(3, fn('Sin', 'x')))).toBe('3\\sin\\left(x\\right)');
    expect(latex(mul(2, fn('Exp', 'x')))).toBe('2e^{x}');
    expect(latex(mul(4, fn('Sqrt', 'x')))).toBe('4\\sqrt{x}');
    expect(latex(mul(2, add('x', 1)))).toBe('2\\left(x+1\\right)');
  });

  it('keeps the multiplication dot where removing it would change the expression', () => {
    expect(latex(mul(2, pow(5, 'x')))).toBe('2\\cdot 5^{x}');
    expect(latex(mul(2, div(1, 'x')))).toBe('2\\cdot \\frac{1}{x}');
    expect(latex(mul('x', fn('Exp', 'x')))).toBe('x\\cdot e^{x}');
  });

  it('writes a negated term as a subtraction without parentheses', () => {
    expect(latex(add(fn('Ln', 'x'), neg(mul(15, fn('Exp', 'x')))))).toBe(
      '\\ln\\left(x\\right)-15e^{x}',
    );
    expect(
      latex(add(mul(2, pow('y', 2)), neg(mul(5, pow('x', 2))), -60)),
    ).toBe('2y^{2}-5x^{2}-60');
  });

  it('keeps parentheses around a negated sum, a negated negation or a negative number', () => {
    expect(latex(neg(add('x', 1)))).toBe('-\\left(x+1\\right)');
    expect(latex(neg(neg('x')))).toBe('-\\left(-x\\right)');
    expect(latex(['Negate', -3] as Expr)).toBe('-\\left(-3\\right)');
  });
});

describe('generated LaTeX round-trips through the grader parser', () => {
  it('parses every source and answer to an equivalent expression', () => {
    const { calc, D } = evaluator(50);
    let compared = 0;
    for (const q of questions()) {
      const variables = q.domain.curve
        ? ['x', 'y']
        : [q.domain.variable];
      for (const expr of [...q.source, ...q.answers]) {
        const tex = latex(expr);
        let parsed: Expr;
        try {
          parsed = parseAnswer(tex, variables);
        } catch (error) {
          throw new Error(
            `${q.id} (${q.templateKey}) failed to parse ${tex}: ${(error as Error).message}`,
          );
        }
        for (let i = 0; i < SAMPLES; i++) {
          const point = sampleValues(q, i);
          let expected, actual;
          try {
            expected = calc(expr, point);
            actual = calc(parsed, point);
          } catch {
            continue;
          }
          const diff = expected.minus(actual).abs();
          const scale = D.max(expected.abs(), actual.abs(), new D(1));
          expect(
            diff.lte(scale.times('1e-9')),
            `${q.id} (${q.templateKey}) at sample ${i}: ${tex} gave ${actual} instead of ${expected}`,
          ).toBe(true);
          compared += 1;
        }
      }
    }
    expect(compared).toBeGreaterThan(0);
  }, 120_000);
});

describe('grading stays unchanged for canonical LaTeX', () => {
  it('grades the serialized answer of every generated question as correct', () => {
    const failures: string[] = [];
    for (const q of questions()) {
      const verdict = grade(
        q,
        q.answers.map((answer) => latex(answer)),
      );
      if (verdict.status !== 'correct')
        failures.push(`${q.id} (${q.templateKey}): ${JSON.stringify(verdict)}`);
    }
    expect(failures).toEqual([]);
  }, 120_000);
});
