// Prototype: conjunctive BKT mastery model on top of FSRS (research only, not product code).
const SRC = '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src';
import { fsrs, Rating } from 'ts-fsrs';
import { freshProgress, stateFor, storeCard, reviveCard, basicPassed, unlock, baseOpen, mixOpen, type Progress, type SkillState, type Current } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/progress';
import { SKILLS, skillById } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/catalog';
import { generateQuestion } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/questions';
import { TEMPLATES, open } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/templates';
import { questionFingerprint } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/question-identity';
import type { Config, Question, Role } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/types';
void SRC;
export const BKT = { s: 0.08, g: 0.05, T: 0.1, prior: { 1: 0.35, 2: 0.25, 3: 0.15, 4: 0.12, 5: 0.1, 6: 0.1 } as Record<number, number>, pass: 0.8, ready: 0.95, weak: 0.6, mixEvery: 3, implicit: true, tAll: false, model: 'bkt' as 'bkt' | 'elo', init: { 1: 0.62, 2: 0.58, 3: 0.45, 4: 0.4, 5: 0.35, 6: 0.35 } as Record<number, number>, K0: 2.6, Kdecay: 0.6, Kmin: 0.4, stickyReady: false, compK: 1, countComp: true };
type MS = SkillState & { m?: number; n?: number };
const sig = (x: number) => 1 / (1 + Math.exp(-x)); const logit = (p: number) => Math.log(p / (1 - p));
const mOf = (p: Progress, id: string) => (p.skills[id] as MS | undefined)?.m ?? 0;
export const weak = (s?: MS) => !!s && s.basic.passed && (s.m ?? 1) < BKT.weak;
export const ready = (s?: MS) => !!s && s.basic.passed && (s.mix.passed || (s.m ?? 0) >= BKT.ready) && !weak(s);
export function allReady(p: Progress, c: Config) { return SKILLS.filter((s) => !c.disabledFamilies.includes(s.id)).every((s) => ready(p.skills[s.id] as MS)); }
export function record(p: Progress, cur: Current, c: Config, good: boolean, now: number) {
  const q = cur.question;
  const R = [...new Set([q.primarySkill, ...(q.requiredSkills ?? q.supportingSkills)])].filter((id) => !c.disabledFamilies.includes(id));
  const st = R.map((id) => { const s = stateFor(p, id, now) as MS; s.m ??= BKT.model === 'elo' ? BKT.init[skillById(id).level] : BKT.prior[skillById(id).level]; return s; });
  if (BKT.model === 'elo') {
    const P = st.reduce((a, s) => a * s.m!, 1);
    st.forEach((s, i) => {
      const n = s.n ?? 0, K = Math.max(BKT.Kmin, BKT.K0 / (1 + BKT.Kdecay * n)) * (i === 0 ? 1 : BKT.compK);
      const grad = good ? 1 - s.m! : (-P * (1 - s.m!)) / (1 - P);
      s.m = Math.min(0.995, Math.max(0.02, sig(logit(s.m!) + K * grad))); if (i === 0 || BKT.countComp) s.n = n + 1;
    });
  } else {
  const cs = st.map((s) => s.m! * (1 - BKT.s) + (1 - s.m!) * BKT.g);
  const C = cs.reduce((a, b) => a * b, 1);
  st.forEach((s, i) => {
    const m = s.m!;
    let post = good ? (m * (1 - BKT.s)) / cs[i] : (m * (1 - (1 - BKT.s) * (C / cs[i]))) / (1 - C);
    if (i === 0 || BKT.tAll) post = post + (1 - post) * BKT.T;
    s.m = Math.min(0.999, Math.max(0.001, post));
  });
  }
  const prim = st[0];
  // FSRS: primary skill as today; a correct combined question also counts as a review of due component skills.
  st.forEach((s, i) => {
    if (i > 0 && !(good && BKT.implicit)) return;
    if (now >= s.card.due) s.card = storeCard(fsrs(p.fsrsParameters).next(reviveCard(s.card), new Date(now), good ? Rating.Good : Rating.Again).card);
  });
  if (prim.m! >= BKT.pass) prim.basic.passed = true;
  for (const s of st) if (BKT.stickyReady && s.basic.passed && s.m! >= BKT.ready) s.mix.passed = true;
  for (const s of st) s.basic.repair = weak(s);
  if (!good) { prim.failureStreak++; prim.otherSinceFailure = 0; } else prim.failureStreak = 0;
  for (const s of st) if (s.basic.repair && s !== prim) s.otherSinceFailure = 0;
  prim.lastSeen = ++p.sequence; prim.lastTemplate = q.templateKey;
  cur.recorded = true; unlock(p, c);
}
export function finish(p: Progress, q: Question) {
  for (const [id, s] of Object.entries(p.skills)) if (id !== q.primarySkill && s.basic.repair) s.otherSinceFailure++;
  p.sequence++;
}
let asked = 0;
export function choose(p: Progress, c: Config, now: number): { question: Question; reason: string } {
  unlock(p, c);
  const ok = (k: string) => basicPassed(p, c, k);
  const available = SKILLS.filter((s) => s.level <= p.unlockedLevel && !c.disabledFamilies.includes(s.id));
  const slot = (id: string, role: Role, reason: string) => {
    const pool0 = TEMPLATES[id].filter((t) => t.role === role && open(t, ok)); if (!pool0.length) return undefined;
    const st = stateFor(p, id, now); const fresh = pool0.filter((t) => t.key !== st.lastTemplate); const pool = fresh.length ? fresh : pool0;
    let question: Question | undefined;
    for (let n = 0; n < 30 && !question; n++) { const q = generateQuestion(id, `${p.sequence}:${now}:${n}`, { key: pool[(p.sequence + n) % pool.length].key, ok }); if (!p.recentQuestionSignatures.includes(questionFingerprint(q.signature))) question = q; }
    question ??= generateQuestion(id, `${p.sequence}:${now}:fb`, { key: pool[0].key, ok });
    p.recentQuestionSignatures = [...p.recentQuestionSignatures, questionFingerprint(question.signature)].slice(-10);
    return { question, reason };
  };
  asked++;
  const sorted = [...available].sort((a, b) => (p.skills[a.id]?.lastSeen ?? -1) - (p.skills[b.id]?.lastSeen ?? -1));
  // 1. A skill that the model now thinks is weak: targeted Basic practice, after two other questions.
  for (const s of sorted) { const t = p.skills[s.id] as MS; if (weak(t) && t.otherSinceFailure >= 2) { const x = slot(s.id, 'basic', 'Rebuild this skill'); if (x) return x; } }
  // 2. Due FSRS reviews.
  for (const s of sorted.filter((s) => p.skills[s.id] && p.skills[s.id].basic.passed && p.skills[s.id].card.due <= now && !weak(p.skills[s.id] as MS)).sort((a, b) => p.skills[a.id].card.due - p.skills[b.id].card.due)) {
    const x = slot(s.id, mixOpen(p, c, s) ? 'mix' : 'basic', 'Spaced review'); if (x) return x;
  }
  // 3. New Basic work, with one combined (Mixed) question in every BKT.mixEvery.
  const mixCand = available.filter((s) => { const t = p.skills[s.id] as MS; return t?.basic.passed && !ready(t) && !weak(t) && mixOpen(p, c, s); });
  const newCand = available.filter((s) => { const t = p.skills[s.id] as MS; return baseOpen(p, c, s) && !t?.basic.passed && !(weak(t) && t.otherSinceFailure < 2); });
  const mixTurn = asked % BKT.mixEvery === 0;
  if (mixTurn || !newCand.length) for (const s of mixCand) { const x = slot(s.id, 'mix', 'Mix it up'); if (x) return x; }
  for (const s of newCand) { const x = slot(s.id, 'basic', p.skills[s.id] ? 'Keep building' : 'New skill'); if (x) return x; }
  for (const s of mixCand) { const x = slot(s.id, 'mix', 'Mix it up'); if (x) return x; }
  throw Error('PRACTICE_PAUSE');
}
export { freshProgress, mOf };
