import { test, expect } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { freshProgress, stateFor } from '../src/progress';
import { SKILLS } from '../src/catalog';
import {
  makePortableProgress,
  encodeProgress,
  splitIntoQrFrames,
  qrErrorCorrection,
  QrCollector,
  decodeProgress,
} from '../src/transfer';

test('full-curriculum snapshot survives raster QR encoding and local image decoding', () => {
  const now = Date.now();
  const p = freshProgress({ schemaVersion: 1, revision: 'test', initialUnlockedLevel: 6, disabledFamilies: [], sessionLength: 12 }, now);
  SKILLS.forEach((skill, index) => {
    const state = stateFor(p, skill.id, now);
    state.card.stability = index + 0.123456789012345;
    state.basic = {
      streak: 2,
      lastQ: `q2:${(index * 2).toString(16).padStart(8, '0')}`,
      passed: true,
      repair: false,
    };
    state.mix = {
      streak: 2,
      lastQ: `q2:${(index * 2 + 1).toString(16).padStart(8, '0')}`,
      passed: true,
      repair: false,
    };
  });
  const snapshot = makePortableProgress(p, now);
  const code = encodeProgress(snapshot);
  const frames = splitIntoQrFrames(code);
  const collector = new QrCollector();
  let result: ReturnType<QrCollector['add']> | undefined;
  expect(frames).toHaveLength(1);
  for (const frame of [...frames].reverse()) {
    const qr = QRCode.create(frame, { errorCorrectionLevel: qrErrorCorrection(frame) });
    const size = qr.modules.size;
    const scale = 3;
    const width = (size + 8) * scale;
    const pixels = new Uint8ClampedArray(width * width * 4);
    pixels.fill(255);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (qr.modules.get(y, x))
          for (let dy = 0; dy < scale; dy++)
            for (let dx = 0; dx < scale; dx++) {
              const i = (((y + 4) * scale + dy) * width + (x + 4) * scale + dx) * 4;
              pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
            }
    const decoded = jsQR(pixels, width, width);
    expect(decoded?.data).toBe(frame);
    result = collector.add(decoded!.data);
  }
  expect(decodeProgress(result!.code!)).toEqual(snapshot);
});
