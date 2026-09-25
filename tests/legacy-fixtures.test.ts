import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { migrateProgress } from '../src/migrate';
import { decodeProgress } from '../src/transfer';
import { validateLocalState } from '../src/storage';
import type { AppState } from '../src/progress';

// These fixtures freeze old formats and the current Phase 2 migration inputs.
// Keep every later migration able to read them; tests never rewrite them.
const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const rawSnapshot = JSON.parse(
  fixture('compact-full-snapshot.json'),
) as Record<string, any>;

function questionFingerprints(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(questionFingerprints);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(key === 'lastQ' && typeof child === 'string' ? [child] : []),
    ...questionFingerprints(child),
  ]);
}

function expectV2(value: unknown) {
  const progress = value as { formatVersion: number; skills: Record<string, unknown> };
  expect(progress.formatVersion).toBe(2);
  expect(Object.values(progress.skills).every((skill) => !('recent' in (skill as object)))).toBe(true);
  const fingerprints = questionFingerprints(value);
  expect(fingerprints.length).toBeGreaterThan(0);
  expect(fingerprints.every((q) => /^q2:[a-f0-9]{8}$/.test(q))).toBe(true);
}

describe('frozen fixtures stay readable by the current code', () => {
  it('migrates the full v1 snapshot and frozen DSP1 / DSP2 profiles 1 and 2', () => {
    const migratedSnapshot = migrateProgress(rawSnapshot).progress;
    const dsp1 = decodeProgress(fixture('dsp1.txt'));
    const profile1 = decodeProgress(fixture('dsp2-profile1.txt'));
    const profile2 = decodeProgress(fixture('dsp2-profile2.txt'));

    [migratedSnapshot, dsp1, profile1, profile2].forEach(expectV2);
    expect(dsp1).toEqual({ ...migratedSnapshot, exportedAt: rawSnapshot.exportedAt });
    expect(dsp1.unlockedLevel).toBe(rawSnapshot.unlockedLevel);
    expect(dsp1.sequence).toBe(rawSnapshot.sequence);
    expect(Object.keys(dsp1.skills).sort()).toEqual(Object.keys(rawSnapshot.skills).sort());
    for (const id of Object.keys(rawSnapshot.skills))
      expect(dsp1.skills[id].card).toEqual(rawSnapshot.skills[id].card);
    expect(fixture('dsp2-profile2.txt').trim()).toHaveLength(1540);
  });

  it('migrates both frozen v1 local states, drops their saved sessions, and retains question-only evidence', () => {
    const local = JSON.parse(fixture('local-state-v1.json')) as AppState;
    const q2Local = JSON.parse(fixture('local-state-v1-q2.json')) as AppState;
    const result = validateLocalState(local);
    const q2Result = validateLocalState(q2Local);

    expect(result.migrated).toBe(true);
    expect(result.from).toBe(1);
    expect(result.state.session).toBeUndefined();
    expectV2(result.state.progress);
    expect(q2Result.migrated).toBe(true);
    expect(q2Result.from).toBe(1);
    expect(q2Result.state.session).toBeUndefined();
    expectV2(q2Result.state.progress);

    // The fixture's saved question is frozen data, even though v1 sessions are
    // intentionally discarded when the progress is migrated.
    expect(q2Local.session?.current?.question.templateKey).toBe('implicit.ellipse');
    expect(q2Local.session?.current?.question.domain.curve?.type).toBe('graph');
  });

  it('loads the frozen golden generator output at its full size', () => {
    const golden = JSON.parse(fixture('generator-1.1.0.json')) as unknown[];
    expect(golden).toHaveLength(26 * 2 * 20);
  });
});
