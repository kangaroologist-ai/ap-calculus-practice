import { describe, expect, it } from 'vitest';
import { generateQuestion } from '../src/questions';
import { open, TEMPLATES, type Template } from '../src/templates';

describe('template roles and open pools', () => {
  const t: Template = {
    key: 'x.test',
    role: 'mix',
    requires: ['sum'],
    pools: { h: ['sin', 'cos'] },
    build: () => ({ e: 'x' }),
  };

  it('opens only when every requirement and one member of each pool is allowed', () => {
    expect(open(t, () => true)).toBe(true);
    expect(open(t, (id) => id !== 'sum')).toBe(false);
    expect(open(t, (id) => id === 'sum' || id === 'cos')).toBe(true);
    expect(open(t, (id) => id === 'sum')).toBe(false);
  });

  it('keeps numeric template overrides and empty options unchanged', () => {
    const plain = generateQuestion('power', 'options-seed');
    expect(generateQuestion('power', 'options-seed', {})).toEqual(plain);
    expect(generateQuestion('power', 'options-seed', 1).template).toBe(1);
  });

  it('filters by role and key and records them on the question', () => {
    for (const template of TEMPLATES.power) {
      const q = generateQuestion('power', 'options-key', { key: template.key });
      expect(q.templateKey).toBe(template.key);
      expect(q.role).toBe(template.role);
    }
    expect(() => generateQuestion('power', 's', { key: 'power.none' })).toThrow(/No open/);
  });
});
