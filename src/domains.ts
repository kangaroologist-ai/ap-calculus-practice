import Decimal from "decimal.js";
import type { Expr, Question } from "./types";
import { evaluator, rationalExponent } from "./math";
type Condition = { kind: "nonzero" | "positive" | "nonnegative"; expr: Expr };
const D = Decimal.clone({ precision: 80 });
type Polynomial = Map<string, Decimal>;
// Exact decimal arithmetic for the small polynomial factors admitted by the input grammar.
function polynomial(e: Expr): Polynomial | undefined {
  if (typeof e === "number") return new Map([["", new D(e)]]);
  if (typeof e === "string")
    return ["x", "y", "t", "theta"].includes(e)
      ? new Map([[e, new D(1)]])
      : undefined;
  const [op, ...args] = e;
  if (op === "Subtract")
    return polynomial(["Add", args[0], ["Negate", args[1]]]);
  if (op === "Negate") {
    const p = polynomial(args[0]);
    return p && new Map([...p].map(([k, v]) => [k, v.neg()]));
  }
  if (
    op === "Power" &&
    typeof args[1] === "number" &&
    Number.isInteger(args[1]) &&
    args[1] >= 0 &&
    args[1] <= 8
  )
    return polynomial([
      "Multiply",
      ...Array.from({ length: args[1] }, () => args[0]),
    ]);
  if (op === "Add" || op === "Multiply") {
    let result: Polynomial = new Map(op === "Multiply" ? [["", new D(1)]] : []);
    for (const arg of args) {
      const p = polynomial(arg);
      if (!p) return;
      if (op === "Add") {
        for (const [k, v] of p)
          result.set(k, (result.get(k) ?? new D(0)).plus(v));
      } else {
        const product: Polynomial = new Map();
        for (const [a, x] of result)
          for (const [b, y] of p) {
            const k = [a, b]
              .filter(Boolean)
              .join("*")
              .split("*")
              .sort()
              .join("*");
            product.set(k, (product.get(k) ?? new D(0)).plus(x.times(y)));
            if (product.size > 64) return;
          }
        result = product;
      }
    }
    return new Map([...result].filter(([, v]) => !v.isZero()));
  }
  if (op === "Divide" && typeof args[1] === "number" && args[1] !== 0) {
    const p = polynomial(args[0]);
    return p && new Map([...p].map(([k, v]) => [k, v.div(args[1] as number)]));
  }
}
function key(e: Expr, nonzero: boolean): string {
  // Pythagorean complements have exactly the same zeros as the other trig factor.
  if (nonzero && Array.isArray(e)) {
    if (e[0] === "Power" && typeof e[2] === "number" && e[2] !== 0)
      return key(e[1], true);
    let square: Expr | undefined;
    if (e[0] === "Subtract" && e[1] === 1) square = e[2];
    if (
      e[0] === "Add" &&
      e[1] === 1 &&
      Array.isArray(e[2]) &&
      e[2][0] === "Negate"
    )
      square = e[2][1];
    if (
      Array.isArray(square) &&
      square[0] === "Power" &&
      square[2] === 2 &&
      Array.isArray(square[1])
    ) {
      const f = square[1];
      if (f[0] === "Sin" || f[0] === "Cos")
        return key([f[0] === "Sin" ? "Cos" : "Sin", f[1]], true);
    }
  }
  const p = polynomial(e);
  if (p) {
    const terms = [...p].sort(([a], [b]) => a.localeCompare(b));
    const scale = nonzero && terms.length ? terms[0][1] : new D(1);
    return JSON.stringify(terms.map(([k, v]) => [k, v.div(scale).toString()]));
  }
  return JSON.stringify(e);
}
function conditions(expressions: Expr[]): Condition[] {
  const result: Condition[] = [];
  function add(kind: Condition["kind"], expr: Expr) {
    if (kind === "nonzero" && Array.isArray(expr)) {
      if (expr[0] === "Multiply" || expr[0] === "Divide") {
        expr.slice(1).forEach((x) => add(kind, x));
        return;
      }
      if (expr[0] === "Negate" || expr[0] === "Power") {
        add(kind, expr[1]);
        return;
      }
      if (expr[0] === "Sqrt") {
        add("positive", expr[1]);
        return;
      }
    }
    result.push({ kind, expr });
  }
  function visit(e: Expr) {
    if (!Array.isArray(e)) return;
    e.slice(1).forEach(visit);
    const [op, u, v] = e;
    if (op === "Divide") add("nonzero", v);
    if (op === "Sqrt") add("nonnegative", u);
    if (op === "Ln" || op === "Log") add("positive", u);
    if (op === "Log" && v !== undefined) {
      add("positive", v);
      add("nonzero", ["Add", v, -1]);
    }
    if (op === "Tan" || op === "Sec") add("nonzero", ["Cos", u]);
    if (op === "Cot" || op === "Csc") add("nonzero", ["Sin", u]);
    if (op === "Arcsin" || op === "Arccos")
      add("nonnegative", ["Add", 1, ["Negate", ["Power", u, 2]]]);
    if (op === "Power") {
      const r = rationalExponent(v);
      if (!r) add("positive", u);
      else {
        if (r[1] % 2 === 0) add(r[0] < 0 ? "positive" : "nonnegative", u);
        else if (r[0] < 0) add("nonzero", u);
      }
    }
  }
  expressions.forEach(visit);
  return result;
}
// 2 means strictly positive, 1 nonnegative, 0 unknown.
function sign(e: Expr): number {
  if (typeof e === "number") return e > 0 ? 2 : e === 0 ? 1 : 0;
  if (typeof e === "string")
    return ["ExponentialE", "e", "Pi"].includes(e) ? 2 : 0;
  const [op, u, v] = e;
  if (op === "Exp" || (op === "Power" && sign(u) === 2)) return 2;
  if (op === "Abs" || op === "Sqrt") return 1;
  if (op === "Power" && typeof v === "number" && v > 0 && v % 2 === 0) return 1;
  if (op === "Add") {
    if (
      e.length === 3 &&
      Array.isArray(u) &&
      Array.isArray(v) &&
      u[0] === "Power" &&
      v[0] === "Power" &&
      u[2] === 2 &&
      v[2] === 2 &&
      Array.isArray(u[1]) &&
      Array.isArray(v[1]) &&
      new Set([u[1][0], v[1][0]]).size === 2 &&
      [u[1][0], v[1][0]].every((op) => op === "Sin" || op === "Cos") &&
      key(u[1][1], false) === key(v[1][1], false)
    )
      return 2;
    const signs = e.slice(1).map(sign);
    return signs.every(Boolean) ? (signs.some((x) => x === 2) ? 2 : 1) : 0;
  }
  if (op === "Multiply") {
    const signs = e.slice(1).map(sign);
    return signs.every((x) => x === 2) ? 2 : signs.every(Boolean) ? 1 : 0;
  }
  return 0;
}
export function checkExtraDomains(
  q: Question,
  answers: Expr[],
): "safe" | "invalid" | "unknown" {
  const known = conditions([...q.source, ...q.answers, ...q.domain.guards]);
  const actual = conditions(answers);
  let unknown = false;
  for (const condition of actual) {
    const { expr, kind } = condition;
    const hasVariable = (e: Expr): boolean =>
      Array.isArray(e)
        ? e.slice(1).some(hasVariable)
        : typeof e === "string" && ["x", "y", "t", "theta"].includes(e);
    if (!hasVariable(expr)) {
      try {
        const value = evaluator(80).calc(expr, {});
        if (
          (kind === "nonzero" && !value.isZero()) ||
          (kind === "positive" && value.gt(0)) ||
          (kind === "nonnegative" && value.gte(0))
        )
          continue;
      } catch {
        /* Unresolved constants are not treated as domain proofs. */
      }
    }
    const s = sign(expr);
    if (s === 2 || (kind === "nonnegative" && s === 1)) continue;
    if (typeof expr === "number" && kind === "nonzero" && expr !== 0) continue;
    const matches = known.some((k) => {
      if (!(
        k.kind === kind ||
        (k.kind === "positive" &&
          (kind === "nonnegative" || kind === "nonzero"))
      ))
        return false;
      return key(k.expr, kind === "nonzero") === key(expr, kind === "nonzero");
    });
    if (matches) continue;
    // A new linear denominator has an exact root: check the original derivative there.
    const p = polynomial(expr),
      variable = q.domain.variable;
    if (
      kind === "nonzero" &&
      !q.domain.curve &&
      p &&
      [...p.keys()].every((k) => k === "" || k === variable) &&
      p.get(variable)?.isZero() === false
    ) {
      const root = (p.get("") ?? new D(0)).neg().div(p.get(variable)!);
      const ev = evaluator(80),
        values = { [variable]: new ev.D(root.toString()) };
      try {
        [...q.source, ...q.domain.guards, ...q.answers].forEach((e) =>
          ev.calc(e, values),
        );
        return "invalid";
      } catch {
        /* This root may already be outside the question domain. */
      }
    }
    unknown = true;
  }
  return unknown ? "unknown" : "safe";
}
