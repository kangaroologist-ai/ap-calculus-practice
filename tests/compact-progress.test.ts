import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { describe, expect, it } from "vitest";
import { SKILLS } from "../src/catalog";
import {
  LATEST_PROFILE,
  LATEST_PROFILE_SKILLS,
  packProgress,
  unpackProgress,
} from "../src/compact-progress";
import { migrateProgress, NewerProgressError } from "../src/migrate";
import {
  decodeProgress,
  encodeProgress,
  qrErrorCorrection,
  QrCollector,
  splitIntoQrFrames,
  validateSnapshot,
  type PortableProgress,
} from "../src/transfer";
import { questionFingerprint } from "../src/question-identity";

const rawSnapshot = JSON.parse(
  readFileSync(new URL("./fixtures/compact-full-snapshot.json", import.meta.url), "utf8"),
) as Record<string, any>;
const snapshot = {
  ...migrateProgress(rawSnapshot).progress,
  exportedAt: rawSnapshot.exportedAt,
} as PortableProgress;
const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

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

  it("migrates the 26-skill fixture into v2 lines and retains its 31-day boundary", () => {
    validateSnapshot(snapshot);
    expect(Object.keys(snapshot.skills)).toHaveLength(26);
    expect(Object.values(snapshot.skills).every((s) => !("recent" in s))).toBe(true);
    expect(Object.values(snapshot.skills).every((s) => s.basic && s.mix)).toBe(true);
    expect(Object.keys(snapshot.practiceDays ?? {})).toHaveLength(31);
    const portable = validateSnapshot(snapshot);
    for (const skill of Object.values(portable.skills))
      for (const line of [skill.basic, skill.mix])
        if (line.lastQ) expect(line.lastQ).toMatch(/^q2:[a-f0-9]{8}$/);
    expect(portable.recentQuestionSignatures.every((q) => /^q2:[a-f0-9]{8}$/.test(q))).toBe(true);
  });

  it("round-trips all FSRS fields and the full v2 line fixture through DSP2", () => {
    const code = encodeProgress(snapshot);
    const decoded = decodeProgress(code);
    expect(isDeepStrictEqual(decoded, snapshot)).toBe(true);
    expect(code.length).toBeGreaterThan(0);
  });

  it("keeps the latest profile skill table in curriculum order", () => {
    expect(LATEST_PROFILE).toBe(3);
    expect(LATEST_PROFILE_SKILLS).toEqual(SKILLS.map((skill) => skill.id));
  });

  it("imports the frozen DSP1 and profile 1 and 2 fixtures as v2 snapshots", () => {
    const direct = decodeProgress(fixture("dsp1.txt"));
    const profile1 = decodeProgress(fixture("dsp2-profile1.txt"));
    const profile2 = decodeProgress(fixture("dsp2-profile2.txt"));
    expect(direct.formatVersion).toBe(2);
    expect(profile1.formatVersion).toBe(2);
    expect(profile2.formatVersion).toBe(2);
    expect(direct.skills.constant.basic.passed).toBe(true);
    expect(profile1.skills.constant.basic.passed).toBe(true);
    expect(profile2.skills.constant.basic.passed).toBe(true);
    expect(direct.skills.constant.mix).toEqual({ streak: 0, passed: false, repair: false });

    const expectedFromFixture = {
      ...migrateProgress(rawSnapshot).progress,
      exportedAt: rawSnapshot.exportedAt,
    };
    expect(direct).toEqual(expectedFromFixture);
  });

  it("round-trips profile 3 and rejects newer or malformed profile data", () => {
    const tuple = packProgress(snapshot);
    expect(tuple[0]).toBe(3);
    expect(decodeProgress(encodeProgress(snapshot))).toEqual(snapshot);

    expect(() => unpackProgress([99])).toThrow(NewerProgressError);
    expect(() => unpackProgress([99])).toThrow(
      "This code was made by a newer version of the app. Reload the page to update, then try again.",
    );

    const badHex = structuredClone(tuple);
    const dictionary = badHex[7] as unknown[];
    dictionary[0] = "not-hex!";
    expect(() => unpackProgress(badHex)).toThrow(/signatures/i);

    const badStreak = structuredClone(tuple);
    const rows = badStreak[10] as unknown[][];
    (rows[0][2] as unknown[])[0] = 3;
    expect(() => unpackProgress(badStreak)).toThrow(/compact index/i);

    const badMixedPassed = structuredClone(tuple);
    const passedRows = badMixedPassed[10] as unknown[][];
    (passedRows[0][2] as unknown[])[0] = 0;
    (passedRows[0][2] as unknown[])[1] = 0;
    (passedRows[0][2] as unknown[])[2] = 0;
    (passedRows[0][3] as unknown[])[0] = 2;
    (passedRows[0][3] as unknown[])[1] = 1;
    expect(() => migrateProgress(unpackProgress(badMixedPassed))).toThrow(/skill evidence/i);

    const badLastQ = structuredClone(tuple);
    const lastQRows = badLastQ[10] as unknown[][];
    (lastQRows[0][2] as unknown[])[4] = 999;
    expect(() => unpackProgress(badLastQ)).toThrow(/compact index/i);

    const firstDay = Date.parse("2026-09-25T00:00:00.000Z") / 86400000;
    const badFlatDelta = structuredClone(tuple);
    badFlatDelta[6] = [firstDay, 1, 0, 1];
    expect(() => unpackProgress(badFlatDelta)).toThrow(/delta/i);

    const nestedDays = structuredClone(tuple);
    nestedDays[6] = [firstDay, 1, [1, 1]];
    expect(() => unpackProgress(nestedDays)).toThrow();

    const longGap = structuredClone(snapshot);
    longGap.practiceDays = { "2026-01-02": 3, "2026-09-19": 4 };
    expect(decodeProgress(encodeProgress(longGap)).practiceDays).toEqual(longGap.practiceDays);
  });

  it("keeps the migrated full fixture below 2000 chars in one QR version 30 or lower", () => {
    const code = encodeProgress(snapshot);
    const frames = splitIntoQrFrames(code);
    expect(code.length).toBeLessThan(2000);
    expect(frames).toHaveLength(1);
    const qr = QRCode.create(frames[0], {
      errorCorrectionLevel: qrErrorCorrection(frames[0]),
    });
    expect(qr.version).toBeLessThanOrEqual(30);
    const scanned = decodeRenderedQr(frames[0]);
    expect(scanned).toBe(frames[0]);
    const result = new QrCollector().add(scanned);
    expect(result.code).toBe(code);
    expect(isDeepStrictEqual(decodeProgress(result.code!), snapshot)).toBe(true);
  });
});
