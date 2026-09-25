import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  decodeProgress,
  makePortableProgress,
  type PortableProgress,
} from '../src/transfer';
import { validateLocalState } from '../src/storage';
import type { AppState } from '../src/progress';
import { generateQuestion } from '../src/questions';

// These fixtures freeze old formats and the current Phase 2 migration inputs
// (see scripts/capture-fixtures.ts). Keep every later migration able to read them.
const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

const rawSnapshot = JSON.parse(
  fixture('compact-full-snapshot.json'),
) as PortableProgress;

function qFields(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(qFields);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(key === 'q' && typeof child === 'string' ? [child] : []),
    ...qFields(child),
  ]);
}

function expectQ2Fingerprints(value: unknown) {
  expect(qFields(value).every((q) => /^q2:[a-f0-9]{8}$/.test(q))).toBe(true);
}

describe('frozen fixtures stay readable by the current code', () => {
  it('decodes the frozen DSP1 export and normalizes all evidence fingerprints', () => {
    const decoded = decodeProgress(fixture('dsp1.txt'));
    expect(decoded.unlockedLevel).toBe(rawSnapshot.unlockedLevel);
    expect(decoded.sequence).toBe(rawSnapshot.sequence);
    expect(Object.keys(decoded.skills).sort()).toEqual(
      Object.keys(rawSnapshot.skills).sort(),
    );
    for (const id of Object.keys(rawSnapshot.skills))
      expect(decoded.skills[id].card).toEqual(rawSnapshot.skills[id].card);
    expectQ2Fingerprints(decoded);
    expect(
      decoded.recentQuestionSignatures.every((q) =>
        /^q2:[a-f0-9]{8}$/.test(q),
      ),
    ).toBe(true);
  });

  it('decodes the frozen DSP2 (compact profile 1) export and keeps key fields', () => {
    const decoded = decodeProgress(fixture('dsp2-profile1.txt'));
    expect(decoded.unlockedLevel).toBe(rawSnapshot.unlockedLevel);
    expect(decoded.sequence).toBe(rawSnapshot.sequence);
    expect(decoded.streak).toBe(rawSnapshot.streak);
    expect(decoded.practiceDays).toEqual(rawSnapshot.practiceDays);
    expect(Object.keys(decoded.skills).sort()).toEqual(
      Object.keys(rawSnapshot.skills).sort(),
    );
    for (const id of Object.keys(rawSnapshot.skills))
      expect(decoded.skills[id].card).toEqual(rawSnapshot.skills[id].card);
    expectQ2Fingerprints(decoded);
  });

  it('decodes the frozen DSP2 profile 2 export', () => {
    const code = fixture('dsp2-profile2.txt').trim();
    expect(code).toHaveLength(1540);
    const decoded = decodeProgress(code);
    expect(decoded).toEqual(
      makePortableProgress(rawSnapshot, rawSnapshot.exportedAt),
    );
    expectQ2Fingerprints(decoded);
  });

  it('validates the frozen formatVersion-1 local state', () => {
    const state = JSON.parse(fixture('local-state-v1.json')) as AppState;
    const result = validateLocalState(state);
    expect(result.migrated).toBe(true);
    expect(result.from).toBe(1);
    expectQ2Fingerprints(result.state.progress);
  });

  it('validates the frozen q2 local state and graph question', () => {
    const state = JSON.parse(
      fixture('local-state-v1-q2.json'),
    ) as AppState;
    const result = validateLocalState(state);
    expect(result.from).toBe(1);
    expect(result.migrated).toBe(false);
    expect(result.state).toEqual(state);
    expectQ2Fingerprints(state.progress);
    expect(state.session?.current?.question).toEqual(
      generateQuestion('implicit', 'fixture', 0),
    );
    expect(state.session?.current?.question.domain.curve?.type).toBe('graph');
  });

  it('loads the frozen golden generator output at its full size', () => {
    const golden = JSON.parse(fixture('generator-1.1.0.json')) as unknown[];
    // Full coverage: every skill x both templates x 20 seeds. The golden
    // comparison itself is added once templates carry more than two slots.
    expect(golden).toHaveLength(26 * 2 * 20);
  });
});
