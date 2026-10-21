// Same simulated students for the current scheduler and the mastery prototype.
// Truth model (not BKT): each skill has a true chance to be applied correctly; it grows with practice.
// Each student has one hidden weak spot (a level 1-3 skill stuck at 0.5 until it is practised 3 times as the main skill).
import { isReady, allEnabledReady, chooseNext, finishQuestion, freshProgress, recordOutcome, type AppState, type Current } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/progress';
import * as M from './mastery';
import { SKILLS } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/catalog';
import { random } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/math';
import type { Config, Question } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/types';
const c: Config = { schemaVersion: 1, revision: 'x', initialUnlockedLevel: 1, disabledFamilies: [], sessionLength: 12 };
const P0: Record<number, number> = { 1: 0.9, 2: 0.82, 3: 0.68, 4: 0.62, 5: 0.58, 6: 0.55 };
const WEAK_POOL = ['power', 'sum', 'root', 'exp', 'log', 'sin', 'cos', 'tan', 'sec', 'product', 'quotient', 'chain'];
function student(seed: string) {
  const r = random(seed);
  const p: Record<string, number> = {}; for (const s of SKILLS) p[s.id] = P0[s.level];
  const weakId = WEAK_POOL[Math.floor(r() * WEAK_POOL.length)]; p[weakId] = 0.5;
  let weakFix = 0;
  return {
    weakId, r, p, fixed: () => weakFix >= 3,
    answer(q: Question, reason = '') {
      const R = [...new Set([q.primarySkill, ...(q.requiredSkills ?? q.supportingSkills)])];
      const ok = R.every((k) => r() < p[k]);
      for (const k of R) if (k !== weakId || weakFix >= 3) p[k] += (0.97 - p[k]) * (k === q.primarySkill ? 0.3 : 0.12);
      if (q.primarySkill === weakId && ['Rebuild this skill', 'Targeted check'].includes(reason) && ++weakFix === 3) p[weakId] = 0.75;
      return ok;
    },
  };
}
type Res = { mix: number; allBasic: number; L6: number; falseReady: number; weakFalseReady: number; q: number; firstPC: number; remed: number; remedOnWeak: number; firstWeakRemed: number; weakSeenAt: number };
function runCurrent(seed: string): Res {
  const S = student(seed); let now = Date.parse('2026-01-01T00:00:00Z'); const p = freshProgress(c, now);
  const st: AppState = { version: 1, progress: p, session: { config: c, completed: 0, independent: 0, assisted: 0, skipped: 0, finished: false } };
  const res: Res = { mix: 0, allBasic: -1, L6: -1, falseReady: 0, weakFalseReady: 0, q: 0, firstPC: -1, remed: 0, remedOnWeak: 0, firstWeakRemed: -1, weakSeenAt: -1 };
  while (res.q < 6000 && !allEnabledReady(p, c)) {
    let picked; try { picked = chooseNext(p, c, now); } catch { now = Math.min(...Object.values(p.skills).map((s) => s.card.due).filter((d) => d > now)); continue; }
    const q = picked.question; track(res, q, picked.reason, S.weakId);
    const cur: Current = { question: q, draft: [''], hintsUsed: 0, recorded: false, closed: false, reason: picked.reason };
    recordOutcome(p, cur, c, S.answer(q, picked.reason) ? { status: 'correct', evidence: 'symbolic' } : { status: 'incorrect', feedbackCode: 'x' }, now);
    st.session!.current = cur; finishQuestion(st); res.q++; now += 45_000; prog(res, p);
  }
  for (const k of SKILLS) if (isReady(p.skills[k.id]) && S.p[k.id] < 0.7) { res.falseReady++; if (k.id === S.weakId) res.weakFalseReady++; }
  return res;
}
function runMastery(seed: string): Res {
  const S = student(seed); let now = Date.parse('2026-01-01T00:00:00Z'); const p = M.freshProgress(c, now);
  const res: Res = { mix: 0, allBasic: -1, L6: -1, falseReady: 0, weakFalseReady: 0, q: 0, firstPC: -1, remed: 0, remedOnWeak: 0, firstWeakRemed: -1, weakSeenAt: -1 };
  while (res.q < 6000 && !M.allReady(p, c)) {
    let picked; try { picked = M.choose(p, c, now); } catch { const due = Object.values(p.skills).map((s) => s.card.due).filter((d) => d > now); if (!due.length) break; now = Math.min(...due); continue; }
    const q = picked.question; track(res, q, picked.reason, S.weakId);
    const cur: Current = { question: q, draft: [''], hintsUsed: 0, recorded: false, closed: false, reason: picked.reason };
    M.record(p, cur, c, S.answer(q, picked.reason), now); M.finish(p, q); res.q++; now += 45_000; prog(res, p);
  }
  for (const k of SKILLS) if (M.ready(p.skills[k.id] as any) && S.p[k.id] < 0.7) { res.falseReady++; if (k.id === S.weakId) res.weakFalseReady++; }
  return res;
}
function prog(res: Res, p: any) { if (res.L6 < 0 && p.unlockedLevel >= 6) res.L6 = res.q; if (res.allBasic < 0 && SKILLS.every((k) => p.skills[k.id]?.basic.passed)) res.allBasic = res.q; }
function track(res: Res, q: Question, reason: string, weakId: string) {
  if (res.allBasic < 0 && (q.role === 'mix')) res.mix++;
  if (res.firstPC < 0 && ['product', 'quotient', 'chain'].includes(q.primarySkill)) res.firstPC = res.q;
  const uses = [q.primarySkill, ...(q.requiredSkills ?? [])].includes(weakId);
  if (res.weakSeenAt < 0 && uses && q.primarySkill !== weakId) res.weakSeenAt = res.q;
  if (['Targeted check', 'Rebuild this skill'].includes(reason)) { res.remed++; if (q.primarySkill === weakId) { res.remedOnWeak++; if (res.firstWeakRemed < 0) res.firstWeakRemed = res.q; } }
}
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const E = { model: 'elo', ready: 0.9, stickyReady: true };
const VARIANTS: [string, any][] = [['current', null],
  ['BKT (state model)', { stickyReady: true }],
  ['Elo/IRT ready .90', { ...E, countComp: false, Kmin: 1, compK: 0.5 }],
  ['Elo/IRT ready .85', { ...E, countComp: false, Kmin: 1, compK: 0.5, ready: 0.85 }]];
