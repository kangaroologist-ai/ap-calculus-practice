import { SKILLS, CURRICULUM_VERSION } from "./catalog";
import {
  PARAMETERS,
  SCHEDULER_VERSION,
  ALGORITHM_VERSION,
  type Progress,
  type SkillState,
} from "./progress";
import type { PortableProgress } from "./transfer";

// Profile 1 freezes this field order, skill catalog, and the full FSRS parameter set.
// A future scheduler/curriculum must use a new profile, never reinterpret this one.
const CARD_KEYS = [
  "due",
  "stability",
  "difficulty",
  "elapsed_days",
  "scheduled_days",
  "reps",
  "lapses",
  "learning_steps",
  "state",
  "last_review",
] as const;
const STATE_KEYS = [
  "needsRemediation",
  "failureStreak",
  "lastFailureAt",
  "otherSinceFailure",
  "extraPracticeGiven",
  "lastSeen",
] as const;
const PROFILE_SKILLS = [
  "constant",
  "power",
  "sum",
  "root",
  "exp",
  "log",
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "asin",
  "acos",
  "atan",
  "product",
  "quotient",
  "chain",
  "nested",
  "mixed",
  "implicit",
  "inverse",
  "higher",
  "parametric",
  "vector",
  "polar",
];
const PROFILE_PARAMETERS =
  '{"request_retention":0.9,"maximum_interval":180,"w":[0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542],"enable_fuzz":false,"enable_short_term":true,"learning_steps":["1m","10m"],"relearning_steps":["10m"]}';
function assertProfile() {
  if (
    CURRICULUM_VERSION !== "ap-derivatives-1" ||
    JSON.stringify(PARAMETERS) !== PROFILE_PARAMETERS ||
    SCHEDULER_VERSION !== "5.4.2" ||
    ALGORITHM_VERSION !== "v5.4.2 using FSRS-6.0" ||
    JSON.stringify(SKILLS.map((s) => s.id)) !== JSON.stringify(PROFILE_SKILLS)
  )
    throw Error("Unsupported compact progress profile.");
}
export function packProgress(p: PortableProgress): unknown[] {
  assertProfile();
  const signatures: string[] = [];
  const signature = (q: string) => {
    let i = signatures.indexOf(q);
    if (i < 0) {
      i = signatures.length;
      signatures.push(q);
    }
    return i;
  };
  const skills = Object.entries(p.skills).map(([id, s]) => [
    PROFILE_SKILLS.indexOf(id),
    CARD_KEYS.map((k) => s.card[k] ?? null),
    s.recent.map((e) => [signature(e.q), e.template, e.correct ? 1 : 0]),
    ...STATE_KEYS.map((k) =>
      typeof s[k] === "boolean" ? (s[k] ? 1 : 0) : s[k],
    ),
  ]);
  const recent = p.recentQuestionSignatures.map(signature);
  return [
    1,
    p.exportedAt,
    p.updatedAt,
    p.unlockedLevel,
    p.sequence,
    p.streak ?? null,
    p.practiceDays ?? null,
    signatures,
    recent,
    p.pendingDiagnostics.map((id) => PROFILE_SKILLS.indexOf(id)),
    skills,
  ];
}
function arr(x: unknown, length?: number): unknown[] {
  if (!Array.isArray(x) || (length !== undefined && x.length !== length))
    throw Error("Invalid compact progress data.");
  return x;
}
function int(x: unknown, max: number): number {
  if (typeof x !== "number" || !Number.isInteger(x) || x < 0 || x > max)
    throw Error("Invalid compact index.");
  return x;
}
function bool(x: unknown): boolean {
  return int(x, 1) === 1;
}
export function unpackProgress(value: unknown): PortableProgress {
  assertProfile();
  const a = arr(value, 11);
  if (a[0] !== 1) throw Error("Unsupported compact progress profile.");
  const exportedAt = a[1];
  if (
    typeof exportedAt !== "number" ||
    !Number.isFinite(exportedAt) ||
    typeof a[2] !== "number" ||
    !Number.isFinite(a[2])
  )
    throw Error("Invalid compact timestamps.");
  const dictionary = arr(a[7]);
  if (
    dictionary.length > 140 ||
    dictionary.some((x) => typeof x !== "string" || x.length > 4096)
  )
    throw Error("Invalid compact signatures.");
  const sig = (x: unknown) =>
    dictionary[int(x, dictionary.length - 1)] as string;
  const skill = (x: unknown) =>
    PROFILE_SKILLS[int(x, PROFILE_SKILLS.length - 1)];
  const skills: Progress["skills"] = {};
  const rows = arr(a[10]);
  if (rows.length > 26) throw Error("Too many skills.");
  for (const raw of rows) {
    const row = arr(raw, 9),
      id = skill(row[0]);
    if (skills[id]) throw Error("Duplicate skill.");
    const cardValues = arr(row[1], 10),
      card: Record<string, number> = {};
    CARD_KEYS.forEach((key, i) => {
      const n = cardValues[i];
      if (key === "last_review" && n === null) return;
      if (typeof n !== "number" || !Number.isFinite(n))
        throw Error("Invalid compact card.");
      card[key] = n;
    });
    const evidence = arr(row[2]);
    if (evidence.length > 5) throw Error("Invalid compact evidence.");
    const state: Record<string, unknown> = {
      card,
      recent: evidence.map((raw) => {
        const e = arr(raw, 3);
        return { q: sig(e[0]), template: int(e[1], 1), correct: bool(e[2]) };
      }),
    };
    STATE_KEYS.forEach((key, i) => {
      state[key] =
        key === "needsRemediation" || key === "extraPracticeGiven"
          ? bool(row[i + 3])
          : row[i + 3];
    });
    skills[id] = state as unknown as SkillState;
  }
  const p: PortableProgress = {
    formatVersion: 1,
    curriculumVersion: CURRICULUM_VERSION,
    schedulerPackageVersion: SCHEDULER_VERSION,
    fsrsAlgorithmVersion: ALGORITHM_VERSION,
    fsrsParameters: structuredClone(PARAMETERS),
    exportedAt,
    updatedAt: a[2],
    unlockedLevel: a[3] as number,
    sequence: a[4] as number,
    skills,
    recentQuestionSignatures: arr(a[8]).map(sig),
    pendingDiagnostics: arr(a[9]).map(skill),
  };
  if (a[5] !== null) p.streak = a[5] as number;
  if (a[6] !== null) p.practiceDays = a[6] as Record<string, number>;
  return p;
}
