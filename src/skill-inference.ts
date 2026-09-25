import type { Expr } from "./types";
// Maps a math.ts operator name to the catalog skill id a student needs to
// differentiate it directly (not counting any composition with the
// differentiation variable, which inferSkills detects separately as
// "chain"/"nested").
const FN: Record<string, string> = {
  Sin: "sin",
  Cos: "cos",
  Tan: "tan",
  Cot: "cot",
  Sec: "sec",
  Csc: "csc",
  Exp: "exp",
  Ln: "log",
  Arcsin: "asin",
  Arccos: "acos",
  Arctan: "atan",
  Sqrt: "root",
};
const has = (e: Expr, vs: string[]): boolean =>
  typeof e === "string"
    ? vs.includes(e)
    : Array.isArray(e) && e.slice(1).some((x) => has(x, vs));
// Infers which catalog skills a source expression actually exercises, given
// the set of differentiation variables `vs` (["x"] for most questions, ["x",
// "y"] for an implicit curve). depth tracks how many composite layers deep
// the current node sits: depth 0 is a bare chain rule, depth >= 1 means the
// chain rule itself is nested inside another one.
export function inferSkills(
  e: Expr,
  vs: string[],
  out = new Set<string>(),
  depth = 0,
): Set<string> {
  if (!Array.isArray(e) || !has(e, vs)) return out;
  const [op, ...args] = e;
  if (op === "Add") out.add("sum");
  // A constant multiple (only one variable-dependent factor) is not a product.
  if (op === "Multiply" && args.filter((x) => has(x, vs)).length > 1)
    out.add("product");
  if (op === "Divide" && has(args[1], vs)) out.add("quotient");
  if (op === "Power")
    out.add(
      has(args[1], vs)
        ? "exp"
        : Array.isArray(args[1]) && args[1][0] === "Divide"
          ? "root"
          : "power",
    );
  if (FN[op]) out.add(FN[op]);
  const inner =
    op === "Power"
      ? has(args[1], vs)
        ? args[1]
        : args[0]
      : FN[op]
        ? args[0]
        : undefined;
  const composite =
    inner !== undefined && !(typeof inner === "string" && vs.includes(inner));
  if (composite && has(inner!, vs)) out.add(depth >= 1 ? "nested" : "chain");
  for (const x of args)
    inferSkills(x, vs, out, x === inner && composite ? depth + 1 : depth);
  return out;
}
