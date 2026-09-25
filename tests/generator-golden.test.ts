import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SKILLS } from '../src/catalog';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';

// Frozen output of every skill x both v1.1.0 templates x 20 seeds. Keep this
// archive loadable even when a later generator intentionally replaces its recipes.
const fixtureUrl = new URL('./fixtures/generator-1.1.0.json', import.meta.url);
const golden = JSON.parse(readFileSync(fixtureUrl, 'utf8')) as Record<string, unknown>[];

// Explicitly map each frozen family:index slot to the current stable key.
// The old slots all changed during Steps 1-4 or Step 10, so none is byte-identical.
const CURRENT_KEY_BY_LEGACY_ID: Record<string, string> = {
  'constant:0': 'constant.basic.forms',
  'constant:1': 'constant.basic.rational',
  'power:0': 'power.basic.positive',
  'power:1': 'power.basic.negative',
  'sum:0': 'sum.basic.polynomial_linear',
  'sum:1': 'sum.mix.square_root',
  'root:0': 'root.basic.square_root',
  'root:1': 'root.basic.fractional_power',
  'exp:0': 'exp.basic.natural',
  'exp:1': 'exp.basic.base',
  'log:0': 'log.basic.natural',
  'log:1': 'log.basic.scaled',
  'sin:0': 'sin.basic.scaled',
  'sin:1': 'sin.basic.divided',
  'cos:0': 'cos.basic.scaled',
  'cos:1': 'cos.basic.divided',
  'tan:0': 'tan.basic.scaled',
  'tan:1': 'tan.basic.divided',
  'cot:0': 'cot.basic.scaled',
  'cot:1': 'cot.basic.divided',
  'sec:0': 'sec.basic.scaled',
  'sec:1': 'sec.basic.divided',
  'csc:0': 'csc.basic.scaled',
  'csc:1': 'csc.basic.divided',
  'asin:0': 'asin.basic.scaled',
  'asin:1': 'asin.basic.divided_value',
  'acos:0': 'acos.basic.scaled',
  'acos:1': 'acos.basic.divided_value',
  'atan:0': 'atan.basic.scaled',
  'atan:1': 'atan.basic.divided_value',
  'product:0': 'product.basic.power_function',
  'product:1': 'product.basic.function_pair',
  'quotient:0': 'quotient.basic.polynomial_linear',
  'quotient:1': 'quotient.basic.reciprocal_power',
  'chain:0': 'chain.basic.power_linear',
  'chain:1': 'chain.basic.function_linear',
  'nested:0': 'nested.basic.function_quadratic',
  'nested:1': 'nested.basic.function_pair',
  'mixed:0': 'mixed.basic.product_chain',
  'mixed:1': 'mixed.basic.quotient_chain',
  'implicit:0': 'implicit.basic.ellipse',
  'implicit:1': 'implicit.basic.hyperbola',
  'inverse:0': 'inverse.basic.linear',
  'inverse:1': 'inverse.basic.cubic',
  'higher:0': 'higher.basic.second_polynomial',
  'higher:1': 'higher.basic.third_power',
  'parametric:0': 'parametric.basic.linear_slope',
  'parametric:1': 'parametric.basic.power_second',
  'vector:0': 'vector.basic.power_function',
  'vector:1': 'vector.basic.polynomial_exponential',
  'polar:0': 'polar.basic.sine_radius',
  'polar:1': 'polar.basic.cosine_radius',
};

const STEP_10_EXCLUSION_REASON =
  'Step 10 replaced this v1.1.0 recipe with a new basic/mix curriculum; it is frozen history, not a byte-identical current template.';
const EXCLUDED_WITH_REASON = Object.fromEntries(
  Object.keys(CURRENT_KEY_BY_LEGACY_ID).map((legacyId) => [legacyId, STEP_10_EXCLUSION_REASON]),
);
const BYTE_IDENTICAL_LEGACY_IDS = new Set<string>();

function contentFields(value: Record<string, unknown>) {
  return Object.fromEntries(
    ['source', 'answers', 'prompt', 'title', 'labels', 'domain', 'domainText', 'steps', 'hints', 'hintMath']
      .filter((field) => field in value)
      .map((field) => [field, value[field]]),
  );
}

describe('frozen v1.1.0 generator history', () => {
  it('keeps the fixture loadable at its original coverage and size', () => {
    expect(golden).toHaveLength(SKILLS.length * 2 * 20);
    expect(statSync(fixtureUrl).size).toBeGreaterThan(500_000);
  });

  it('maps each historical family:index to an existing current key', () => {
    expect(Object.keys(CURRENT_KEY_BY_LEGACY_ID)).toHaveLength(SKILLS.length * 2);
    for (const [legacyId, key] of Object.entries(CURRENT_KEY_BY_LEGACY_ID)) {
      const [family] = legacyId.split(':');
      expect(TEMPLATES[family]?.some((template) => template.key === key), legacyId).toBe(true);
    }
  });

  it('compares only byte-identical template content', () => {
    for (const entry of golden) {
      const legacyId = `${entry.family}:${entry.template}`;
      if (!BYTE_IDENTICAL_LEGACY_IDS.has(legacyId)) {
        expect(EXCLUDED_WITH_REASON[legacyId], legacyId).toBe(STEP_10_EXCLUSION_REASON);
        expect(CURRENT_KEY_BY_LEGACY_ID[legacyId], legacyId).toBeTruthy();
        continue;
      }
      const family = entry.family as string;
      const question = generateQuestion(family, entry.seed as string, {
        key: CURRENT_KEY_BY_LEGACY_ID[legacyId],
        ok: () => true,
      }) as unknown as Record<string, unknown>;
      expect(contentFields(question), legacyId).toEqual(contentFields(entry));
    }
    expect(BYTE_IDENTICAL_LEGACY_IDS.size).toBe(0);
  });
});
