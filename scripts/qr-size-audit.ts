import QRCode from "qrcode";
import jsQR from "jsqr";
import { strToU8, zlibSync } from "fflate";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { SKILLS } from "../src/catalog";
import {
  chooseNext,
  finishQuestion,
  freshProgress,
  recordOutcome,
  type AppState,
  type Current,
} from "../src/progress";
import { generateQuestion } from "../src/questions";
import {
  checksum,
  decodeProgress,
  encodeProgress,
  makePortableProgress,
  qrErrorCorrection,
  splitIntoQrFrames,
  validateSnapshot,
  type PortableProgress,
} from "../src/transfer";
import { packProgress } from "../src/compact-progress";
import { migrateProgress } from "../src/migrate";

const config = (initialUnlockedLevel: number) => ({
  schemaVersion: 1 as const,
  revision: "2026-09-19-1",
  initialUnlockedLevel,
  disabledFamilies: [] as string[],
  sessionLength: 12,
});
const anchor = Date.parse("2026-09-18T16:00:00.000Z");
const day = 86_400_000;
const b64url = (bytes: Uint8Array) =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

function legacyCode(p: PortableProgress) {
  const body = b64url(zlibSync(strToU8(JSON.stringify(p)), { level: 9 }));
  return `DSP1.${checksum(body)}.${body}`;
}

function qrRead(frame: string) {
  const ec = qrErrorCorrection(frame);
  const qr = QRCode.create(frame, { errorCorrectionLevel: ec });
  const size = qr.modules.size;
  const scale = 3;
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
  if (data !== frame) throw new Error("QR pixel decode did not reproduce its frame.");
  return { chars: frame.length, ec, version: (size - 17) / 4 };
}

function makeTenQuestionProgress(): PortableProgress {
  const c = config(1);
  const p = freshProgress(c, anchor - day);
  const state: AppState = {
    version: 1,
    progress: p,
    session: { config: c, completed: 0, independent: 0, assisted: 0, skipped: 0, finished: false },
  };
  for (let i = 0; i < 10; i += 1) {
    const t = anchor - day + i * 60_000;
    const next = chooseNext(p, c, t);
    const current: Current = {
      question: next.question,
      draft: [],
      hintsUsed: 0,
      recorded: false,
      closed: false,
      reason: next.reason,
      verdict: { status: "correct", evidence: "symbolic" },
    };
    recordOutcome(p, current, c, current.verdict!, t);
    state.session!.current = current;
    finishQuestion(state);
  }
  return makePortableProgress(p, anchor);
}

function makeFullProgress(): PortableProgress {
  const c = config(6);
  const end = anchor - 60_000;
  const start = end - 30 * day;
  const p = freshProgress(c, start);
  const state: AppState = {
    version: 1,
    progress: p,
    session: { config: c, completed: 0, independent: 0, assisted: 0, skipped: 0, finished: false },
  };
  const patterns = [
    ["correct", "correct", "correct", "correct", "correct"],
    ["incorrect", "correct", "correct", "correct", "correct"],
    ["correct", "incorrect", "correct", "correct", "correct"],
    ["incorrect", "incorrect", "correct", "correct", "correct"],
    ["correct", "correct", "incorrect", "correct", "correct"],
    ["correct", "incorrect", "incorrect", "correct", "correct"],
    ["incorrect", "correct", "incorrect", "correct", "correct"],
    ["incorrect", "incorrect", "incorrect", "correct", "correct"],
  ] as const;
  const used = new Set<string>();
  for (let si = 0; si < SKILLS.length; si += 1) {
    const startDay = Math.floor((si * 31) / SKILLS.length);
    for (let ei = 0; ei < 5; ei += 1) {
      const t = start + Math.min(30, startDay + ei) * day + ei * 60_000;
      const role: "basic" | "mix" = ei % 2 ? "mix" : "basic";
      let question = generateQuestion(SKILLS[si].id, `qr-audit:${si}:${ei}:0`, { role, ok: () => true });
      for (let k = 0; k < 200 && used.has(question.signature); k += 1)
        question = generateQuestion(SKILLS[si].id, `qr-audit:${si}:${ei}:${k + 1}`, { role, ok: () => true });
      // Every template branch now varies across seeds (SPEC-G1), but 200
      // retries can still coincide by chance for a low-cardinality template.
      // The suffix is an audit-only unique evidence key; the generated source is unchanged.
      if (used.has(question.signature))
        question = { ...question, signature: `${question.signature}|audit-${si}-${ei}` };
      used.add(question.signature);
      const status = patterns[si % patterns.length][ei];
      const current: Current = {
        question,
        draft: [],
        hintsUsed: 0,
        recorded: false,
        closed: false,
        reason: "audit",
        verdict:
          status === "correct"
            ? { status: "correct", evidence: "symbolic" }
            : { status: "incorrect", feedbackCode: "wrong-rule" },
      };
      recordOutcome(p, current, c, current.verdict!, t);
      state.session!.current = current;
      finishQuestion(state);
    }
  }
  for (const skill of SKILLS) p.skills[skill.id].basic.passed = true;
  if (Object.keys(p.skills).length !== 26 || Object.values(p.skills).some((s) => !s.basic || !s.mix))
    throw new Error("Full audit fixture did not contain 26 pairs of learning lines.");
  if (Object.keys(p.practiceDays ?? {}).length !== 31)
    throw new Error("Full audit fixture did not contain 31 practice days.");
  return makePortableProgress(p, anchor);
}

function measure(name: string, p: PortableProgress) {
  validateSnapshot(p);
  const legacy = legacyCode(p);
  const packedJson = JSON.stringify(packProgress(p));
  const compact = encodeProgress(p);
  const frames = splitIntoQrFrames(compact);
  const qr = frames.map(qrRead);
  const decoded = decodeProgress(compact);
  if (!isDeepStrictEqual(decoded, p))
    throw new Error(`${name} compact decode changed the snapshot.`);
  console.log(
    JSON.stringify({
      name,
      profile: JSON.parse(packedJson)[0],
      skills: Object.keys(p.skills).length,
      lines: Object.values(p.skills).reduce((n, s) => n + Number(!!s.basic) + Number(!!s.mix), 0),
      practiceDays: Object.keys(p.practiceDays ?? {}).length,
      jsonChars: JSON.stringify(p).length,
      legacyJsonZlib9Chars: legacy.length,
      legacy700Chunks: Math.ceil(legacy.length / 700),
      tupleJsonChars: packedJson.length,
      tupleZlib9Bytes: zlibSync(strToU8(packedJson), { level: 9 }).length,
      compactChars: compact.length,
      qrFrames: frames.length,
      qr,
    }),
  );
}

measure("initial", makePortableProgress(freshProgress(config(1), anchor), anchor));
measure("ten-real-questions", makeTenQuestionProgress());
measure("full26-each5-varied-FSRS-31days", makeFullProgress());
const rawFixture = JSON.parse(
  readFileSync(new URL("../tests/fixtures/compact-full-snapshot.json", import.meta.url), "utf8"),
) as Record<string, any>;
// Keep the raw 26 x 5 fixture for comparison, but measure the transport form after
// the same privacy-preserving makePortableProgress step used by the app.
const fixtureV2 = migrateProgress(rawFixture).progress;
measure("fixture-portable", makePortableProgress(fixtureV2, rawFixture.exportedAt));
