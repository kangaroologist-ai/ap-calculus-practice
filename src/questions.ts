import type { Expr, Question, Domain, Skill } from "./types";
import { derivative as d, latex as L, random, complexity } from "./math";
import { SKILLS, skillById } from "./catalog";
import { ddx } from "./notation";
import { TEMPLATES, makeCtx, type Built, type Template } from "./templates";
import { inferSkills } from "./skill-inference";
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
    list = TEMPLATES[id],
    r = random(seed),
    v = override ?? Math.floor(r() * list.length),
    a = 2 + Math.floor(r() * 8),
    b = 1 + Math.floor(r() * 9),
    n = 2 + Math.floor(r() * 4);
  const template = list[v];
  return finalize(
    skill,
    template,
    v,
    seed,
    template.build(makeCtx(r, a, b, n)),
  );
}
function finalize(
  skill: Skill,
  template: Template,
  v: number,
  seed: string,
  built: Built,
): Question {
  const variable: Domain["variable"] = built.variable ?? "x";
  let source = built.source ?? [];
  let answers = built.answers ?? [];
  if (!source.length) {
    source = [built.e ?? 0];
    answers = [d(built.e ?? 0)];
  }
  const prompt = built.prompt ?? `f(x)=${L(source[0])}`;
  const labels = built.labels ?? ["f'(x)"];
  const title = built.title ?? "Find the derivative";
  const domainText =
    built.domainText ??
    "Use radians. Give an expression valid wherever the derivative exists.";
  const intervals: [number, number][] = built.intervals ?? [
    [-2.5, -0.2],
    [0.2, 2.5],
  ];
  const steps =
    built.steps && built.steps.length
      ? built.steps
      : [
          { text: skill.rule, math: ruleFormula(skill.id) },
          ...derivationSteps(source[0], variable),
          {
            text: "Apply the rule to this function. Equivalent unsimplified answers are accepted.",
            math: `${labels[0]}=${L(answers[0])}`,
          },
        ];
  const hintMath = structureHint(skill.id, source, variable);
  // What this specific question actually uses, not the catalog's static
  // prerequisite list (SPEC-G3): every source expression's inferred skills,
  // plus whatever the template declares as type-inherent (e.g. implicit
  // differentiation always needs the chain rule for dy/dx), minus the skill
  // itself, in catalog order. An implicit question infers over both x and y.
  const inferenceVars = built.curve ? ["x", "y"] : [variable];
  const inferred = new Set<string>();
  for (const expr of source) inferSkills(expr, inferenceVars, inferred);
  for (const req of template.requires ?? []) inferred.add(req);
  inferred.delete(skill.id);
  const requiredSkills = SKILLS.filter((s) => inferred.has(s.id)).map(
    (s) => s.id,
  );
  return {
    id: `${skill.id}:${v}:${seed}`,
    seed,
    generatorVersion: GENERATOR_VERSION,
    template: v,
    templateKey: template.key,
    meta: template.meta,
    family: skill.id,
    level: skill.level,
    primarySkill: skill.id,
    supportingSkills: requiredSkills,
    requiredSkills,
    title,
    prompt,
    source,
    answers,
    labels,
    domain: {
      variable,
      intervals,
      curve: built.curve,
      guards: built.guards ?? [],
    },
    domainText,
    hints: [
      skill.rule,
      "Identify the parts below, then apply the rule to each part.",
    ],
    hintMath,
    steps,
    signature: JSON.stringify([skill.id, v, source]),
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
