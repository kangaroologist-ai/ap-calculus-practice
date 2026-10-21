import { questionFingerprint } from "./question-identity";
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  FSRSVersion,
  Rating,
  type Card,
  type FSRSParameters,
} from "ts-fsrs";
import { SKILLS, skillById, CURRICULUM_VERSION } from "./catalog";
import { generateQuestion } from "./questions";
import { TEMPLATES, open } from "./templates";
import {
  PASS_THRESHOLD,
  READY_THRESHOLD,
  questionSkills,
  seedMastery,
  startMastery,
  staysInRepair,
  updateMasteries,
} from "./mastery";
import type { Question, Config, Role, Skill, Verdict } from "./types";
export const SCHEDULER_VERSION = "5.4.2";
export const ALGORITHM_VERSION = FSRSVersion;
export const PARAMETERS = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 180,
  enable_fuzz: false,
  enable_short_term: true,
});
export type StoredCard = Omit<Card, "due" | "last_review"> & {
  due: number;
  last_review?: number;
};
// A learning line keeps its old streak bookkeeping, but the mastery estimate
// now decides pass and repair. `passed` is sticky so unlocking never goes
// backwards; `basic.repair` is the weak-skill repair flag.
export interface LineState {
  streak: number;
  lastQ?: string;
  passed: boolean;
  repair: boolean;
  // Passed by conservative migration from a v1 Ready skill, not in v2 itself.
  legacy?: true;
}
export interface SkillState {
  card: StoredCard;
  basic: LineState;
  mix: LineState;
  failureStreak: number;
  otherSinceFailure: number;
  extraPracticeGiven: boolean;
  lastSeen: number;
  // Absent on saves made before the mastery model; seeded lazily on first read.
  mastery?: number;
  // Questions where this skill was the primary skill.
  observations?: number;
  // Local only (not exported): rotates templates within a skill.
  lastTemplate?: string;
}
export interface Progress {
  formatVersion: 3;
  curriculumVersion: string;
  schedulerPackageVersion: string;
  fsrsAlgorithmVersion: string;
  fsrsParameters: FSRSParameters;
  unlockedLevel: number;
  streak?: number;
  practiceDays?: Record<string, number>;
  skills: Record<string, SkillState>;
  pendingDiagnostics: string[];
  recentQuestionSignatures: string[];
  sequence: number;
  updatedAt: number;
}
export interface Current {
  question: Question;
  draft: string[];
  hintsUsed: number;
  recorded: boolean;
  verdict?: Verdict;
  closed: boolean;
  reason: string;
  firstOutcome?: "good" | "again";
}
export interface Session {
  config: Config;
  completed: number;
  independent: number;
  assisted: number;
  skipped: number;
  current?: Current;
  finished: boolean;
}
export interface AppState {
  version: 1;
  progress: Progress;
  session?: Session;
  lastImportedId?: string;
}
export const storeCard = (c: Card): StoredCard => {
  const { due, last_review, ...rest } = c;
  return {
    ...rest,
    due: due.getTime(),
    ...(last_review ? { last_review: last_review.getTime() } : {}),
  };
};
export const reviveCard = (c: StoredCard): Card => ({
  ...c,
  due: new Date(c.due),
  last_review:
    c.last_review === undefined ? undefined : new Date(c.last_review),
});
export function freshProgress(config: Config, now = Date.now()): Progress {
  return {
    formatVersion: 3,
    curriculumVersion: CURRICULUM_VERSION,
    schedulerPackageVersion: SCHEDULER_VERSION,
    fsrsAlgorithmVersion: ALGORITHM_VERSION,
    fsrsParameters: structuredClone(PARAMETERS),
    unlockedLevel: config.initialUnlockedLevel,
    streak: 0,
    practiceDays: {},
    skills: {},
    pendingDiagnostics: [],
    recentQuestionSignatures: [],
    sequence: 0,
    updatedAt: now,
  };
}
export function stateFor(p: Progress, id: string, now: number): SkillState {
  return (p.skills[id] ??= {
    card: storeCard(createEmptyCard(new Date(now))),
    basic: freshLine(),
    mix: freshLine(),
    failureStreak: 0,
    otherSinceFailure: 0,
    extraPracticeGiven: false,
    lastSeen: 0,
  });
}
export const freshLine = (): LineState => ({
  streak: 0,
  passed: false,
  repair: false,
});
export const lineReady = (l?: LineState) => !!l && l.passed && !l.repair;
function unifyRepair(s: SkillState) {
  // An old save may mark an unpassed line as repairing. Keep that flag until
  // masteryOf seeds from it, so the seed does not depend on call order.
  if (!s.basic.passed) return;
  s.basic.repair = s.basic.repair || s.mix.repair;
  s.mix.repair = false;
}
export function isReady(s?: SkillState) {
  if (!s) return false;
  unifyRepair(s);
  return s.basic.passed && s.mix.passed && !s.basic.repair;
}
export function needsRemediation(s?: SkillState) {
  if (!s) return false;
  unifyRepair(s);
  return s.basic.passed && s.basic.repair;
}
// A disabled skill never blocks anything that depends on it.
export const basicPassed = (p: Progress, c: Config, id: string) =>
  c.disabledFamilies.includes(id) || !!p.skills[id]?.basic.passed;
