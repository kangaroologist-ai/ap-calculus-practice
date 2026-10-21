import { describe, expect, it } from 'vitest';
import { checkExtraDomains } from '../src/domains';
import {
  ABSTRACT_CHOICES,
  grade,
  instantiate,
  parseAnswer,
} from '../src/grading';
import { complexity, derivative, evaluator, latex } from '../src/math';
import type { Expr, Question } from '../src/types';

const fn = (name: 'f' | 'g', order: number, arg: Expr): Expr => [
  'Fn',
  name,
  order,
  arg,
];

const sources: Record<string, Expr> = {
  'f(x^3)': fn('f', 0, ['Power', 'x', 3]),
  'f(sin x)': fn('f', 0, ['Sin', 'x']),
  '[f(x)]^3': ['Power', fn('f', 0, 'x'), 3],
  'e^{f(x)}': ['Exp', fn('f', 0, 'x')],
  'sqrt f(x)': ['Sqrt', fn('f', 0, 'x')],
  'ln f(x)': ['Ln', fn('f', 0, 'x')],
  'sin f(x)': ['Sin', fn('f', 0, 'x')],
  'x^2 f(x)': ['Multiply', ['Power', 'x', 2], fn('f', 0, 'x')],
  'f(x)/x': ['Divide', fn('f', 0, 'x'), 'x'],
  'f(x)g(x)': ['Multiply', fn('f', 0, 'x'), fn('g', 0, 'x')],
  'f(x)/g(x)': ['Divide', fn('f', 0, 'x'), fn('g', 0, 'x')],
  'f(g(x))': fn('f', 0, fn('g', 0, 'x')),
};

function question(
  source: Expr,
  answer: Expr = derivative(source),
  abstract = true,
): Question {
  return {
    id: 'abstract-grading:test',
    seed: 'abstract-grading',
    generatorVersion: 'test',
    template: 0,
    templateKey: 'abstract.test',
    role: 'basic',
    family: 'abstract',
    level: 5,
    primarySkill: 'abstract',
    supportingSkills: [],
    title: 'Differentiate',
    prompt: '',
    source: [source],
    answers: [answer],
    labels: ["h'(x)"],
    domain: {
      variable: 'x',
      intervals: [
        [-2, -0.5],
        [0.5, 2],
      ],
      guards: [],
      ...(abstract ? { functions: ['f', 'g'] as ('f' | 'g')[] } : {}),
    },
    domainText: '',
    hints: [],
    hintMath: '',
    steps: [],
    signature: 'abstract-grading',
  };
}

