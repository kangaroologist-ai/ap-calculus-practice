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
const EXCLUDED_FIELDS = new Set<string>([]);

// Template keys a later step is allowed to change the generated content for
// (e.g. once a template is rewritten for SPEC-G1/G4 variety) go here, keyed
// by the fixture's `family:template` pair, so the exclusion is auditable.
const EXCLUDED_TEMPLATE_KEYS = new Set<string>([]);

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
