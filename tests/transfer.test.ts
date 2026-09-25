import { describe, expect, it } from 'vitest';
import { strToU8, zlibSync } from 'fflate';
import { freshProgress, stateFor } from '../src/progress';
import {
  QrCollector,
  checksum,
  decodeProgress,
  encodeProgress,
  makePortableProgress,
  splitIntoQrFrames,
} from '../src/transfer';
import type { Config } from '../src/types';

const NOW = Date.now();
const config: Config = {
  schemaVersion: 1,
  revision: 'transfer-test',
  initialUnlockedLevel: 1,
  disabledFamilies: [],
  sessionLength: 12,
};

function portable(now = NOW) {
  return makePortableProgress(freshProgress(config, now), now);
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function pseudoRandomText(length: number, seed: number): string {
  let state = seed >>> 0;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    state = Math.imul(state ^ (state >>> 13), 0x5bd1e995) >>> 0;
    state = (state + 0x6d2b79f5) >>> 0;
    out += alphabet[state % alphabet.length];
  }
  return out;
}

function largeCode(now = NOW): string {
  const p = portable(now);
  // Keep QR multipart coverage after fingerprints become fixed-size q2 values.
  const raw = { ...p, exportPadding: pseudoRandomText(4096, 1) };
  const body = base64Url(zlibSync(strToU8(JSON.stringify(raw))));
  return `DSP1.${checksum(body)}.${body}`;
}

function replaceFrameBody(frame: string, body: string): string {
  const match = /^DSQ1\.([a-f0-9]{8})\.(\d+)\.(\d+)\.([a-f0-9]{8})\.(.*)$/.exec(frame);
  if (!match) throw new Error('unexpected test frame');
  return `DSQ1.${match[1]}.${match[2]}.${match[3]}.${checksum(body)}.${body}`;
}

function frameBody(frame: string): string {
  const match = /^DSQ1\.[a-f0-9]{8}\.\d+\.\d+\.[a-f0-9]{8}\.(.*)$/.exec(frame);
  if (!match) throw new Error('unexpected test frame');
  return match[1];
}

