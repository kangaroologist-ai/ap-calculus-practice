import { describe, expect, it } from 'vitest';
import { grade } from '../src/grading';
import { add, derivative, div, latex, mul, neg, pow } from '../src/math';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Expr, Question } from '../src/types';

const SEEDS = 50;
const TEMPLATE_KEYS = [
  'abstract.basic.inner',
  'abstract.basic.outer',
  'abstract.mix.product',
  'abstract.mix.quotient',
  'abstract.mix.composition',
];
const COMPOSITE_TEMPLATES = new Set([
  'abstract.basic.inner',
  'abstract.basic.outer',
  'abstract.mix.composition',
]);

const questions = TEMPLATES.abstract.flatMap((template) =>
  Array.from({ length: SEEDS }, (_, seedIndex) =>
    generateQuestion(
      'abstract',
      `abstract-templates:${template.key}:${seedIndex}`,
      { key: template.key, role: template.role, ok: () => true },
    ),
  ),
);

// Removes the outer differentiation of f (or g) while keeping the rest of the
// answer, so the result is the correct derivative with one chain factor gone.
function eraseFunctionDerivative(e: Expr): Expr {
  if (!Array.isArray(e)) return e;
  if (e[0] === 'Fn' && e[2] === 1) return 1;
  const [op, ...args] = e;
  const parts = args.map(eraseFunctionDerivative);
  switch (op) {
    case 'Add':
      return add(...parts);
    case 'Multiply':
      return mul(...parts);
    case 'Divide':
      return div(parts[0], parts[1]);
    case 'Negate':
      return neg(parts[0]);
    case 'Power':
      return pow(parts[0], parts[1]);
    default:
      return [op, ...parts];
  }
}

// A plausible but wrong answer that drops the inner derivative.
function wrongAnswer(q: Question): Expr {
  const source = q.source[0];
  switch (q.templateKey) {
    case 'abstract.basic.inner':
      return ['Fn', 'f', 1, (source as Expr[])[3]];
    case 'abstract.basic.outer':
      return eraseFunctionDerivative(derivative(source));
    case 'abstract.mix.product': {
      const factors = (source as Expr[]).slice(1);
      return mul(
        ...factors.map((factor, i) =>
          i === factors.length - 1 ? derivative(factor) : factor,
        ),
      );
    }
    case 'abstract.mix.quotient': {
      const [, u, v] = source as Expr[];
      return div(derivative(u), v);
    }
    case 'abstract.mix.composition': {
      const [, name, order, arg] = source as [string, 'f' | 'g', number, Expr];
      return ['Fn', name, order + 1, arg];
    }
    default:
      throw new Error(`No wrong answer for ${q.templateKey}`);
  }
}

describe('abstract-function templates', () => {
  it('registers the decided basic and mixed templates', () => {
    expect(TEMPLATES.abstract.map((template) => template.key)).toEqual(
      TEMPLATE_KEYS,
    );
  });

  it('sets f and g, h(x), h′(x), and the domain text on every question', () => {
    for (const q of questions) {
      expect(q.domain.functions, q.id).toEqual(['f', 'g']);
      expect(q.prompt, q.id).toMatch(/^h\(x\)=/);
      expect(q.labels, q.id).toEqual(["h'(x)"]);
      expect(q.title, q.id).toBe('Find the derivative');
      expect(q.domainText, q.id).toBe(
        'f and g are differentiable functions. Write f′ for the derivative of f.',
      );
    }
  });

  it('grades the canonical answer correct for 50 seeds per template', () => {
    const failures: string[] = [];
    for (const q of questions) {
      const verdict = grade(
        q,
        q.answers.map((answer) => latex(answer)),
      );
      if (verdict.status !== 'correct')
        failures.push(`${q.id}: ${JSON.stringify(verdict)}`);
    }
    expect(failures).toEqual([]);
  }, 120_000);

  it('grades an answer that drops the inner derivative incorrect', () => {
    const failures: string[] = [];
    for (const q of questions) {
      const verdict = grade(q, [latex(wrongAnswer(q))]);
      if (verdict.status !== 'incorrect')
        failures.push(`${q.id}: ${JSON.stringify(verdict)}`);
    }
    expect(failures).toEqual([]);
  }, 120_000);

  it('requires the chain rule when the inside is composite', () => {
    for (const q of questions) {
      if (!COMPOSITE_TEMPLATES.has(q.templateKey)) continue;
      expect(q.requiredSkills, q.id).toContain('chain');
    }
  });
});
