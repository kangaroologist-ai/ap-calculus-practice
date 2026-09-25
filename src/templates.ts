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
// ax+b for templates with a linear inner function.
const lin = (c: Ctx): Expr => A(M(c.a, "x"), c.b);
function higherBuilt(
  e: Expr,
  order: number,
  intervals: [number, number][],
): Built {
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
    intervals,
    steps,
  };
}
function parametricBuilt(
  u: Expr,
  w: Expr,
  order: 1 | 2,
  intervals: [number, number][],
): Built {
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
    intervals,
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
function polarBuilt(e: Expr, intervals: [number, number][]): Built {
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
    intervals,
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
function vectorBuilt(source: Expr[], intervals: [number, number][]): Built {
  const answers = source.map((e) => d(e, "t"));
  return {
    variable: "t",
    source,
    answers,
    prompt: `\\mathbf{r}(t)=\\langle ${source.map(L).join(",")}\\rangle`,
    labels: ["First component of r′(t)", "Second component of r′(t)"],
    title: "Differentiate the vector function",
    intervals,
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
  domainText = "Compare on the given curve, where y ≠ 0.",
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
    domainText,
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
function inverseBuilt(
  e: Expr,
  point: number,
  intervals: [number, number][],
): Built {
  const ev = evaluator();
  const val = ev.calc(e, { x: new ev.D(point) }).toNumber();
  const slope = ev.calc(d(e), { x: new ev.D(point) }).toNumber();
  const answers = [Q(1, slope)];
  return {
    source: [e],
    answers,
    intervals,
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
export const SKILL_FN: Record<string, string> = {
  sin: "Sin",
  cos: "Cos",
  exp: "Exp",
  log: "Ln",
  tan: "Tan",
  cot: "Cot",
  sec: "Sec",
  csc: "Csc",
  asin: "Arcsin",
  acos: "Arccos",
  atan: "Arctan",
};

const X_INTERVALS: [number, number][] = [
  [-2.5, -0.2],
  [0.2, 2.5],
];
const POSITIVE_INTERVALS: [number, number][] = [
  [0.2, 1],
  [1.2, 3],
];
const SAFE_TRIG_INTERVALS: [number, number][] = [
  [0.2, 0.6],
  [0.7, 0.9],
];
const T_INTERVALS: [number, number][] = [
  [-2, -0.2],
  [0.2, 2],
];
const POLAR_INTERVALS: [number, number][] = [
  [-0.1, -0.05],
  [0.05, 0.1],
];
const SMOOTH_POOL = ["sin", "cos", "exp"] as const;
const implicitRequires = ["chain", "quotient"];
const polarRequires = ["product", "quotient", "sin", "cos"];

const int = (c: Ctx, min: number, max: number) =>
  min + Math.floor(c.r() * (max - min + 1));
const pooled = (c: Ctx, name: string, variable = "x") =>
  F(SKILL_FN[c.pool(name)], variable);
const trigIntervals = (id: string): [number, number][] =>
  ["tan", "sec", "cot", "csc"].includes(id)
    ? SAFE_TRIG_INTERVALS
    : X_INTERVALS;
const linearIntervals = (c: Ctx): [number, number][] => [
  [(-c.b - 0.6) / c.a, (-c.b - 0.2) / c.a],
  [(-c.b + 0.2) / c.a, (-c.b + 0.6) / c.a],
];

export const TEMPLATES: Record<string, readonly Template[]> = {
  constant: [
    {
      key: "constant.basic.forms",
      role: "basic",
      build: (c) => {
        const a = int(c, 2, 15);
        return {
          e: c.pick<Expr>([a, F("Ln", a), F("Sqrt", a), F("Exp", a)]),
          intervals: X_INTERVALS,
        };
      },
    },
    {
      key: "constant.basic.rational",
      role: "basic",
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          n = int(c, 2, 9);
        return { e: A(a, Q(b, n)), intervals: X_INTERVALS };
      },
    },
    {
      key: "constant.mix.power_sum",
      role: "mix",
      requires: ["sum", "power"],
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          n = int(c, 2, 12);
        return { e: A(a, M(b, P("x", n))), intervals: X_INTERVALS };
      },
    },
  ],
  power: [
    {
      key: "power.basic.positive",
      role: "basic",
      build: (c) => ({ e: P("x", int(c, 2, 12)), intervals: X_INTERVALS }),
    },
    {
      key: "power.basic.negative",
      role: "basic",
      build: (c) => ({ e: P("x", -int(c, 2, 12)), intervals: X_INTERVALS }),
    },
    {
      key: "power.mix.polynomial_sum",
      role: "mix",
      requires: ["sum"],
      build: (c) => {
        const n = int(c, 2, 5),
          m = int(c, 2, 5),
          a = int(c, 2, 15),
          b = int(c, 2, 15),
          k = int(c, 2, 15);
        return { e: A(M(a, P("x", n)), M(b, P("x", m)), k), intervals: X_INTERVALS };
      },
    },
    {
      key: "power.mix.negative_sum",
      role: "mix",
      requires: ["sum"],
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          n = int(c, 2, 12);
        return { e: A(M(a, P("x", -n)), M(b, "x")), intervals: X_INTERVALS };
      },
    },
  ],
  sum: [
    {
      key: "sum.basic.polynomial_linear",
      role: "basic",
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          k = int(c, 2, 15),
          n = int(c, 2, 8);
        return { e: A(M(a, P("x", n)), M(b, "x"), k), intervals: X_INTERVALS };
      },
    },
    {
      key: "sum.mix.square_root",
      role: "mix",
      requires: ["root"],
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          n = int(c, 2, 8);
        return { e: A(M(a, F("Sqrt", "x")), M(b, P("x", n))), intervals: POSITIVE_INTERVALS };
      },
    },
    {
      key: "sum.mix.fractional_root",
      role: "mix",
      requires: ["root"],
      meta: { oddRoot: true },
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          n = int(c, 2, 8),
          [p, q] = c.pick([
            [1, 3],
            [2, 3],
            [4, 3],
            [1, 5],
            [2, 5],
          ] as const);
        return {
          e: A(M(a, P("x", -n)), M(b, P("x", Q(p, q)))),
          intervals: X_INTERVALS,
        };
      },
    },
  ],
  root: [
    {
      key: "root.basic.square_root",
      role: "basic",
      meta: { oddRoot: false },
      build: (c) => {
        const a = int(c, 2, 15),
          displayed = M(a, F("Sqrt", "x")),
          rewritten = M(a, P("x", Q(1, 2)));
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
          intervals: POSITIVE_INTERVALS,
        };
      },
    },
    {
      key: "root.basic.fractional_power",
      role: "basic",
      meta: { oddRoot: true },
      build: (c) => {
        const a = int(c, 2, 15),
          [p, q] = c.pick([
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
    {
      key: "root.mix.square_root_power",
      role: "mix",
      requires: ["sum", "power"],
      meta: { oddRoot: false },
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          n = int(c, 2, 8);
        return { e: A(M(a, F("Sqrt", "x")), M(b, P("x", n))), intervals: POSITIVE_INTERVALS };
      },
    },
  ],
  exp: [
    {
      key: "exp.basic.natural",
      role: "basic",
      build: (c) => ({ e: M(int(c, 2, 15), F("Exp", "x")), intervals: X_INTERVALS }),
    },
    {
      key: "exp.basic.base",
      role: "basic",
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15);
        return { e: M(b, P(a, "x")), intervals: X_INTERVALS };
      },
    },
    {
      key: "exp.mix.polynomial",
      role: "mix",
      requires: ["sum", "power"],
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          n = int(c, 2, 8);
        return { e: A(M(a, F("Exp", "x")), M(b, P("x", n))), intervals: X_INTERVALS };
      },
    },
    {
      key: "exp.mix.square_root",
      role: "mix",
      requires: ["sum", "root"],
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15);
        return { e: A(F("Exp", "x"), M(a, F("Sqrt", "x"))), intervals: POSITIVE_INTERVALS };
      },
    },
  ],
  log: [
    {
      key: "log.basic.natural",
      role: "basic",
      build: (c) => ({ e: M(int(c, 2, 15), F("Ln", "x")), intervals: POSITIVE_INTERVALS }),
    },
    {
      key: "log.basic.scaled",
      role: "basic",
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15);
        return { e: Q(M(a, F("Ln", "x")), F("Ln", b + 1)), intervals: POSITIVE_INTERVALS };
      },
    },
    {
      key: "log.mix.polynomial",
      role: "mix",
      requires: ["sum", "power"],
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          n = int(c, 2, 8);
        return { e: A(M(a, F("Ln", "x")), M(b, P("x", n))), intervals: POSITIVE_INTERVALS };
      },
    },
    {
      key: "log.mix.exponential",
      role: "mix",
      requires: ["sum", "exp"],
      build: (c) => ({
        e: A(F("Ln", "x"), N(M(int(c, 2, 15), F("Exp", "x")))),
        intervals: POSITIVE_INTERVALS,
      }),
    },
  ],
  sin: [],
  cos: [],
  tan: [],
  cot: [],
  sec: [],
  csc: [],
  asin: [],
  acos: [],
  atan: [],
  product: [
    {
      key: "product.basic.power_function",
      role: "basic",
      pools: { h: SMOOTH_POOL },
      build: (c) => ({ e: M(P("x", int(c, 2, 5)), pooled(c, "h")), intervals: SAFE_TRIG_INTERVALS }),
    },
    {
      key: "product.basic.function_pair",
      role: "basic",
      pools: { h: SMOOTH_POOL, g: SMOOTH_POOL },
      build: (c) => ({ e: M(c.a, pooled(c, "h"), pooled(c, "g")), intervals: SAFE_TRIG_INTERVALS }),
    },
    {
      key: "product.mix.quadratic_function",
      role: "mix",
      requires: ["sum", "power"],
      pools: { h: SMOOTH_POOL },
      build: (c) => ({
        e: M(A(P("x", 2), int(c, 2, 15)), pooled(c, "h")),
        intervals: SAFE_TRIG_INTERVALS,
      }),
    },
    {
      key: "product.mix.tangent_secant",
      role: "mix",
      requires: ["power"],
      pools: { h: ["tan", "sec"] },
      build: (c) => ({
        e: M(P("x", int(c, 2, 12)), pooled(c, "h")),
        intervals: SAFE_TRIG_INTERVALS,
      }),
    },
  ],
  quotient: [
    {
      key: "quotient.basic.polynomial_linear",
      role: "basic",
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          k = int(c, 2, 15);
        return { e: Q(A(P("x", 2), b), A(M(a, "x"), k)), intervals: POSITIVE_INTERVALS };
      },
    },
    {
      key: "quotient.basic.reciprocal_power",
      role: "basic",
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 2, 15),
          n = int(c, 2, 8);
        return { e: Q(a, A(P("x", n), b)), intervals: POSITIVE_INTERVALS };
      },
    },
    {
      key: "quotient.mix.function_quadratic",
      role: "mix",
      pools: { h: SMOOTH_POOL },
      build: (c) => ({
        e: Q(pooled(c, "h"), A(P("x", 2), int(c, 2, 15))),
        intervals: SAFE_TRIG_INTERVALS,
      }),
    },
    {
      key: "quotient.mix.product_linear",
      role: "mix",
      requires: ["product"],
      pools: { h: SMOOTH_POOL },
      build: (c) => ({
        e: Q(M(P("x", int(c, 2, 8)), pooled(c, "h")), A("x", int(c, 2, 15))),
        intervals: SAFE_TRIG_INTERVALS,
      }),
    },
  ],
  chain: [
    {
      key: "chain.basic.power_linear",
      role: "basic",
      build: (c) => ({ e: P(lin(c), int(c, 2, 8)), intervals: X_INTERVALS }),
    },
    {
      key: "chain.basic.function_linear",
      role: "basic",
      pools: { h: SMOOTH_POOL },
      build: (c) => ({ e: F(SKILL_FN[c.pool("h")], lin(c)), intervals: X_INTERVALS }),
    },
    {
      key: "chain.mix.function_power_sum",
      role: "mix",
      requires: ["power", "sum"],
      pools: { h: SMOOTH_POOL },
      build: (c) => {
        const k = int(c, 2, 3),
          b = int(c, 1, 9);
        return { e: F(SKILL_FN[c.pool("h")], A(P("x", k), b)), intervals: POSITIVE_INTERVALS };
      },
    },
    {
      key: "chain.mix.square_root_quadratic",
      role: "mix",
      requires: ["root", "sum", "power"],
      build: (c) => ({
        e: F("Sqrt", A(M(int(c, 2, 15), P("x", 2)), int(c, 1, 15))),
        intervals: X_INTERVALS,
      }),
    },
  ],
  nested: [
    {
      key: "nested.basic.function_quadratic",
      role: "basic",
      requires: ["chain"],
      pools: { h: SMOOTH_POOL },
      build: (c) => ({
        e: F(SKILL_FN[c.pool("h")], P(lin(c), 2)),
        intervals: linearIntervals(c),
      }),
    },
    {
      key: "nested.basic.function_pair",
      role: "basic",
      requires: ["chain"],
      pools: { h: SMOOTH_POOL, g: SMOOTH_POOL },
      build: (c) => ({
        e: F(SKILL_FN[c.pool("h")], F(SKILL_FN[c.pool("g")], lin(c))),
        intervals: linearIntervals(c),
      }),
    },
    {
      key: "nested.mix.function_power_sum",
      role: "mix",
      requires: ["chain", "power", "sum"],
      pools: { h: SMOOTH_POOL, g: SMOOTH_POOL },
      build: (c) => {
        const k = int(c, 2, 3),
          b = -int(c, 1, 2),
          g = SKILL_FN[c.pool("g")],
          h = SKILL_FN[c.pool("h")];
        return {
          e: F(h, F(g, A(P("x", k), b))),
          intervals: [
            [0.2, 0.6],
            [0.7, 0.9],
          ],
        };
      },
    },
    {
      key: "nested.mix.power_outer",
      role: "mix",
      requires: ["power"],
      pools: { h: SMOOTH_POOL },
      build: (c) => {
        const b = int(c, 1, 9),
          n = int(c, 2, 5);
        return { e: P(A(F(SKILL_FN[c.pool("h")], lin(c)), b), n), intervals: linearIntervals(c) };
      },
    },
  ],
  mixed: [
    {
      key: "mixed.basic.product_chain",
      role: "basic",
      pools: { h: SMOOTH_POOL },
      build: (c) => ({
        e: M(A(P("x", 2), int(c, 2, 15)), F(SKILL_FN[c.pool("h")], M(int(c, 2, 15), "x"))),
        intervals: X_INTERVALS,
      }),
    },
    {
      key: "mixed.basic.quotient_chain",
      role: "basic",
      pools: { h: SMOOTH_POOL },
      build: (c) => ({
        e: Q(F(SKILL_FN[c.pool("h")], lin(c)), A(P("x", 2), int(c, 2, 15))),
        intervals: POSITIVE_INTERVALS,
      }),
    },
    {
      key: "mixed.mix.quotient_power",
      role: "mix",
      requires: ["product", "quotient", "chain"],
      pools: { h: SMOOTH_POOL },
      build: (c) => ({
        e: Q(M(P("x", int(c, 2, 8)), F(SKILL_FN[c.pool("h")], lin(c))), A("x", int(c, 2, 15))),
        intervals: POSITIVE_INTERVALS,
      }),
    },
    {
      key: "mixed.mix.log_product",
      role: "mix",
      requires: ["log", "product"],
      pools: { h: SMOOTH_POOL },
      build: (c) => ({
        e: M(F("Ln", A(P("x", 2), int(c, 2, 15))), pooled(c, "h")),
        intervals: X_INTERVALS,
      }),
    },
  ],
  implicit: [
    {
      key: "implicit.basic.ellipse",
      role: "basic",
      requires: implicitRequires,
      build: (c) => {
        const p = int(c, 1, 5),
          q = int(c, 1, 5),
          cc = p * q * int(c, 4, 16),
          y = F("Sqrt", Q(A(cc, N(M(p, P("x", 2)))), q)),
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
      key: "implicit.basic.hyperbola",
      role: "basic",
      requires: implicitRequires,
      build: (c) => {
        const p = int(c, 1, 5),
          q = int(c, 1, 5),
          cc = p * q * int(c, 4, 16),
          y = F("Sqrt", Q(A(cc, M(p, P("x", 2))), q));
        return implicitBuilt(
          { type: "graph", free: "x", branches: [y, N(y)] },
          A(M(q, P("y", 2)), N(M(p, P("x", 2))), -cc),
          X_INTERVALS,
        );
      },
    },
    {
      key: "implicit.mix.sine_curve",
      role: "mix",
      requires: [...implicitRequires, "sin"],
      build: (c) => {
        const a = int(c, 2, 15),
          value = a + int(c, 1, 10),
          x = F("Sqrt", A(value, N(M(a, F("Sin", "y")))));
        return implicitBuilt(
          { type: "graph", free: "y", branches: [x, N(x)] },
          A(P("x", 2), M(a, F("Sin", "y")), -value),
          [
            [-0.8, -0.3],
            [0.3, 0.8],
          ],
          "Compare on the given curve, where cos(y) ≠ 0.",
        );
      },
    },
    {
      key: "implicit.mix.exponential_curve",
      role: "mix",
      requires: [...implicitRequires, "exp"],
      build: (c) => {
        const a = int(c, 2, 15),
          value = int(c, 10, 20) + 5,
          x = F("Sqrt", Q(A(value, N(F("Exp", "y"))), a));
        return implicitBuilt(
          { type: "graph", free: "y", branches: [x, N(x)] },
          A(F("Exp", "y"), M(a, P("x", 2)), -value),
          [
            [-1, -0.2],
            [0.2, 1],
          ],
          "Compare on the given curve; the branch has x ≠ 0.",
        );
      },
    },
  ],
  inverse: [
    {
      key: "inverse.basic.linear",
      role: "basic",
      build: (c) => {
        const a = int(c, 2, 15),
          b = int(c, 1, 9);
        return inverseBuilt(A(M(a, "x"), b), b, X_INTERVALS);
      },
    },
    {
      key: "inverse.basic.cubic",
      role: "basic",
      build: (c) => inverseBuilt(A(P("x", 3), M(int(c, 2, 15), "x")), int(c, 1, 9), X_INTERVALS),
    },
    {
      key: "inverse.mix.linear_exponential",
      role: "mix",
      requires: ["exp"],
      build: (c) => inverseBuilt(A(M(int(c, 2, 15), "x"), F("Exp", "x")), 0, X_INTERVALS),
    },
    {
      key: "inverse.mix.cubic_sine",
      role: "mix",
      requires: ["sin"],
      build: (c) => {
        const a = int(c, 5, 15),
          b = int(c, 1, a - 1);
        return inverseBuilt(A(P("x", 3), M(a, "x"), M(b, F("Sin", "x"))), 0, X_INTERVALS);
      },
    },
  ],
  higher: [
    {
      key: "higher.basic.second_polynomial",
      role: "basic",
      meta: { derivativeOrder: 2 },
      build: (c) => higherBuilt(A(P("x", int(c, 3, 9)), M(int(c, 2, 15), P("x", 2))), 2, X_INTERVALS),
    },
    {
      key: "higher.basic.third_power",
      role: "basic",
      meta: { derivativeOrder: 3 },
      build: (c) => higherBuilt(M(int(c, 2, 15), P("x", int(c, 4, 12))), 3, X_INTERVALS),
    },
    {
      key: "higher.mix.third_chain",
      role: "mix",
      requires: ["chain"],
      pools: { h: SMOOTH_POOL },
      meta: { derivativeOrder: 3 },
      build: (c) => higherBuilt(M(int(c, 2, 15), F(SKILL_FN[c.pool("h")], M(int(c, 2, 5), "x"))), 3, X_INTERVALS),
    },
    {
      key: "higher.mix.second_product",
      role: "mix",
      requires: ["product"],
      pools: { h: SMOOTH_POOL },
      meta: { derivativeOrder: 2 },
      build: (c) => higherBuilt(M(P("x", int(c, 2, 5)), pooled(c, "h")), 2, SAFE_TRIG_INTERVALS),
    },
  ],
  parametric: [
    {
      key: "parametric.basic.linear_slope",
      role: "basic",
      requires: ["quotient"],
      meta: { derivativeOrder: 1 },
      build: (c) => parametricBuilt(A(M(int(c, 2, 15), "t"), int(c, 1, 9)), P("t", int(c, 2, 8)), 1, T_INTERVALS),
    },
    {
      key: "parametric.basic.power_second",
      role: "basic",
      requires: ["quotient"],
      meta: { derivativeOrder: 2 },
      build: (c) => parametricBuilt(M(int(c, 2, 15), P("t", 2)), P("t", int(c, 3, 8)), 2, T_INTERVALS),
    },
    {
      key: "parametric.mix.exponential_product",
      role: "mix",
      requires: ["quotient", "exp", "product"],
      pools: { h: SMOOTH_POOL },
      meta: { derivativeOrder: 1 },
      build: (c) => parametricBuilt(F("Exp", "t"), M(c.a, "t", pooled(c, "h", "t")), 1, SAFE_TRIG_INTERVALS),
    },
    {
      key: "parametric.mix.linear_chain",
      role: "mix",
      requires: ["quotient", "chain"],
      pools: { h: SMOOTH_POOL },
      meta: { derivativeOrder: 1 },
      build: (c) => parametricBuilt(
        A(M(int(c, 2, 15), "t"), int(c, 1, 9)),
        F(SKILL_FN[c.pool("h")], M(int(c, 2, 5), "t")),
        1,
        T_INTERVALS,
      ),
    },
  ],
  vector: [
    {
      key: "vector.basic.power_function",
      role: "basic",
      pools: { h: SMOOTH_POOL },
      build: (c) => vectorBuilt([P("t", int(c, 2, 8)), M(int(c, 2, 15), pooled(c, "h", "t"))], T_INTERVALS),
    },
    {
      key: "vector.basic.polynomial_exponential",
      role: "basic",
      build: (c) => vectorBuilt([
        A(M(int(c, 2, 15), P("t", int(c, 2, 8))), int(c, 1, 9)),
        F("Exp", "t"),
      ], T_INTERVALS),
    },
    {
      key: "vector.mix.product_chain",
      role: "mix",
      requires: ["product", "chain"],
      pools: { h: SMOOTH_POOL },
      build: (c) => vectorBuilt([
        M(A(P("t", 2), int(c, 2, 15)), F("Exp", "t")),
        F(SKILL_FN[c.pool("h")], P("t", 2)),
      ], T_INTERVALS),
    },
    {
      key: "vector.mix.log_product",
      role: "mix",
      requires: ["log", "chain", "product"],
      pools: { h: SMOOTH_POOL },
      build: (c) => vectorBuilt([
        F("Ln", A(P("t", 2), int(c, 2, 15))),
        M("t", pooled(c, "h", "t")),
      ], T_INTERVALS),
    },
  ],
  polar: [
    {
      key: "polar.basic.sine_radius",
      role: "basic",
      requires: polarRequires,
      build: (c) => polarBuilt(A(int(c, 2, 10), M(int(c, 11, 20), F("Sin", "theta"))), POLAR_INTERVALS),
    },
    {
      key: "polar.basic.cosine_radius",
      role: "basic",
      requires: polarRequires,
      build: (c) => polarBuilt(A(int(c, 2, 15), M(int(c, 2, 15), F("Cos", "theta"))), POLAR_INTERVALS),
    },
    {
      key: "polar.mix.sine_frequency",
      role: "mix",
      requires: [...polarRequires, "chain"],
      build: (c) => polarBuilt(A(int(c, 2, 10), F("Sin", M(int(c, 2, 3), "theta"))), POLAR_INTERVALS),
    },
    {
      key: "polar.mix.cosine_frequency",
      role: "mix",
      requires: [...polarRequires, "chain"],
      build: (c) => polarBuilt(A(int(c, 10, 20), M(int(c, 2, 15), F("Cos", M(int(c, 2, 3), "theta")))), POLAR_INTERVALS),
    },
  ],
};

