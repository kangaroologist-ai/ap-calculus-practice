import { FLAGS, allEnabledReady, chooseNext, finishQuestion, freshProgress, recordOutcome, type AppState, type Current } from './progress-v';
import { SKILLS } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/catalog';
import { random } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/math';
import type { Config } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/types';
const AP: Record<string, number> = { constant:1, power:1, sum:1, root:1, sin:2, cos:2, exp:2, log:2, product:3, quotient:3, tan:3, cot:3, sec:3, csc:3, chain:4, nested:4, asin:4, acos:4, atan:4, implicit:5, inverse:5, higher:5, mixed:5, parametric:6, vector:6, polar:6 };
for (const s of SKILLS) { s.level = AP[s.id]; if (s.id === 'product') s.prerequisites = s.prerequisites.filter(x => x !== 'tan'); }
SKILLS.sort((a, b) => a.level - b.level);
const c: Config = { schemaVersion: 1, revision: 'x', initialUnlockedLevel: 1, disabledFamilies: [], sessionLength: 12 };
const BASE: Record<number, number> = { 1: 0.92, 2: 0.88, 3: 0.8, 4: 0.75, 5: 0.72, 6: 0.7 };
function run(seed: string, uniform?: number) {
  const r = random(seed); let now = Date.parse('2026-01-01T00:00:00Z');
  const p = freshProgress(c, now);
  const st: AppState = { version: 1, progress: p, session: { config: c, completed: 0, independent: 0, assisted: 0, skipped: 0, finished: false } };
  let q = 0, firstL3 = -1, allBasic = -1, remed = 0, sinceNew = 0, longestNoNew = 0;
  while (q < 6000 && !allEnabledReady(p, c)) {
    let picked; try { picked = chooseNext(p, c, now); } catch (e) { if ((e as Error).message !== 'PRACTICE_PAUSE') throw e; now = Math.min(...Object.values(p.skills).map(s => s.card.due).filter(d => d > now)); continue; }
    const qq = picked.question;
    if (picked.reason === 'New skill') { longestNoNew = Math.max(longestNoNew, sinceNew); sinceNew = 0; } else sinceNew++;
    if (['Targeted check', 'Rebuild this skill'].includes(picked.reason)) remed++;
    if (firstL3 < 0 && ['product','quotient','chain'].includes(qq.primarySkill)) firstL3 = q;
    const acc = uniform ?? (BASE[qq.level] - (qq.role === 'mix' ? 0.08 : 0));
    const cur: Current = { question: qq, draft: [''], hintsUsed: 0, recorded: false, closed: false, reason: picked.reason };
    recordOutcome(p, cur, c, r() < acc ? { status: 'correct', evidence: 'symbolic' } : { status: 'incorrect', feedbackCode: 'x' }, now);
    st.session!.current = cur; finishQuestion(st); q++; now += 45_000;
    if (allBasic < 0 && SKILLS.every(s => p.skills[s.id]?.basic.passed)) allBasic = q;
  }
  return { q, firstL3, allBasic, remed, longestNoNew };
}
const variants: [string, Partial<typeof FLAGS>][] = [
  ['current', {}],
  ['basics before mixed', { basicsFirst: true }],
  ['diagnostic cap 1', { diagCap: 1 }],
  ['1-question pass L1-2 basic', { fastLevels: 2 }],
  ['level-gated (L basics, L mixed, L+1)', { levelGated: true }],
  ['level-gated + diag cap 1', { levelGated: true, diagCap: 1 }],
  ['basics first + diag cap 1', { basicsFirst: true, diagCap: 1 }],
  ['basics first, 1 in 3 mixed + cap 1', { interleave: 3, diagCap: 1 }],
  ['basics first, 1 in 2 mixed + cap 1', { interleave: 2, diagCap: 1 }],
  ['all three', { basicsFirst: true, diagCap: 1, fastLevels: 2 }],
];
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
for (const [name, f] of variants) {
  Object.assign(FLAGS, { basicsFirst: false, diagCap: 99, fastLevels: 0, levelGated: false, interleave: 0 }, f);
  const rs = Array.from({ length: 40 }, (_, i) => run(`v-${i}`));
  console.log(`${name.padEnd(28)} firstProduct/Chain=${med(rs.map(r => r.firstL3))} allBasic=${med(rs.map(r => r.allBasic))} allReady=${med(rs.map(r => r.q))} remediation=${Math.round(100*med(rs.map(r => r.remed / r.q)))}% longestNoNewSkill=${med(rs.map(r => r.longestNoNew))}`);
}
