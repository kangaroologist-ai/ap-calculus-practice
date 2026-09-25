import { readFileSync, writeFileSync } from "node:fs";
import { strToU8, zlibSync } from "fflate";
import { SKILLS } from "../src/catalog";
import { generateQuestion } from "../src/questions";
import {
  checksum,
  encodeProgress,
  makePortableProgress,
  type PortableProgress,
} from "../src/transfer";
import type { Question } from "../src/types";

/**
 * Runs once, by hand, to freeze samples of formats the CURRENT code produces.
 * The four files this writes are committed fixtures, not generated output:
 * every later step must keep reading them. Do not rerun this script to
 * "refresh" them — that would defeat the point of freezing a legacy format.
 */

const FIXTURES = (name: string) => new URL(`../tests/fixtures/${name}`, import.meta.url);
const raw = JSON.parse(
  readFileSync(FIXTURES("compact-full-snapshot.json"), "utf8"),
) as PortableProgress;

// DSP2, compact profile 1: today's export format for the frozen snapshot.
writeFileSync(
  FIXTURES("dsp2-profile1.txt"),
  `${encodeProgress(makePortableProgress(raw, raw.exportedAt))}\n`,
);

// DSP1: the legacy zlib(JSON(full snapshot)) format DSP2 replaced. DSP1 never
// fingerprinted evidence, so this keeps all 5 raw question signatures per
// skill, exactly as an old export would have.
function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const n of bytes) s += String.fromCharCode(n);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const dsp1Body = base64url(zlibSync(strToU8(JSON.stringify(raw)), { level: 9 }));
writeFileSync(FIXTURES("dsp1.txt"), `DSP1.${checksum(dsp1Body)}.${dsp1Body}\n`);

// A formatVersion-1 IndexedDB record, as an app running the current code
// would have saved it mid-session: the portable snapshot minus exportedAt,
// plus a question in progress.
const { exportedAt: _exportedAt, ...progress } = raw;
const config = JSON.parse(
  readFileSync(new URL("../public/practice-config.json", import.meta.url), "utf8"),
);
writeFileSync(
  FIXTURES("local-state-v1.json"),
  `${JSON.stringify(
    {
      version: 1,
      progress,
      session: {
        config,
        completed: 3,
        independent: 2,
        assisted: 1,
        skipped: 0,
        finished: false,
        current: {
          question: generateQuestion("implicit", "fixture", 0),
          draft: [""],
          hintsUsed: 0,
          recorded: false,
          closed: false,
          reason: "New skill",
        },
      },
    },
    null,
    2,
  )}\n`,
);

// Golden generator output: every skill x template 0/1 x 20 seeds, trimmed to
// the fields a later step compares against. Steps, hints, and the generator
// version string are left out on purpose — later steps legitimately change
// notation there, and this fixture must not force them to stay byte-identical.
function pickGolden(q: Question) {
  return {
    id: q.id,
    seed: q.seed,
    template: q.template,
    family: q.family,
    level: q.level,
    primarySkill: q.primarySkill,
    supportingSkills: q.supportingSkills,
    title: q.title,
    prompt: q.prompt,
    source: q.source,
    answers: q.answers,
    labels: q.labels,
    domain: q.domain,
    domainText: q.domainText,
    hintMath: q.hintMath,
    signature: q.signature,
  };
}
const golden = SKILLS.flatMap((s) =>
  [0, 1].flatMap((t) =>
    Array.from({ length: 20 }, (_, i) =>
      pickGolden(generateQuestion(s.id, `golden:${s.id}:${t}:${i}`, t)),
    ),
  ),
);
writeFileSync(FIXTURES("generator-1.1.0.json"), `${JSON.stringify(golden)}\n`);

console.log(
  "Captured tests/fixtures/dsp2-profile1.txt, dsp1.txt, local-state-v1.json, generator-1.1.0.json",
);
