import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  LATEST_FORMAT,
  migrateProgress,
  NewerProgressError,
  validateCurrent,
} from '../src/migrate';
import { validateLocalState } from '../src/storage';
import { decodeProgress } from '../src/transfer';
import { questionFingerprint } from '../src/question-identity';
import type { AppState } from '../src/progress';

type LegacyProgress = Record<string, any>;

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const rawSnapshot = JSON.parse(
  fixture('compact-full-snapshot.json'),
) as LegacyProgress;

function legacyWithPower(recent: LegacyProgress['skills']['power']['recent'], needsRemediation = false, unlockedLevel = 1) {
  const input = structuredClone(rawSnapshot);
  input.unlockedLevel = unlockedLevel;
  input.skills.power.recent = recent;
  input.skills.power.needsRemediation = needsRemediation;
  return input;
}

function expectCurrentV2(value: { formatVersion: number }) {
  expect(value.formatVersion).toBe(LATEST_FORMAT);
}

describe('versioned progress migration', () => {
  it('migrates all frozen v1 progress inputs to format 2', () => {
    const compact = migrateProgress(rawSnapshot).progress;
    const dsp1 = decodeProgress(fixture('dsp1.txt'));
    const profile1 = decodeProgress(fixture('dsp2-profile1.txt'));
    const profile2 = decodeProgress(fixture('dsp2-profile2.txt'));
    const local = validateLocalState(
      JSON.parse(fixture('local-state-v1.json')) as AppState,
    );
    const localQ2 = validateLocalState(
      JSON.parse(fixture('local-state-v1-q2.json')) as AppState,
    );

    [compact, dsp1, profile1, profile2, local.state.progress, localQ2.state.progress].forEach(expectCurrentV2);
    expect(dsp1).toEqual({ ...compact, exportedAt: rawSnapshot.exportedAt });
    expect(profile1.formatVersion).toBe(2);
    expect(profile2.formatVersion).toBe(2);
    expect(local.from).toBe(1);
    expect(localQ2.from).toBe(1);
    expect(local.state.session).toBeUndefined();
    expect(localQ2.state.session).toBeUndefined();
  });

  it('maps a v1 Ready skill to a legacy-passed basic line and a fresh mixed line', () => {
    const recent = [
      { q: 'q2:00000001', template: 0, correct: true },
      { q: 'q2:00000002', template: 1, correct: true },
    ];
    const input = legacyWithPower(recent);
    const beforeCard = structuredClone(input.skills.power.card);
    const migrated = migrateProgress(input).progress.skills.power;

    expect(migrated.basic).toEqual({
      streak: 2,
      lastQ: 'q2:00000002',
      passed: true,
      repair: false,
      legacy: true,
    });
    expect(migrated.mix).toEqual({ streak: 0, passed: false, repair: false });
    expect(migrated.card).toEqual(beforeCard);
    expect(migrated).not.toHaveProperty('recent');
  });

  it('preserves basic access if a skill was Ready earlier in its evidence window', () => {
    const input = legacyWithPower([
      { q: 'q2:00000011', template: 0, correct: true },
      { q: 'q2:00000012', template: 1, correct: true },
      { q: 'q2:00000013', template: 0, correct: false },
    ]);
    const migrated = migrateProgress(input).progress.skills.power;

    expect(migrated.basic).toEqual({
      streak: 0,
      lastQ: 'q2:00000013',
      passed: true,
      repair: false,
    });
  });

  it('keeps a below-unlock v1 skill passed while it remains in remediation', () => {
    const input = legacyWithPower(
      [
        { q: 'q2:00000021', template: 0, correct: true },
        { q: 'q2:00000022', template: 1, correct: false },
      ],
      true,
      3,
    );
    const migrated = migrateProgress(input).progress;

    expect(migrated.unlockedLevel).toBe(3);
    expect(migrated.skills.power.basic).toEqual({
      streak: 0,
      lastQ: 'q2:00000022',
      passed: true,
      repair: true,
    });
    expect(migrated.skills.power.mix).toEqual({ streak: 0, passed: false, repair: false });
  });

  it('preserves every FSRS card field and monotonic progress counters', () => {
    const migrated = migrateProgress(rawSnapshot).progress;
    expect(migrated.unlockedLevel).toBe(rawSnapshot.unlockedLevel);
    expect(migrated.sequence).toBe(rawSnapshot.sequence);
    expect(migrated.streak).toBe(rawSnapshot.streak);
    expect(migrated.practiceDays).toEqual(rawSnapshot.practiceDays);
    expect(migrated.pendingDiagnostics).toEqual(rawSnapshot.pendingDiagnostics);
    for (const id of Object.keys(rawSnapshot.skills))
      expect(migrated.skills[id].card).toEqual(rawSnapshot.skills[id].card);
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
    expect(progress.skills.power.basic.lastQ).toBe('q2:12345678');
    expect(progress.recentQuestionSignatures).toEqual([
      questionFingerprint(middle),
      'q2:12345678',
    ]);
  });

  it('reports data from a newer format with an update instruction', () => {
    const newer = { ...migrateProgress(rawSnapshot).progress, formatVersion: LATEST_FORMAT + 1 };
    expect(() => migrateProgress(newer)).toThrow(NewerProgressError);
    expect(() => migrateProgress(newer)).toThrow(/reload the page to update/i);
  });

  it.each([
    ['curriculum', (p: LegacyProgress) => ({ ...p, curriculumVersion: 'future' })],
    ['scheduler', (p: LegacyProgress) => ({ ...p, schedulerPackageVersion: '6.0.0' })],
    ['algorithm', (p: LegacyProgress) => ({ ...p, fsrsAlgorithmVersion: 'future' })],
    ['parameters', (p: LegacyProgress) => ({ ...p, fsrsParameters: { ...p.fsrsParameters, maximum_interval: 181 } })],
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
    const current = migrateProgress(rawSnapshot).progress;
    expect(() => validateCurrent({ ...current, curriculumVersion: 'old-curriculum' })).toThrow(/not supported/i);
  });

  it.each([
    ['negative streak', (p: ReturnType<typeof migrateProgress>['progress']) => { p.skills.power.basic.streak = -1; }],
    ['streak above two', (p: ReturnType<typeof migrateProgress>['progress']) => { p.skills.power.basic.streak = 3; }],
    ['two successes without passed', (p: ReturnType<typeof migrateProgress>['progress']) => { p.skills.power.basic.streak = 2; p.skills.power.basic.passed = false; p.skills.power.basic.repair = false; }],
    ['mixed passed without basic passed', (p: ReturnType<typeof migrateProgress>['progress']) => { p.skills.power.mix.passed = true; p.skills.power.basic.passed = false; }],
    ['non-q2 line fingerprint', (p: ReturnType<typeof migrateProgress>['progress']) => { p.skills.power.basic.lastQ = 'raw-signature'; }],
    ['v1 evidence field', (p: ReturnType<typeof migrateProgress>['progress']) => { (p.skills.power as unknown as Record<string, unknown>).recent = []; }],
    ['v1 remediation field', (p: ReturnType<typeof migrateProgress>['progress']) => { (p.skills.power as unknown as Record<string, unknown>).needsRemediation = false; }],
    ['v1 failure timestamp field', (p: ReturnType<typeof migrateProgress>['progress']) => { (p.skills.power as unknown as Record<string, unknown>).lastFailureAt = 0; }],
  ])('rejects malformed v2 line and legacy data: %s', (_name, mutate) => {
    const current = migrateProgress(rawSnapshot).progress;
    mutate(current);
    expect(() => validateCurrent(current)).toThrow();
  });

  it('rejects raw signatures and q1 fingerprints in current queues', () => {
    const current = migrateProgress(rawSnapshot).progress;
    current.recentQuestionSignatures = ['raw-expression-signature'];
    expect(() => validateCurrent(current)).toThrow(/practice queue/i);

    const q1Evidence = migrateProgress(rawSnapshot).progress;
    q1Evidence.skills.power.basic.lastQ = 'q1:12345678aaaaaaaaaaaaaaaaaaaaaaaa';
    expect(() => validateCurrent(q1Evidence)).toThrow(/skill evidence/i);
  });
});
