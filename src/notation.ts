// ISO 80000-2 treats the differential operator d like a function name (sin,
// ln): upright, not an italic variable. Every generated or hand-written LaTeX
// fraction that means "with respect to" must go through these helpers so an
// italic \frac{d...}{d...} never appears in the app.
export const DIFF = "\\mathrm{d}";
const v = (x: string) => (x === "theta" ? "\\theta" : x);
export const ddx = (x = "x") => `\\frac{${DIFF}}{${DIFF}${v(x)}}`;
export const dydx = (order = 1, y = "y", x = "x") =>
  order === 1
    ? `\\frac{${DIFF}${y}}{${DIFF}${v(x)}}`
    : `\\frac{${DIFF}^{${order}}${y}}{${DIFF}${v(x)}^{${order}}}`;
