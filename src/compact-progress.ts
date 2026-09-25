import { NewerProgressError } from "./migrate";
import type { Progress, SkillState } from "./progress";
import type { PortableProgress } from "./transfer";

// Each tuple profile permanently owns its identity and skill-index order.
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
const PROFILE1_SKILLS = Object.freeze([
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
]);
const PROFILE2_SKILLS = Object.freeze([
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
]);
const PROFILE1_IDENTITY = Object.freeze({
  curriculumVersion: "ap-derivatives-1",
  schedulerPackageVersion: "5.4.2",
  fsrsAlgorithmVersion: "v5.4.2 using FSRS-6.0",
  parametersJson:
    '{"request_retention":0.9,"maximum_interval":180,"w":[0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542],"enable_fuzz":false,"enable_short_term":true,"learning_steps":["1m","10m"],"relearning_steps":["10m"]}',
});
const PROFILE2_IDENTITY = Object.freeze({
  curriculumVersion: "ap-derivatives-1",
  schedulerPackageVersion: "5.4.2",
  fsrsAlgorithmVersion: "v5.4.2 using FSRS-6.0",
  parametersJson:
    '{"request_retention":0.9,"maximum_interval":180,"w":[0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542],"enable_fuzz":false,"enable_short_term":true,"learning_steps":["1m","10m"],"relearning_steps":["10m"]}',
});

interface ProfileIdentity {
  curriculumVersion: string;
  schedulerPackageVersion: string;
  fsrsAlgorithmVersion: string;
  parametersJson: string;
}
interface Profile {
  skills: readonly string[];
  identity: ProfileIdentity;
  signatures: "full" | "q2-hex";
  decode(value: unknown[]): unknown;
  encode?(progress: PortableProgress): unknown[];
}

