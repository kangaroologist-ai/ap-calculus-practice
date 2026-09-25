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
// One learning line: two independent first-try successes on different
// questions pass it. `passed` is sticky so unlocking never goes backwards; a
// later miss only sets `repair` until two new successes clear it again.
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
  // Local only (not exported): rotates templates within a skill.
  lastTemplate?: string;
}
export interface Progress {
  formatVersion: 2;
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
    formatVersion: 2,
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
export const lineReady = (l?: LineState) => !!l && l.streak >= 2 && !l.repair;
export const isReady = (s?: SkillState) =>
  lineReady(s?.basic) && lineReady(s?.mix);
export const needsRemediation = (s?: SkillState) =>
  !!s && (s.basic.repair || s.mix.repair);
// A disabled skill never blocks anything that depends on it.
export const basicPassed = (p: Progress, c: Config, id: string) =>
  c.disabledFamilies.includes(id) || !!p.skills[id]?.basic.passed;
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
function updateLine(l: LineState, fingerprint: string, good: boolean) {
  if (!good) {
    Object.assign(l, { streak: 0, lastQ: fingerprint, repair: true });
    return;
  }
  if (l.lastQ !== fingerprint)
    Object.assign(l, { streak: Math.min(2, l.streak + 1), lastQ: fingerprint });
  if (l.streak >= 2) {
    l.passed = true;
    l.repair = false;
    delete l.legacy;
  }
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
  // Questions saved before Phase 2 carry no role; they count as basic.
  updateLine(
    s[q.role ?? "basic"],
    questionFingerprint(q.signature),
    good,
  );
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
    // Only the first failure of a streak is informative; repeated misses on the
    // same skill would otherwise keep re-queuing diagnostics for skills we
    // already know are shaky (SPEC-S1).
    if (s.failureStreak === 1) {
      const diagnostic = (q.requiredSkills ?? q.supportingSkills).filter(
        (id) =>
          !c.disabledFamilies.includes(id) &&
          skillById(id).level <= p.unlockedLevel &&
          isReady(p.skills[id]),
      );
      if (diagnostic.length) {
        p.pendingDiagnostics = [
          ...new Set([...p.pendingDiagnostics, ...diagnostic]),
        ];
      }
    }
  }
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
  // Mixed work only once the skill's basic line is solid; otherwise basic.
  const reviewRole = (s: Skill): Role =>
    mixOpen(p, c, s) && !p.skills[s.id].basic.repair ? "mix" : "basic";
  const repairRole = (s: Skill): Role =>
    p.skills[s.id].mix.repair && !p.skills[s.id].basic.repair && mixOpen(p, c, s)
      ? "mix"
      : "basic";
  const ready = (t: SkillState) =>
    !needsRemediation(t) || t.otherSinceFailure >= 2;
  // Diagnostics first; resolving one is not evidence against any other skill.
  const diag = p.pendingDiagnostics.find((id) =>
    available.some((s) => s.id === id),
  );
  if (diag) {
    p.pendingDiagnostics = p.pendingDiagnostics.filter((x) => x !== diag);
    const picked = slot(diag, "basic", "Targeted check");
    if (picked) return picked;
  }
  const sorted = [...available].sort(
    (a, b) =>
      (p.skills[a.id]?.lastSeen ?? -1) - (p.skills[b.id]?.lastSeen ?? -1),
  );
  for (const s of sorted) {
    const t = p.skills[s.id];
    if (
      !t ||
      !needsRemediation(t) ||
      t.otherSinceFailure < 2 ||
      (t.extraPracticeGiven && now < t.card.due)
    )
      continue;
    t.extraPracticeGiven = true;
    const picked = slot(s.id, repairRole(s), "Rebuild this skill");
    if (picked) return picked;
  }
  const due = sorted
    .filter((s) => p.skills[s.id]?.card.due <= now && ready(p.skills[s.id]))
    .sort((a, b) => p.skills[a.id].card.due - p.skills[b.id].card.due);
  for (const s of due) {
    const picked = slot(s.id, reviewRole(s), "Spaced review");
    if (picked) return picked;
  }
  for (const s of available) {
    const t = p.skills[s.id];
    if (t && !ready(t)) continue;
    if (baseOpen(p, c, s) && !lineReady(t?.basic)) {
      const picked = slot(s.id, "basic", t ? "Keep building" : "New skill");
      if (picked) return picked;
    }
    if (mixOpen(p, c, s) && !lineReady(t?.mix)) {
      const picked = slot(s.id, "mix", "Mix it up");
      if (picked) return picked;
    }
  }
  for (const s of sorted) {
    const t = p.skills[s.id];
    if (
      t?.card.last_review !== undefined &&
      t.card.due <= now &&
      now - t.card.last_review >= 60000
    ) {
      const picked = slot(
        s.id,
        needsRemediation(t) ? repairRole(s) : reviewRole(s),
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