for (const id of ["sin", "cos", "tan", "cot", "sec", "csc"] as const) {
  const op = SKILL_FN[id];
  TEMPLATES[id] = [
    {
      key: `${id}.basic.scaled`,
      role: "basic",
      build: (c) => ({ e: M(int(c, 2, 15), F(op, "x")), intervals: trigIntervals(id) }),
    },
    {
      key: `${id}.basic.divided`,
      role: "basic",
      build: (c) => ({ e: Q(F(op, "x"), int(c, 2, 15)), intervals: trigIntervals(id) }),
    },
    {
      key: `${id}.mix.power_sum`,
      role: "mix",
      requires: ["sum", "power"],
      build: (c) => ({
        e: A(M(int(c, 2, 15), F(op, "x")), M(int(c, 2, 15), P("x", int(c, 2, 8)))),
        intervals: SAFE_TRIG_INTERVALS,
      }),
    },
    {
      key: `${id}.mix.function_sum`,
      role: "mix",
      requires: ["sum"],
      pools: { h: SMOOTH_POOL.filter((fn) => fn !== id) },
      build: (c) => ({
        e: A(M(int(c, 2, 15), F(op, "x")), M(int(c, 2, 15), pooled(c, "h"))),
        intervals: SAFE_TRIG_INTERVALS,
      }),
    },
  ];
}
for (const id of ["asin", "acos", "atan"] as const) {
  const op = SKILL_FN[id];
  TEMPLATES[id] = [
    {
      key: `${id}.basic.scaled`,
      role: "basic",
      build: (c) => ({ e: M(int(c, 2, 15), F(op, "x")), intervals: SAFE_TRIG_INTERVALS }),
    },
    {
      key: `${id}.basic.divided_value`,
      role: "basic",
      build: (c) => ({ e: Q(F(op, "x"), int(c, 2, 15)), intervals: SAFE_TRIG_INTERVALS }),
    },
    {
      key: `${id}.mix.power_sum`,
      role: "mix",
      requires: ["sum", "power"],
      build: (c) => ({
        e: A(M(int(c, 2, 15), F(op, "x")), M(int(c, 2, 15), P("x", int(c, 2, 8)))),
        intervals: SAFE_TRIG_INTERVALS,
      }),
    },
    {
      key: `${id}.mix.square_root`,
      role: "mix",
      requires: ["sum", "root"],
      build: (c) => ({
        e: A(F(op, "x"), M(int(c, 2, 15), F("Sqrt", "x"))),
        intervals: SAFE_TRIG_INTERVALS,
      }),
    },
  ];
}
