import type { Config, Skill } from "./types";
export const CURRICULUM_VERSION = "ap-derivatives-3";
const s = (
  id: string,
  label: string,
  level: number,
  rule: string,
  prerequisites: string[] = [],
): Skill => ({ id, label, level, rule, prerequisites });
const functionLabels: Record<string, string> = {
  sin: "Sine",
  cos: "Cosine",
  tan: "Tangent",
  cot: "Cotangent",
  sec: "Secant",
  csc: "Cosecant",
  asin: "Arcsine",
  acos: "Arccosine",
  atan: "Arctangent",
};
export const SKILLS: Skill[] = [
  s("constant", "Constants", 1, "The derivative of a constant is zero."),
  s(
    "power",
    "Power rule",
    1,
    "Multiply by the exponent, then subtract one from the exponent.",
  ),
  s(
    "sum",
    "Sums & constant multiples",
    1,
    "Differentiate each term separately and keep constant coefficients.",
    ["power", "constant"],
  ),
  s(
    "root",
    "Roots & fractional powers",
    1,
    "Rewrite a root as a fractional power, then apply the power rule.",
    ["power"],
  ),
  s(
    "exp",
    "Exponential functions",
    2,
    "For e to a function, multiply by the inner derivative; for another base, also multiply by its natural logarithm.",
    ["power"],
  ),
  s(
    "log",
    "Logarithmic functions",
    2,
    "The derivative of ln(u) is u′/u; a different base adds a logarithm in the denominator.",
    ["power"],
  ),
  ...["sin", "cos"].map((id) =>
    s(
      id,
      functionLabels[id],
      2,
      "Use the basic trigonometric derivative and include any inner derivative.",
      ["power"],
    ),
  ),
  s(
    "product",
    "Product rule",
    3,
    "Differentiate the first factor times the second, plus the first times the derivative of the second.",
    ["sum", "power", "sin", "cos", "exp"],
  ),
  s(
    "quotient",
    "Quotient rule",
    3,
    "Use (u′v − uv′)/v². Keep the order in the numerator.",
    ["sum", "power"],
  ),
  ...["tan", "cot", "sec", "csc"].map((id) =>
    s(
      id,
      functionLabels[id],
      3,
      "Use the basic trigonometric derivative and include any inner derivative.",
      ["quotient"],
    ),
  ),
  s(
    "combine",
    "Combinations I",
    3,
    "Find the outermost operation first, then use the sum, product and quotient rules on its parts.",
    ["product", "quotient"],
  ),
  s(
    "chain",
    "Chain rule",
    4,
    "Differentiate the outer function at the inner function, then multiply by the inner derivative.",
    ["power", "sin", "cos", "exp"],
  ),
  s(
    "mixed",
    "Combinations II",
    4,
    "Use the product or sum rule outside and the chain rule inside: multiply each composite part by the derivative of its inside.",
    ["product", "chain"],
  ),
  s(
    "implicit",
    "Implicit differentiation",
    5,
    "Differentiate F(x,y)=0 with respect to x; every derivative of y introduces dy/dx.",
    ["chain", "quotient"],
  ),
  s(
    "inverse",
    "Inverse-function derivatives",
    5,
    "Use (f⁻¹)′(a)=1/f′(b), where f(b)=a and f′(b) is nonzero.",
    ["power"],
  ),
  ...["asin", "acos", "atan"].map((id) =>
    s(
      id,
      functionLabels[id],
      5,
      "Use the inverse-trigonometric derivative, with its real-domain restriction.",
      id === "atan" ? ["inverse"] : ["inverse", "root"],
    ),
  ),
  s(
    "higher",
    "Higher derivatives",
    5,
    "Differentiate successively; keep track of which derivative is requested.",
    ["product", "chain"],
  ),
  s(
    "nested",
    "Combinations III",
    5,
    "Work from the outside in: apply the quotient, product and chain rules in turn, and multiply by the derivative of every inner layer.",
    ["mixed", "quotient"],
  ),
  s(
    "abstract",
    "Abstract functions",
    5,
    "Treat f and g like any other function: differentiate the outer function at the inside, then multiply by the derivative of the inside. Write f′ for the derivative of f.",
    ["chain", "product"],
  ),
  s(
    "parametric",
    "Parametric derivatives",
    6,
    "Use dy/dx=(dy/dt)/(dx/dt). For the second derivative, differentiate the slope in t and divide by dx/dt again.",
    ["quotient", "higher"],
  ),
  s(
    "vector",
    "Vector derivatives",
    6,
    "Differentiate each component with respect to the parameter.",
    ["exp", "sin", "cos", "tan", "power"],
  ),
  s(
    "polar",
    "Polar slopes",
    6,
    "Write x=r cos(θ), y=r sin(θ), then use (dy/dθ)/(dx/dθ).",
    ["product", "parametric"],
  ),
];
export const skillById = (id: string) => {
  const v = SKILLS.find((s) => s.id === id);
  if (!v) throw Error("Unknown skill");
  return v;
};
export function validateConfig(v: unknown): Config {
  const c = v as Config;
  if (
    !c ||
    c.schemaVersion !== 1 ||
    typeof c.revision !== "string" ||
    !Number.isInteger(c.initialUnlockedLevel) ||
    c.initialUnlockedLevel < 1 ||
    c.initialUnlockedLevel > 6 ||
    !Number.isInteger(c.sessionLength) ||
    c.sessionLength < 1 ||
    c.sessionLength > 100 ||
    !Array.isArray(c.disabledFamilies) ||
    c.disabledFamilies.some((id) => !SKILLS.some((s) => s.id === id))
  )
    throw Error("Invalid practice configuration. Please contact your teacher.");
  return c;
}
