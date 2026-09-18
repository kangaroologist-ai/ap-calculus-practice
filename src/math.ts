import Decimal from "decimal.js";
import type { Expr } from "./types";
export const add = (...xs: Expr[]): Expr => {
  const a = xs.filter((x) => x !== 0);
  return a.length === 0 ? 0 : a.length === 1 ? a[0] : ["Add", ...a];
};
export const mul = (...xs: Expr[]): Expr => {
  if (xs.includes(0)) return 0;
  const a = xs.filter((x) => x !== 1);
  return a.length === 0 ? 1 : a.length === 1 ? a[0] : ["Multiply", ...a];
};
export const neg = (x: Expr): Expr =>
  typeof x === "number" ? -x : ["Negate", x];
export const div = (a: Expr, b: Expr): Expr =>
  a === 0 ? 0 : b === 1 ? a : ["Divide", a, b];
export const pow = (a: Expr, b: Expr): Expr =>
  b === 0 ? 1 : b === 1 ? a : ["Power", a, b];
export const fn = (op: string, x: Expr): Expr => [op, x];
export function derivative(e: Expr, v = "x"): Expr {
  if (typeof e === "number") return 0;
  if (typeof e === "string") return e === v ? 1 : 0;
  const [op, ...a] = e;
  const u = a[0],
    z = a[1],
    d = derivative(u, v);
  switch (op) {
    case "Add":
      return add(...a.map((x) => derivative(x, v)));
    case "Negate":
      return neg(d);
    case "Multiply":
      return add(
        ...a.map((_, i) =>
          mul(...a.map((x, j) => (i === j ? derivative(x, v) : x))),
        ),
      );
    case "Divide":
      return div(add(mul(d, z), neg(mul(u, derivative(z, v)))), pow(z, 2));
    case "Power":
      if (typeof z === "number") return mul(z, pow(u, z - 1), d);
      if (
        Array.isArray(z) &&
        z[0] === "Divide" &&
        typeof z[1] === "number" &&
        typeof z[2] === "number"
      )
        return mul(z, pow(u, div(z[1] - z[2], z[2])), d);
      return mul(e, add(mul(derivative(z, v), fn("Ln", u)), div(mul(z, d), u)));
    case "Exp":
      return mul(fn("Exp", u), d);
    case "Ln":
      return div(d, u);
    case "Sin":
      return mul(fn("Cos", u), d);
    case "Cos":
      return neg(mul(fn("Sin", u), d));
    case "Tan":
      return mul(pow(fn("Sec", u), 2), d);
    case "Cot":
      return neg(mul(pow(fn("Csc", u), 2), d));
    case "Sec":
      return mul(fn("Sec", u), fn("Tan", u), d);
    case "Csc":
      return neg(mul(fn("Csc", u), fn("Cot", u), d));
    case "Arcsin":
      return div(d, fn("Sqrt", add(1, neg(pow(u, 2)))));
    case "Arccos":
      return neg(div(d, fn("Sqrt", add(1, neg(pow(u, 2))))));
    case "Arctan":
      return div(d, add(1, pow(u, 2)));
    case "Sqrt":
      return div(d, mul(2, fn("Sqrt", u)));
    default:
      throw Error(`Unsupported derivative: ${op}`);
  }
}
export function latex(e: Expr): string {
  if (typeof e === "number") return String(e);
  if (typeof e === "string")
    return e === "theta" ? "\\theta" : e === "ExponentialE" ? "e" : e;
  const [op, ...a] = e,
    u = a[0],
    v = a[1];
  const wrap = (x: Expr) => `\\left(${latex(x)}\\right)`;
  switch (op) {
    case "Add":
      return a.map(latex).join("+").replace(/\+\-/g, "-");
    case "Multiply":
      return a
        .map((x) =>
          (Array.isArray(x) && ["Add", "Negate"].includes(x[0])) ||
          (typeof x === "number" && x < 0)
            ? wrap(x)
            : latex(x),
        )
        .join("\\cdot ");
    case "Negate":
      return `-${wrap(u)}`;
    case "Divide":
      return `\\frac{${latex(u)}}{${latex(v)}}`;
    case "Power":
      return `${typeof u === "string" || (typeof u === "number" && u >= 0) ? latex(u) : wrap(u)}^{${latex(v)}}`;
    case "Sqrt":
      return `\\sqrt{${latex(u)}}`;
    case "Exp":
      return `e^{${latex(u)}}`;
    case "Ln":
      return `\\ln${wrap(u)}`;
    case "Arcsin":
    case "Arccos":
    case "Arctan":
      return `\\${op.toLowerCase()}${wrap(u)}`;
    default:
      return `\\${op.toLowerCase()}${wrap(u)}`;
  }
}
export function complexity(e: Expr): number {
  return Array.isArray(e)
    ? 1 + e.slice(1).reduce<number>((s, x) => s + complexity(x), 0)
    : 1;
}
export function rationalExponent(e: Expr): [number, number] | undefined {
  const reduce = (p: number, q: number): [number, number] | undefined => {
    if (!Number.isSafeInteger(p) || !Number.isSafeInteger(q) || !q) return;
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const g = gcd(Math.abs(p), Math.abs(q));
    return [(p / g) * Math.sign(q), Math.abs(q) / g];
  };
  if (typeof e === "number") {
    if (Number.isInteger(e)) return reduce(e, 1);
    const digits = String(e).split(".")[1]?.length;
    return digits && digits <= 12
      ? reduce(e * 10 ** digits, 10 ** digits)
      : undefined;
  }
  if (!Array.isArray(e)) return;
  const [op, ...args] = e,
    values = args.map(rationalExponent);
  if (values.some((x) => !x)) return;
  const a = values[0]!,
    b = values[1];
  if (op === "Negate") return [-a[0], a[1]];
  if (op === "Divide" && b) return reduce(a[0] * b[1], a[1] * b[0]);
  if (op === "Subtract" && b)
    return reduce(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  if (op === "Add" || op === "Multiply") {
    let result: [number, number] | undefined = op === "Add" ? [0, 1] : [1, 1];
    for (const v of values) {
      if (!result || !v) return;
      result =
        op === "Add"
          ? reduce(result[0] * v[1] + v[0] * result[1], result[1] * v[1])
          : reduce(result[0] * v[0], result[1] * v[1]);
    }
    return result;
  }
}
export class NumericalUncertainty extends Error {}
export class MathDomainError extends Error {}
export type Values = Record<string, Decimal>;
export function evaluator(precision = 50) {
  const D = Decimal.clone({ precision });
  const calc = (e: Expr, values: Values): Decimal => {
    if (typeof e === "number") return new D(e);
    if (typeof e === "string") {
      if (e === "e" || e === "ExponentialE") return new D(1).exp();
      if (e === "Pi") return D.acos(-1);
      if (values[e] !== undefined) return new D(values[e]);
      throw Error("Unknown variable");
    }
    const [op, ...args] = e;
    const a = args.map((x) => calc(x, values)),
      u = a[0],
      v = a[1];
    let r: Decimal;
    const reciprocal = (x: Decimal) => {
      if (x.isZero()) throw new MathDomainError("Singularity");
      if (x.abs().lt("1e-30"))
        throw new NumericalUncertainty("Near singularity");
      return new D(1).div(x);
    };
    switch (op) {
      case "Add":
        r = a.reduce((s, x) => s.plus(x), new D(0));
        break;
      case "Multiply":
        r = a.reduce((s, x) => s.times(x), new D(1));
        break;
      case "Negate":
        r = u.neg();
        break;
      case "Subtract":
        r = u.minus(v);
        break;
      case "Divide":
        if (v.isZero()) throw new MathDomainError("Singularity");
        if (v.abs().lt("1e-30"))
          throw new NumericalUncertainty("Near singularity");
        r = u.div(v);
        break;
      case "Power": {
        const rational = rationalExponent(args[1]);
        if (
          u.isNegative() &&
          !v.isInteger() &&
          rational &&
          rational[1] % 2 === 1
        ) {
          r = u
            .abs()
            .pow(v)
            .times(Math.abs(rational[0]) % 2 === 1 ? -1 : 1);
          break;
        }
        if (
          (u.isNegative() && !v.isInteger()) ||
          (u.isZero() && v.isNegative())
        )
          throw new MathDomainError("Outside the real domain");
        r = u.pow(v);
        break;
      }
      case "Sqrt":
        if (u.isNegative())
          throw new MathDomainError("Outside the real domain");
        r = u.sqrt();
        break;
      case "Exp":
        r = u.exp();
        break;
      case "Ln":
        if (u.lte(0)) throw new MathDomainError("Outside the real domain");
        r = u.ln();
        break;
      case "Log":
        if (u.lte(0) || (v && (v.lte(0) || v.eq(1))))
          throw new MathDomainError("Outside the real domain");
        r = args.length === 1 ? u.log(10) : u.log(v);
        break;
      case "Sin":
        r = u.sin();
        break;
      case "Cos":
        r = u.cos();
        break;
      case "Tan":
        r = u.sin().times(reciprocal(u.cos()));
        break;
      case "Cot":
        r = u.cos().times(reciprocal(u.sin()));
        break;
      case "Sec":
        r = reciprocal(u.cos());
        break;
      case "Csc":
        r = reciprocal(u.sin());
        break;
      case "Arcsin":
        if (u.abs().gt(1)) throw new MathDomainError("Outside the real domain");
        r = u.asin();
        break;
      case "Arccos":
        if (u.abs().gt(1)) throw new MathDomainError("Outside the real domain");
        r = u.acos();
        break;
      case "Arctan":
        r = u.atan();
        break;
      case "Abs":
        r = u.abs();
        break;
      default:
        throw Error(`Unsupported expression ${op}`);
    }
    if (!r.isFinite() || r.abs().gt("1e100"))
      throw new NumericalUncertainty("Outside numerical range");
    return r;
  };
  return { calc, D };
}
export function random(seed: string) {
  let a = 2166136261;
  for (const c of seed) a = Math.imul(a ^ c.charCodeAt(0), 16777619);
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
