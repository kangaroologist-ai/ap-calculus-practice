import { beforeAll, describe, expect, it } from 'vitest';
import { ComputeEngine } from '@cortex-js/compute-engine';
import { SKILLS } from '../src/catalog';
import { derivative, evaluator } from '../src/math';
import { generateQuestion } from '../src/questions';
import { TEMPLATES, type Template } from '../src/templates';
import type { Expr, Question } from '../src/types';

const SEEDS = 200;
const BASE_VALUES = new Set([2, 3, 5, 10]);
const BASE_TEMPLATES = new Set(['exp.basic.base', 'log.basic.scaled']);
const FUNCTION_OPS = new Set([
  'Sin',
  'Cos',
  'Tan',
  'Cot',
  'Sec',
  'Csc',
  'Exp',
  'Ln',
  'Arcsin',
  'Arccos',
  'Arctan',
]);

type Role = 'ordinary' | 'base' | 'implicit-constant' | 'linear-b';

interface Sample {
  template: Template;
  question: Question;
}

const samples: Sample[] = [];

beforeAll(() => {
  for (const skill of SKILLS) {
    for (const template of TEMPLATES[skill.id]) {
      for (let seed = 0; seed < SEEDS; seed += 1) {
        samples.push({
          template,
          question: generateQuestion(skill.id, `number-policy:${template.key}:${seed}`, {
            key: template.key,
            ok: () => true,
          }),
        });
      }
    }
  }
}, 300_000);

function promptOf(question: Question): string {
  return question.prompt;
}

function checkNumber(
  value: number,
  role: Role,
  template: Template,
  question: Question,
  fail: (message: string) => void,
): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(`source number ${value} is not finite`);
    return;
  }
  const magnitude = Math.abs(value);
  if (!Number.isInteger(magnitude)) {
    fail(`source number ${value} is not an integer`);
    return;
  }
  if (role === 'base') {
    if (!BASE_VALUES.has(value)) fail(`base ${value} is not one of 2, 3, 5, 10`);
    return;
  }
  if (role === 'implicit-constant') {
    if (magnitude > 36) fail(`implicit constant ${value} exceeds 36`);
    return;
  }
  if (role === 'linear-b') {
    if (template.role === 'mix' && magnitude <= 9) return;
  }
  const limit = template.role === 'mix' || template.key.startsWith('polar.') ? 9 : 5;
  if (magnitude < 1 || magnitude > limit) {
    fail(`source number ${value} is outside ${template.role} ±1..${limit}`);
  }
}

function isLinearInVariable(node: Expr): boolean {
  return (
    Array.isArray(node) &&
    node[0] === 'Multiply' &&
    typeof node[1] === 'number' &&
    typeof node[2] === 'string'
  );
}

function checkExponent(
  node: Expr,
  template: Template,
  question: Question,
  fail: (message: string) => void,
): void {
  if (typeof node === 'string') return;
  if (typeof node === 'number') {
    if (Number.isInteger(node) && node >= 2 && node <= 6) return;
    if (Number.isInteger(node) && node <= -1 && node >= -4) return;
    fail(`exponent ${node} is outside 2..6 or -4..-1`);
    return;
  }
  if (Array.isArray(node) && node[0] === 'Divide') {
    const [p, q] = [node[1], node[2]];
    if (
      typeof p === 'number' &&
      typeof q === 'number' &&
      Number.isInteger(p) &&
      Number.isInteger(q) &&
      p >= 1 &&
      p <= 5 &&
      (q === 2 || q === 3) &&
      p % q !== 0
    )
      return;
  }
  fail(`exponent ${JSON.stringify(node)} is not a supported integer or p/q`);
}

function walkSource(
  node: Expr,
  role: Role,
  template: Template,
  question: Question,
  fail: (message: string) => void,
): void {
  if (typeof node === 'number') {
    checkNumber(node, role, template, question, fail);
    return;
  }
  if (typeof node === 'string') return;
  const [op, ...args] = node;
  if (op === 'Multiply' && args[0] === 1) {
    fail(`coefficient 1 is written instead of omitted`);
  }
  if (op === 'Power') {
    const [base, exponent] = args;
    if (template.key === 'exp.basic.base' && typeof base === 'number') {
      checkNumber(base, 'base', template, question, fail);
    } else {
      walkSource(base, role, template, question, fail);
    }
    checkExponent(exponent, template, question, fail);
    return;
  }
  if (
    template.key === 'log.basic.scaled' &&
    op === 'Ln' &&
    args.length === 1 &&
    typeof args[0] === 'number'
  ) {
    checkNumber(args[0], 'base', template, question, fail);
    return;
  }
  if (op === 'Add' && template.role === 'mix') {
    args.forEach((child, index) => {
      if (index === 1 && isLinearInVariable(args[0])) {
        if (typeof child === 'number') {
          checkNumber(child, 'linear-b', template, question, fail);
          return;
        }
      }
      walkSource(child, role, template, question, fail);
    });
    return;
  }
  for (const child of args) walkSource(child, role, template, question, fail);
}

