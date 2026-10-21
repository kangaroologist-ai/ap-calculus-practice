import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SKILLS, skillById, validateConfig } from '../src/catalog';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Expr } from '../src/types';
import { simulate } from './helpers/simulate';

// SPEC S8: the path the owner accepted in R8/R9. The order inside a level is
// the catalog order and the order students meet new skills.
const EXPECTED_PATH: [string, number][] = [
  ['constant', 1],
  ['power', 1],
  ['sum', 1],
  ['root', 1],
  ['exp', 2],
  ['log', 2],
  ['sin', 2],
  ['cos', 2],
  ['product', 3],
  ['quotient', 3],
  ['tan', 3],
  ['cot', 3],
  ['sec', 3],
  ['csc', 3],
  ['combine', 3],
  ['chain', 4],
  ['mixed', 4],
  ['implicit', 5],
  ['inverse', 5],
  ['asin', 5],
  ['acos', 5],
  ['atan', 5],
  ['higher', 5],
  ['nested', 5],
  ['abstract', 5],
  ['parametric', 6],
  ['vector', 6],
  ['polar', 6],
];

const EXPECTED_PREREQUISITES: Record<string, string[]> = {
  constant: [],
  power: [],
  sum: ['power', 'constant'],
  root: ['power'],
  exp: ['power'],
  log: ['power'],
  sin: ['power'],
  cos: ['power'],
  product: ['sum', 'power', 'sin', 'cos', 'exp'],
  quotient: ['sum', 'power'],
  tan: ['quotient'],
  cot: ['quotient'],
  sec: ['quotient'],
  csc: ['quotient'],
  combine: ['product', 'quotient'],
  chain: ['power', 'sin', 'cos', 'exp'],
  mixed: ['product', 'chain'],
  implicit: ['chain', 'quotient'],
  inverse: ['power'],
  asin: ['inverse', 'root'],
  acos: ['inverse', 'root'],
  atan: ['inverse'],
  higher: ['product', 'chain'],
  nested: ['mixed', 'quotient'],
  abstract: ['chain', 'product'],
  parametric: ['quotient', 'higher'],
  vector: ['exp', 'sin', 'cos', 'tan', 'power'],
  polar: ['product', 'parametric'],
};

const ORDER = new Map(EXPECTED_PATH.map(([id], index) => [id, index]));
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
  'Sqrt',
]);

function expectNoCompositeArgument(node: Expr, key: string): void {
  if (!Array.isArray(node)) return;
  const [op, ...args] = node;
  if (FUNCTION_OPS.has(op)) expect(args[0], key).toBe('x');
  if (op === 'Fn') expect(args[2], key).toBe('x');
  for (const arg of args) expectNoCompositeArgument(arg, key);
}

type MixedRule = 'product' | 'quotient' | 'sum';

// T9 (S8) leaves Combinations II with exactly these four templates. The
// explicit list makes a re-added three-rule template fail even when its
// requiredSkills happen to contain `chain`.
const MIXED_RULES: Record<string, MixedRule> = {
  'mixed.basic.product_chain': 'product',
  'mixed.basic.power_times_composite': 'product',
  'mixed.mix.log_product': 'product',
  'mixed.mix.sum_with_composite': 'sum',
};

const FUNCTION_HEADS = new Set([
  'Fn',
  'Sin',
  'Cos',
  'Tan',
  'Cot',
  'Sec',
  'Csc',
  'Exp',
  'Ln',
  'Log',
  'Sqrt',
  'Arcsin',
  'Arccos',
  'Arctan',
]);

function hasVariable(node: Expr, variable: string): boolean {
  if (typeof node === 'string') return node === variable;
  if (!Array.isArray(node)) return false;
  return node.slice(1).some((part) => hasVariable(part, variable));
}

// Counts combination rules outside function arguments: inside an argument,
// sums and products belong to the chain-rule inner derivative, not to a
// second outer rule.
function mixedCombinationRules(
  node: Expr,
  variable: string,
  rules = new Set<MixedRule>(),
): Set<MixedRule> {
  if (!Array.isArray(node)) return rules;
  const [op, ...args] = node;
  if (FUNCTION_HEADS.has(op)) return rules;
  if (op === 'Divide' && hasVariable(args[1], variable)) rules.add('quotient');
  if (
    op === 'Multiply' &&
    args.filter((arg) => hasVariable(arg, variable)).length >= 2
  )
    rules.add('product');
  if (
    (op === 'Add' || op === 'Subtract') &&
    args.filter((arg) => hasVariable(arg, variable)).length >= 2
  )
    rules.add('sum');
  args.forEach((arg) => mixedCombinationRules(arg, variable, rules));
  return rules;
}

