import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LATEST_FORMAT, migrateProgress } from '../src/migrate';
import { decodeProgress } from '../src/transfer';
import { validateLocalState } from '../src/storage';
import type { AppState } from '../src/progress';

// These fixtures freeze old formats and the migration inputs. Keep every later
// migration able to read them; tests never rewrite them.
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

function expectCurrent(value: unknown) {
  const progress = value as {
    formatVersion: number;
    curriculumVersion: string;
    pendingDiagnostics: unknown[];
    skills: Record<string, any>;
  };
  expect(progress.formatVersion).toBe(LATEST_FORMAT);
  expect(progress.curriculumVersion).toBe('ap-derivatives-3');
  expect(progress.pendingDiagnostics).toEqual([]);
  expect(Object.values(progress.skills).every((skill) => !('recent' in skill))).toBe(true);
  for (const skill of Object.values(progress.skills)) {
    expect(typeof skill.mastery).toBe('number');
    expect(Number.isInteger(skill.observations)).toBe(true);
  }
  const fingerprints = questionFingerprints(value);
  expect(fingerprints.length).toBeGreaterThan(0);
  expect(fingerprints.every((q) => /^q2:[a-f0-9]{8}$/.test(q))).toBe(true);
}

describe('frozen fixtures stay readable by the current code', () => {
  it('migrates the full v1 snapshot and frozen DSP1 / DSP2 profiles 1, 2 and 3', () => {
    const migratedSnapshot = migrateProgress(rawSnapshot).progress;
    const dsp1 = decodeProgress(fixture('dsp1.txt'));
    const profile1 = decodeProgress(fixture('dsp2-profile1.txt'));
    const profile2 = decodeProgress(fixture('dsp2-profile2.txt'));
    const profile3 = decodeProgress(fixture('dsp2-profile3.txt'));

    [migratedSnapshot, dsp1, profile1, profile2, profile3].forEach(expectCurrent);
    expect(dsp1).toEqual({ ...migratedSnapshot, exportedAt: rawSnapshot.exportedAt });
    expect(profile3).toEqual({ ...migratedSnapshot, exportedAt: rawSnapshot.exportedAt });
    expect(dsp1.unlockedLevel).toBe(rawSnapshot.unlockedLevel);
    expect(dsp1.sequence).toBe(rawSnapshot.sequence);
    expect(Object.keys(dsp1.skills).sort()).toEqual(Object.keys(rawSnapshot.skills).sort());
    for (const id of Object.keys(rawSnapshot.skills))
      expect(dsp1.skills[id].card).toEqual(rawSnapshot.skills[id].card);
    // Every frozen skill is Basic passed but not Ready, so it seeds at 0.82.
    for (const progress of [migratedSnapshot, dsp1, profile1, profile2, profile3])
      expect(Object.values(progress.skills).every((skill: any) => skill.mastery === 0.82)).toBe(true);
    expect(fixture('dsp2-profile2.txt').trim()).toHaveLength(1540);
    expect(fixture('dsp2-profile3.txt').trim()).toHaveLength(1200);
  });

  it('migrates both frozen v1 local states and the frozen v2 local state, dropping v1 sessions', () => {
    const local = JSON.parse(fixture('local-state-v1.json')) as AppState;
    const q2Local = JSON.parse(fixture('local-state-v1-q2.json')) as AppState;
    const v2Local = JSON.parse(fixture('local-state-v2.json')) as AppState;
    const result = validateLocalState(local);
    const q2Result = validateLocalState(q2Local);
    const v2Result = validateLocalState(v2Local);

    expect(result.migrated).toBe(true);
    expect(result.from).toBe(1);
    expect(result.state.session).toBeUndefined();
    expectCurrent(result.state.progress);
    expect(q2Result.migrated).toBe(true);
    expect(q2Result.from).toBe(1);
    expect(q2Result.state.session).toBeUndefined();
    expectCurrent(q2Result.state.progress);
    expect(v2Result.migrated).toBe(true);
    expect(v2Result.from).toBe(2);
    expect(v2Result.state.session).toBeUndefined();
    expectCurrent(v2Result.state.progress);

    for (const progress of [result.state.progress, q2Result.state.progress])
      expect(Object.values(progress.skills).every((skill) => skill.mastery === 0.82)).toBe(true);
    expect(v2Result.state.progress.skills.constant.mastery).toBe(0.82);
    expect(v2Result.state.progress.skills.power.mastery).toBe(0.92);
    expect(v2Result.state.progress.skills.sum.mastery).toBe(0.55);

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