function checkSourcePolicy(sample: Sample, fail: (message: string) => void): void {
  const { template, question } = sample;
  for (const source of question.source) {
    if (
      template.key.startsWith('implicit.') &&
      Array.isArray(source) &&
      source[0] === 'Add'
    ) {
      for (const term of source.slice(1)) {
        if (typeof term === 'number') {
          checkNumber(term, 'implicit-constant', template, question, fail);
        } else if (
          Array.isArray(term) &&
          term[0] === 'Negate' &&
          typeof term[1] === 'number'
        ) {
          checkNumber(term[1], 'implicit-constant', template, question, fail);
        } else {
          walkSource(term, 'ordinary', template, question, fail);
        }
      }
      continue;
    }
    walkSource(source, 'ordinary', template, question, fail);
  }
}

function checkBasePolicy(sample: Sample, fail: (message: string) => void): void {
  const { template, question } = sample;
  if (!BASE_TEMPLATES.has(template.key)) return;
  const bases: number[] = [];
  const visit = (node: Expr): void => {
    if (!Array.isArray(node)) return;
    if (node[0] === 'Power' && typeof node[1] === 'number') bases.push(node[1]);
    if (node[0] === 'Ln' && typeof node[1] === 'number') bases.push(node[1]);
    node.slice(1).forEach(visit);
  };
  visit(question.source[0]);
  if (!bases.length) fail('did not find an exponential or logarithm base');
  for (const base of bases) {
    if (!BASE_VALUES.has(base)) fail(`base ${base} is not one of 2, 3, 5, 10`);
  }
}

function productHeads(node: Expr): string[] {
  if (!Array.isArray(node) || node[0] !== 'Multiply') return [];
  return node
    .slice(1)
    .flatMap((child) =>
      Array.isArray(child) && FUNCTION_OPS.has(child[0]) ? [child[0]] : [],
    );
}

function nestedHeads(node: Expr): string[] {
  const heads: string[] = [];
  let current = node;
  while (Array.isArray(current) && FUNCTION_OPS.has(current[0])) {
    heads.push(current[0]);
    current = current[1];
  }
  return heads;
}

function checkNoSelfCombination(
  sample: Sample,
  fail: (message: string) => void,
): void {
  const { template, question } = sample;
  if (template.key === 'product.basic.function_pair') {
    const heads = productHeads(question.source[0]);
    if (new Set(heads).size !== heads.length)
      fail(`product repeats a function: ${heads.join(' and ')}`);
  }
  if (
    template.key === 'nested.basic.function_pair' ||
    template.key === 'nested.mix.function_power_sum'
  ) {
    const heads = nestedHeads(question.source[0]);
    if (new Set(heads).size !== heads.length)
      fail(`composition repeats a function: ${heads.join(' and ')}`);
  }
}

function checkDistinctExponents(
  sample: Sample,
  fail: (message: string) => void,
): void {
  const { template, question } = sample;
  if (template.key !== 'power.mix.polynomial_sum') return;
  const source = question.source[0];
  if (!Array.isArray(source) || source[0] !== 'Add') {
    fail('polynomial_sum source is not a sum');
    return;
  }
  const failure = repeatedExponentFailure(source);
  if (failure) fail(failure);
}

function polynomialExponents(source: Expr): number[] {
  if (!Array.isArray(source) || source[0] !== 'Add') return [];
  const exponents: number[] = [];
  for (const term of source.slice(1)) {
    if (term === 'x') {
      exponents.push(1);
      continue;
    }
    if (!Array.isArray(term)) continue;
    if (term[0] === 'Power' && term[1] === 'x' && typeof term[2] === 'number') {
      exponents.push(term[2]);
      continue;
    }
    if (term[0] !== 'Multiply') continue;
    for (const factor of term.slice(1)) {
      if (factor === 'x') {
        exponents.push(1);
        break;
      }
      if (
        Array.isArray(factor) &&
        factor[0] === 'Power' &&
        factor[1] === 'x' &&
        typeof factor[2] === 'number'
      ) {
        exponents.push(factor[2]);
        break;
      }
    }
  }
  return exponents;
}

