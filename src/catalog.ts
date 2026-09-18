import type { Config, Skill } from "./types";
export const CURRICULUM_VERSION = "ap-derivatives-1";
const s = (
  id: string,
  label: string,
  level: number,
  rule: string,
  prerequisites: string[] = [],
): Skill => ({ id, label, level, rule, prerequisites });
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
  ...["sin", "cos", "tan", "cot", "sec", "csc"].map((id) =>
    s(
      id,
      `${id} derivatives`,
      2,
      "Use the basic trigonometric derivative and include any inner derivative.",
      ["power"],
    ),
  ),
  ...["asin", "acos", "atan"].map((id) =>
    s(
      id,
      `${id.replace("a", "arc")} derivatives`,
      2,
      "Use the inverse-trigonometric derivative, with its real-domain restriction.",
      ["root"],
    ),
  ),
  s(
    "product",
    "Product rule",
    3,
    "Differentiate the first factor times the second, plus the first times the derivative of the second.",
    ["sum", "sin", "exp"],
  ),
  s(
    "quotient",
    "Quotient rule",
    3,
    "Use (u′v − uv′)/v². Keep the order in the numerator.",
    ["sum", "cos"],
  ),
  s(
    "chain",
    "Chain rule",
    3,
    "Differentiate the outer function at the inner function, then multiply by the inner derivative.",
    ["power", "sin"],
  ),
  s(
    "nested",
    "Nested chain rule",
    4,
    "Work from the outside in, multiplying by the derivative of every inner layer.",
    ["chain", "exp", "sin"],
  ),
  s(
    "mixed",
    "Mixed differentiation",
    4,
    "Identify the outermost operation first, then apply the rules within each factor.",
    ["product", "quotient", "chain"],
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
  s(
    "higher",
    "Higher derivatives",
    5,
    "Differentiate successively; keep track of which derivative is requested.",
    ["product", "chain"],
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
    ["exp", "sin", "power"],
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
