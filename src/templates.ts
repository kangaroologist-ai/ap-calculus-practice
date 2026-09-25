import type { Curve, Domain, Expr, QuestionMeta, Role } from "./types";
import {
  add as A,
  mul as M,
  div as Q,
  pow as P,
  neg as N,
  fn as F,
  derivative as d,
  latex as L,
  evaluator,
} from "./math";
import { dydx } from "./notation";
export type { QuestionMeta, Role };
export interface Ctx {
  r: () => number;
  a: number;
  b: number;
  n: number;
  smooth(): string;
  innerPower(): Expr;
  pick<T>(xs: readonly T[]): T;
  // A skill id drawn from the template's named pool, restricted to skills the
  // student may combine right now (see `open`).
  pool(name: string): string;
}
export interface Built {
  e?: Expr;
  source?: Expr[];
  answers?: Expr[];
  labels?: string[];
  prompt?: string;
  title?: string;
  domainText?: string;
  intervals?: [number, number][];
  variable?: Domain["variable"];
  curve?: Domain["curve"];
  guards?: Expr[];
  steps?: { text: string; math: string }[];
  // SPEC-G5: steps shown before the standard rule-reminder/derivation/apply
  // sequence below, e.g. rewriting a radical as a fractional power before the
  // power rule takes over. Only used when `steps` itself is left empty.
  prefixSteps?: { text: string; math: string }[];
  // Overrides the expression finalize()'s default per-node derivation
  // commentary walks, for when it should differ from the displayed
  // `source`/`e` (e.g. root.sqrt shows a radical but derives from its
  // rewritten x^(1/2) form). Defaults to `source[0]`.
  derivationBasis?: Expr;
}
export interface Template {
  key: string;
  role: Role;
  meta?: QuestionMeta;
  // Skills a question from this template always combines.
  requires?: string[];
  // Interchangeable skills, e.g. { h: ["sin", "cos", "exp"] }; each pool needs
  // at least one usable member before the template opens.
  pools?: Record<string, readonly string[]>;
  build(c: Ctx): Built;
}
export const open = (t: Template, ok: (skill: string) => boolean) =>
  (t.requires ?? []).every(ok) &&
  Object.values(t.pools ?? {}).every((pool) => pool.some(ok));