function repeatedExponentFailure(source: Expr): string | undefined {
  const exponents = polynomialExponents(source);
  if (new Set(exponents).size !== exponents.length)
    return `sum repeats an exponent: ${exponents.join(', ')}`;
  return undefined;
}

function checkInversePolicy(
  sample: Sample,
  fail: (message: string) => void,
): void {
  const { template, question } = sample;
  if (!template.key.startsWith('inverse.')) return;
  if (question.domain.variable !== 'x') {
    fail(`inverse question uses variable ${question.domain.variable}`);
    return;
  }
  const match = /f\((-?[0-9]+(?:\.[0-9]+)?)\)=/.exec(question.prompt);
  if (!match) {
    fail('cannot read the inverse point from the prompt');
    return;
  }
  const point = Number(match[1]);
  if (![-1, 0, 1, 2].includes(point)) {
    fail(`inverse point ${point} is not in {-1, 0, 1, 2}`);
    return;
  }
  const { calc, D } = evaluator(70);
  const value = calc(question.source[0], { x: new D(point) }).toNumber();
  const slope = calc(derivative(question.source[0], 'x'), {
    x: new D(point),
  }).toNumber();
  if (!(Math.abs(value) < 100)) fail(`f(${point}) = ${value} is not below 100`);
  if (!(Number.isInteger(slope) && slope !== 0 && Math.abs(slope) < 100))
    fail(`f'(${point}) = ${slope} is not a nonzero integer below 100`);
  const slopes = [-10, -5, -2, -1, -0.5, 0, 0.5, 1, 2, 5, 10].map((x) =>
    calc(derivative(question.source[0], 'x'), { x: new D(x) }).toNumber(),
  );
  const increasing = slopes.every((value) => value > 0);
  const decreasing = slopes.every((value) => value < 0);
  if (!increasing && !decreasing)
    fail('f is not strictly monotone, so it has no global inverse');
}

function collectIntegers(value: unknown, out: number[]): void {
  if (typeof value === 'number') {
    if (Number.isFinite(value) && Number.isInteger(value)) out.push(Math.abs(value));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectIntegers(item, out));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectIntegers(item, out));
  }
}

describe('number and natural-form policy', () => {
  it('keeps source numbers, exponents, bases, combinations, and inverse points natural', () => {
    const expected = SKILLS.reduce(
      (total, skill) => total + TEMPLATES[skill.id].length * SEEDS,
      0,
    );
    expect(samples).toHaveLength(expected);
    const failures: string[] = [];
    for (const sample of samples) {
      const report = (message: string) =>
        failures.push(`${sample.template.key}: ${message} | ${promptOf(sample.question)}`);
      checkSourcePolicy(sample, report);
      checkBasePolicy(sample, report);
      checkNoSelfCombination(sample, report);
      checkDistinctExponents(sample, report);
      checkInversePolicy(sample, report);
    }
    expect(failures).toEqual([]);
  }, 300_000);

  it('keeps every simplified answer integer below 100, or at most 200 for a third derivative', () => {
    const ce = new ComputeEngine();
    const failures: string[] = [];
    for (const sample of samples) {
      const limit = sample.template.meta?.derivativeOrder === 3 ? 200 : 99;
      for (const answer of sample.question.answers) {
        const integers: number[] = [];
        collectIntegers(ce.box(answer as never).simplify().json, integers);
        for (const value of integers) {
          if (value > limit)
            failures.push(
              `${sample.template.key}: simplified answer contains ${value} (limit ${limit}) | ${promptOf(sample.question)}`,
            );
        }
      }
    }
    expect(failures).toEqual([]);
  }, 300_000);

  it('has exactly one third-order template in each higher-derivative line', () => {
    for (const role of ['basic', 'mix'] as const) {
      const thirdOrder = TEMPLATES.higher.filter(
        (template) => template.role === role && template.meta?.derivativeOrder === 3,
      );
      expect(thirdOrder, role).toHaveLength(1);
    }
  });

  it('rejects a polynomial sum with a repeated exponent', () => {
    const repeated: Expr = [
      'Add',
      ['Multiply', 2, ['Power', 'x', 3]],
      ['Multiply', 4, ['Power', 'x', 3]],
      1,
    ];
    const distinct: Expr = [
      'Add',
      ['Multiply', 2, ['Power', 'x', 2]],
      ['Multiply', 3, 'x'],
      1,
    ];
    expect(polynomialExponents(repeated)).toEqual([3, 3]);
    expect(repeatedExponentFailure(repeated)).toMatch(/repeats an exponent/);
    expect(polynomialExponents(distinct)).toEqual([2, 1]);
    expect(repeatedExponentFailure(distinct)).toBeUndefined();
  });
});
