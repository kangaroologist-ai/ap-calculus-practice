import { ComputeEngine } from '@cortex-js/compute-engine';
const ce = new ComputeEngine();
try { ce.declare('f', 'function'); ce.declare('g', 'function'); } catch (e) { console.log('declare err', (e as Error).message); }
for (const s of ["2xf(3x)+3x^2f'(3x)", "f(x)", "f(g(x))", "\\left(f\\left(x\\right)\\right)^2", "\\frac{1}{f(x)}", "e^{f(x)}f'(x)", "f'(g(x))g'(x)", "xf(x^2)"]) {
  try { console.log(s, ' => ', JSON.stringify(ce.parse(s, { form: 'raw' }).json)); } catch (e) { console.log(s, 'ERR', (e as Error).message); }
}
