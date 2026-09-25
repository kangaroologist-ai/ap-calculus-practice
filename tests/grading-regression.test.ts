import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SKILLS } from '../src/catalog';
import { grade } from '../src/grading';
import { latex } from '../src/math';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Expr, Question } from '../src/types';

// Reads off a p*x^2 or q*y^2 term's coefficient from an
// implicit.ellipse/implicit.hyperbola source (p*x^2 + q*y^2 - c, or
// q*y^2 - p*x^2 - c), so tests can assert against the real p/q ratio
// instead of a value hardcoded for one seed. mul() drops a literal
// coefficient of 1, so a bare Power(x|y, 2) term means coefficient 1.
function coefficientOf(term: Expr): number {
  if (Array.isArray(term) && term[0] === 'Negate') return -coefficientOf(term[1]);
  if (Array.isArray(term) && term[0] === 'Power') return 1;
  if (Array.isArray(term) && term[0] === 'Multiply' && typeof term[1] === 'number') return term[1];
  throw new Error(`Unexpected implicit term shape: ${JSON.stringify(term)}`);
}

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
    // root.frac_power now draws p/q from six options and a from the shared
    // 2..9 range, so search for a seed landing on the classic cube-root case
    // (p/q = 1/3) with a coefficient that divides evenly, to keep the
    // equivalent literal form simple to write by hand.
    let question: Question | undefined;
    let coefficient = 0;
    for (let i = 0; i < 300 && !question; i++) {
      const candidate = generateQuestion('root', `root-regression:${i}`, 1);
      const term = candidate.source[0] as Expr[]; // ["Multiply", a, ["Power", "x", ["Divide", p, q]]]
      const a = term[1] as number;
      const power = term[2] as Expr[]; // ["Power", "x", ["Divide", p, q]]
      const divide = power[2] as Expr[]; // ["Divide", p, q]
      const [p, q] = [divide[1] as number, divide[2] as number];
      if (p === 1 && q === 3 && a % 3 === 0) {
        question = candidate;
        coefficient = a / 3;
      }
    }
    if (!question) throw new Error('no a%3===0, p/q=1/3 root seed found in 300 tries');
    // e.g. 6*(1/3)*x^(-2/3) = 2*x^(-2/3), including on the negative-real branch.
    expect(grade(question, [`${coefficient}x^{-\\frac{2}{3}}`])).toMatchObject({
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
    // <id>.basic now draws its own local coefficient (SPEC-G1), so read it
    // back off the generated source instead of hardcoding a value tied to
    // one seed's old shared-ctx.a draw.
    const coefficientOf = (q: Question) => (q.source[0] as Expr[])[1] as number;

    const tan = generateQuestion('tan', 'tan:0', 0);
    const tanCoefficient = coefficientOf(tan);
    expect(grade(tan, [`${tanCoefficient}(1+\\tan^2(x))`])).toMatchObject({ status: 'correct' });
    expect(grade(tan, [`\\frac{${tanCoefficient}}{1-\\sin^2(x)}`])).toMatchObject({ status: 'correct' });

    const sec = generateQuestion('sec', 'sec:0', 0);
    expect(grade(sec, [`\\frac{${coefficientOf(sec)}\\sin(x)}{\\cos(x)^2}`])).toMatchObject({ status: 'correct' });

    const csc = generateQuestion('csc', 'csc:0', 0);
    expect(grade(csc, [`\\frac{-${coefficientOf(csc)}\\cos(x)}{\\sin(x)^2}`])).toMatchObject({ status: 'correct' });

    const cot = generateQuestion('cot', 'cot:0', 0);
    expect(grade(cot, [`-${coefficientOf(cot)}(1+\\cot^2(x))`])).toMatchObject({ status: 'correct' });
  });

  it('checks equivalent implicit derivatives along the curve', () => {
    // p == q would make the canonical answer coincide with the naive +-x/y
    // ratio, so search for a seed whose p != q before using that literal as
    // a "wrong ratio" negative case (p, q are drawn independently from
    // 1..5, so most seeds already qualify; searching keeps this exact
    // instead of assuming one arbitrary seed happens to qualify).
    function pqUnequalSeed(template: number, coefficients: (source: Expr) => [number, number]): Question {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion('implicit', `implicit-regression:${template}:${i}`, template);
        const [p, qq] = coefficients(q.source[0]);
        if (p !== qq) return q;
      }
      throw new Error(`no seed with p != q found for implicit template ${template} in 20 tries`);
    }

    const ellipse = pqUnequalSeed(0, (source) => [
      coefficientOf((source as Expr[])[1]),
      coefficientOf((source as Expr[])[2]),
    ]);
    expect(grade(ellipse, [latex(ellipse.answers[0])])).toMatchObject({ status: 'correct' });
    expect(grade(ellipse, ['-x/y'])).toMatchObject({ status: 'incorrect' });

    const hyperbola = pqUnequalSeed(1, (source) => [
      -coefficientOf((source as Expr[])[2]),
      coefficientOf((source as Expr[])[1]),
    ]);
    expect(grade(hyperbola, [latex(hyperbola.answers[0])])).toMatchObject({ status: 'correct' });
    expect(grade(hyperbola, ['x/y'])).toMatchObject({ status: 'incorrect' });
  });

  it('grades the old saved circle-curve implicit question (tests/fixtures/local-state-v1.json)', () => {
    // The fixture is a frozen sample of generator <= 1.1.0 output (the
    // legacy { type: "circle", parameter } curve); it must keep grading
    // forever, independent of anything Step 3 changes about new questions.
    const fixture = JSON.parse(
      readFileSync(new URL('./fixtures/local-state-v1.json', import.meta.url), 'utf8'),
    ) as { session: { current: { question: Question } } };
    const question = fixture.session.current.question;
    expect(question.domain.curve).toMatchObject({ type: 'circle' });
    expect(grade(question, [latex(question.answers[0])])).toMatchObject({ status: 'correct' });
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
