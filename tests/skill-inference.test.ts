import { describe, expect, it } from 'vitest';
import { inferSkills } from '../src/skill-inference';
import type { Expr } from '../src/types';

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

  it('treats an abstract function with a bare argument as no skill', () => {
    const e: Expr = ['Fn', 'f', 0, 'x'];
    expect(inferSkills(e, ['x'])).toEqual(new Set());
  });

  it('adds chain for f(x^3) and still finds power', () => {
    const e: Expr = ['Fn', 'f', 0, ['Power', 'x', 3]];
    expect(inferSkills(e, ['x'])).toEqual(new Set(['chain', 'power']));
  });

  it('adds chain for f(g(x)) without mapping f or g to a catalog skill', () => {
    const e: Expr = ['Fn', 'f', 0, ['Fn', 'g', 0, 'x']];
    expect(inferSkills(e, ['x'])).toEqual(new Set(['chain']));
  });

  it('adds nested when an abstract application sits inside a composite', () => {
    const e: Expr = ['Fn', 'f', 0, ['Exp', ['Sin', 'x']]];
    expect(inferSkills(e, ['x'])).toEqual(
      new Set(['chain', 'nested', 'exp', 'sin']),
    );
  });

  it('finds product and quotient around abstract functions', () => {
    const product: Expr = ['Multiply', ['Power', 'x', 2], ['Fn', 'f', 0, 'x']];
    expect(inferSkills(product, ['x'])).toEqual(new Set(['product', 'power']));
    const quotient: Expr = ['Divide', ['Fn', 'f', 0, 'x'], ['Fn', 'g', 0, 'x']];
    expect(inferSkills(quotient, ['x'])).toEqual(new Set(['quotient']));
  });
});
