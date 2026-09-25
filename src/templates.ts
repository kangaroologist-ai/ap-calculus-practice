import type { Domain, Expr, QuestionMeta } from "./types";
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
export type { QuestionMeta };
export interface Ctx {
  r: () => number;
  a: number;
  b: number;
  n: number;
  smooth(): string;
  innerPower(): Expr;
  pick<T>(xs: readonly T[]): T;
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
}
export interface Template {
  key: string;
  meta?: QuestionMeta;
  requires?: string[];
  build(c: Ctx): Built;
}
export function makeCtx(r: () => number, a: number, b: number, n: number): Ctx {
  return {
    r,
    a,
    b,
    n,
    smooth: () => ["Sin", "Cos", "Exp"][Math.floor(r() * 3)],
    innerPower: () => A(P("x", 2 + Math.floor(r() * 3)), b),
    pick: <T>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)],
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
function implicitBuilt(
  curveType: "circle" | "hyperbola",
  param: number,
  sourceExpr: Expr,
  intervals: [number, number][],
  stepMath: string,
): Built {
  const answer = N(Q(d(sourceExpr, "x"), d(sourceExpr, "y")));
  return {
    curve: { type: curveType, parameter: param },
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
        math: stepMath,
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
    { key: `${id}.basic`, build: ({ a }) => ({ e: M(a, F(op, "x")) }) },
    { key: `${id}.linear`, build: (c) => ({ e: F(op, lin(c)) }) },
  ];
}
function arcTemplates(id: string, op: string): readonly Template[] {
  const intervals: [number, number][] = [
    [-0.8, -0.05],
    [0.05, 0.8],
  ];
  return [
    {
      key: `${id}.basic`,
      build: ({ a }) => ({ e: M(a, F(op, "x")), intervals }),
    },
    {
      key: `${id}.scaled`,
      build: ({ a }) => ({ e: F(op, Q("x", a)), intervals }),
    },
  ];
}
export const TEMPLATES: Record<string, readonly Template[]> = {
  constant: [
    { key: "constant.plain", build: ({ a }) => ({ e: a }) },
    { key: "constant.frac", build: ({ a, b, n }) => ({ e: A(a, Q(b, n)) }) },
  ],
  power: [
    { key: "power.xn", build: ({ n }) => ({ e: P("x", n) }) },
    { key: "power.neg", build: ({ a, n }) => ({ e: M(a, P("x", -n)) }) },
  ],
  sum: [
    {
      key: "sum.poly2",
      build: ({ a, b, n }) => ({ e: A(P("x", n), M(b, P("x", 2)), a) }),
    },
    {
      key: "sum.scaled",
      build: ({ a, b, n }) => ({ e: A(M(a, P("x", n)), M(-b, "x"), n) }),
    },
  ],
  root: [
    {
      key: "root.sqrt",
      build: ({ a }) => ({
        e: M(a, P("x", Q(1, 2))),
        intervals: [
          [0.1, 1],
          [1, 5],
        ],
      }),
    },
    {
      key: "root.cube",
      meta: { oddRoot: true },
      build: ({ a }) => ({
        e: M(a, P("x", Q(1, 3))),
        intervals: [
          [-5, -0.1],
          [0.1, 5],
        ],
      }),
    },
  ],
  exp: [
    { key: "exp.natural", build: (c) => ({ e: F("Exp", lin(c)) }) },
    { key: "exp.base", build: ({ a }) => ({ e: P(a, "x") }) },
  ],
  log: [
    {
      key: "log.natural",
      build: (c) => ({
        e: F("Ln", lin(c)),
        intervals: [
          [0.1, 1],
          [1, 5],
        ],
      }),
    },
    {
      key: "log.base",
      build: ({ a }) => ({
        e: Q(F("Ln", "x"), F("Ln", a)),
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
      key: "product.xn",
      build: ({ n, smooth }) => ({ e: M(P("x", n), F(smooth(), "x")) }),
    },
    {
      key: "product.quad",
      build: ({ a, smooth }) => ({
        e: M(A(P("x", 2), a), F(smooth(), "x")),
      }),
    },
  ],
  quotient: [
    {
      key: "quotient.poly",
      build: (c) => ({ e: Q(A(P("x", 2), c.b), lin(c)) }),
    },
    {
      key: "quotient.smooth",
      build: ({ a, smooth }) => ({ e: Q(F(smooth(), "x"), A(P("x", 2), a)) }),
    },
  ],
  chain: [
    { key: "chain.power", build: (c) => ({ e: P(lin(c), c.n) }) },
    {
      key: "chain.smooth_inner",
      build: ({ smooth, innerPower }) => ({ e: F(smooth(), innerPower()) }),
    },
  ],
  nested: [
    {
      key: "nested.sin_linear",
      build: (c) => ({ e: F(c.smooth(), F("Sin", lin(c))) }),
    },
    {
      key: "nested.linear_sq",
      build: (c) => ({ e: F(c.smooth(), P(lin(c), 2)) }),
    },
  ],
  mixed: [
    {
      key: "mixed.quad_smooth",
      build: ({ a, b, smooth }) => ({
        e: M(A(P("x", 2), b), F(smooth(), M(a, "x"))),
      }),
    },
    {
      key: "mixed.smooth_over_quad",
      build: (c) => ({ e: Q(F(c.smooth(), lin(c)), A(P("x", 2), c.b)) }),
    },
  ],
  implicit: [
    {
      key: "implicit.circle",
      build: ({ a }) =>
        implicitBuilt(
          "circle",
          a,
          A(P("x", 2), P("y", 2), -a * a),
          [
            [0.25, 2.8],
            [3.4, 6.0],
          ],
          `2x+2y${dydx()}=0`,
        ),
    },
    {
      key: "implicit.hyperbola",
      build: ({ a }) =>
        implicitBuilt(
          "hyperbola",
          a,
          A(P("y", 2), N(P("x", 2)), -a),
          [
            [-2, -0.2],
            [0.2, 2],
          ],
          `2y${dydx()}-2x=0`,
        ),
    },
  ],
  inverse: [
    {
      key: "inverse.linear",
      build: ({ a, b }) => inverseBuilt(A(M(a, "x"), b), b),
    },
    {
      key: "inverse.cubic",
      build: ({ a, b }) => inverseBuilt(A(P("x", 3), M(a, "x")), b),
    },
  ],
  higher: [
    {
      key: "higher.poly2",
      meta: { derivativeOrder: 2 },
      build: ({ b, n }) => higherBuilt(A(P("x", n + 1), M(b, P("x", 2))), 2),
    },
    {
      key: "higher.sin3",
      meta: { derivativeOrder: 3 },
      build: ({ a }) => higherBuilt(M(a, F("Sin", "x")), 3),
    },
  ],
  parametric: [
    {
      key: "parametric.linear",
      meta: { derivativeOrder: 1 },
      build: ({ a, b }) => parametricBuilt(A(M(a, "t"), b), F("Sin", "t"), 1),
    },
    {
      key: "parametric.poly",
      meta: { derivativeOrder: 2 },
      build: () => parametricBuilt(P("t", 2), P("t", 3), 2),
    },
  ],
  vector: [
    {
      key: "vector.power_sin",
      build: ({ a, n }) => vectorBuilt([P("t", n), F("Sin", M(a, "t"))]),
    },
    {
      key: "vector.exp_cos",
      build: ({ a }) => vectorBuilt([F("Exp", M(a, "t")), F("Cos", "t")]),
    },
  ],
  polar: [
    { key: "polar.sin", build: ({ a }) => polarBuilt(M(a, F("Sin", "theta"))) },
    { key: "polar.cos", build: ({ a }) => polarBuilt(A(a, F("Cos", "theta"))) },
  ],
};
