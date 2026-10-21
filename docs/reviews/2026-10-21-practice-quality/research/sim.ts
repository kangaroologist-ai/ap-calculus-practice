import { allEnabledReady, chooseNext, finishQuestion, freshProgress, recordOutcome, lineReady, isReady, type AppState, type Current } from '../../../../../../../../Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/progress';
import { SKILLS } from '../../../../../../../../Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/catalog';
import { random } from '../../../../../../../../Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/math';
import type { Config } from '../../../../../../../../Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/types';
const c: Config = { schemaVersion: 1, revision: 'x', initialUnlockedLevel: 1, disabledFamilies: [], sessionLength: 12 };
function run(acc: number, seed: string, max = 5000) {
  const r = random(seed);
  let now = Date.parse('2026-01-01T00:00:00Z');
  const p = freshProgress(c, now);
  const st: AppState = { version: 1, progress: p, session: { config: c, completed: 0, independent: 0, assisted: 0, skipped: 0, finished: false } };
  const levelAt: Record<number, number> = { 1: 0 };
  const reasons: Record<string, number> = {};
  let pauses = 0, q = 0, firstPauseQ = -1;
  const basicPassAt: Record<string, number> = {};
  let allBasicQ = -1;
  for (; q < max; ) {
    if (allEnabledReady(p, c)) break;
    let picked;
    try { picked = chooseNext(p, c, now); } catch (e) {
      if ((e as Error).message !== 'PRACTICE_PAUSE') throw e;
      pauses++; if (firstPauseQ < 0) firstPauseQ = q;
      const due = Object.values(p.skills).map((s) => s.card.due).filter((d) => d > now);
      now = Math.min(...due); continue;
    }
    reasons[picked.reason] = (reasons[picked.reason] ?? 0) + 1;
    const cur: Current = { question: picked.question, draft: [''], hintsUsed: 0, recorded: false, closed: false, reason: picked.reason };
    const ok = r() < acc;
    recordOutcome(p, cur, c, ok ? { status: 'correct', evidence: 'symbolic' } : { status: 'incorrect', feedbackCode: 'x' }, now);
    st.session!.current = cur; finishQuestion(st); q++; now += 45_000;
    if (!(p.unlockedLevel in levelAt)) levelAt[p.unlockedLevel] = q;
    for (const s of SKILLS) if (p.skills[s.id]?.basic.passed && !(s.id in basicPassAt)) basicPassAt[s.id] = q;
    if (allBasicQ < 0 && SKILLS.every(s => p.skills[s.id]?.basic.passed)) allBasicQ = q;
  }
  return { q, levelAt, reasons, pauses, firstPauseQ, allBasicQ, days: (now - Date.parse('2026-01-01T00:00:00Z'))/86400000 };
}
for (const acc of [1, 0.9, 0.8, 0.7]) {
  const rs = Array.from({ length: 20 }, (_, i) => run(acc, `s${acc}-${i}`));
  const med = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  console.log(`acc=${acc} questionsToAllReady median=${med(rs.map(r => r.q))} allBasic median=${med(rs.map(r=>r.allBasicQ))} level2 at=${med(rs.map(r=>r.levelAt[2]))} L3=${med(rs.map(r=>r.levelAt[3]))} L4=${med(rs.map(r=>r.levelAt[4]))} L5=${med(rs.map(r=>r.levelAt[5]))} L6=${med(rs.map(r=>r.levelAt[6]))} pauses=${med(rs.map(r=>r.pauses))} days=${med(rs.map(r=>r.days)).toFixed(1)}`);
  console.log('  reasons(run0)', JSON.stringify(rs[0].reasons));
}
