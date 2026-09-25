import { describe, expect, it } from 'vitest';
import { SKILLS, skillById } from '../src/catalog';
import { inferSkills } from '../src/skill-inference';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Expr } from '../src/types';

// The current basic templates that deliberately preview a chain rule before
// level 3 (chain's own level): e^{ax+b}, ln(ax+b), the six trig g(ax+b)
// templates, and the three inverse-trig arc(x/a) templates. Phase 2 Step 10
// removes the chain preview from basic templates entirely, at which point
// this whole exception list is deleted.
const KNOWN_CHAIN_PREVIEW = new Set([
  'exp.natural',
  'log.natural',
  'sin.linear',
  'cos.linear',
  'tan.linear',
  'cot.linear',
  'sec.linear',
  'csc.linear',
  'asin.scaled',
  'acos.scaled',
  'atan.scaled',
]);

describe('inferSkills', () => {
  it('finds sin, chain, sum, and power in sin(x^2+1)', () => {
    const e: Expr = ['Sin', ['Add', ['Power', 'x', 2], 1]];
    expect(inferSkills(e, ['x'])).toEqual(new Set(['sin', 'chain', 'sum', 'power']));
  });

  it('finds exp, sin, chain, and nested in e^{sin(3x)}', () => {
    const e: Expr = ['Exp', ['Sin', ['Multiply', 3, 'x']]];
    expect(inferSkills(e, ['x'])).toEqual(new Set(['exp', 'sin', 'chain', 'nested']));
  });

  it('finds only power in 3x^4', () => {
    const e: Expr = ['Multiply', 3, ['Power', 'x', 4]];
    expect(inferSkills(e, ['x'])).toEqual(new Set(['power']));
  });

  it('finds only log in (ln x)/(ln 5), since the denominator is constant', () => {
    const e: Expr = ['Divide', ['Ln', 'x'], ['Ln', 5]];
    expect(inferSkills(e, ['x'])).toEqual(new Set(['log']));
  });

  it('treats a constant multiple as not a product', () => {
    const e: Expr = ['Multiply', 7, 'x'];
    expect(inferSkills(e, ['x']).has('product')).toBe(false);
  });

  it('finds product in x*sin(x)', () => {
    const e: Expr = ['Multiply', 'x', ['Sin', 'x']];
    const found = inferSkills(e, ['x']);
    expect(found.has('product')).toBe(true);
    expect(found.has('sin')).toBe(true);
  });

  it('finds exp (not chain) in a^x, since the exponent is the bare variable', () => {
    const e: Expr = ['Power', 3, 'x'];
    expect(inferSkills(e, ['x'])).toEqual(new Set(['exp']));
  });

  it('finds root in x^(1/3)', () => {
    const e: Expr = ['Power', 'x', ['Divide', 1, 3]];
    expect(inferSkills(e, ['x'])).toEqual(new Set(['root']));
  });

  it('finds quotient only when the denominator depends on the variable', () => {
    const withVariable: Expr = ['Divide', 'x', ['Add', 'x', 1]];
    const withoutVariable: Expr = ['Divide', 'x', 5];
    expect(inferSkills(withVariable, ['x']).has('quotient')).toBe(true);
    expect(inferSkills(withoutVariable, ['x']).has('quotient')).toBe(false);
  });
});

describe('Question.requiredSkills stays within the primary skill\'s level', () => {
  it('never exceeds the primary skill level, except the documented chain-preview templates', () => {
    const violations: string[] = [];
    for (const skill of SKILLS) {
      for (let template = 0; template < TEMPLATES[skill.id].length; template++) {
        const key = TEMPLATES[skill.id][template].key;
        for (let seedIndex = 0; seedIndex < 50; seedIndex++) {
          const q = generateQuestion(
            skill.id,
            `skill-inference-matrix:${skill.id}:${template}:${seedIndex}`,
            template,
          );
          const tooHigh = (q.requiredSkills ?? []).some(
            (id) => skillById(id).level > skill.level,
          );
          if (tooHigh && !KNOWN_CHAIN_PREVIEW.has(key)) violations.push(`${key} (${q.id})`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('confirms every listed chain-preview template really does violate the level rule', () => {
    for (const skill of SKILLS) {
      for (let template = 0; template < TEMPLATES[skill.id].length; template++) {
        const key = TEMPLATES[skill.id][template].key;
        if (!KNOWN_CHAIN_PREVIEW.has(key)) continue;
        const q = generateQuestion(skill.id, `skill-inference-known:${key}`, template);
        const tooHigh = (q.requiredSkills ?? []).some((id) => skillById(id).level > skill.level);
        expect(tooHigh, `${key} was listed as a known chain preview but does not violate`).toBe(
          true,
        );
      }
    }
  });

  it('lists only template keys that actually exist in the registry', () => {
    const allKeys = new Set(SKILLS.flatMap((skill) => TEMPLATES[skill.id].map((t) => t.key)));
    for (const key of KNOWN_CHAIN_PREVIEW) expect(allKeys.has(key)).toBe(true);
  });
});
