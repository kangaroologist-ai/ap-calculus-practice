import { describe, expect, it } from 'vitest';
import { SKILLS } from '../src/catalog';
import { grade, parseAnswer } from '../src/grading';
import { add, derivative, evaluator, latex, type Values } from '../src/math';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Expr, Question } from '../src/types';

const DIRECT_FAMILIES = new Set([
  'constant',
  'power',
  'sum',
  'root',
  'exp',
  'log',
  'sin',
  'cos',
  'tan',
  'cot',
  'sec',
  'csc',
  'asin',
  'acos',
  'atan',
  'product',
  'quotient',
  'chain',
  'nested',
  'mixed',
]);

function decimalValue(q: Question, expr: Expr, variable: string, point: number): number {
  const { calc, D } = evaluator(70);
  const values: Values = { [variable]: new D(point) };
  return calc(expr, values).toNumber();
}

function closeEnough(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1e-9 + 1e-9 * Math.max(Math.abs(actual), Math.abs(expected)));
}

function usablePoints(q: Question): number[] {
  const points = q.domain.intervals.flatMap(([lo, hi]) => [lo + 0.31 * (hi - lo), lo + 0.69 * (hi - lo)]);
  if (q.family === 'root' && q.template === 1) return [-2, -0.5, 0.5, 2];
  return points;
}

function compareAtPoints(q: Question, expected: Expr, actual: Expr): void {
  let compared = 0;
  for (const point of usablePoints(q)) {
    let expectedValue: number;
    let actualValue: number;
    try {
      expectedValue = decimalValue(q, expected, q.domain.variable, point);
      actualValue = decimalValue(q, actual, q.domain.variable, point);
    } catch {
      // A sampled point can be a trigonometric pole or a denominator zero.
      continue;
    }
    closeEnough(actualValue, expectedValue);
    compared += 1;
  }
  expect(compared, `${q.id} had no finite comparison point`).toBeGreaterThan(0);
}

function generated(skill: string, template: number, suffix = 'math-test'): Question {
  return generateQuestion(skill, `${suffix}:${skill}:${template}`, template);
}

function operators(expr: Expr): string[] {
  return Array.isArray(expr) ? [expr[0], ...expr.slice(1).flatMap(operators)] : [];
}

function powerExponents(expr: Expr): string[] {
  if (!Array.isArray(expr)) return [];
  return [
    ...(expr[0] === 'Power' ? [JSON.stringify(expr[2])] : []),
    ...expr.slice(1).flatMap(powerExponents),
  ];
}

describe('math primitives and real-domain edge cases', () => {
  it('differentiates representative expressions without relying on the grader', () => {
    const cases: Array<[Expr, Expr, string, number]> = [
      [['Power', 'x', 5], ['Multiply', 5, ['Power', 'x', 4]], 'x', 2],
      [['Power', 'x', ['Divide', 1, 2]], ['Multiply', ['Divide', 1, 2], ['Power', 'x', ['Divide', -1, 2]]], 'x', 4],
      [['Exp', ['Add', ['Multiply', 2, 'x'], 1]], ['Multiply', ['Exp', ['Add', ['Multiply', 2, 'x'], 1]], 2], 'x', 0.25],
      [['Ln', ['Add', ['Multiply', 3, 'x'], 1]], ['Divide', 3, ['Add', ['Multiply', 3, 'x'], 1]], 'x', 0.5],
      [['Sin', ['Multiply', 2, 'x']], ['Multiply', ['Cos', ['Multiply', 2, 'x']], 2], 'x', 0.4],
      [['Arccos', ['Add', 1, ['Negate', ['Multiply', 2, 'x']]]], ['Divide', 2, ['Sqrt', ['Add', 1, ['Negate', ['Power', ['Add', 1, ['Negate', ['Multiply', 2, 'x']]], 2]]]]], 'x', 0.3],
      [['Multiply', ['Power', 'x', 3], ['Sin', 'x']], ['Add', ['Multiply', 3, ['Power', 'x', 2], ['Sin', 'x']], ['Multiply', ['Power', 'x', 3], ['Cos', 'x']]], 'x', 0.7],
    ];
    for (const [source, expected, variable, point] of cases) {
      const actual = derivative(source, variable);
      const { calc, D } = evaluator(70);
      closeEnough(calc(actual, { [variable]: new D(point) }).toNumber(), calc(expected, { [variable]: new D(point) }).toNumber());
    }
  });

  it('evaluates odd-denominator rational powers on negative reals', () => {
    const { calc, D } = evaluator(70);
    const root = ['Power', 'x', ['Divide', 1, 3]] as Expr;
    const rootDerivative = derivative(root);
    expect(calc(root, { x: new D(-8) }).toNumber()).toBe(-2);
    closeEnough(calc(rootDerivative, { x: new D(-8) }).toNumber(), 1 / 12);
    expect(() => calc(['Power', 'x', ['Divide', 1, 2]], { x: new D(-1) })).toThrow();
  });

  it('keeps the zero and pole states distinct from finite numeric answers', () => {
    const { calc, D } = evaluator(70);
    expect(() => calc(['Divide', 1, 'x'], { x: new D(0) })).toThrow(/Singularity|range/i);
    expect(() => calc(['Ln', 'x'], { x: new D(0) })).toThrow();
    expect(() => calc(['Sqrt', ['Negate', 1]], {})).toThrow();
    expect(calc(['Power', 'x', ['Divide', 2, 3]], { x: new D(0) }).toNumber()).toBe(0);
  });
});

