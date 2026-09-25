import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generateQuestion } from '../src/questions';

// Frozen output of every skill x both v1.1.0 templates x 20 seeds (see
// scripts/capture-fixtures.ts). Regenerating each entry from its own seed and
// comparing against the stored fields is how each generator step proves it
// did not silently change already-shipped question content.
const golden = JSON.parse(
  readFileSync(new URL('./fixtures/generator-1.1.0.json', import.meta.url), 'utf8'),
) as Record<string, unknown>[];

// Fields a later step is allowed to change on purpose get added here, with a
// comment explaining why, instead of being deleted from the comparison.
const EXCLUDED_FIELDS = new Set<string>([
  // SPEC-G3 (Step 2): supportingSkills now legitimately reflects the skills a
  // question's own expression tree exercises, not a copy of the catalog's
  // static prerequisite list, so it is allowed to differ from the frozen
  // v1.1.0 fixture.
  'supportingSkills',
]);

// Template keys a later step is allowed to change the generated content for
// (e.g. once a template is rewritten for SPEC-G1/G4 variety) go here, keyed
// by the fixture's `family:template` pair, so the exclusion is auditable.
//
// Step 3 (SPEC-G1/G4/G5/G6) rewrote every template below for more variety
// and/or to fix a degenerate answer; see src/templates.ts for each one's
// current shape and the plan for the table.
const EXCLUDED_TEMPLATE_KEYS = new Set<string>([
  // Widened from a single a-value to 4 forms (a, ln a, sqrt a, e^a);
  // renamed constant.plain -> constant.value.
  'constant:0',
  // n widened from a shared 2..5 to a local 2..12 draw (key unchanged).
  'power:0',
  // SPEC-G5: now shows a real radical and rewrites it to x^(1/2) with an
  // explicit rewrite step before differentiating (key unchanged).
  'root:0',
  // p/q now ranges over six rational exponents instead of a fixed cube
  // root; renamed root.cube -> root.frac_power.
  'root:1',
  // SPEC-G6: n now draws from a local 3..6 so x^n and b*x^2 can never
  // collide as like terms (key unchanged).
  'sum:0',
  // Adds an independent leading coefficient b*a^x (key unchanged).
  'exp:1',
  // Adds an independent leading coefficient b*ln(x)/ln(a) (key unchanged).
  'log:1',
  // a widened from a shared 2..9 to a local 2..13 draw so 200 seeds clear
  // the 10-distinct-fingerprint floor (key unchanged for all six).
  'sin:0',
  'cos:0',
  'tan:0',
  'cot:0',
  'sec:0',
  'csc:0',
  // Same a-range widening as the six trig basics above (keys unchanged).
  'asin:0',
  'asin:1',
  'acos:0',
  'acos:1',
  'atan:0',
  'atan:1',
  // SPEC-G6: denominator now draws an independent constant c instead of
  // reusing the numerator's b (key unchanged).
  'quotient:0',
  'mixed:1',
  // SPEC-G4: circle -> general ellipse p*x^2+q*y^2=c on the new generic
  // graph curve; renamed implicit.circle -> implicit.ellipse.
  'implicit:0',
  // SPEC-G4: generalized to q*y^2-p*x^2=c on the new generic graph curve
  // (key unchanged).
  'implicit:1',
  // Third derivative of a*g(kx) for g in {sin, cos}, not just a*sin(x);
  // renamed higher.sin3 -> higher.trig3.
  'higher:1',
  // x=a*t^2, y=t^k for k in 3..5, instead of the single fixed pair
  // x=t^2, y=t^3 (key unchanged).
  'parametric:1',
  // Adds an independent leading coefficient on the cosine component
  // (key unchanged).
  'vector:1',
  // SPEC-G1/G4: r=a+b*sin(theta) instead of the degenerate r=a*sin(theta)
  // (whose slope was always tan(2*theta)); renamed polar.sin -> polar.sin_limacon.
  'polar:0',
  // Adds an independent leading coefficient b*cos(theta) (key unchanged).
  'polar:1',
  // Not in the plan's Step 3 table, but tests/generator-variety.test.ts
  // (SPEC-G1) caught the same defect here: b was only ever the evaluation
  // point, never part of the source, so the signature only took 8 distinct
  // values. b is now also folded into the cubic itself (key unchanged).
  'inverse:1',
]);

function omitExcluded(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([field]) => !EXCLUDED_FIELDS.has(field)),
  );
}

describe('generator golden fixture stays reproducible from its own seed', () => {
  it(`regenerates all ${golden.length} frozen questions identically`, () => {
    for (const entry of golden) {
      const family = entry.family as string;
      const template = entry.template as number;
      const seed = entry.seed as string;
      if (EXCLUDED_TEMPLATE_KEYS.has(`${family}:${template}`)) continue;
      const actual = generateQuestion(family, seed, template) as unknown as Record<
        string,
        unknown
      >;
      expect(omitExcluded(actual), `${family} template ${template} seed ${seed}`).toMatchObject(
        omitExcluded(entry),
      );
    }
  });
});
