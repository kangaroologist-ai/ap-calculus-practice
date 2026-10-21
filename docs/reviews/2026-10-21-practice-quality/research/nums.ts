import { TEMPLATES } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/templates';
import { generateQuestion } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/questions';
import { ComputeEngine } from '@cortex-js/compute-engine';
const ce = new ComputeEngine();
type E = any;
const ints = (e: E, out: number[] = []) => { if (typeof e === 'number') out.push(Math.abs(e)); else if (Array.isArray(e)) e.slice(1).forEach((x: E) => ints(x, out)); return out; };
const rows: any[] = [];
for (const [skill, list] of Object.entries(TEMPLATES)) {
  for (const t of list) {
    let worst: any = null, srcMaxes: number[] = [], ansMaxes: number[] = [];
    for (let i = 0; i < 120; i++) {
      const q = generateQuestion(skill, `n${i}`, { key: t.key });
      const sm = Math.max(0, ...q.source.flatMap((e: E) => ints(e)));
      let simp = '', am = 0;
      try { const b = ce.box(q.answers[0] as any).simplify(); simp = b.latex; am = Math.max(0, ...ints(b.json as E).filter(n => Number.isFinite(n))); } catch { simp = '?'; }
      srcMaxes.push(sm); ansMaxes.push(am);
      if (!worst || am > worst.am) worst = { prompt: q.prompt, simp, am, sm };
    }
    const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
    rows.push({ key: t.key, role: t.role, srcMed: med(srcMaxes), srcMax: Math.max(...srcMaxes), ansMed: med(ansMaxes), ansMax: Math.max(...ansMaxes), worstPrompt: worst.prompt, worstAns: worst.simp.slice(0, 160) });
  }
}
rows.sort((a, b) => b.ansMed - a.ansMed);
for (const r of rows) console.log(`${r.key.padEnd(40)} ${r.role.padEnd(5)} src med/max ${String(r.srcMed).padStart(4)}/${String(r.srcMax).padStart(4)}  ans med/max ${String(r.ansMed).padStart(7)}/${String(r.ansMax).padStart(7)} | ${r.worstPrompt} => ${r.worstAns}`);