describe('question generation and independent derivative identities', () => {
  it('generates every registered template for every catalog skill', () => {
    const questions = SKILLS.flatMap((skill) =>
      TEMPLATES[skill.id].map((_, template) => generated(skill.id, template)),
    );
    const totalTemplates = SKILLS.reduce((sum, skill) => sum + TEMPLATES[skill.id].length, 0);
    expect(questions).toHaveLength(totalTemplates);
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
    for (const question of questions) {
      expect(question.template).toBeGreaterThanOrEqual(0);
      expect(question.template).toBeLessThanOrEqual(TEMPLATES[question.family].length - 1);
      expect(question.source.length).toBeGreaterThan(0);
      expect(question.answers.length).toBeGreaterThan(0);
      expect(question.family).toBe(question.primarySkill);
      expect(question.signature).toContain(question.family);
    }
  });

  it('keeps rule-generated combination families structurally varied across seeds', () => {
    const families = ['product', 'quotient', 'chain', 'nested', 'mixed'];
    for (const family of families) {
      for (let template = 0; template < TEMPLATES[family].length; template++) {
        const questions = Array.from({ length: 100 }, (_, seed) =>
          generateQuestion(family, `variety:${family}:${template}:${seed}`, template),
        );
        const sourceShapes = new Set(questions.map((question) => JSON.stringify(question.source[0])));
        expect(sourceShapes.size, `${family} template ${template} has no seed-level shape variety`).toBeGreaterThan(1);

        const smooth = new Set(
          questions
            .flatMap((question) => operators(question.source[0]))
            .filter((operator) => ['Sin', 'Cos', 'Exp'].includes(operator)),
        );
        const smoothIsExpected =
          (family === 'product' && true) ||
          (family === 'quotient' && template === 1) ||
          (family === 'chain' && template === 1) ||
          family === 'nested' ||
          family === 'mixed';
        if (smoothIsExpected) expect(smooth.size, `${family} template ${template} smooth choices`).toBeGreaterThanOrEqual(2);
      }
    }

    const chainInnerPowers = new Set(
      Array.from({ length: 100 }, (_, seed) => generateQuestion('chain', `inner-power:${seed}`, 1))
        .flatMap((question) => powerExponents(question.source[0])),
    );
    expect(chainInnerPowers.size).toBeGreaterThan(1);
  });

  it('matches the independently constructed derivative for every direct-rule family and template', () => {
    let checked = 0;
    for (const skill of SKILLS.filter((item) => DIRECT_FAMILIES.has(item.id))) {
      for (let template = 0; template < TEMPLATES[skill.id].length; template++) {
        const question = generated(skill.id, template, 'direct-family');
        const expected = derivative(question.source[0], question.domain.variable);
        compareAtPoints(question, expected, question.answers[0]);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(20);
  });

  it('checks higher, parametric, vector, and polar answers with their family rules', () => {
    const higher = generated('higher', 1, 'family-special');
    const expectedHigher = derivative(derivative(derivative(higher.source[0], 'x'), 'x'), 'x');
    compareAtPoints(higher, expectedHigher, higher.answers[0]);

    const parametric = generated('parametric', 1, 'family-special');
    const slope = ['Divide', derivative(parametric.source[1], 't'), derivative(parametric.source[0], 't')] as Expr;
    const expectedSecond = ['Divide', derivative(slope, 't'), derivative(parametric.source[0], 't')] as Expr;
    compareAtPoints(parametric, expectedSecond, parametric.answers[0]);

    const vector = generated('vector', 1, 'family-special');
    expect(vector.answers).toEqual(vector.source.map((expr) => derivative(expr, 't')));

    const polar = generated('polar', 0, 'family-special');
    const radius = polar.source[0];
    const xTheta = ['Multiply', radius, ['Cos', 'theta']] as Expr;
    const yTheta = ['Multiply', radius, ['Sin', 'theta']] as Expr;
    const expectedPolar = ['Divide', derivative(yTheta, 'theta'), derivative(xTheta, 'theta')] as Expr;
    compareAtPoints(polar, expectedPolar, polar.answers[0]);
  });
});

describe('domain metadata and parser boundaries', () => {
  it('records square-root and odd-root comparison domains separately', () => {
    const square = generated('root', 0, 'domain');
    const odd = generated('root', 1, 'domain');
    expect(square.domain.intervals.every(([lo, hi]) => lo > 0 && hi > 0)).toBe(true);
    expect(odd.domain.intervals.some(([lo, hi]) => hi < 0)).toBe(true);
    expect(odd.domain.intervals.some(([lo, hi]) => lo > 0)).toBe(true);
    expect(odd.domain.intervals.every(([lo, hi]) => !(lo <= 0 && hi >= 0))).toBe(true);
  });

  it('retains logarithm, inverse-trig, curve, and denominator-guard metadata', () => {
    const logQuestion = generated('log', 1, 'domain');
    expect(logQuestion.domain.intervals.every(([lo, hi]) => lo > 0 && hi > 0)).toBe(true);

    for (const family of ['asin', 'acos', 'atan']) {
      const question = generated(family, 1, 'domain');
      expect(question.domain.intervals.every(([lo, hi]) => lo >= -1 && hi <= 1)).toBe(true);
    }

    const implicit = generated('implicit', 0, 'domain');
    expect(implicit.domain.curve?.type).toBe('circle');
    expect(implicit.domainText).toMatch(/curve|y/i);

    const parametric = generated('parametric', 1, 'domain');
    const polar = generated('polar', 1, 'domain');
    expect(parametric.domain.guards.length).toBeGreaterThan(0);
    expect(polar.domain.guards.length).toBeGreaterThan(0);
  });

  it('round-trips generated LaTeX through the supported raw parser', () => {
    const negativeProduct = ['Multiply', -2, 'x'] as Expr;
    const parsedNegative = parseAnswer(latex(negativeProduct), ['x']);
    const { calc, D } = evaluator(60);
    closeEnough(calc(parsedNegative, { x: new D(3) }).toNumber(), -6);
    expect(parseAnswer('\\sqrt[3]{x}', ['x'])).toEqual(['Power', 'x', ['Divide', 1, 3]]);
    expect(parseAnswer('2\\,x', ['x'])).toEqual(['Multiply', 2, 'x']);
    expect(() => parseAnswer('x+y', ['x'])).toThrow(/Use only/);
    expect(() => parseAnswer('', ['x'])).toThrow(/Enter an answer/);
  });

  it('grades canonical and deliberately wrong answers on representative supported questions', () => {
    const power = generated('power', 0, 'grading');
    const canonical = grade(power, [latex(power.answers[0])]);
    expect(canonical.status).toBe('correct');
    const wrong = grade(power, ['0']);
    expect(wrong).toMatchObject({ status: 'incorrect' });

    const root = generated('root', 1, 'grading');
    expect(grade(root, [latex(root.answers[0])].map((answer) => answer.replace(/\\cdot ?/g, ' '))).status).toBe('correct');

    const implicit = generated('implicit', 0, 'grading');
    expect(grade(implicit, [latex(implicit.answers[0])]).status).toBe('correct');
    expect(grade(implicit, ['x/y']).status).toBe('incorrect');
  });
});
