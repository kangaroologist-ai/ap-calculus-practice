import { checkExtraDomains } from "./domains";
import { ComputeEngine } from "@cortex-js/compute-engine";
import type { Expr, Question, Verdict } from "./types";
import { evaluator, random, latex, MathDomainError, type Values } from "./math";
const ce = new ComputeEngine();
const arities: Record<string, [number, number]> = {
  Add: [2, 200],
  Multiply: [2, 200],
  Divide: [2, 2],
  Power: [2, 2],
  Negate: [1, 1],
  Subtract: [2, 2],
  Sqrt: [1, 1],
  Sin: [1, 1],
  Cos: [1, 1],
  Tan: [1, 1],
  Cot: [1, 1],
  Sec: [1, 1],
  Csc: [1, 1],
  Arcsin: [1, 1],
  Arccos: [1, 1],
  Arctan: [1, 1],
  Ln: [1, 1],
  Log: [1, 2],
  Exp: [1, 1],
  Abs: [1, 1],
};
export function parseAnswer(raw: string, variables: string[]): Expr {
  if (!raw.trim()) throw Error("Enter an answer first.");
  if (raw.length > 2000) throw Error("Your expression is too long.");
  let count = 0;
  const walk = (e: unknown, depth = 0): Expr => {
    if (++count > 200 || depth > 20)
      throw Error("Please use a shorter expression.");
    if (typeof e === "number") {
      if (!Number.isFinite(e) || Math.abs(e) > 1e12)
        throw Error("This number is outside the supported range.");
      return e;
    }
    if (typeof e === "string") {
      if ([...variables, "e", "ExponentialE", "Pi"].includes(e)) return e;
      throw Error(`Use only ${variables.join(", ")} and supported functions.`);
    }
    if (e && typeof e === "object" && !Array.isArray(e) && "num" in e) {
      const n = String((e as { num: unknown }).num);
      if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(n) || n.length > 40)
        throw Error("Use a smaller exact number.");
      return walk(Number(n), depth);
    }
    if (!Array.isArray(e) || typeof e[0] !== "string")
      throw Error("Check the expression and its brackets.");
    let op = e[0];
    if (op === "Delimiter") {
      if (e.length !== 2) throw Error("Enter a single expression.");
      return walk(e[1], depth + 1);
    }
    if (op === "Root" && e.length === 3)
      return walk(["Power", e[1], ["Divide", 1, e[2]]], depth + 1);
    if (op === "InvisibleOperator") op = "Multiply";
    if (op === "Rational") op = "Divide";
    const arity = arities[op];
    if (!arity || e.length - 1 < arity[0] || e.length - 1 > arity[1])
      throw Error("Use an evaluated expression with supported functions.");
    const args = e
      .slice(1)
      .filter((x) => !(Array.isArray(x) && x[0] === "HorizontalSpacing"))
      .map((x) => walk(x, depth + 1));
    if (args.length < arity[0] || args.length > arity[1])
      throw Error("Check the expression spacing.");
    if (op === "Power") {
      const z = args[1];
      if (typeof z === "number" && Math.abs(z) > 100)
        throw Error("The exponent is too large.");
    }
    return [op, ...args];
  };
  // Raw form preserves holes in the student's domain before any simplification.
  return walk(ce.parse(raw, { form: "raw" }).json);
}
export function sampleValues(q: Question, i: number, precision = 50): Values {
  const { D, calc } = evaluator(precision);
  const rng = random(`${q.seed}:grade:${i}`);
  const [lo, hi] = q.domain.intervals[i % q.domain.intervals.length];
  const unit = i < 6 ? [0.05, 0.25, 0.5, 0.75, 0.95, 0.125][i] : rng();
  let point = new D(lo).plus(new D(hi).minus(lo).times(unit));
  if (q.domain.curve) {
    const c = q.domain.curve;
    // Checked first, since "graph" is the only member of the Curve union
    // whose object shape TypeScript can narrow to by itself; circle and
    // hyperbola share one shape (a type: "circle" | "hyperbola" field) and
    // are told apart below without relying on excluding "graph" by then.
    if (c.type === "graph") {
      // Generic graph curve (SPEC-G4): the other variable is whichever
      // branch this sample's turn lands on, evaluated at the free-variable
      // point. Cycling the branch every `intervals.length` steps (while the
      // interval itself alternates every step) spreads samples over every
      // branch x interval combination instead of favoring one branch.
      const other = c.free === "x" ? "y" : "x";
      const k = Math.floor(i / q.domain.intervals.length) % c.branches.length;
      return {
        [c.free]: point,
        [other]: calc(c.branches[k], { [c.free]: point }),
      };
    }
    if (c.type === "circle")
      return {
        x: new D(c.parameter).times(point.cos()),
        y: new D(c.parameter).times(point.sin()),
      };
    const x = point;
    return {
      x,
      y: calc(["Sqrt", ["Add", ["Power", "x", 2], c.parameter]], { x }).times(
        i % 2 ? 1 : -1,
      ),
    };
  }
  if (i < 7) point = new D([0, 1, -1, 2, -2, 0.5, -0.5][i]);
  return { [q.domain.variable]: point };
}
export function grade(q: Question, raw: string[]): Verdict {
  if (raw.length !== q.answers.length)
    return { status: "invalid", message: "Complete every answer field." };
  let answers: Expr[];
  try {
    answers = raw.map((x) =>
      parseAnswer(x, q.domain.curve ? ["x", "y"] : [q.domain.variable]),
    );
  } catch (e) {
    return { status: "invalid", message: (e as Error).message };
  }
  let valid = 0;
  const counts = q.domain.intervals.map(() => 0);
  const { calc, D } = evaluator(50);
  for (let i = 0; i < 200 && valid < 24; i++) {
    const values = sampleValues(q, i);
    let expected;
    try {
      q.source.forEach((x) => calc(x, values));
      q.domain.guards.forEach((x) => calc(x, values));
      expected = q.answers.map((x) => calc(x, values));
    } catch {
      continue;
    }
    let actual;
    try {
      actual = answers.map((x) => calc(x, values));
    } catch (error) {
      if (!(error instanceof MathDomainError)) continue;
      // Recheck at higher precision before classifying an undefined answer.
      try {
        const hi = evaluator(80),
          p = sampleValues(q, i, 80);
        q.answers.forEach((x) => hi.calc(x, p));
        answers.forEach((x) => hi.calc(x, p));
      } catch (error) {
        if (!(error instanceof MathDomainError)) continue;
        return { status: "incorrect", feedbackCode: "domain" };
      }
      continue;
    }
    for (let j = 0; j < expected.length; j++) {
      const diff = expected[j].minus(actual[j]).abs();
      const tolerance = new D("1e-12").plus(
        D.max(expected[j].abs(), actual[j].abs()).times("1e-10"),
      );
      if (diff.gt(tolerance)) {
        try {
          const hi = evaluator(80),
            p = sampleValues(q, i, 80),
            a = hi.calc(answers[j], p),
            b = hi.calc(q.answers[j], p);
          if (
            a
              .minus(b)
              .abs()
              .gt(
                new hi.D("1e-12").plus(
                  hi.D.max(a.abs(), b.abs()).times("1e-10"),
                ),
              )
          )
            return { status: "incorrect", feedbackCode: "different" };
        } catch {
          return {
            status: "inconclusive",
            message:
              "We could not verify this form reliably. Try an equivalent expression.",
          };
        }
      }
    }
    valid++;
    counts[i % counts.length]++;
  }
  if (valid < 24 || counts.some((x) => x < 4))
    return {
      status: "inconclusive",
      message:
        "Not enough valid comparison points. Try another equivalent form or skip this question.",
    };
  // Put trusted ASTs through the same raw LaTeX grammar as student input,
  // so harmless serializer forms do not look like new domain restrictions.
  const variables = q.domain.curve ? ["x", "y"] : [q.domain.variable];
  const normalize = (e: Expr) => parseAnswer(latex(e), variables);
  let domainCheck: ReturnType<typeof checkExtraDomains>;
  try {
    domainCheck = checkExtraDomains(
      {
        ...q,
        source: q.source.map(normalize),
        answers: q.answers.map(normalize),
        domain: { ...q.domain, guards: q.domain.guards.map(normalize) },
      },
      answers,
    );
  } catch {
    domainCheck = "unknown";
  }
  if (domainCheck === "invalid")
    return { status: "incorrect", feedbackCode: "domain" };
  if (domainCheck === "unknown")
    return {
      status: "inconclusive",
      message:
        "This form may add a domain restriction. Try a form without extra denominators, roots, or logarithms.",
    };
  const identical = answers.every(
    (a, i) => JSON.stringify(a) === JSON.stringify(q.answers[i]),
  );
  return { status: "correct", evidence: identical ? "symbolic" : "numeric" };
}
