import { describe, expect, it } from 'vitest';
import { SKILLS } from '../src/catalog';
import { TEMPLATES } from '../src/templates';

describe('template registry keys', () => {
  it('covers every catalog skill with at least one template', () => {
    for (const skill of SKILLS) expect(TEMPLATES[skill.id]?.length).toBeGreaterThan(0);
  });

  it('prefixes every template key with its own skill id, so keys never collide across skills', () => {
    for (const skill of SKILLS)
      for (const template of TEMPLATES[skill.id])
        expect(template.key.startsWith(`${skill.id}.`)).toBe(true);
  });

  it('never reuses a template key, across skills or within one', () => {
    const keys = SKILLS.flatMap((skill) => TEMPLATES[skill.id].map((template) => template.key));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
