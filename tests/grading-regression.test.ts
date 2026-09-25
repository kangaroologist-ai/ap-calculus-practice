import { describe, expect, it } from 'vitest';
import { SKILLS } from '../src/catalog';
import { grade } from '../src/grading';
import { latex } from '../src/math';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Question } from '../src/types';

function canonical(question: Question) {
  return question.answers.map((answer) => latex(answer));
}

function polynomialQuestion(): Question {
  return {
    id: 'grading-regression:removable-linear-hole',
    seed: 'grading-regression:removable-linear-hole',
    generatorVersion: '1.1.0',
    template: 0,
    templateKey: 'power.xn',
    family: 'power',
    level: 1,
    primarySkill: 'power',
    supportingSkills: [],
    title: 'Find the derivative',
    prompt: 'f(x)=x^2',
    source: [['Power', 'x', 2]],
    answers: [['Multiply', 2, 'x']],
    labels: ["f'(x)"],
    domain: {
      variable: 'x',
      intervals: [
        [-2, -0.2],
        [0.2, 2],
      ],
      guards: [],
    },
    domainText: 'Use the real domain of the derivative.',
    hints: [],
    hintMath: '',
    steps: [],
    signature: 'grading-regression:removable-linear-hole',
  };
}

describe('grading regressions for generated calculus questions', () => {
  it('accepts the nested v1 reviewer seed after parsing its canonical answer', () => {
    const question = generateQuestion('nested', 'nested:1:2', 1);
    const verdict = grade(question, canonical(question));
    expect(verdict).toMatchObject({ status: 'correct' });
  });

  it('accepts a standard negative fractional exponent for the odd real root', () => {
    const question = generateQuestion('root', 'root:0', 1);
    // 6*(1/3)*x^(-2/3) = 2*x^(-2/3), including on the negative-real branch.
    expect(grade(question, ['2x^{-\\frac{2}{3}}'])).toMatchObject({
      status: 'correct',
    });
  });

  it('rejects a polynomial answer with a removable denominator hole', () => {
    const question = polynomialQuestion();
    const verdict = grade(question, ['2x*(x-.123)/(x-.123)']);
    expect(verdict).toEqual({ status: 'incorrect', feedbackCode: 'domain' });
  });

  it('proves a trig-sum denominator but keeps an unproven trig zero inconclusive', () => {
    const question = polynomialQuestion();
    const proven = grade(question, [
      '2x(\\sin^2(x)+\\cos^2(x))/(\\sin^2(x)+\\cos^2(x))',
    ]);
    expect(proven).toMatchObject({ status: 'correct' });

    const unproven = grade(question, ['2x\\sin(x-.123)/\\sin(x-.123)']);
    expect(unproven.status).toBe('inconclusive');
  });

  it('accepts Pythagorean and reciprocal trigonometric equivalents', () => {
    const tan = generateQuestion('tan', 'tan:0', 0);
    expect(grade(tan, ['4(1+\\tan^2(x))'])).toMatchObject({ status: 'correct' });
    expect(grade(tan, ['\\frac{4}{1-\\sin^2(x)}'])).toMatchObject({ status: 'correct' });

    const sec = generateQuestion('sec', 'sec:0', 0);
    expect(grade(sec, ['\\frac{8\\sin(x)}{\\cos(x)^2}'])).toMatchObject({ status: 'correct' });

    const csc = generateQuestion('csc', 'csc:0', 0);
    expect(grade(csc, ['\\frac{-9\\cos(x)}{\\sin(x)^2}'])).toMatchObject({ status: 'correct' });

    const cot = generateQuestion('cot', 'cot:0', 0);
    expect(grade(cot, ['-9(1+\\cot^2(x))'])).toMatchObject({ status: 'correct' });
  });

  it('checks equivalent implicit derivatives along the curve', () => {
    const circle = generateQuestion('implicit', 'implicit:0', 0);
    expect(grade(circle, ['-x/y'])).toMatchObject({ status: 'correct' });
    expect(grade(circle, ['x/y'])).toMatchObject({ status: 'incorrect' });

    const hyperbola = generateQuestion('implicit', 'implicit:1', 1);
    expect(grade(hyperbola, ['x/y'])).toMatchObject({ status: 'correct' });
  });

  it(
    'grades 20 independent seeds for every template of every catalog skill',
    () => {
      const failures: Array<{
        skill: string;
        template: number;
        seed: string;
        questionId: string;
        source: string[];
        answer: string[];
        verdict: ReturnType<typeof grade>;
      }> = [];
      let checked = 0;
      let expectedChecked = 0;

      for (const skill of SKILLS) {
        expectedChecked += TEMPLATES[skill.id].length * 20;
        for (let template = 0; template < TEMPLATES[skill.id].length; template++) {
          for (let seedIndex = 0; seedIndex < 20; seedIndex++) {
            const seed = `canonical-matrix:${skill.id}:${template}:${seedIndex}`;
            const question = generateQuestion(skill.id, seed, template);
            const answer = canonical(question);
            const verdict = grade(question, answer);
            checked += 1;
            if (verdict.status !== 'correct') {
              failures.push({
                skill: skill.id,
                template,
                seed,
                questionId: question.id,
                source: question.source.map((expr) => latex(expr)),
                answer,
                verdict,
              });
            }
          }
        }
      }

      expect(checked).toBe(expectedChecked);
      expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
    },
    120_000,
  );
});
