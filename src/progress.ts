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
import type { Question, Config, Verdict } from "./types";
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
export interface Evidence {
  q: string;
  template: number;
  correct: boolean;
}
export interface SkillState {
  card: StoredCard;
  recent: Evidence[];
  needsRemediation: boolean;
  failureStreak: number;
  lastFailureAt: number;
  otherSinceFailure: number;
  extraPracticeGiven: boolean;
  lastSeen: number;
}
export interface Progress {
  formatVersion: 1;
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
    formatVersion: 1,
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
    recent: [],
    needsRemediation: false,
    failureStreak: 0,
    lastFailureAt: 0,
    otherSinceFailure: 0,
    extraPracticeGiven: false,
    lastSeen: 0,
  });
}
function hasAdvanceEvidence(s: SkillState): boolean {
  const lastTwo = s.recent.slice(-2);
  return (
    lastTwo.length === 2 &&
    lastTwo.every((entry) => entry.correct) &&
    new Set(lastTwo.map((entry) => entry.q)).size === 2 &&
    new Set(lastTwo.map((entry) => entry.template)).size === 2
  );
}
export function isReady(s?: SkillState): boolean {
  return !!s && !s.needsRemediation && hasAdvanceEvidence(s);
}
export function unlock(p: Progress, c: Config) {
  p.unlockedLevel = Math.max(p.unlockedLevel, c.initialUnlockedLevel);
  while (p.unlockedLevel < 6) {
    const enabled = SKILLS.filter(
      (s) => s.level === p.unlockedLevel && !c.disabledFamilies.includes(s.id),
    );
    if (!enabled.every((s) => isReady(p.skills[s.id]))) break;
    p.unlockedLevel++;
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
  s.recent = [
    ...s.recent.filter(
      (x) => questionFingerprint(x.q) !== questionFingerprint(q.signature),
    ),
    {
      q: questionFingerprint(q.signature),
      template: q.template,
      correct: good,
    },
  ].slice(-5);
  s.lastSeen = ++p.sequence;
  if (good) {
    s.failureStreak = 0;
    s.needsRemediation = s.needsRemediation && !hasAdvanceEvidence(s);
    s.extraPracticeGiven = false;
  } else {
    s.needsRemediation = true;
    s.failureStreak++;
    s.lastFailureAt = p.sequence;
    s.otherSinceFailure = 0;
    s.extraPracticeGiven = false;
    const diagnostic = (q.requiredSkills ?? q.supportingSkills).filter(
      (id) => !c.disabledFamilies.includes(id),
    );
    if (diagnostic.length) {
      p.pendingDiagnostics = [
        ...new Set([...p.pendingDiagnostics, ...diagnostic]),
      ];
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
  // Use unblocked prerequisite diagnostics first; resolving one is not evidence against any other skill.
  const diag = p.pendingDiagnostics.find((id) =>
    available.some((s) => s.id === id),
  );
  let id = diag,
    reason = "Targeted check";
  if (id) p.pendingDiagnostics = p.pendingDiagnostics.filter((x) => x !== id);
  const sorted = [...available].sort(
    (a, b) =>
      (p.skills[a.id]?.lastSeen ?? -1) - (p.skills[b.id]?.lastSeen ?? -1),
  );
  if (!id) {
    const remedial = sorted.find((s) => {
      const t = p.skills[s.id];
      return (
        t?.needsRemediation &&
        t.otherSinceFailure >= 2 &&
        (!t.extraPracticeGiven || now >= t.card.due)
      );
    });
    if (remedial) {
      id = remedial.id;
      reason = "Rebuild this skill";
      stateFor(p, id, now).extraPracticeGiven = true;
    }
  }
  if (!id) {
    const due = sorted
      .filter(
        (s) =>
          p.skills[s.id] &&
          p.skills[s.id].card.due <= now &&
          (!p.skills[s.id].needsRemediation ||
            p.skills[s.id].otherSinceFailure >= 2),
      )
      .sort((a, b) => p.skills[a.id].card.due - p.skills[b.id].card.due)[0];
    if (due) {
      id = due.id;
      reason = "Spaced review";
    }
  }
  if (!id) {
    const eligible = available.filter((s) =>
      s.prerequisites.every(
        (k) => c.disabledFamilies.includes(k) || isReady(p.skills[k]),
      ),
    );
    const weak = eligible.find(
      (s) =>
        !isReady(p.skills[s.id]) &&
        (!p.skills[s.id]?.needsRemediation ||
          p.skills[s.id].otherSinceFailure >= 2),
    );
    const selected =
      weak ??
      sorted.find((s) => {
        const t = p.skills[s.id];
        return (
          t?.card.last_review !== undefined &&
          t.card.due <= now &&
          now - t.card.last_review >= 60000
        );
      });
    if (!selected) throw Error("PRACTICE_PAUSE");
    id = selected.id;
    reason = p.skills[id] ? "Keep building" : "New skill";
  }
  const st = stateFor(p, id, now);
  const variant = st.recent.length
    ? 1 - st.recent[st.recent.length - 1].template
    : 0;
  let question: Question | undefined;
  for (let n = 0; n < 30; n++) {
    const q = generateQuestion(id, `${p.sequence}:${now}:${n}`, variant);
    if (
      !p.recentQuestionSignatures.some(
        (signature) =>
          questionFingerprint(signature) === questionFingerprint(q.signature),
      )
    ) {
      question = q;
      break;
    }
  }
  question ??= generateQuestion(id, `${p.sequence}:${now}:fallback`, variant);
  p.recentQuestionSignatures = [
    ...p.recentQuestionSignatures,
    questionFingerprint(question.signature),
  ].slice(-10);
  return { question, reason };
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
    state.progress.skills[cur.question.primarySkill]?.recent.at(-1)?.correct
  )
    ses.independent++;
  else ses.assisted++;
  for (const [id, s] of Object.entries(state.progress.skills))
    if (id !== cur.question.primarySkill && s.needsRemediation)
      s.otherSinceFailure++;
  state.progress.sequence++;
  state.progress.updatedAt = Date.now();
  // Continuous practice ends only when no eligible work is currently available.
}
