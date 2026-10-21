import { ComputeEngine } from '@cortex-js/compute-engine';
const ce = new ComputeEngine();
for (const s of ["3x^2f'(x^3)", "3x^{2}f^{\\prime}\\left(x^{3}\\right)", "f'(g(x))g'(x)", "3[f(x)]^2f'(x)", "3\\left(f\\left(x\\right)\\right)^2f'\\left(x\\right)", "e^{f(x^2)}f'(x^2)\\cdot2x", "\\frac{f'(x)}{2\\sqrt{f(x)}}", "f(x)", "g(x)", "h(x)", "2xf(3x)+3x^2f'(3x)", "f''(x)", "-\\frac{2}{9}", "-2e"]) {
  try { console.log(s, ' => ', JSON.stringify(ce.parse(s, { form: 'raw' }).json)); } catch (e) { console.log(s, 'ERR', (e as Error).message); }
}