// Read the mastery estimate, seeding old saves from their line state.
export function masteryOf(p: Progress, id: string): number {
  const t = p.skills[id];
  if (!t) return startMastery(skillById(id).level);
  if (t.mastery === undefined)
    t.mastery =
      Math.round(
        seedMastery({
          level: skillById(id).level,
          ready: lineReady(t.basic) && lineReady(t.mix),
          passed: !!t.basic.passed,
          repair: !!t.basic.repair || !!t.mix.repair,
        }) * 1000,
      ) / 1000;
  if (t.basic.passed) unifyRepair(t);
  else {
    // The seed has read the old flag; before the first pass a low estimate is
    // ordinary learning, not repair.
    t.basic.repair = false;
    t.mix.repair = false;
  }
  return t.mastery;
}
export function unlock(p: Progress, c: Config) {
  p.unlockedLevel = Math.max(p.unlockedLevel, c.initialUnlockedLevel);
  while (
    p.unlockedLevel < 6 &&
    SKILLS.filter((s) => s.level === p.unlockedLevel).every((s) =>
      basicPassed(p, c, s.id),
    )
  )
    p.unlockedLevel++;
}
export const baseOpen = (p: Progress, c: Config, s: Skill) =>
  s.level <= p.unlockedLevel &&
  s.prerequisites.every((k) => basicPassed(p, c, k));
const openTemplates = (p: Progress, c: Config, id: string, role: Role) =>
  TEMPLATES[id].filter(
    (t) => t.role === role && open(t, (k) => basicPassed(p, c, k)),
  );
export const mixOpen = (p: Progress, c: Config, s: Skill) =>
  !!p.skills[s.id]?.basic.passed &&
  openTemplates(p, c, s.id, "mix").length > 0;
