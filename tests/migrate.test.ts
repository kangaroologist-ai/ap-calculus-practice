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
import { questionFingerprint } from '../src/question-identity';
import type { AppState } from '../src/progress';

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const rawSnapshot = JSON.parse(
  fixture('compact-full-snapshot.json'),
) as PortableProgress;

describe('versioned progress migration', () => {
  it('keeps all four frozen progress fixtures readable', () => {
    const dsp1 = decodeProgress(fixture('dsp1.txt'));
    expect(dsp1.unlockedLevel).toBe(rawSnapshot.unlockedLevel);
    expect(dsp1.sequence).toBe(rawSnapshot.sequence);
    expect(Object.keys(dsp1.skills).sort()).toEqual(
      Object.keys(rawSnapshot.skills).sort(),
    );
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
    expect(migrateProgress(rawSnapshot).progress).toEqual(dsp1);
    expect(
      Object.values(dsp1.skills).every((s) =>
        s.recent.every((e) => /^q2:[a-f0-9]{8}$/.test(e.q)),
      ),
    ).toBe(true);

    const local = JSON.parse(fixture('local-state-v1.json')) as AppState;
    const result = validateLocalState(local);
    expect(result.migrated).toBe(true);
    expect(
      Object.values(result.state.progress.skills).every((s) =>
        s.recent.every((e) => /^q2:[a-f0-9]{8}$/.test(e.q)),
      ),
    ).toBe(true);
    expect(result.from).toBe(1);
  });

  it('deduplicates colliding fingerprints by keeping each last occurrence in order', () => {
    const input = structuredClone(rawSnapshot);
    const first = `q1:12345678${'a'.repeat(24)}`;
    const last = `q1:12345678${'b'.repeat(24)}`;
    const middle = 'different-signature';
    input.skills.power.recent = [
      { q: first, template: 0, correct: false },
      { q: middle, template: 1, correct: true },
      { q: last, template: 0, correct: true },
    ];
    input.recentQuestionSignatures = [first, middle, last];

    const { progress } = migrateProgress(input);
    expect(progress.skills.power.recent).toEqual([
      {
        q: questionFingerprint(middle),
        template: 1,
        correct: true,
      },
      { q: 'q2:12345678', template: 0, correct: true },
    ]);
    expect(progress.recentQuestionSignatures).toEqual([
      questionFingerprint(middle),
      'q2:12345678',
    ]);
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

  it('rejects raw signatures and q1 fingerprints in current evidence', () => {
    const current = migrateProgress(rawSnapshot).progress;
    const rawSignature = structuredClone(current);
    rawSignature.recentQuestionSignatures = ['raw-expression-signature'];
    expect(() => validateCurrent(rawSignature)).toThrow(/practice queue/i);

    const q1Evidence = structuredClone(current);
    q1Evidence.skills.power.recent[0].q =
      'q1:12345678aaaaaaaaaaaaaaaaaaaaaaaa';
    expect(() => validateCurrent(q1Evidence)).toThrow(/skill evidence/i);
  });
});