describe('abstract-function grading', () => {
  it('accepts the canonical answer for every S6 form', () => {
    for (const [name, source] of Object.entries(sources)) {
      const answer = derivative(source);
      expect(grade(question(source, answer), [latex(answer)]), name).toMatchObject({
        status: 'correct',
      });
    }
  });

  it('accepts equivalent student forms', () => {
    const forms: [string, string][] = [
      ['f(x^3)', "3x^2f'(x^3)"],
      ['f(x^3)', "f'(x^3)\\cdot 3x^2"],
      ['f(x^3)', "f^{\\prime}\\left(x^3\\right)3x^2"],
      ['sqrt f(x)', "\\frac{f'(x)}{2\\sqrt{f(x)}}"],
      ['f(g(x))', "f'(g(x))g'(x)"],
      [
        'f(x)/g(x)',
        "\\frac{f'(x)g(x)-f(x)g'(x)}{g(x)^2}",
      ],
      ['[f(x)]^3', "3(f(x))^2f'(x)"],
    ];
    for (const [name, raw] of forms) {
      const source = sources[name];
      expect(grade(question(source), [raw]), `${name}: ${raw}`).toMatchObject({
        status: 'correct',
      });
    }
  });

  it('rejects forms that are not the derivative', () => {
    const wrong: [string, string][] = [
      ['f(x^3)', "f'(x^3)"],
      ['f(x^3)', "3x^2f(x^3)"],
      ['f(x^3)', "f'(x)"],
      ['f(g(x))', "f'(g'(x))"],
      ['f(x)/g(x)', "\\frac{f'(x)}{g'(x)}"],
      ['f(x)g(x)', "f(x)g'(x)"],
    ];
    for (const [name, raw] of wrong) {
      expect(grade(question(sources[name]), [raw]), `${name}: ${raw}`).toMatchObject({
        status: 'incorrect',
      });
    }
  });

  it('rejects a function without an argument', () => {
    const q = question(sources['f(x^3)']);
    expect(grade(q, ['f'])).toMatchObject({
      status: 'invalid',
      message: expect.stringContaining('f(...)'),
    });
    expect(grade(q, ["f'"])).toMatchObject({
      status: 'invalid',
      message: expect.stringContaining('f(...)'),
    });
    expect(grade(q, ["f'''(x)"])).toMatchObject({ status: 'invalid' });
  });

  it('rejects a function name outside the question', () => {
    expect(grade(question(sources['f(x^3)']), ['h(x)'])).toMatchObject({
      status: 'invalid',
    });
  });

  it('still rejects f(x) on a non-abstract question', () => {
    const plain = question(['Power', 'x', 2], ['Multiply', 2, 'x'], false);
    expect(grade(plain, ['f(x)'])).toMatchObject({ status: 'invalid' });
    expect(grade(plain, ['2x'])).toMatchObject({ status: 'correct' });
  });

  it('treats an abstract function as an opaque factor in the domain check', () => {
    const q = question(fn('f', 0, 'x'), fn('f', 1, 'x'));
    const canonical = parseAnswer("f'(x)", ['x'], ['f', 'g']);
    expect(checkExtraDomains(q, [canonical])).toBe('safe');
    const extraDenominator = parseAnswer('\\frac{1}{f(x)}', ['x'], ['f', 'g']);
    expect(checkExtraDomains(q, [extraDenominator])).toBe('unknown');
  });

  it('reads both prime notations into Fn nodes', () => {
    expect(parseAnswer("f'(x^3)", ['x'], ['f', 'g'])).toEqual(
      fn('f', 1, ['Power', 'x', 3]),
    );
    expect(parseAnswer("f^{\\prime}\\left(x^3\\right)", ['x'], ['f', 'g'])).toEqual(
      fn('f', 1, ['Power', 'x', 3]),
    );
    expect(parseAnswer("f''(x)", ['x'], ['f', 'g'])).toEqual(fn('f', 2, 'x'));
    expect(parseAnswer('f(g(x))', ['x'], ['f', 'g'])).toEqual(
      fn('f', 0, fn('g', 0, 'x')),
    );
  });
});

describe('abstract-function helpers', () => {
  it('instantiates a function node with the chosen concrete function', () => {
    expect(instantiate(fn('f', 1, ['Power', 'x', 3]), ABSTRACT_CHOICES[0])).toEqual([
      'Add',
      ['Multiply', 2, ['Power', 'x', 3]],
      1,
    ]);
    expect(instantiate(fn('g', 0, 'x'), ABSTRACT_CHOICES[0])).toEqual(['Exp', 'x']);
  });

  it('instantiates nested arguments before substituting', () => {
    expect(instantiate(fn('f', 1, fn('g', 0, 'x')), ABSTRACT_CHOICES[0])).toEqual([
      'Add',
      ['Multiply', 2, ['Exp', 'x']],
      1,
    ]);
  });

  it('raises the order and applies the chain rule', () => {
    expect(derivative(fn('f', 1, ['Power', 'x', 3]))).toEqual([
      'Multiply',
      fn('f', 2, ['Power', 'x', 3]),
      ['Multiply', 3, ['Power', 'x', 2]],
    ]);
  });

  it('stops at the third derivative', () => {
    expect(() => derivative(fn('g', 3, 'x'))).toThrow();
  });

  it('writes primes without a dot after a number', () => {
    expect(latex(fn('f', 0, 'x'))).toBe('f\\left(x\\right)');
    expect(latex(fn('g', 2, ['Power', 'x', 3]))).toBe(
      "g''\\left(x^{3}\\right)",
    );
    expect(latex(['Multiply', 3, fn('f', 0, 'x')])).toBe('3f\\left(x\\right)');
  });

  it('counts an abstract function as one argument', () => {
    expect(complexity(fn('f', 1, ['Power', 'x', 2]))).toBe(4);
  });

  it('refuses to evaluate an abstract tree directly', () => {
    expect(() => evaluator(50).calc(fn('f', 0, 'x'), {})).toThrow(/Substitute/);
  });
});
