import type { Expr, Question, Domain } from "./types";
import {
  add as A,
  mul as M,
  div as Q,
  pow as P,
  neg as N,
  fn as F,
  derivative as d,
  latex as L,
  random,
  complexity,
  evaluator,
} from "./math";
import { skillById } from "./catalog";
import { ddx, dydx } from "./notation";
export const GENERATOR_VERSION = "1.1.0";
export function generateQuestion(
  id: string,
  seed: string,
  templateOverride?: number,
): Question {
  for (let attempt = 0; attempt < 20; attempt++) {
    const q = instantiate(
      id,
      attempt ? `${seed}:${attempt}` : seed,
      templateOverride,
    );
    if (
      q.source.every((e) => complexity(e) <= 40) &&
      q.answers.every((e) => complexity(e) <= 180)
    )
      return q;
  }
  return instantiate(id, "verified-fallback", templateOverride ?? 0);
}
function instantiate(id: string, seed: string, override?: number): Question {
  const skill = skillById(id),
    r = random(seed),
    v = override ?? Math.floor(r() * 2),
    a = 2 + Math.floor(r() * 8),
    b = 1 + Math.floor(r() * 9),
    n = 2 + Math.floor(r() * 4);
  let variable: Domain["variable"] = "x",
    source: Expr[] = [],
    answers: Expr[] = [],
    labels = ["f'(x)"],
    prompt = "",
    title = "Find the derivative",
    domainText =
      "Use radians. Give an expression valid wherever the derivative exists.",
    intervals: [number, number][] = [
      [-2.5, -0.2],
      [0.2, 2.5],
    ],
    curve: Domain["curve"],
    guards: Expr[] = [];
  let e: Expr = 0,
    steps: { text: string; math: string }[] = [];
  const x = "x",
    lin = A(M(a, x), b),
    smooth = () => ["Sin", "Cos", "Exp"][Math.floor(r() * 3)],
    innerPower = () => A(P(x, 2 + Math.floor(r() * 3)), b);
  switch (id) {
    case "constant":
      e = v ? A(a, Q(b, n)) : a;
      break;
    case "power":
      e = v ? M(a, P(x, -n)) : P(x, n);
      break;
    case "sum":
      e = v ? A(M(a, P(x, n)), M(-b, x), n) : A(P(x, n), M(b, P(x, 2)), a);
      break;
    case "root":
      e = v ? M(a, P(x, Q(1, 3))) : M(a, P(x, Q(1, 2)));
      intervals = v
        ? [
            [-5, -0.1],
            [0.1, 5],
          ]
        : [
            [0.1, 1],
            [1, 5],
          ];
      break;
    case "exp":
      e = v ? P(a, x) : F("Exp", lin);
      break;
    case "log":
      e = v ? Q(F("Ln", x), F("Ln", a)) : F("Ln", lin);
      intervals = [
        [0.1, 1],
        [1, 5],
      ];
      break;
    case "sin":
    case "cos":
    case "tan":
    case "cot":
    case "sec":
    case "csc":
      e = v
        ? F(id[0].toUpperCase() + id.slice(1), lin)
        : M(a, F(id[0].toUpperCase() + id.slice(1), x));
      break;
    case "asin":
    case "acos":
    case "atan": {
      const op = { asin: "Arcsin", acos: "Arccos", atan: "Arctan" }[id];
      e = v ? F(op, Q(x, a)) : M(a, F(op, x));
      intervals = [
        [-0.8, -0.05],
        [0.05, 0.8],
      ];
      break;
    }
    case "product":
      e = v ? M(A(P(x, 2), a), F(smooth(), x)) : M(P(x, n), F(smooth(), x));
      break;
    case "quotient":
      e = v ? Q(F(smooth(), x), A(P(x, 2), a)) : Q(A(P(x, 2), b), lin);
      break;
    case "chain":
      e = v ? F(smooth(), innerPower()) : P(lin, n);
      break;
    case "nested":
      e = v ? F(smooth(), P(lin, 2)) : F(smooth(), F("Sin", lin));
      break;
    case "mixed":
      e = v
        ? Q(F(smooth(), lin), A(P(x, 2), b))
        : M(A(P(x, 2), b), F(smooth(), M(a, x)));
      break;
    case "implicit": {
      curve = { type: v ? "hyperbola" : "circle", parameter: a };
      source = [
        v ? A(P("y", 2), N(P(x, 2)), -a) : A(P(x, 2), P("y", 2), -a * a),
      ];
      answers = [N(Q(d(source[0], "x"), d(source[0], "y")))];
      prompt = `${L(source[0])}=0`;
      labels = ["dy/dx"];
      title = "Differentiate implicitly";
      intervals = v
        ? [
            [-2, -0.2],
            [0.2, 2],
          ]
        : [
            [0.25, 2.8],
            [3.4, 6.0],
          ];
      domainText = "Compare on the given curve, where y ≠ 0.";
      steps = [
        {
          text: "Differentiate both sides, remembering that y depends on x.",
          math: v ? `2y${dydx()}-2x=0` : `2x+2y${dydx()}=0`,
        },
        {
          text: "Isolate the requested derivative.",
          math: `${dydx()}=${L(answers[0])}`,
        },
      ];
      break;
    }
    case "inverse": {
      e = v ? A(P(x, 3), M(a, x)) : A(M(a, x), b);
      const point = b,
        evalr = evaluator();
      const val = evalr.calc(e, { x: new evalr.D(point) }).toNumber(),
        slope = evalr.calc(d(e), { x: new evalr.D(point) }).toNumber();
      source = [e];
      answers = [Q(1, slope)];
      title = "Find an inverse-function derivative";
      prompt = `f(x)=${L(e)},\\quad f(${point})=${val}.\\quad (f^{-1})'(${val})=?`;
      labels = [`(f⁻¹)'(${val})`];
      steps = [
        {
          text: "The inverse derivative is the reciprocal of the original derivative at the matching input.",
          math: `(f^{-1})'(${val})=\\frac{1}{f'(${point})}=${L(answers[0])}`,
        },
      ];
      break;
    }
    case "higher": {
      e = v ? M(a, F("Sin", x)) : A(P(x, n + 1), M(b, P(x, 2)));
      source = [e];
      let z = e;
      const order = v ? 3 : 2;
      for (let i = 1; i <= order; i++) {
        z = d(z);
        steps.push({
          text: `Differentiate ${i === 1 ? "once" : "again"}.`,
          math: `f^{(${i})}(x)=${L(z)}`,
        });
      }
      answers = [z];
      labels = [v ? "f'''(x)" : "f''(x)"];
      title = `Find the ${v ? "third" : "second"} derivative`;
      break;
    }
    case "parametric": {
      variable = "t";
      const t = "t",
        u = v ? P(t, 2) : A(M(a, t), b),
        w = v ? P(t, 3) : F("Sin", t);
      source = [u, w];
      const slope = Q(d(w, t), d(u, t));
      answers = [v ? Q(d(slope, t), d(u, t)) : slope];
      guards = [Q(1, d(u, t))];
      prompt = `x(t)=${L(u)},\\quad y(t)=${L(w)}`;
      labels = [v ? "d²y/dx²" : "dy/dx"];
      title = `Find the ${v ? "second derivative" : "slope"} in terms of t`;
      steps = [
        {
          text: "Divide the derivatives with respect to t.",
          math: `${dydx()}=${L(slope)}`,
        },
        ...(v
          ? [
              {
                text: "Differentiate the slope in t, then divide by dx/dt again.",
                math: `${dydx(2)}=${L(answers[0])}`,
              },
            ]
          : []),
      ];
      domainText = "Give your answer in t, where dx/dt ≠ 0.";
      break;
    }
    case "vector": {
      variable = "t";
      source = v
        ? [F("Exp", M(a, "t")), F("Cos", "t")]
        : [P("t", n), F("Sin", M(a, "t"))];
      answers = source.map((e) => d(e, "t"));
      prompt = `\\mathbf{r}(t)=\\langle ${source.map(L).join(",")}\\rangle`;
      labels = ["First component of r′(t)", "Second component of r′(t)"];
      title = "Differentiate the vector function";
      steps = answers.map((e, i) => ({
        text: `Differentiate component ${i + 1}.`,
        math: L(e),
      }));
      break;
    }
    case "polar": {
      variable = "theta";
      e = v ? A(a, F("Cos", "theta")) : M(a, F("Sin", "theta"));
      source = [e];
      const u = M(e, F("Cos", "theta")),
        w = M(e, F("Sin", "theta"));
      answers = [Q(d(w, "theta"), d(u, "theta"))];
      guards = [Q(1, d(u, "theta"))];
      prompt = `r(\\theta)=${L(e)}`;
      labels = ["dy/dx"];
      title = "Find the polar slope in terms of θ";
      steps = [
        {
          text: "Convert to Cartesian coordinates.",
          math: `x=${L(u)},\\quad y=${L(w)}`,
        },
        {
          text: "Divide their derivatives with respect to θ.",
          math: `${dydx()}=${L(answers[0])}`,
        },
      ];
      domainText = "Give your answer in θ, where dx/dθ ≠ 0.";
      break;
    }
  }
  if (!source.length) {
    source = [e];
    answers = [d(e)];
  }
  if (!prompt) prompt = `f(x)=${L(e)}`;
  if (!steps.length) {
    steps = [
      { text: skill.rule, math: ruleFormula(id) },
      ...derivationSteps(e, variable),
      {
        text: "Apply the rule to this function. Equivalent unsimplified answers are accepted.",
        math: `${labels[0]}=${L(answers[0])}`,
      },
    ];
  }
  const hintMath = structureHint(id, source, variable);
  return {
    id: `${id}:${v}:${seed}`,
    seed,
    generatorVersion: GENERATOR_VERSION,
    template: v,
    family: id,
    level: skill.level,
    primarySkill: id,
    supportingSkills: skill.prerequisites,
    title,
    prompt,
    source,
    answers,
    labels,
    domain: { variable, intervals, curve, guards },
    domainText,
    hints: [
      skill.rule,
      "Identify the parts below, then apply the rule to each part.",
    ],
    hintMath,
    steps,
    signature: JSON.stringify([id, v, source]),
  };
}
export function ruleFormula(id: string): string {
  const rules: Record<string, string> = {
    constant: `${ddx()}c=0`,
    power: `${ddx()}x^n=nx^{n-1}`,
    sum: "(au+bv)'=au'+bv'",
    root: "\\sqrt{x}=x^{1/2}",
    product: "(uv)'=u'v+uv'",
    quotient: "\\left(\\frac{u}{v}\\right)'=\\frac{u'v-uv'}{v^2}",
    chain: "[f(g(x))]'=f'(g(x))g'(x)",
    nested: "[f(g(h(x)))]'=f'(g(h(x)))g'(h(x))h'(x)",
    exp: "(e^u)'=e^u u',\\quad (a^u)'=a^u\\ln(a)u'",
    log: "(\\ln u)'=\\frac{u'}{u}",
    sin: "(\\sin u)'=\\cos(u)u'",
    cos: "(\\cos u)'=-\\sin(u)u'",
    tan: "(\\tan u)'=\\sec^2(u)u'",
    cot: "(\\cot u)'=-\\csc^2(u)u'",
    sec: "(\\sec u)'=\\sec(u)\\tan(u)u'",
    csc: "(\\csc u)'=-\\csc(u)\\cot(u)u'",
    asin: "(\\arcsin u)'=\\frac{u'}{\\sqrt{1-u^2}}",
    acos: "(\\arccos u)'=-\\frac{u'}{\\sqrt{1-u^2}}",
    atan: "(\\arctan u)'=\\frac{u'}{1+u^2}",
  };
  return rules[id] ?? "[f(g(x))]'=f'(g(x))g'(x)";
}
function structureHint(id: string, source: Expr[], variable: string): string {
  let e = source[0];
  if (["product", "mixed", "quotient"].includes(id) && Array.isArray(e))
    return `u=${L(e[1])},\\quad v=${L(e[2])}`;
  if (Array.isArray(e) && e[0] === "Multiply" && typeof e[1] === "number")
    e = e[2];
  if (Array.isArray(e)) {
    if (e[0] === "Power") {
      if (typeof e[1] === "number") return `a=${L(e[1])},\\quad u=${L(e[2])}`;
      return `u=${L(e[1])},\\quad n=${L(e[2])}`;
    }
    if (
      [
        "Sin",
        "Cos",
        "Tan",
        "Cot",
        "Sec",
        "Csc",
        "Exp",
        "Ln",
        "Arcsin",
        "Arccos",
        "Arctan",
      ].includes(e[0])
    )
      return `u=${L(e[1])}`;
  }
  return `${variable === "theta" ? "\\theta" : variable}\\text{ is the differentiation variable.}\\quad ${source.map(L).join(",\\;")}`;
}
function derivationSteps(
  e: Expr,
  variable: string,
): { text: string; math: string }[] {
  const steps: { text: string; math: string }[] = [];
  const seen = new Set<string>();
  function visit(node: Expr, top = false) {
    if (!Array.isArray(node)) return;
    for (const child of node.slice(1)) visit(child);
    const key = JSON.stringify(node);
    if (top || seen.has(key) || !key.includes(`"${variable}"`)) return;
    seen.add(key);
    const rule: Record<string, string> = {
      Add: "Differentiate each term.",
      Multiply: "Apply the constant multiple or product rule.",
      Divide: "Apply the quotient rule.",
      Power: "Apply the power rule and multiply by the inner derivative.",
      Sin: "Differentiate sine and multiply by the inner derivative.",
      Cos: "Differentiate cosine and multiply by the inner derivative.",
      Exp: "Differentiate the exponential and multiply by the inner derivative.",
    };
    steps.push({
      text: rule[node[0]] ?? "Differentiate this inner function.",
      math: `${ddx(variable)}\\left[${L(node)}\\right]=${L(d(node, variable))}`,
    });
  }
  visit(e, true);
  return steps.slice(0, 10);
}