function hasCompositeFunction(node: Expr, variable: string): boolean {
  if (!Array.isArray(node)) return false;
  const [op, ...args] = node;
  if (op === 'Fn')
    return args[2] !== variable || hasCompositeFunction(args[2], variable);
  if (FUNCTION_HEADS.has(op))
    return args[0] !== variable || hasCompositeFunction(args[0], variable);
  return args.some((arg) => hasCompositeFunction(arg, variable));
}

const shippedConfig = validateConfig(
  JSON.parse(
    readFileSync(new URL('../public/practice-config.json', import.meta.url), 'utf8'),
  ),
);

describe('S8 learning path', () => {
  it('has the exact order and levels', () => {
    expect(SKILLS.map((skill) => [skill.id, skill.level])).toEqual(EXPECTED_PATH);
  });

  it('has the exact prerequisites', () => {
    expect(
      Object.fromEntries(SKILLS.map((skill) => [skill.id, skill.prerequisites])),
    ).toEqual(EXPECTED_PREREQUISITES);
  });

  it('puts every prerequisite earlier in the path', () => {
    for (const skill of SKILLS)
      for (const id of skill.prerequisites)
        expect(ORDER.get(id), `${skill.id} depends on ${id}`).toBeLessThan(
          ORDER.get(skill.id)!,
        );
  });

  it('keeps every combine template free of composite arguments', () => {
    for (const template of TEMPLATES.combine)
      for (let seed = 0; seed < 20; seed += 1) {
        const question = generateQuestion('combine', `combine:${template.key}:${seed}`, {
          key: template.key,
          ok: () => true,
        });
        for (const source of question.source)
          expectNoCompositeArgument(source, template.key);
      }
  });

  it('keeps every mixed template to a chain plus exactly one other rule', () => {
    expect(TEMPLATES.mixed.map((template) => template.key)).toEqual(
      Object.keys(MIXED_RULES),
    );
    for (const template of TEMPLATES.mixed) {
      const expected = MIXED_RULES[template.key];
      for (let seed = 0; seed < 20; seed += 1) {
        const question = generateQuestion('mixed', `mixed:${template.key}:${seed}`, {
          key: template.key,
          ok: () => true,
        });
        for (const source of question.source) {
          expect(
            [...mixedCombinationRules(source, question.domain.variable)].sort(),
            `${template.key} outer rules`,
          ).toEqual([expected]);
          expect(
            hasCompositeFunction(source, question.domain.variable),
            `${template.key} has a composite function`,
          ).toBe(true);
        }
      }
    }
  });

  it('opens every nested template only from skills taught earlier in the path', () => {
    for (const template of TEMPLATES.nested) {
      const components = [
        ...(template.requires ?? []),
        ...Object.values(template.pools ?? {}).flat(),
      ];
      for (const id of components)
        expect(ORDER.get(id), `${template.key} uses ${id}`).toBeLessThan(
          ORDER.get('nested')!,
        );
    }
  });

  it('turns level 6 off in the shipped config', () => {
    expect(shippedConfig.disabledFamilies).toEqual(['parametric', 'vector', 'polar']);
    expect(skillById('parametric').level).toBe(6);
  });

  it('reaches the first product and chain questions at the target questions', () => {
    let index = 0,
      firstProduct = -1,
      firstChain = -1;
    // The helper's default 20 s step puts the simulated 10-minute review wave
    // before the chain question, so the chain bound includes that FSRS timing.
    simulate(shippedConfig, () => true, 3000, {
      onQuestion: (question) => {
        index += 1;
        if (firstProduct < 0 && question.primarySkill === 'product')
          firstProduct = index;
        if (firstChain < 0 && question.primarySkill === 'chain')
          firstChain = index;
      },
    });
    console.log(
      `S8 always-correct student: first product question ${firstProduct}, ` +
        `first chain question ${firstChain}`,
    );
    expect(firstProduct).toBeGreaterThan(0);
    expect(firstChain).toBeGreaterThan(0);
    expect(firstProduct).toBeLessThanOrEqual(15);
    expect(firstChain).toBeLessThanOrEqual(50);
  });
});