export function makeCtx(
  r: () => number,
  a: number,
  b: number,
  n: number,
  pools: Template["pools"] = {},
  ok: (skill: string) => boolean = () => true,
): Ctx {
  return {
    r,
    a,
    b,
    n,
    smooth: () => ["Sin", "Cos", "Exp"][Math.floor(r() * 3)],
    innerPower: () => A(P("x", 2 + Math.floor(r() * 3)), b),
    pick: <T>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)],
    pool: (name) => {
      const usable = (pools[name] ?? []).filter(ok);
      if (!usable.length) throw Error(`Template pool ${name} has no usable skill.`);
      return usable[Math.floor(r() * usable.length)];
    },
  };
}
// ax+b, shared by every template that shows a chain-preview linear inner
// argument. Pure: it only reads a/b, so calling it never consumes r().
const lin = (c: Ctx): Expr => A(M(c.a, "x"), c.b);
function higherBuilt(e: Expr, order: number): Built {
  let z = e;
  const steps: { text: string; math: string }[] = [];
  for (let i = 1; i <= order; i++) {
    z = d(z);
    steps.push({
      text: `Differentiate ${i === 1 ? "once" : "again"}.`,
      math: `f^{(${i})}(x)=${L(z)}`,
    });
  }
  return {
    source: [e],
    answers: [z],
    labels: [order === 3 ? "f'''(x)" : "f''(x)"],
    title: `Find the ${order === 3 ? "third" : "second"} derivative`,
    steps,
  };
}
function parametricBuilt(u: Expr, w: Expr, order: 1 | 2): Built {
  const slope = Q(d(w, "t"), d(u, "t"));
  const answer = order === 2 ? Q(d(slope, "t"), d(u, "t")) : slope;
  return {
    variable: "t",
    source: [u, w],
    answers: [answer],
    guards: [Q(1, d(u, "t"))],
    prompt: `x(t)=${L(u)},\\quad y(t)=${L(w)}`,
    labels: [order === 2 ? "d²y/dx²" : "dy/dx"],
    title: `Find the ${order === 2 ? "second derivative" : "slope"} in terms of t`,
    steps: [
      {
        text: "Divide the derivatives with respect to t.",
        math: `${dydx()}=${L(slope)}`,
      },
      ...(order === 2
        ? [
            {
              text: "Differentiate the slope in t, then divide by dx/dt again.",
              math: `${dydx(2)}=${L(answer)}`,
            },
          ]
        : []),
    ],
    domainText: "Give your answer in t, where dx/dt ≠ 0.",
  };
}
function polarBuilt(e: Expr): Built {
  const u = M(e, F("Cos", "theta")),
    w = M(e, F("Sin", "theta"));
  const answer = Q(d(w, "theta"), d(u, "theta"));
  return {
    variable: "theta",
    source: [e],
    answers: [answer],
    guards: [Q(1, d(u, "theta"))],
    prompt: `r(\\theta)=${L(e)}`,
    labels: ["dy/dx"],
    title: "Find the polar slope in terms of θ",
    steps: [
      {
        text: "Convert to Cartesian coordinates.",
        math: `x=${L(u)},\\quad y=${L(w)}`,
      },
      {
        text: "Divide their derivatives with respect to θ.",
        math: `${dydx()}=${L(answer)}`,
      },
    ],
    domainText: "Give your answer in θ, where dx/dθ ≠ 0.",
  };
}
function vectorBuilt(source: Expr[]): Built {
  const answers = source.map((e) => d(e, "t"));
  return {
    variable: "t",
    source,
    answers,
    prompt: `\\mathbf{r}(t)=\\langle ${source.map(L).join(",")}\\rangle`,
    labels: ["First component of r′(t)", "Second component of r′(t)"],
    title: "Differentiate the vector function",
    steps: answers.map((e, i) => ({
      text: `Differentiate component ${i + 1}.`,
      math: L(e),
    })),
  };
}
// Generic implicit-curve builder (SPEC-G4). `curve` drives sampling for both
// the grader and the SymPy oracle; the "differentiate both sides" step is
// derived from the actual constraint's own partial derivatives (via d()),
// never a hardcoded formula, so it stays correct for any p/q/c coefficients.
function implicitBuilt(
  curve: Curve,
  sourceExpr: Expr,
  intervals: [number, number][],
): Built {
  const fx = d(sourceExpr, "x"),
    fy = d(sourceExpr, "y");
  const answer = N(Q(fx, fy));
  return {
    curve,
    source: [sourceExpr],
    answers: [answer],
    prompt: `${L(sourceExpr)}=0`,
    labels: ["dy/dx"],
    title: "Differentiate implicitly",
    intervals,
    domainText: "Compare on the given curve, where y ≠ 0.",
    steps: [
      {
        text: "Differentiate both sides, remembering that y depends on x.",
        math: `${L(fx)}+${L(fy)}${dydx()}=0`,
      },
      {
        text: "Isolate the requested derivative.",
        math: `${dydx()}=${L(answer)}`,
      },
    ],
  };
}
function inverseBuilt(e: Expr, point: number): Built {
  const ev = evaluator();
  const val = ev.calc(e, { x: new ev.D(point) }).toNumber();
  const slope = ev.calc(d(e), { x: new ev.D(point) }).toNumber();
  const answers = [Q(1, slope)];
  return {
    source: [e],
    answers,
    title: "Find an inverse-function derivative",
    prompt: `f(x)=${L(e)},\\quad f(${point})=${val}.\\quad (f^{-1})'(${val})=?`,
    labels: [`(f⁻¹)'(${val})`],
    steps: [
      {
        text: "The inverse derivative is the reciprocal of the original derivative at the matching input.",
        math: `(f^{-1})'(${point})=\\frac{1}{f'(${point})}=${L(answers[0])}`,
      },
    ],
  };
}
// Both templates share the same coefficient-then-inner-chain shape; only the
// trig function name changes, so the two entries are built by a factory
// instead of copy-pasting six near-identical pairs.
function trigTemplates(id: string): readonly Template[] {
  const op = id[0].toUpperCase() + id.slice(1);
  return [
    {
      key: `${id}.basic`, role: "basic",
      // SPEC-G1: a local 2..13 draw (instead of the shared ctx.a, whose
      // 2..9 range only ever produced 8 distinct questions).
      build: (c) => {
        const av = 2 + Math.floor(c.r() * 12);
        return { e: M(av, F(op, "x")) };
      },
    },
    { key: `${id}.linear`, role: "basic", build: (c) => ({ e: F(op, lin(c)) }) },
  ];
}
function arcTemplates(id: string, op: string): readonly Template[] {
  const intervals: [number, number][] = [
    [-0.8, -0.05],
    [0.05, 0.8],
  ];
  return [
    {
      key: `${id}.basic`, role: "basic",
      build: (c) => {
        const av = 2 + Math.floor(c.r() * 12);
        return { e: M(av, F(op, "x")), intervals };
      },
    },
    {
      key: `${id}.scaled`, role: "basic",
      build: (c) => {
        const av = 2 + Math.floor(c.r() * 12);
        return { e: F(op, Q("x", av)), intervals };
      },
    },
  ];
}
export const TEMPLATES: Record<string, readonly Template[]> = {
  constant: [
    {
      key: "constant.value", role: "basic",
      // SPEC-G1: one of {a, ln a, sqrt a, e^a} instead of always a bare
      // number, so the source (and its displayed prompt) actually varies.
      build: (c) => {
        const av = 2 + Math.floor(c.r() * 12);
        return {
          e: c.pick<Expr>([av, F("Ln", av), F("Sqrt", av), F("Exp", av)]),
        };
      },
    },
    { key: "constant.frac", role: "basic", build: ({ a, b, n }) => ({ e: A(a, Q(b, n)) }) },
  ],
  power: [
    {
      key: "power.xn", role: "basic",
      // SPEC-G1: a local 2..12 draw; the shared ctx.n (2..5) stays untouched
      // because chain.power, product.xn, and vector.power_sin still use it.
      build: (c) => {
        const nn = 2 + Math.floor(c.r() * 11);
        return { e: P("x", nn) };
      },
    },
    { key: "power.neg", role: "basic", build: ({ a, n }) => ({ e: M(a, P("x", -n)) }) },
  ],
  sum: [
    {
      key: "sum.poly2", role: "basic",
      // SPEC-G6: n now draws locally from 3..6, so xⁿ and bx² can never
      // collapse into the same power and hide a like-terms case.
      build: (c) => {
        const nn = 3 + Math.floor(c.r() * 4);
        return { e: A(P("x", nn), M(c.b, P("x", 2)), c.a) };
      },
    },
    {
      key: "sum.scaled", role: "basic",
      build: ({ a, b, n }) => ({ e: A(M(a, P("x", n)), M(-b, "x"), n) }),
    },
  ],
  root: [
    {
      key: "root.sqrt", role: "basic",
      // SPEC-G5: the displayed source is a genuine radical (a real Sqrt
      // node), and the answer is derived from the rewritten a*x^(1/2), with
      // an explicit rewrite step ahead of the usual power-rule derivation.
      build: (c) => {
        const av = 2 + Math.floor(c.r() * 16);
        const displayed = M(av, F("Sqrt", "x"));
        const rewritten = M(av, P("x", Q(1, 2)));
        return {
          e: displayed,
          answers: [d(rewritten)],
          derivationBasis: rewritten,
          prefixSteps: [
            {
              text: "Rewrite the radical as a fractional power before differentiating.",
              math: `${L(displayed)}=${L(rewritten)}`,
            },
          ],
          intervals: [
            [0.1, 1],
            [1, 5],
          ],
        };
      },
    },
    {
      key: "root.frac_power", role: "basic",
      meta: { oddRoot: true },
      // SPEC-G1: p/q now ranges over six rational exponents (not just the
      // fixed cube root), keeping the Multiply(a, Power(x, Divide(p,q)))
      // source shape check_math.py's odd-root real-branch check relies on.
      build: ({ a, pick }) => {
        const [p, q] = pick([
          [1, 3],
          [2, 3],
          [4, 3],
          [5, 3],
          [1, 5],
          [2, 5],
        ] as const);
        return {
          e: M(a, P("x", Q(p, q))),
          intervals: [
            [-5, -0.1],
            [0.1, 5],
          ],
        };
      },
    },
  ],
  exp: [
    { key: "exp.natural", role: "basic", build: (c) => ({ e: F("Exp", lin(c)) }) },
    {
      key: "exp.base", role: "basic",
      // SPEC-G1: an independent leading coefficient b*a^x.
      build: ({ a, b }) => ({ e: M(b, P(a, "x")) }),
    },
  ],
  log: [
    {
      key: "log.natural", role: "basic",
      build: (c) => ({
        e: F("Ln", lin(c)),
        intervals: [
          [0.1, 1],
          [1, 5],
        ],
      }),
    },
    {
      key: "log.base", role: "basic",
      // SPEC-G1: an independent leading coefficient b*ln(x)/ln(a).
      build: ({ a, b }) => ({
        e: Q(M(b, F("Ln", "x")), F("Ln", a)),
        intervals: [
          [0.1, 1],
          [1, 5],
        ],
      }),
    },
  ],
  sin: trigTemplates("sin"),
  cos: trigTemplates("cos"),
  tan: trigTemplates("tan"),
  cot: trigTemplates("cot"),
  sec: trigTemplates("sec"),
  csc: trigTemplates("csc"),
  asin: arcTemplates("asin", "Arcsin"),
  acos: arcTemplates("acos", "Arccos"),
  atan: arcTemplates("atan", "Arctan"),
  product: [
    {
      key: "product.xn", role: "basic",
      build: ({ n, smooth }) => ({ e: M(P("x", n), F(smooth(), "x")) }),
    },
    {
      key: "product.quad", role: "basic",
      build: ({ a, smooth }) => ({
        e: M(A(P("x", 2), a), F(smooth(), "x")),
      }),
    },
  ],
  quotient: [
    {
      key: "quotient.poly", role: "basic",
      // SPEC-G6: the denominator now draws its own constant c, instead of
      // reusing the numerator's b (which could hide an unintended relation
      // between numerator and denominator).
      build: (c) => {
        const cc = 1 + Math.floor(c.r() * 9);
        return { e: Q(A(P("x", 2), c.b), A(M(c.a, "x"), cc)) };
      },
    },
    {
      key: "quotient.smooth", role: "basic",
      build: ({ a, smooth }) => ({ e: Q(F(smooth(), "x"), A(P("x", 2), a)) }),
    },
  ],
  chain: [
    { key: "chain.power", role: "basic", build: (c) => ({ e: P(lin(c), c.n) }) },
    {
      key: "chain.smooth_inner", role: "basic",
      build: ({ smooth, innerPower }) => ({ e: F(smooth(), innerPower()) }),
    },
  ],
  nested: [
    {
      key: "nested.sin_linear", role: "basic",
      build: (c) => ({ e: F(c.smooth(), F("Sin", lin(c))) }),
    },
    {
      key: "nested.linear_sq", role: "basic",
      build: (c) => ({ e: F(c.smooth(), P(lin(c), 2)) }),
    },
  ],
  mixed: [
    {
      key: "mixed.quad_smooth", role: "basic",
      build: ({ a, b, smooth }) => ({
        e: M(A(P("x", 2), b), F(smooth(), M(a, "x"))),
      }),
    },
    {
      key: "mixed.smooth_over_quad", role: "basic",
      // SPEC-G6: the denominator now draws its own constant c instead of
      // reusing the numerator's b.
      build: (c) => {
        const cc = 1 + Math.floor(c.r() * 9);
        return { e: Q(F(c.smooth(), lin(c)), A(P("x", 2), cc)) };
      },
    },
  ],
  implicit: [
    {
      key: "implicit.ellipse", role: "basic",
      // Differentiating y^2 always introduces a chain-rule factor of dy/dx,
      // even though that composition never shows up in the source constraint.
      requires: ["chain"],
      // SPEC-G4: a general ellipse p*x^2 + q*y^2 = c (p != q in general, so
      // the answer is no longer always -x/y) on the generic graph curve.
      build: (c) => {
        const p = c.pick([1, 2, 3, 4, 5]),
          q = c.pick([1, 2, 3, 4, 5]),
          cc = p * q * c.pick([4, 9, 16]);
        const y = F("Sqrt", Q(A(cc, N(M(p, P("x", 2)))), q)),
          xm = Math.sqrt(cc / p);
        return implicitBuilt(
          { type: "graph", free: "x", branches: [y, N(y)] },
          A(M(p, P("x", 2)), M(q, P("y", 2)), -cc),
          [
            [-0.85 * xm, -0.1 * xm],
            [0.1 * xm, 0.85 * xm],
          ],
        );
      },
    },
    {
      key: "implicit.hyperbola", role: "basic",
      requires: ["chain"],
      // SPEC-G4: a general hyperbola q*y^2 - p*x^2 = c on the generic graph
      // curve (y is always defined and nonzero for every real x).
      build: (c) => {
        const p = c.pick([1, 2, 3, 4, 5]),
          q = c.pick([1, 2, 3, 4, 5]),
          cc = p * q * c.pick([4, 9, 16]);
        const y = F("Sqrt", Q(A(cc, M(p, P("x", 2))), q));
        return implicitBuilt(
          { type: "graph", free: "x", branches: [y, N(y)] },
          A(M(q, P("y", 2)), N(M(p, P("x", 2))), -cc),
          [
            [-2, -0.2],
            [0.2, 2],
          ],
        );
      },
    },
  ],
  inverse: [
    {
      key: "inverse.linear", role: "basic",
      build: ({ a, b }) => inverseBuilt(A(M(a, "x"), b), b),
    },
    {
      key: "inverse.cubic", role: "basic",
      // The source previously depended only on a (b was only the evaluation
      // point), so its signature only ever took 8 distinct values across any
      // number of seeds -- below SPEC-G1's 10-fingerprint floor. b already
      // varies per seed and drops out of the derivative, so folding it into
      // the source as well costs nothing mathematically.
      build: ({ a, b }) => inverseBuilt(A(P("x", 3), M(a, "x"), b), b),
    },
  ],
  higher: [
    {
      key: "higher.poly2", role: "basic",
      meta: { derivativeOrder: 2 },
      build: ({ b, n }) => higherBuilt(A(P("x", n + 1), M(b, P("x", 2))), 2),
    },
    {
      key: "higher.trig3", role: "basic",
      meta: { derivativeOrder: 3 },
      // SPEC-G1: g ranges over {sin, cos} and the inner argument is scaled
      // by k in 1..3, instead of always the fixed a*sin(x).
      build: (c) => {
        const g = c.pick(["Sin", "Cos"] as const);
        const k = 1 + Math.floor(c.r() * 3);
        return higherBuilt(M(c.a, F(g, M(k, "x"))), 3);
      },
    },
  ],
  parametric: [
    {
      key: "parametric.linear", role: "basic",
      meta: { derivativeOrder: 1 },
      // The slope (dy/dt)/(dx/dt) is a quotient of derivatives; that division
      // never appears in the x(t)/y(t) source expressions themselves.
      requires: ["quotient"],
      build: ({ a, b }) => parametricBuilt(A(M(a, "t"), b), F("Sin", "t"), 1),
    },
    {
      key: "parametric.poly", role: "basic",
      meta: { derivativeOrder: 2 },
      requires: ["quotient"],
      // SPEC-G1: x = a*t^2, y = t^k for k in 3..5, instead of the single
      // fixed pair x=t^2, y=t^3.
      build: (c) => {
        const k = 3 + Math.floor(c.r() * 3);
        return parametricBuilt(M(c.a, P("t", 2)), P("t", k), 2);
      },
    },
  ],
  vector: [
    {
      key: "vector.power_sin", role: "basic",
      build: ({ a, n }) => vectorBuilt([P("t", n), F("Sin", M(a, "t"))]),
    },
    {
      key: "vector.exp_cos", role: "basic",
      // SPEC-G1: an independent leading coefficient b on the cosine component.
      build: ({ a, b }) =>
        vectorBuilt([F("Exp", M(a, "t")), M(b, F("Cos", "t"))]),
    },
  ],
  polar: [
    {
      key: "polar.sin_limacon", role: "basic",
      // Converting to Cartesian (x=r cos theta, y=r sin theta) always brings
      // in product, quotient, sin, and cos, none of which need appear in the
      // bare radius expression r(theta).
      requires: ["product", "quotient", "sin", "cos"],
      // SPEC-G1/G4: a limaçon a+b*sin(theta) instead of the bare rose
      // r=a*sin(theta), whose slope was always tan(2*theta) regardless of a.
      build: ({ a, b }) => polarBuilt(A(a, M(b, F("Sin", "theta")))),
    },
    {
      key: "polar.cos", role: "basic",
      requires: ["product", "quotient", "sin", "cos"],
      // SPEC-G1: an independent leading coefficient b on the cosine term.
      build: ({ a, b }) => polarBuilt(A(a, M(b, F("Cos", "theta")))),
    },
  ],
};
