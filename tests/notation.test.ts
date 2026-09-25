import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SKILLS } from '../src/catalog';
import { generateQuestion, ruleFormula } from '../src/questions';
import { ddx, dydx } from '../src/notation';

// An italic \frac{d...}{d...} is the ISO 80000-2 violation this step removes:
// the differential d must always be upright (\mathrm{d}), like sin or ln.
const ITALIC_D = /\\frac\{d(\^\{?\d\}?)?[a-z]*\}\{d/;

describe('notation helpers render an upright differential d', () => {
  it('ddx builds the operator form, theta included', () => {
    expect(ddx()).toBe('\\frac{\\mathrm{d}}{\\mathrm{d}x}');
    expect(ddx('t')).toBe('\\frac{\\mathrm{d}}{\\mathrm{d}t}');
    expect(ddx('theta')).toBe('\\frac{\\mathrm{d}}{\\mathrm{d}\\theta}');
  });

  it('dydx builds first and higher-order ratios, theta included', () => {
    expect(dydx()).toBe('\\frac{\\mathrm{d}y}{\\mathrm{d}x}');
    expect(dydx(2)).toBe('\\frac{\\mathrm{d}^{2}y}{\\mathrm{d}x^{2}}');
    expect(dydx(1, 'x', 't')).toBe('\\frac{\\mathrm{d}x}{\\mathrm{d}t}');
    expect(dydx(1, 'x', 'theta')).toBe('\\frac{\\mathrm{d}x}{\\mathrm{d}\\theta}');
  });

  it('none of these forms match the italic-d regression pattern', () => {
    for (const tex of [ddx(), ddx('theta'), dydx(), dydx(2)])
      expect(tex).not.toMatch(ITALIC_D);
  });
});

describe('generated formulas use an upright differential d', () => {
  it('every skill and template produces no italic differential d', () => {
    for (const s of SKILLS)
      for (const t of [0, 1]) {
        const q = generateQuestion(s.id, `notation:${s.id}:${t}`, t);
        for (const tex of [
          q.prompt,
          q.hintMath,
          ruleFormula(s.id),
          ...q.steps.map((step) => step.math),
        ])
          expect(tex).not.toMatch(ITALIC_D);
      }
  });

  it('keeps italic differential d out of the source tree', () => {
    for (const file of ['src/main.ts', 'src/questions.ts', 'scripts/skill-examples.ts'])
      expect(readFileSync(file, 'utf8')).not.toMatch(/\\\\frac\{d/);
  });
});
