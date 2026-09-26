import { SKILLS } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/catalog';
import { generateQuestion } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/questions';
import { TEMPLATES } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/templates';
type Expr = number | string | [string, ...Expr[]];
const heads: Record<string, number> = {}; const qWith: Record<string, number> = {};
let n = 0; const vars: Record<string, number> = {}; let multiField = 0;
const walk = (e: Expr, seen: Set<string>) => {
  if (Array.isArray(e)) { let h = e[0]; if (h === 'Power' && e[1] === 'ExponentialE') h = 'e^'; if (h === 'Power' && (e[2] === 'Half' || JSON.stringify(e[2]) === '["Rational",1,2]')) h = 'Sqrt(as ^1/2)'; seen.add(h); e.slice(1).forEach(x => walk(x as Expr, seen)); }
  else if (typeof e === 'string') { if (['Pi','ExponentialE'].includes(e)) seen.add(e); }
  else if (typeof e === 'number' && !Number.isInteger(e)) seen.add('decimal');
};
for (const s of SKILLS) TEMPLATES[s.id].forEach((t, ti) => { for (let i = 0; i < 40; i++) {
  const q = generateQuestion(s.id, `${s.id}:${ti}:${i}`, { key: t.key, role: t.role, ok: () => true });
  n++; if (q.answers.length > 1) multiField++;
  const v = q.domain.curve ? 'x,y' : q.domain.variable; vars[v] = (vars[v] ?? 0) + 1;
  const seen = new Set<string>(); q.answers.forEach(a => walk(a as Expr, seen));
  seen.forEach(h => qWith[h] = (qWith[h] ?? 0) + 1);
}});
console.log('questions', n, 'multi-field', multiField, 'vars', JSON.stringify(vars));
Object.entries(qWith).sort((a,b)=>b[1]-a[1]).forEach(([h,c])=>console.log(h.padEnd(18), c, (100*c/n).toFixed(1)+'%'));
