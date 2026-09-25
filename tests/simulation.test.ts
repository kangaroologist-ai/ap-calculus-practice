import { describe, expect, it } from 'vitest';
import { allEnabledReady, basicPassed, type Progress } from '../src/progress';
import type { Question } from '../src/types';
import { SKILLS } from '../src/catalog';
import { random } from '../src/math';
import type { Config } from '../src/types';
import { simulate } from './helpers/simulate';

const baseConfig = (disabledFamilies: string[] = []): Config => ({
  schemaVersion: 1,
  revision: 'sim-revision',
  initialUnlockedLevel: 1,
  disabledFamilies,
  sessionLength: 12,
});

// A deterministic pseudo-random disabled-skill subset, never the full roster
// (an empty enabled set has nothing to converge toward).
function disabledSubset(seed: string): string[] {
  const r = random(seed);
  const ids = SKILLS.filter(() => r() < 0.4).map((s) => s.id);
  if (ids.length >= SKILLS.length) ids.pop();
  return ids;
}

const SEEDS = Array.from({ length: 20 }, (_, i) => `sim-subset-${i}`);

describe('scheduler convergence (SPEC-C7-style, Phase 1 scheduler)', () => {
  it('reaches Ready on every skill and unlockedLevel 6 from fresh progress when every answer is correct', () => {
    const c = baseConfig();
    const { p, questions } = simulate(c, () => true);
    expect(allEnabledReady(p, c)).toBe(true);
    expect(p.unlockedLevel).toBe(6);
    expect(questions).toBeLessThan(3000);
  });

  it.each(SEEDS)('converges to Ready + unlockedLevel 6 under a random disabled subset (%s)', (seed) => {
    const disabledFamilies = disabledSubset(seed);
    expect(disabledFamilies.length).toBeLessThan(SKILLS.length);
    const c = baseConfig(disabledFamilies);
    const { p, questions } = simulate(c, () => true);
    expect(allEnabledReady(p, c)).toBe(true);
    expect(p.unlockedLevel).toBe(6);
    expect(questions).toBeLessThan(3000);
  });

  it('never lets unlockedLevel decrease over the course of a run, across all seeded subsets', () => {
    for (const seed of ['all-enabled', ...SEEDS]) {
      const c = baseConfig(seed === 'all-enabled' ? [] : disabledSubset(seed));
      let maxSeen = -Infinity;
      const drops: string[] = [];
      simulate(c, () => true, 3000, {
        onQuestion: (_q, _reason, progressBefore: Progress) => {
          if (progressBefore.unlockedLevel < maxSeen) {
            drops.push(`${seed}: dropped from ${maxSeen} to ${progressBefore.unlockedLevel}`);
          }
          maxSeen = Math.max(maxSeen, progressBefore.unlockedLevel);
        },
      });
      expect(drops).toEqual([]);
    }
  });

  // SPEC-C7: each skill's first mixed question is answered wrong; the student
  // must still converge, levels never drop, a mixed question only appears once
  // its own basic line and every skill it combines have passed.
  it.each(['all-enabled', ...SEEDS])('converges when every first mixed question fails (%s)', (seed) => {
    const c = baseConfig(seed === 'all-enabled' ? [] : disabledSubset(seed));
    const failed = new Set<string>();
    const isRight = (q: Question) => {
      if (q.role !== 'mix' || failed.has(q.primarySkill)) return true;
      failed.add(q.primarySkill);
      return false;
    };
    let level = 0;
    const violations: string[] = [];
    const { p } = simulate(c, isRight, 3000, {
      onQuestion: (q, _reason, before: Progress) => {
        if (before.unlockedLevel < level) violations.push(`level dropped at ${q.id}`);
        level = before.unlockedLevel;
        if (q.role !== 'mix') return;
        if (!before.skills[q.primarySkill]?.basic.passed)
          violations.push(`mix before basic: ${q.templateKey}`);
        for (const k of q.requiredSkills ?? [])
          if (!basicPassed(before, c, k)) violations.push(`${q.templateKey} combines unpassed ${k}`);
      },
    });
    expect(violations).toEqual([]);
    expect(allEnabledReady(p, c)).toBe(true);
    expect(p.unlockedLevel).toBe(6);
  });
});
