import { SKILLS, CURRICULUM_VERSION } from "./catalog";
import {
  PARAMETERS,
  SCHEDULER_VERSION,
  ALGORITHM_VERSION,
  localPracticeDay,
  type Progress,
} from "./progress";

const PROFILE1_PARAMETERS_JSON =
  '{"request_retention":0.9,"maximum_interval":180,"w":[0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542],"enable_fuzz":false,"enable_short_term":true,"learning_steps":["1m","10m"],"relearning_steps":["10m"]}';

export const LATEST_FORMAT = 1;

export class NewerProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewerProgressError";
  }
}

type MutableProgress = Record<string, any>;
type MigrationStep = {
  from: number;
  to: number;
  run(progress: MutableProgress): MutableProgress;
};

const KNOWN_IDENTITIES: Record<
  number,
  {
    curriculum: string[];
    scheduler: string[];
    algorithm: string[];
    parameters: string[];
  }
> = {
  1: {
    curriculum: ["ap-derivatives-1"],
    scheduler: ["5.4.2"],
    algorithm: ["v5.4.2 using FSRS-6.0"],
    parameters: [PROFILE1_PARAMETERS_JSON],
  },
};

const STEPS: MigrationStep[] = [];

function unsupportedVersion() {
  throw Error(
    "This progress version is not supported. Use the same app version on both devices.",
  );
}

function checkKnownIdentity(progress: MutableProgress, version: number) {
  const identity = KNOWN_IDENTITIES[version];
  if (
    !identity ||
    !identity.curriculum.includes(progress.curriculumVersion) ||
    !identity.scheduler.includes(progress.schedulerPackageVersion) ||
    !identity.algorithm.includes(progress.fsrsAlgorithmVersion)
  )
    unsupportedVersion();
  if (!identity.parameters.includes(JSON.stringify(progress.fsrsParameters)))
    throw Error("Unsupported review settings. No progress was changed.");
}

function normalizeFingerprints(progress: MutableProgress) {
  return progress;
}

function currentIdentity() {
  return {
    formatVersion: LATEST_FORMAT,
    curriculumVersion: CURRICULUM_VERSION,
    schedulerPackageVersion: SCHEDULER_VERSION,
    fsrsAlgorithmVersion: ALGORITHM_VERSION,
    fsrsParameters: structuredClone(PARAMETERS),
  };
}

export function migrateProgress(raw: unknown): {
  progress: Progress;
  from: number;
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("Invalid progress data.");
  const source = raw as MutableProgress;
  const from = source.formatVersion;
  if (typeof from !== "number" || !Number.isInteger(from) || from < 1)
    throw Error("Invalid progress data.");
  if (from > LATEST_FORMAT)
    throw new NewerProgressError(
      "This progress was saved by a newer version of the app. Reload the page to update, then try again.",
    );

  checkKnownIdentity(source, from);
  let current = normalizeFingerprints(structuredClone(source));
  let version = from;
  for (const step of STEPS) {
    if (step.from === version) {
      current = step.run(current);
      version = step.to;
    }
  }
  Object.assign(current, currentIdentity());
  return { progress: validateCurrent(current), from };
}

const finite = (value: unknown, min = 0, max = 1e15) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;
const integer = (value: unknown, min = 0, max = 1e9) =>
  finite(value, min, max) && Number.isInteger(value);

export function validateCurrent(value: unknown): Progress {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid progress data.");
  const p = value as Progress;
  if (
    p.formatVersion !== LATEST_FORMAT ||
    p.curriculumVersion !== CURRICULUM_VERSION ||
    p.schedulerPackageVersion !== SCHEDULER_VERSION ||
    p.fsrsAlgorithmVersion !== ALGORITHM_VERSION
  )
    unsupportedVersion();
  if (JSON.stringify(p.fsrsParameters) !== JSON.stringify(PARAMETERS))
    throw Error("Unsupported review settings. No progress was changed.");
  if (
    !finite(p.updatedAt, 946684800000, Date.now() + 86400000) ||
    !integer(p.unlockedLevel, 1, 6) ||
    !integer(p.sequence) ||
    !p.skills ||
    typeof p.skills !== "object" ||
    Array.isArray(p.skills)
  )
    throw Error("Invalid progress data.");
  if (p.streak !== undefined && !integer(p.streak))
    throw Error("Invalid streak.");
  if (p.practiceDays !== undefined) {
    if (
      !p.practiceDays ||
      typeof p.practiceDays !== "object" ||
      Array.isArray(p.practiceDays) ||
      Object.keys(p.practiceDays).length > 31
    )
      throw Error("Invalid daily practice counts.");
    const latestLocalDay = new Date();
    latestLocalDay.setDate(latestLocalDay.getDate() + 2);
    for (const [day, count] of Object.entries(p.practiceDays)) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
        !Number.isFinite(Date.parse(day)) ||
        new Date(day).toISOString().slice(0, 10) !== day ||
        day > localPracticeDay(latestLocalDay.getTime()) ||
        !integer(count)
      )
        throw Error("Invalid daily practice counts.");
    }
  }
  if (Object.keys(p.skills).length > SKILLS.length)
    throw Error("Too many skills.");
  for (const [id, s] of Object.entries(p.skills)) {
    if (
      !SKILLS.some((skill) => skill.id === id) ||
      !s ||
      typeof s !== "object" ||
      !s.card
    )
      throw Error("Unknown or invalid skill.");
    const card = s.card;
    for (const key of [
      "stability",
      "difficulty",
      "elapsed_days",
      "scheduled_days",
      "learning_steps",
      "reps",
      "lapses",
      "state",
      "due",
    ] as const)
      if (!finite(card[key])) throw Error("Invalid review state.");
    if (
      !integer(card.state, 0, 3) ||
      card.difficulty > 10 ||
      card.stability > 1e6 ||
      !finite(card.due, 946684800000, Date.now() + 366 * 86400000) ||
      (card.last_review !== undefined &&
        !finite(card.last_review, 946684800000, Date.now() + 86400000))
    )
      throw Error("Invalid review dates or values.");
    for (const key of ["reps", "lapses", "learning_steps"] as const)
      if (!integer(card[key])) throw Error("Invalid review count.");
    if (
      !Array.isArray(s.recent) ||
      s.recent.length > 5 ||
      s.recent.some(
        (e: any) =>
          !e ||
          typeof e.q !== "string" ||
          e.q.length > 4096 ||
          !integer(e.template, 0, 1) ||
          typeof e.correct !== "boolean",
      ) ||
      new Set(s.recent.map((e: any) => e.q)).size !== s.recent.length
    )
      throw Error("Invalid skill evidence.");
    if (
      typeof s.needsRemediation !== "boolean" ||
      typeof s.extraPracticeGiven !== "boolean" ||
      ![
        s.failureStreak,
        s.lastFailureAt,
        s.otherSinceFailure,
        s.lastSeen,
      ].every((item) => integer(item))
    )
      throw Error("Invalid practice state.");
  }
  if (
    !Array.isArray(p.pendingDiagnostics) ||
    p.pendingDiagnostics.length > SKILLS.length ||
    p.pendingDiagnostics.some((id) =>
      !SKILLS.some((skill) => skill.id === id),
    ) ||
    !Array.isArray(p.recentQuestionSignatures) ||
    p.recentQuestionSignatures.length > 10 ||
    p.recentQuestionSignatures.some(
      (signature) =>
        typeof signature !== "string" || signature.length > 4096,
    )
  )
    throw Error("Invalid practice queue.");
  return p;
}
