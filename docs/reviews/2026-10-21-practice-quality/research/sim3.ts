import { FLAGS, allEnabledReady, chooseNext, finishQuestion, freshProgress, recordOutcome, type AppState, type Current } from './progress-v';
import { random } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/math';
import type { Config } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/types';
const c: Config = { schemaVersion: 1, revision: 'x', initialUnlockedLevel: 1, disabledFamilies: [], sessionLength: 12 };
const BASE: Record<number, number> = { 1: 0.92, 2: 0.88, 3: 0.8, 4: 0.75, 5: 0.72, 6: 0.7 };
for (const f of [{}, { diagCap: 1 }, {diagCap: 0}]) {
Object.assign(FLAGS, { basicsFirst: false, diagCap: 99, fastLevels: 0 }, f);
const tot: Record<string, number> = {}; let fails = 0, Q = 0;
for (let i = 0; i < 20; i++) {
  const r = random(`b-${i}`); let now = Date.parse('2026-01-01T00:00:00Z'); const p = freshProgress(c, now);
  const st: AppState = { version: 1, progress: p, session: { config: c, completed: 0, independent: 0, assisted: 0, skipped: 0, finished: false } };
  let q = 0;
  while (q < 6000 && !allEnabledReady(p, c)) {
    let picked; try { picked = chooseNext(p, c, now); } catch (e) { now = Math.min(...Object.values(p.skills).map(s => s.card.due).filter(d => d > now)); continue; }
    tot[picked.reason] = (tot[picked.reason] ?? 0) + 1;
    const qq = picked.question; const ok = r() < BASE[qq.level] - (qq.role === 'mix' ? 0.08 : 0); if (!ok) fails++;
    const cur: Current = { question: qq, draft: [''], hintsUsed: 0, recorded: false, closed: false, reason: picked.reason };
    recordOutcome(p, cur, c, ok ? { status: 'correct', evidence: 'symbolic' } : { status: 'incorrect', feedbackCode: 'x' }, now);
    st.session!.current = cur; finishQuestion(st); q++; now += 45_000;
  }
  Q += q;
}
console.log(JSON.stringify(f), 'avg questions', Q/20, 'avg fails', fails/20, Object.fromEntries(Object.entries(tot).map(([k,v])=>[k, Math.round(v/20)])));
}