function arr(value: unknown, length?: number): unknown[] {
  if (!Array.isArray(value) || (length !== undefined && value.length !== length))
    throw Error("Invalid compact progress data.");
  return value;
}
function int(value: unknown, max: number): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > max
  )
    throw Error("Invalid compact index.");
  return value;
}
function bool(value: unknown): boolean {
  return int(value, 1) === 1;
}
function dayInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value))
    throw Error("Invalid compact practice days.");
  return value;
}
function dayKey(day: number): string {
  const date = new Date(day * 86400000);
  if (!Number.isFinite(date.getTime()))
    throw Error("Invalid compact practice days.");
  const key = date.toISOString().slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(key) ||
    Date.parse(`${key}T00:00:00.000Z`) / 86400000 !== day
  )
    throw Error("Invalid compact practice days.");
  return key;
}
function dayNumber(key: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key))
    throw Error("Invalid compact practice days.");
  const timestamp = Date.parse(`${key}T00:00:00.000Z`);
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== key
  )
    throw Error("Invalid compact practice days.");
  return timestamp / 86400000;
}
function decodeDays(value: unknown): Record<string, number> | undefined {
  if (value === null) return undefined;
  const encoded = arr(value);
  if (encoded.length === 0) return {};
  if (encoded.length % 2 !== 0) throw Error("Invalid compact practice days.");
  const firstDay = dayInt(encoded[0]);
  const firstCount = encoded[1];
  const pairs: unknown[][] = [];
  for (let i = 2; i < encoded.length; i += 2)
    pairs.push([encoded[i], encoded[i + 1]]);
  const days: Record<string, number> = { [dayKey(firstDay)]: int(firstCount, 1e9) };
  let day = firstDay;
  for (const [rawDelta, rawCount] of pairs) {
    const delta = dayInt(rawDelta);
    if (delta < 1 || delta > 36500)
      throw Error("Invalid compact practice day delta.");
    day += delta;
    if (Object.keys(days).length >= 31)
      throw Error("Invalid compact practice days.");
    days[dayKey(day)] = int(rawCount, 1e9);
  }
  return days;
}
function encodeDays(days?: Record<string, number>): unknown {
  if (days === undefined) return null;
  const entries = Object.entries(days)
    .map(([key, count]) => [dayNumber(key), count] as const)
    .sort(([a], [b]) => a - b);
  if (entries.length === 0) return [];
  // [firstDay, count, Δday, count, …]: flat pairs avoid per-day brackets.
  const flat: unknown[] = [entries[0][0], entries[0][1]];
  for (let i = 1; i < entries.length; i += 1) {
    const delta = entries[i][0] - entries[i - 1][0];
    if (!Number.isSafeInteger(delta) || delta < 1 || delta > 36500)
      throw Error("Invalid compact practice day delta.");
    flat.push(delta, entries[i][1]);
  }
  return flat;
}
function decodeProfile(value: unknown[], profile: Profile): unknown {
  const a = arr(value, 11);
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
    dictionary.some(
      (entry) =>
        typeof entry !== "string" ||
        (profile.signatures === "full"
          ? entry.length > 4096
          : !/^[a-f0-9]{8}$/.test(entry)),
    )
  )
    throw Error("Invalid compact signatures.");
  const signature = (index: unknown) => {
    const entry = dictionary[int(index, dictionary.length - 1)] as string;
    return profile.signatures === "q2-hex" ? `q2:${entry}` : entry;
  };
  const skill = (index: unknown) => profile.skills[int(index, profile.skills.length - 1)];
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
      const number = cardValues[i];
      if (key === "last_review" && number === null) return;
      if (typeof number !== "number" || !Number.isFinite(number))
        throw Error("Invalid compact card.");
      card[key] = number;
    });
    const evidence = arr(row[2]);
    if (evidence.length > 5) throw Error("Invalid compact evidence.");
    const state: Record<string, unknown> = {
      card,
      recent: evidence.map((rawEvidence) => {
        const entry = arr(rawEvidence, 3);
        return {
          q: signature(entry[0]),
          template: int(entry[1], 1),
          correct: bool(entry[2]),
        };
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
  const identity = profile.identity;
  const progress: Record<string, unknown> = {
    formatVersion: 1,
    curriculumVersion: identity.curriculumVersion,
    schedulerPackageVersion: identity.schedulerPackageVersion,
    fsrsAlgorithmVersion: identity.fsrsAlgorithmVersion,
    fsrsParameters: JSON.parse(identity.parametersJson),
    exportedAt,
    updatedAt: a[2],
    unlockedLevel: a[3],
    sequence: a[4],
    skills,
    recentQuestionSignatures: arr(a[8]).map(signature),
    pendingDiagnostics: arr(a[9]).map(skill),
  };
  if (a[5] !== null) progress.streak = a[5];
  if (a[6] !== null)
    progress.practiceDays =
      profile.signatures === "q2-hex" ? decodeDays(a[6]) : a[6];
  return progress;
}
function encodeProfile2(progress: PortableProgress): unknown[] {
  const signatures: string[] = [];
  const signature = (value: string) => {
    if (!/^q2:[a-f0-9]{8}$/.test(value))
      throw Error("Invalid compact signature.");
    const encoded = value.slice(3);
    let index = signatures.indexOf(encoded);
    if (index < 0) {
      index = signatures.length;
      signatures.push(encoded);
    }
    return index;
  };
  const skills = Object.entries(progress.skills).map(([id, state]) => {
    const skillIndex = PROFILE2_SKILLS.indexOf(id);
    if (skillIndex < 0) throw Error("Unknown skill in compact progress.");
    return [
      skillIndex,
      CARD_KEYS.map((key) => state.card[key] ?? null),
      state.recent.map((entry) => [
        signature(entry.q),
        entry.template,
        entry.correct ? 1 : 0,
      ]),
      ...STATE_KEYS.map((key) =>
        typeof state[key] === "boolean" ? (state[key] ? 1 : 0) : state[key],
      ),
    ];
  });
  const recent = progress.recentQuestionSignatures.map(signature);
  return [
    2,
    progress.exportedAt,
    progress.updatedAt,
    progress.unlockedLevel,
    progress.sequence,
    progress.streak ?? null,
    encodeDays(progress.practiceDays),
    signatures,
    recent,
    progress.pendingDiagnostics.map((id) => PROFILE2_SKILLS.indexOf(id)),
    skills,
  ];
}

const PROFILES: Record<number, Profile> = Object.freeze({
  1: Object.freeze({
    skills: PROFILE1_SKILLS,
    identity: PROFILE1_IDENTITY,
    signatures: "full",
    decode: (value: unknown[]) => decodeProfile(value, PROFILES[1]),
  }),
  2: Object.freeze({
    skills: PROFILE2_SKILLS,
    identity: PROFILE2_IDENTITY,
    signatures: "q2-hex",
    decode: (value: unknown[]) => decodeProfile(value, PROFILES[2]),
    encode: encodeProfile2,
  }),
});
export const LATEST_PROFILE = 2;
export const LATEST_PROFILE_SKILLS = PROFILES[LATEST_PROFILE].skills;

function assertProfileIdentity(progress: PortableProgress, profile: Profile) {
  const identity = profile.identity;
  if (
    progress.curriculumVersion !== identity.curriculumVersion ||
    progress.schedulerPackageVersion !== identity.schedulerPackageVersion ||
    progress.fsrsAlgorithmVersion !== identity.fsrsAlgorithmVersion ||
    JSON.stringify(progress.fsrsParameters) !== identity.parametersJson
  )
    throw Error(`Progress identity does not match compact profile ${LATEST_PROFILE}.`);
}

export function packProgress(progress: PortableProgress): unknown[] {
  const profile = PROFILES[LATEST_PROFILE];
  assertProfileIdentity(progress, profile);
  if (!profile.encode) throw Error("Compact progress profile cannot encode.");
  return profile.encode(progress);
}

export function unpackProgress(value: unknown): unknown {
  const a = arr(value);
  const version = a[0];
  const profile = typeof version === "number" ? PROFILES[version] : undefined;
  if (!profile) {
    if (typeof version === "number" && version > LATEST_PROFILE)
      throw new NewerProgressError(
        "This code was made by a newer version of the app. Reload the page to update, then try again.",
      );
    throw Error("Unsupported compact progress profile.");
  }
  return profile.decode(a);
}