export function allEnabledReady(p: Progress, c: Config): boolean {
  return SKILLS.filter((s) => !c.disabledFamilies.includes(s.id)).every((s) =>
    isReady(p.skills[s.id]),
  );
}
function updateStreak(l: LineState, fingerprint: string, good: boolean) {
  if (!good) {
    Object.assign(l, { streak: 0, lastQ: fingerprint });
    return;
  }
  if (l.lastQ !== fingerprint)
    Object.assign(l, { streak: Math.min(2, l.streak + 1), lastQ: fingerprint });
}
export function localPracticeDay(now = Date.now()): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function todayCount(p: Progress, now = Date.now()): number {
  return p.practiceDays?.[localPracticeDay(now)] ?? 0;
}
export function recordOutcome(
  p: Progress,
  current: Current,
  c: Config,
  verdict: Verdict,
  now = Date.now(),
): boolean {
  if (current.recorded || !["correct", "incorrect"].includes(verdict.status))
    return false;
  const q = current.question,
    s = stateFor(p, q.primarySkill, now),
    good = verdict.status === "correct" && current.hintsUsed === 0;
  current.recorded = true;
  p.streak = good ? Math.min((p.streak ?? 0) + 1, 1e9) : 0;
  const day = localPracticeDay(now);
  const days = {
    ...p.practiceDays,
    [day]: Math.min(todayCount(p, now) + 1, 1e9),
  };
  p.practiceDays = Object.fromEntries([
    ...Object.entries(days)
      .filter(([key]) => key !== day)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30),
    [day, days[day]],
  ]);
  // A question contributes at most one event, including when help precedes submission.
  if (now >= s.card.due) {
    s.card = storeCard(
      fsrs(p.fsrsParameters).next(
        reviveCard(s.card),
        new Date(now),
        good ? Rating.Good : Rating.Again,
      ).card,
    );
  }
  const skills = questionSkills(q, c.disabledFamilies),
    states = skills.map((id) => stateFor(p, id, now)),
    masteries = skills.map((id) => masteryOf(p, id)),
    wasRepair = states.map((t) => !!t.basic.repair),
    next = updateMasteries(
      masteries,
      good,
      states.map((t) => t.observations ?? 0),
      skills.indexOf(q.primarySkill),
    );
  states.forEach((t, i) => {
    // Three decimals fit the compact profile's per-mille integer exactly.
    t.mastery = Math.round(next[i] * 1000) / 1000;
    if (skills[i] === q.primarySkill)
      t.observations = (t.observations ?? 0) + 1;
    if (next[i] >= PASS_THRESHOLD) t.basic.passed = true;
    if (t.basic.passed && next[i] >= READY_THRESHOLD) t.mix.passed = true;
    // Before the first pass a low estimate is ordinary learning, not repair.
    t.basic.repair =
      !!t.basic.passed && staysInRepair(next[i], t.basic.repair);
  });
  // A correct combined question also reviews each component card that is due.
  if (good)
    skills.forEach((id, i) => {
      const t = states[i];
      if (id === q.primarySkill || now < t.card.due) return;
      t.card = storeCard(
        fsrs(p.fsrsParameters).next(
          reviveCard(t.card),
          new Date(now),
          Rating.Good,
        ).card,
      );
    });
  // Questions saved before Phase 2 carry no role; they count as basic.
  updateStreak(
    s[q.role ?? "basic"],
    questionFingerprint(q.signature),
    good,
  );
  // Passed lines stay at two so older saved-progress readers agree.
  for (const t of states) {
    if (t.basic.passed) t.basic.streak = 2;
    if (t.mix.passed) t.mix.streak = 2;
  }
  current.firstOutcome = good ? "good" : "again";
  s.lastSeen = ++p.sequence;
  s.lastTemplate = q.templateKey;
  if (good) {
    s.failureStreak = 0;
    s.extraPracticeGiven = false;
  } else {
    s.failureStreak++;
    s.otherSinceFailure = 0;
    s.extraPracticeGiven = false;
  }
  states.forEach((t, i) => {
    if (t !== s && t.basic.repair && !wasRepair[i]) t.otherSinceFailure = 0;
  });
  p.updatedAt = now;
  unlock(p, c);
  return true;
}
export function recordHint(
  p: Progress,
  current: Current,
  c: Config,
  now = Date.now(),
) {
  current.hintsUsed = Math.min(3, current.hintsUsed + 1);
  recordOutcome(
    p,
    current,
    c,
    { status: "incorrect", feedbackCode: "assisted" },
    now,
  );
}
export function chooseNext(
  p: Progress,
  c: Config,
  now = Date.now(),
): { question: Question; reason: string } {
  unlock(p, c);
  const available = SKILLS.filter(
    (s) => s.level <= p.unlockedLevel && !c.disabledFamilies.includes(s.id),
  );
  if (!available.length)
    throw Error("No enabled skills. Please contact your teacher.");
  for (const s of available) {
    const t = p.skills[s.id];
    if (t) unifyRepair(t);
  }
  const ok = (k: string) => basicPassed(p, c, k);
  const slot = (id: string, role: Role, reason: string) => {
    const candidates = openTemplates(p, c, id, role);
    if (!candidates.length) return undefined;
    const st = stateFor(p, id, now);
    const fresh = candidates.filter((t) => t.key !== st.lastTemplate);
    const pool = fresh.length ? fresh : candidates;
    let question: Question | undefined;
    for (let n = 0; n < 30; n++) {
      const seed = `${p.sequence}:${now}:${n}`;
      const key = pool[(p.sequence + n) % pool.length].key;
      const q = generateQuestion(id, seed, { key, ok });
      if (
        !p.recentQuestionSignatures.includes(questionFingerprint(q.signature))
      ) {
        question = q;
        break;
      }
    }
    question ??= generateQuestion(id, `${p.sequence}:${now}:fallback`, {
      key: pool[0].key,
      ok,
    });
    p.recentQuestionSignatures = [
      ...p.recentQuestionSignatures,
      questionFingerprint(question.signature),
    ].slice(-10);
    return { question, reason };
  };
  const sorted = [...available].sort(
    (a, b) =>
      (p.skills[a.id]?.lastSeen ?? -1) - (p.skills[b.id]?.lastSeen ?? -1),
  );
  // 1. A weak skill gets targeted Basic practice after two other questions.
  const repairCand = available
    .filter((s) => {
      const t = p.skills[s.id];
      return (
        !!t &&
        t.basic.passed &&
        t.basic.repair &&
        t.otherSinceFailure >= 2
      );
    })
    .sort((a, b) => masteryOf(p, b.id) - masteryOf(p, a.id));
  for (const s of repairCand) {
    const t = p.skills[s.id];
    t.extraPracticeGiven = true;
    const picked = slot(s.id, "basic", "Rebuild this skill");
    if (picked) return picked;
  }
  // 2. Due FSRS reviews of passed skills that are not in repair.
  const due = sorted
    .filter((s) => {
      const t = p.skills[s.id];
      return !!t && t.basic.passed && !t.basic.repair && t.card.due <= now;
    })
    .sort((a, b) => p.skills[a.id].card.due - p.skills[b.id].card.due);
  for (const s of due) {
    const picked = slot(
      s.id,
      mixOpen(p, c, s) ? "mix" : "basic",
      "Spaced review",
    );
    if (picked) return picked;
  }
  const mixCand = available.filter((s) => {
    const t = p.skills[s.id];
    return (
      !!t &&
      t.basic.passed &&
      !isReady(t) &&
      !t.basic.repair &&
      mixOpen(p, c, s)
    );
  });
  // 3. One Mixed question in every three, for a passed skill not yet Ready.
  if (Math.floor(p.sequence / 2) % 3 === 0)
    for (const s of mixCand) {
      const picked = slot(s.id, "mix", "Mix it up");
      if (picked) return picked;
    }
  // 4. New Basic work in catalog order.
  for (const s of available) {
    const t = p.skills[s.id];
    if (t?.basic.passed) continue;
    if (!baseOpen(p, c, s)) continue;
    const picked = slot(s.id, "basic", t ? "Keep building" : "New skill");
    if (picked) return picked;
  }
  // 5. Mixed candidates on any other turn.
  for (const s of mixCand) {
    const picked = slot(s.id, "mix", "Mix it up");
    if (picked) return picked;
  }
  // 6. Any other due card, including a non-passed skill's short-term review.
  for (const s of sorted) {
    const t = p.skills[s.id];
    if (
      t?.card.last_review !== undefined &&
      t.card.due <= now &&
      now - t.card.last_review >= 60000
    ) {
      const picked = slot(
        s.id,
        (t.basic.passed && t.basic.repair) || !mixOpen(p, c, s)
          ? "basic"
          : "mix",
        "Keep building",
      );
      if (picked) return picked;
    }
  }
  throw Error("PRACTICE_PAUSE");
}
export function finishQuestion(state: AppState, skip = false) {
  const ses = state.session,
    cur = ses?.current;
  if (!ses || !cur || cur.closed) return;
  cur.closed = true;
  ses.completed++;
  if (skip && !cur.recorded) {
    ses.skipped++;
    state.progress.streak = 0;
  } else if (
    cur.verdict?.status === "correct" &&
    cur.firstOutcome === "good"
  )
    ses.independent++;
  else ses.assisted++;
  for (const [id, s] of Object.entries(state.progress.skills))
    if (id !== cur.question.primarySkill && needsRemediation(s))
      s.otherSinceFailure++;
  state.progress.sequence++;
  state.progress.updatedAt = Date.now();
  // Continuous practice ends only when no eligible work is currently available.
}
