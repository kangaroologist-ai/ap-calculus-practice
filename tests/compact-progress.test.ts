import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { describe, expect, it } from "vitest";
import {
  decodeProgress,
  encodeProgress,
  qrErrorCorrection,
  QrCollector,
  splitIntoQrFrames,
  validateSnapshot,
  type PortableProgress,
} from "../src/transfer";
import { makePortableProgress } from "../src/transfer";
import { questionFingerprint } from "../src/question-identity";

const snapshot = JSON.parse(
  readFileSync(new URL("./fixtures/compact-full-snapshot.json", import.meta.url), "utf8"),
) as PortableProgress;

function decodeRenderedQr(frame: string): string {
  const qr = QRCode.create(frame, { errorCorrectionLevel: qrErrorCorrection(frame) });
  const scale = 3;
  const size = qr.modules.size;
  const width = (size + 8) * scale;
  const pixels = new Uint8ClampedArray(width * width * 4);
  pixels.fill(255);
  for (let y = 0; y < size; y += 1)
    for (let x = 0; x < size; x += 1)
      if (qr.modules.get(y, x))
        for (let dy = 0; dy < scale; dy += 1)
          for (let dx = 0; dx < scale; dx += 1) {
            const i = (((y + 4) * scale + dy) * width + (x + 4) * scale + dx) * 4;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
          }
  const data = jsQR(pixels, width, width)?.data;
  if (!data) throw new Error("QR image did not decode.");
  return data;
}

describe("full compact progress transfer fixture", () => {
  it("uses idempotent q2 fingerprints and truncates q1 to the same SHA-256 prefix", () => {
    for (const value of ["", "abc", "微积分🌌".repeat(32)]) {
      const hash = createHash("sha256").update(value, "utf8").digest("hex");
      const expected = `q2:${hash.slice(0, 8)}`;
      const legacy = `q1:${hash.slice(0, 32)}`;
      expect(questionFingerprint(value)).toBe(expected);
      expect(questionFingerprint(legacy)).toBe(expected);
      expect(questionFingerprint(expected)).toBe(expected);
      expect(questionFingerprint(questionFingerprint(value))).toBe(expected);
    }
  });

  it("contains the intended 26 x 5 evidence and 31-day boundary", () => {
    validateSnapshot(snapshot);
    expect(Object.keys(snapshot.skills)).toHaveLength(26);
    expect(Object.values(snapshot.skills).every((s) => s.recent.length === 5)).toBe(true);
    expect(Object.keys(snapshot.practiceDays ?? {})).toHaveLength(31);
    const portable = makePortableProgress(snapshot, snapshot.exportedAt);
    expect(
      Object.values(portable.skills).every((s) =>
        s.recent.every((e) => /^q2:[a-f0-9]{8}$/.test(e.q)),
      ),
    ).toBe(true);
    expect(
      portable.recentQuestionSignatures.every((q) =>
        /^q2:[a-f0-9]{8}$/.test(q),
      ),
    ).toBe(true);
  });

  it("round-trips all FSRS fields and the full evidence fixture through DSP2", () => {
    const portable = validateSnapshot(snapshot);
    const code = encodeProgress(portable);
    const decoded = decodeProgress(code);
    expect(isDeepStrictEqual(decoded, portable)).toBe(true);
    expect(code.length).toBeGreaterThan(2300);
  });

  it("round-trips the dense single QR through rendered pixels", () => {
    const code = encodeProgress(makePortableProgress(snapshot, snapshot.exportedAt));
    const frames = splitIntoQrFrames(code);
    expect(frames).toHaveLength(1);
    expect(frames[0].length).toBeGreaterThan(0);
    const scanned = decodeRenderedQr(frames[0]);
    expect(scanned).toBe(frames[0]);
    const result = new QrCollector().add(scanned);
    expect(result.code).toBe(code);
    expect(isDeepStrictEqual(
      decodeProgress(result.code!),
      makePortableProgress(snapshot, snapshot.exportedAt),
    )).toBe(true);
  });
});
