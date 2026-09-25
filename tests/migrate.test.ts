import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  LATEST_FORMAT,
  migrateProgress,
  NewerProgressError,
  validateCurrent,
} from '../src/migrate';
import { validateLocalState } from '../src/storage';
import { decodeProgress, type PortableProgress } from '../src/transfer';
import type { AppState } from '../src/progress';

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const rawSnapshot = JSON.parse(
  fixture('compact-full-snapshot.json'),
) as PortableProgress;

describe('versioned progress migration', () => {
  it('keeps all four frozen progress fixtures readable', () => {
    expect(decodeProgress(fixture('dsp1.txt'))).toEqual(rawSnapshot);
    const compact = decodeProgress(fixture('dsp2-profile1.txt'));
    expect(compact.formatVersion).toBe(rawSnapshot.formatVersion);
    expect(compact.sequence).toBe(rawSnapshot.sequence);
    expect(compact.unlockedLevel).toBe(rawSnapshot.unlockedLevel);
    expect(compact.practiceDays).toEqual(rawSnapshot.practiceDays);
    expect(Object.keys(compact.skills).sort()).toEqual(
      Object.keys(rawSnapshot.skills).sort(),
    );
    for (const id of Object.keys(rawSnapshot.skills))
      expect(compact.skills[id].card).toEqual(rawSnapshot.skills[id].card);
    expect(migrateProgress(rawSnapshot).progress).toEqual(rawSnapshot);

    const local = JSON.parse(fixture('local-state-v1.json')) as AppState;
    const result = validateLocalState(local);
    expect(result.state).toEqual(local);
    expect(result.from).toBe(1);
    expect(result.migrated).toBe(false);
  });

  it('reports data from a newer format with an update instruction', () => {
    const newer = { ...rawSnapshot, formatVersion: LATEST_FORMAT + 1 };
    expect(() => migrateProgress(newer)).toThrow(NewerProgressError);
    expect(() => migrateProgress(newer)).toThrow(/reload the page to update/i);
  });

  it.each([
    [
      'curriculum',
      (p: PortableProgress) => ({ ...p, curriculumVersion: 'future' }),
    ],
    [
      'scheduler',
      (p: PortableProgress) => ({ ...p, schedulerPackageVersion: '6.0.0' }),
    ],
    [
      'algorithm',
      (p: PortableProgress) => ({ ...p, fsrsAlgorithmVersion: 'future' }),
    ],
    [
      'parameters',
      (p: PortableProgress) => ({
        ...p,
        fsrsParameters: { ...p.fsrsParameters, maximum_interval: 181 },
      }),
    ],
  ])('rejects an unknown %s identity', (_name, mutate) => {
    expect(() => migrateProgress(mutate(rawSnapshot))).toThrow();
  });

  it('does not mutate the input while migrating', () => {
    const input = structuredClone(rawSnapshot);
    const before = structuredClone(input);
    migrateProgress(input);
    expect(input).toEqual(before);
  });

  it('rejects current-format data with a stale identity', () => {
    expect(() =>
      validateCurrent({ ...rawSnapshot, curriculumVersion: 'old-curriculum' }),
    ).toThrow(/not supported/i);
  });
});