for (const [name, v] of VARIANTS) {
  const fn = v ? runMastery : runCurrent; if (v) Object.assign(M.BKT, { s: 0.08, T: 0.1, tAll: false, weak: 0.6, model: 'bkt', ready: 0.95, Kmin: 0.4, stickyReady: false, compK: 1, countComp: true }, v);
  const rs = Array.from({ length: 40 }, (_, i) => fn(`t-${i}`));
  console.log(`${name.padEnd(20)} mixedBeforeAllBasic=${med(rs.map((r) => r.mix))} L6=${med(rs.map((r) => r.L6))} allBasic=${med(rs.map((r) => r.allBasic))} firstP/C=${med(rs.map((r) => r.firstPC))} allReady=${med(rs.map((r) => r.q))} remediation=${med(rs.map((r) => r.remed))} (${Math.round(100 * med(rs.map((r) => r.remed / r.q)))}%) onWeakSpot=${Math.round(100 * med(rs.map((r) => (r.remed ? r.remedOnWeak / r.remed : 0))))}% weakDetectedAfter=${med(rs.filter((r) => r.firstWeakRemed >= 0).map((r) => r.firstWeakRemed - Math.max(0, r.weakSeenAt)))}q weakTargeted=${rs.filter((r) => r.firstWeakRemed >= 0).length}/40 falseReadyAvg=${(rs.reduce((a, r) => a + r.falseReady, 0) / 40).toFixed(2)} weakSpotLabelledReady=${rs.filter((r) => r.weakFalseReady).length}/40`);
}
