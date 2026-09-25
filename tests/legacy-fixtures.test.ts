import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodeProgress, type PortableProgress } from '../src/transfer';
import { validateLocalState } from '../src/storage';
import type { AppState } from '../src/progress';

// These fixtures are frozen samples of formats produced by past code (see
// scripts/capture-fixtures.ts). This baseline must keep passing forever: it
// is how every later migration step proves it can still read old data.
const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

const rawSnapshot = JSON.parse(
  fixture('compact-full-snapshot.json'),
) as PortableProgress;

describe('legacy fixtures stay readable by the current code', () => {
  it('decodes the frozen DSP1 export without changing any field', () => {
    const decoded = decodeProgress(fixture('dsp1.txt'));
    expect(decoded).toEqual(rawSnapshot);
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
  });

  it('validates the frozen formatVersion-1 local state', () => {
    const state = JSON.parse(fixture('local-state-v1.json')) as AppState;
    expect(validateLocalState(state)).toEqual(state);
  });

  it('loads the frozen golden generator output at its full size', () => {
    const golden = JSON.parse(fixture('generator-1.1.0.json')) as unknown[];
    // Full coverage: every skill x both templates x 20 seeds. The golden
    // comparison itself is added once templates carry more than two slots.
    expect(golden).toHaveLength(26 * 2 * 20);
  });
});