describe('portable progress encoding and QR transfer', () => {
  it('round-trips a small self-contained progress code', () => {
    const snapshot = portable();
    const code = encodeProgress(snapshot);
    const decoded = decodeProgress(code);
    expect(decoded).toEqual(snapshot);
    expect(code).toMatch(/^DSP2\.[a-f0-9]{8}\.[A-Za-z0-9_-]+$/);
  });

  it('rejects a code with an altered checksum', () => {
    const code = encodeProgress(portable());
    const altered = `${code.slice(0, 5)}${code[5] === '0' ? '1' : '0'}${code.slice(6)}`;
    expect(() => decodeProgress(altered)).toThrow(/incomplete|damaged/i);
  });

  it('rejects unsupported prefixes and invalid alphabet characters', () => {
    expect(() => decodeProgress('BAD1.00000000.AAAA')).toThrow();
    expect(() => decodeProgress('DSP1.00000000.a+b')).toThrow();
  });

  it('rejects a code above the compressed input size limit', () => {
    const oversized = `DSP1.00000000.${'A'.repeat(131073)}`;
    expect(() => decodeProgress(oversized)).toThrow(/too large/i);
  });

  it('rejects a checksum-valid but non-zlib payload', () => {
    const body = base64Url(strToU8('not a zlib stream'));
    const code = `DSP1.${checksum(body)}.${body}`;
    expect(() => decodeProgress(code)).toThrow();
  });

  it('bounds decompressed transfer data before JSON parsing', () => {
    const compressed = base64Url(zlibSync(strToU8('x'.repeat(300_000))));
    const code = `DSP1.${checksum(compressed)}.${compressed}`;
    expect(code.length).toBeLessThan(131072);
    expect(() => decodeProgress(code)).toThrow(/expanded|too large/i);
  });

  it('creates multiple frames for a large but valid progress snapshot', () => {
    const code = largeCode();
    const frames = splitIntoQrFrames(code);
    expect(code.length).toBeGreaterThan(700);
    expect(frames.length).toBeGreaterThan(1);
    expect(frames.every((frame) => frame.startsWith('DSQ1.'))).toBe(true);
  });

  it('assembles frames in reverse order and accepts an identical duplicate', () => {
    const code = largeCode();
    const frames = splitIntoQrFrames(code);
    const collector = new QrCollector();
    const first = collector.add(frames[0]);
    expect(first.received).toBe(1);
    expect(collector.add(frames[0])).toEqual(first);
    let complete: string | undefined;
    for (const frame of frames.slice(1).reverse()) complete = collector.add(frame).code ?? complete;
    expect(complete).toBe(code);
  });

  it('does not finalize when a frame is missing', () => {
    const frames = splitIntoQrFrames(largeCode());
    const collector = new QrCollector();
    for (const frame of frames.slice(0, -1)) {
      const result = collector.add(frame);
      expect(result.code).toBeUndefined();
    }
    expect(collector.add(frames[0]).code).toBeUndefined();
  });

  it('rejects a conflicting duplicate frame with the same index', () => {
    const frame = splitIntoQrFrames(largeCode())[0];
    const body = frameBody(frame);
    const changedBody = body[0] === 'A' ? `B${body.slice(1)}` : `A${body.slice(1)}`;
    const conflicting = replaceFrameBody(frame, changedBody);
    const collector = new QrCollector();
    collector.add(frame);
    expect(() => collector.add(conflicting)).toThrow(/conflicting/i);
  });

  it('rejects a frame whose per-frame checksum does not match its body', () => {
    const frame = splitIntoQrFrames(largeCode())[0];
    const body = frameBody(frame);
    const corrupted = frame.replace(body, `${body[0] === 'A' ? 'B' : 'A'}${body.slice(1)}`);
    expect(() => new QrCollector().add(corrupted)).toThrow(/damaged/i);
  });

  it('rejects frames from a different transfer session', () => {
    const first = splitIntoQrFrames(largeCode(NOW))[0];
    const second = splitIntoQrFrames(largeCode(NOW + 1))[0];
    const collector = new QrCollector();
    collector.add(first);
    expect(() => collector.add(second)).toThrow(/different snapshots/i);
  });

  it.each([
    ['zero index', 'DSQ1.aaaaaaaa.0.1.00000000.A'],
    ['index above total', 'DSQ1.aaaaaaaa.2.1.00000000.A'],
    ['too many frames', 'DSQ1.aaaaaaaa.1.189.00000000.A'],
    ['wrong prefix', 'BAD1.aaaaaaaa.1.1.00000000.A'],
  ])('rejects malformed QR metadata: %s', (_name, frame) => {
    expect(() => new QrCollector().add(frame)).toThrow();
  });

  it('rejects an assembled code whose whole-transfer checksum is wrong', () => {
    const frames = splitIntoQrFrames(largeCode());
    const body = frameBody(frames[0]);
    const badFirst = replaceFrameBody(frames[0], `${body[0] === 'A' ? 'B' : 'A'}${body.slice(1)}`);
    const collector = new QrCollector();
    expect(() => {
      collector.add(badFirst);
      for (const frame of frames.slice(1)) collector.add(frame);
    }).toThrow(/assembled|damaged/i);
  });

  it('keeps assembly local until the completed code decodes and validates', () => {
    const code = largeCode();
    const collector = new QrCollector();
    let assembled: string | undefined;
    for (const frame of splitIntoQrFrames(code)) assembled = collector.add(frame).code ?? assembled;
    expect(assembled).toBe(code);
    expect(decodeProgress(assembled!)).toEqual(expect.objectContaining({ formatVersion: 1 }));
  });
});

 it('imports legacy DSP1 snapshots without changing their state', () => {
   const snapshot = portable();
   const body = base64Url(zlibSync(strToU8(JSON.stringify(snapshot))));
   expect(decodeProgress(`DSP1.${checksum(body)}.${body}`)).toEqual(snapshot);
 });
 it('uses one direct QR for compact progress and validates it on collection', () => {
   const code = encodeProgress(portable());
   expect(splitIntoQrFrames(code)).toHaveLength(1);
   expect(new QrCollector().add(splitIntoQrFrames(code)[0]).code).toBe(code);
   expect(new QrCollector().add(code).code).toBe(code);
 });

 it('preserves every card number including fractional timestamps exactly', () => {
   const snapshot = portable();
   const s = stateFor(snapshot, 'constant', NOW);
   s.card.stability = 0.12345678901234567;
   s.card.difficulty = 4.987654321098765;
   s.card.due = NOW + 0.25;
   s.card.last_review = NOW - 123.75;
   expect(decodeProgress(encodeProgress(snapshot))).toEqual(snapshot);
 });
