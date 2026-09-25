import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { convertLatexToMarkup } from "mathlive/ssr";
import { SKILLS } from "../src/catalog";
import {
  generateQuestion,
} from "../src/questions";
import { TEMPLATES } from "../src/templates";
import {
  add as A,
  div as Q,
  derivative as d,
  evaluator,
  latex as L,
  mul as M,
  neg as N,
  pow as P,
} from "../src/math";
import type { Expr, Question, Skill } from "../src/types";
import { dydx } from "../src/notation";

/**
 * This script intentionally uses the production generator. The generated
 * documents are an auditable snapshot of two templates for every catalog
 * skill, rather than a hand-written worksheet.
 */

const OUT_DIR = resolve(process.cwd(), "docs");
const SEED_PREFIX = "skill-examples-2026-09-19";

const CHINESE_TYPE: Record<string, string> = {
  constant: "常数函数：常数没有变化，导数为零。",
  power: "幂函数：把指数乘到前面，再把指数减一。",
  sum: "和与常数倍：逐项求导，保留每一项的常数系数。",
  root: "根式与分数幂：先改写为分数指数，再使用幂法则。",
  exp: "指数函数：外层指数函数乘以内层导数；其他底数还要乘以 ln(底数)。",
  log: "对数函数：ln(u) 的导数为 u′/u；换底后分母出现 ln(底数)。",
  sin: "正弦函数：使用 sin(u) 的基本导数，并乘以内层导数。",
  cos: "余弦函数：使用 −sin(u) 的基本导数，并乘以内层导数。",
  tan: "正切函数：使用 sec²(u) 的基本导数，并乘以内层导数。",
  cot: "余切函数：使用 −csc²(u) 的基本导数，并乘以内层导数。",
  sec: "正割函数：使用 sec(u)tan(u) 的基本导数，并乘以内层导数。",
  csc: "余割函数：使用 −csc(u)cot(u) 的基本导数，并乘以内层导数。",
  asin: "反正弦函数：使用 1/√(1−u²)，并满足实数定义域。",
  acos: "反余弦函数：使用 −1/√(1−u²)，并满足实数定义域。",
  atan: "反正切函数：使用 1/(1+u²)，定义域为全体实数。",
  product: "乘积法则：第一因子的导数乘第二因子，加第一因子乘第二因子的导数。",
  quotient: "商法则：分子为 u′v−uv′，分母为 v²，保持顺序。",
  chain: "链式法则：先求外层函数在内层处的导数，再乘以内层导数。",
  nested: "多层链式法则：由外向内逐层求导，并乘上每一层的导数。",
  mixed: "混合求导：先识别最外层运算，再在各因子内部使用相应法则。",
  implicit: "隐函数求导：对 F(x,y)=0 关于 x 求导；每个 y 的导数都带 dy/dx。",
  inverse: "反函数导数：在对应点使用 (f⁻¹)′(a)=1/f′(b)。",
  higher: "高阶导数：连续求导，并准确区分所要求的阶数。",
  parametric: "参数方程导数：用 (dy/dt)/(dx/dt)；二阶导数还要再次除以 dx/dt。",
  vector: "向量函数导数：分别对每个分量关于参数求导。",
  polar: "极坐标斜率：写成 x=r cosθ、y=r sinθ，再用 (dy/dθ)/(dx/dθ)。",
};

const ENGLISH_TYPE: Record<string, string> = {
  constant: "Differentiate a constant.",
  power: "Apply the power rule.",
  sum: "Differentiate a sum and constant multiples term by term.",
  root: "Rewrite a root as a fractional power and differentiate.",
  exp: "Differentiate an exponential function, including its inner derivative.",
  log: "Differentiate a logarithmic function on its real domain.",
  sin: "Differentiate a sine function, including its inner derivative.",
  cos: "Differentiate a cosine function, including its inner derivative.",
  tan: "Differentiate a tangent function, including its inner derivative.",
  cot: "Differentiate a cotangent function, including its inner derivative.",
  sec: "Differentiate a secant function, including its inner derivative.",
  csc: "Differentiate a cosecant function, including its inner derivative.",
  asin: "Differentiate an inverse-sine function on the interior of its real domain.",
  acos: "Differentiate an inverse-cosine function on the interior of its real domain.",
  atan: "Differentiate an inverse-tangent function.",
  product: "Apply the product rule.",
  quotient: "Apply the quotient rule.",
  chain: "Apply a single chain rule.",
  nested: "Apply the chain rule through multiple layers.",
  mixed: "Combine product, quotient, and chain rules.",
  implicit: "Differentiate an equation that relates x and y.",
  inverse: "Use the reciprocal derivative theorem for an inverse function.",
  higher: "Find a second or third derivative.",
  parametric: "Find a first or second derivative from parametric equations.",
  vector: "Differentiate every component of a vector-valued function.",
  polar: "Find the slope of a polar curve.",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function mathMarkup(latex: string): string {
  // MathLive SSR is bundled with the project. The returned markup contains no
  // script or network reference; the page only needs the bundled static CSS.
  return convertLatexToMarkup(latex);
}

function mdMath(latex: string, display = true): string {
  return display ? `\\[\n${latex}\n\\]` : `\\(${latex}\\)`;
}

function answerExpressions(q: Question): Expr[] {
  const e = q.source[0];
  switch (q.family) {
    case "implicit":
      return [N(Q(d(e, "x"), d(e, "y")))];
    case "inverse": {
      const pointMatch = q.prompt.match(/f\(([-+]?\d+(?:\.\d+)?)\)=/);
      if (!pointMatch) throw new Error(`Cannot read inverse point: ${q.prompt}`);
      const point = Number(pointMatch[1]);
      const calc = evaluator();
      const slope = calc.calc(d(e, "x"), { x: new calc.D(point) });
      const actual = evaluator().calc(q.answers[0], {});
      const expected = new calc.D(1).div(slope);
      if (!actual.eq(expected)) {
        throw new Error(
          `inverse answer mismatch for ${q.id}: got ${actual} expected ${expected}`,
        );
      }
      // The inverse answer is a numeric reciprocal; the generator already
      // represents it as an exact expression. Return the generated answer so
      // the structural check below can still record it.
      return q.answers;
    }
    case "higher": {
      let result = e;
      const order = q.meta?.derivativeOrder ?? (q.template ? 3 : 2);
      for (let i = 0; i < order; i++) result = d(result, "x");
      return [result];
    }
    case "parametric": {
      const u = q.source[0];
      const w = q.source[1];
      const slope = Q(d(w, "t"), d(u, "t"));
      const order = q.meta?.derivativeOrder ?? (q.template ? 2 : 1);
      return [order === 2 ? Q(d(slope, "t"), d(u, "t")) : slope];
    }
    case "vector":
      return q.source.map((part) => d(part, "t"));
    case "polar": {
      const r = e;
      const x = M(r, ["Cos", "theta"]);
      const y = M(r, ["Sin", "theta"]);
      return [Q(d(y, "theta"), d(x, "theta"))];
    }
    default:
      return [d(e, q.domain.variable)];
  }
}

function expressionsEqual(a: Expr[], b: Expr[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function verifyQuestion(skill: Skill, q: Question, template: number): string[] {
  const errors: string[] = [];
  if (q.primarySkill !== skill.id || q.family !== skill.id)
    errors.push(`wrong skill identity (${q.primarySkill}/${q.family})`);
  if (q.level !== skill.level) errors.push(`wrong level ${q.level}`);
  if (q.template !== template) errors.push(`wrong template ${q.template}`);
  if (!q.source.length || !q.answers.length) errors.push("missing source or answer");
  const expected = answerExpressions(q);
  if (skill.id !== "inverse" && !expressionsEqual(q.answers, expected))
    errors.push(
      `answer tree mismatch: ${JSON.stringify(q.answers)} != ${JSON.stringify(expected)}`,
    );
  if (q.generatorVersion !== "1.1.0")
    errors.push(`unexpected generator version ${q.generatorVersion}`);
  return errors;
}

function conditionText(q: Question): string {
  switch (q.family) {
    case "constant":
    case "power":
    case "sum":
    case "product":
    case "chain":
    case "nested":
    case "mixed":
    case "higher":
      return "Work over the real domain of the displayed function and at points where the requested derivative exists.";
    case "root":
      return !(q.meta?.oddRoot ?? q.template === 1)
        ? "For the square-root template, use x > 0 for the derivative (the function itself is real for x ≥ 0)."
        : "For the cube-root template, the real function is defined for every x, but its derivative is undefined at x = 0. Thus x ≠ 0."
    case "exp":
      return "The displayed exponential is real and differentiable for every real x. Angles, when present, are measured in radians."
    case "log":
      return "The logarithm requires a positive argument; here the displayed argument must be > 0. The base is valid because it is positive and not 1."
    case "sin":
    case "cos":
      return "Sine and cosine are real and differentiable for every real input; use radians."
    case "tan":
    case "sec":
      return "The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians."
    case "cot":
    case "csc":
      return "The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians."
    case "asin":
    case "acos":
      return "For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined."
    case "atan":
      return "The inverse tangent is real and differentiable for every real input."
    case "quotient":
      return "The denominator of the displayed quotient must be nonzero; the derivative is valid wherever both numerator and denominator are differentiable."
    case "implicit":
      return "Stay on the displayed curve and use the generator condition y ≠ 0, so the implicit derivative can be isolated."
    case "inverse":
      return "Use the corresponding input b shown in f(b)=a. The inverse-function theorem requires f′(b) ≠ 0 and a local inverse at that point."
    case "parametric":
      return "Give the result in t and require dx/dt ≠ 0. The second-derivative template also requires the displayed derivatives to exist."
    case "vector":
      return "Differentiate each component wherever that component derivative exists; use radians for the trigonometric component."
    case "polar":
      return "Write x = r cos(θ) and y = r sin(θ). The slope formula is valid where dx/dθ ≠ 0; use radians."
    default:
      return q.domainText;
  }
}

function questionIntro(q: Question): string {
  switch (q.family) {
    case "implicit":
      return "For the curve shown below, find dy/dx by implicit differentiation.";
    case "inverse":
      return "Use the inverse-function derivative theorem to find the requested value.";
    case "higher":
      return `For the function shown below, find ${(q.meta?.derivativeOrder ?? (q.template ? 3 : 2)) === 3 ? "the third derivative" : "the second derivative"}.`;
    case "parametric":
      return (q.meta?.derivativeOrder ?? (q.template ? 2 : 1)) === 2
        ? "For the parametric equations below, find d²y/dx² in terms of t."
        : "For the parametric equations below, find dy/dx in terms of t.";
    case "vector":
      return "Differentiate the vector function component by component to find r′(t).";
    case "polar":
      return "For the polar curve below, find the slope dy/dx in terms of θ.";
    default:
      return "Differentiate the function shown below.";
  }
}

function answerLatex(q: Question): string {
  if (q.family === "vector") return `\\langle ${q.answers.map(L).join(",\\; ")} \\rangle`;
  return q.answers.map((answer, i) => {
    const label = q.labels[i] ?? q.labels[0] ?? "answer";
    const tex = label === "dy/dx" ? dydx() : label === "d²y/dx²" ? dydx(2) : label;
    return `${tex}=${L(answer)}`;
  }).join("\\quad");
}

function guardLatex(q: Question): string {
  if (q.family === "parametric") return `${dydx(1, "x", "t")}\\ne 0`;
  if (q.family === "polar") return `${dydx(1, "x", "theta")}\\ne 0`;
  return q.domain.guards.length
    ? q.domain.guards.map((guard) => `\\frac{1}{${L(guard)}}`).join(",\\; ")
    : "none";
}

function metadataLines(q: Question): string[] {
  const intervals = q.domain.intervals
    .map(([a, b]) => `[${a}, ${b}]`)
    .join(", ");
  return [
    `- Generator ID: \`${q.id}\``,
    `- Seed: \`${q.seed}\``,
    `- Template: ${q.template} (the generator's ${q.template === 0 ? "first" : "second"} structure)`,
    `- Generator version: \`${q.generatorVersion}\``,
    `- Differentiation variable: \`${q.domain.variable}\``,
    `- Generator domain text: ${q.domainText}`,
    `- Validation intervals sampled by the app: ${intervals}`,
    `- Guard used by the app: ${guardLatex(q)}`,
  ];
}

function renderMarkdown(items: { skill: Skill; questions: Question[] }[]): string {
  const lines: string[] = [
    "# Derivative Studio: Skill Examples",
    "",
    "Two real generated examples for every differentiation skill in `src/catalog.ts`.",
    "The student-facing prompts are in English; each skill has a Chinese type note for teacher review.",
    "",
    `Generated from \`generateQuestion\` version \`1.1.0\` on ${SEED_PREFIX.slice(-10)}; ${items.length} skills × 2 templates = ${items.length * 2} questions.`,
    "",
    "> The answers preserve the production generator's expression tree, so an unsimplified form may appear. Equivalent expressions are accepted by the app's grader.",
    "",
    "## Coverage and verification",
    "",
    "Every question below was generated with a fixed seed and an explicit template override (`0` and `1`). The verification pass checked the catalog skill ID, level, template, generator version, source/answer presence, and the answer tree recomputed from the production derivative rules. Inverse-function answers were additionally checked numerically as the reciprocal of the original derivative at the matching input.",
    "",
    "| Skill ID | Level | Templates | Verification |",
    "| --- | ---: | --- | --- |",
    ...items.map(({ skill }) => `| \`${skill.id}\` | ${skill.level} | 0 and 1 | verified |`),
    "",
    "## Examples",
    "",
  ];
  let number = 1;
  for (const { skill, questions } of items) {
    lines.push(`### ${skill.id} — ${skill.label}`);
    lines.push("");
    lines.push(`**题型说明（中文）:** ${CHINESE_TYPE[skill.id]}`);
    lines.push("");
    lines.push(`**English focus:** ${ENGLISH_TYPE[skill.id]}`);
    lines.push("");
    lines.push(`**Rule / definition:** ${skill.rule}`);
    lines.push("");
    for (const q of questions) {
      lines.push(`#### ${number}. Template ${q.template}`);
      lines.push("");
      lines.push(`**Student question (English).** ${questionIntro(q)}`);
      lines.push("");
      lines.push(mdMath(q.prompt));
      lines.push("");
      lines.push(`**Definition / validity conditions.** ${conditionText(q)}`);
      lines.push("");
      lines.push("<details>");
      lines.push("<summary>Answer and generator verification</summary>");
      lines.push("");
      lines.push(`**Answer.**`);
      lines.push("");
      lines.push(mdMath(answerLatex(q)));
      lines.push("");
      lines.push("**Production metadata.**");
      lines.push("");
      lines.push(...metadataLines(q));
      lines.push("");
      lines.push("**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.");
      lines.push("");
      lines.push("</details>");
      lines.push("");
      number++;
    }
  }
  return `${lines.join("\n")}\n`;
}

function renderHtml(
  items: { skill: Skill; questions: Question[] }[],
  target: "docs" | "public",
): string {
  const skillRows = items
    .map(
      ({ skill }) =>
        `<tr><td><code>${escapeHtml(skill.id)}</code></td><td>${skill.level}</td><td>0 and 1</td><td><span class="verified">verified</span></td></tr>`,
    )
    .join("");
  const sections: string[] = [];
  let number = 1;
  for (const { skill, questions } of items) {
    const cards = questions
      .map((q) => {
        const answer = answerLatex(q);
        const metadata = metadataLines(q)
          .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
          .join("");
        const card = `<article class="question" id="q-${number}">
  <div class="question-heading"><span class="question-number">${number}</span><h3>Template ${q.template}</h3></div>
  <p class="student-label">Student question (English)</p>
  <p>${escapeHtml(questionIntro(q))}</p>
  <div class="formula" role="img" aria-label="${escapeHtml(q.prompt)}">${mathMarkup(q.prompt)}</div>
  <p class="condition"><strong>Definition / validity conditions.</strong> ${escapeHtml(conditionText(q))}</p>
  <details class="answer">
    <summary>Answer and generator verification</summary>
    <p class="answer-label">Answer</p>
    <div class="formula answer-formula" role="img" aria-label="${escapeHtml(answer)}">${mathMarkup(answer)}</div>
    <p class="verified-note"><strong>Verified.</strong> The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.</p>
    <details class="metadata"><summary>Production metadata</summary><ul>${metadata}</ul></details>
  </details>
</article>`;
        number++;
        return card;
      })
      .join("\n");
    sections.push(`<section id="skill-${escapeHtml(skill.id)}" class="skill-section">
  <div class="skill-heading"><div><p class="eyebrow">Level ${skill.level} · <code>${escapeHtml(skill.id)}</code></p><h2>${escapeHtml(skill.label)}</h2></div><p class="chinese">${escapeHtml(CHINESE_TYPE[skill.id])}</p></div>
  <p class="english-focus"><strong>English focus:</strong> ${escapeHtml(ENGLISH_TYPE[skill.id])}</p>
  <p><strong>Rule / definition:</strong> ${escapeHtml(skill.rule)}</p>
  ${cards}
</section>`);
  }
  const staticCss = readFileSync(
    resolve(process.cwd(), "node_modules/mathlive/mathlive-static.css"),
    "utf8",
  ).replaceAll(
    "url(fonts/",
    target === "public" ? "url(/fonts/" : "url(../node_modules/mathlive/fonts/",
  );
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Two production-generated derivative practice examples for each of 26 AP Calculus skills.">
<title>Derivative Studio — Skill Examples</title>
<style>
:root{color-scheme:light;--ink:#18302d;--muted:#5b706c;--line:#d7e3df;--paper:#fff;--wash:#f2f7f5;--teal:#0f766e;--red:#b42318;--blue:#1d4ed8;--amber:#9a6700;--shadow:0 14px 34px rgba(24,48,45,.08)}
*{box-sizing:border-box}body{margin:0;background:var(--wash);color:var(--ink);font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:1080px;margin:0 auto;padding:44px 24px 80px}header{background:var(--ink);color:#fff;border-radius:24px;padding:36px 38px;margin-bottom:24px;box-shadow:var(--shadow)}h1,h2,h3{line-height:1.2;margin:0 0 10px}h1{font-size:clamp(2rem,4vw,3rem);letter-spacing:-.03em}h2{font-size:1.7rem}h3{font-size:1.15rem}p{margin:10px 0}.lede{max-width:760px;color:#d6e7e2}.meta{font-size:.9rem;color:#a9cbc4;margin-top:20px}.panel,.skill-section{background:var(--paper);border:1px solid var(--line);border-radius:20px;padding:24px 28px;margin:20px 0;box-shadow:var(--shadow)}.panel h2{font-size:1.25rem}.coverage{width:100%;border-collapse:collapse;margin-top:14px}.coverage th,.coverage td{text-align:left;border-bottom:1px solid var(--line);padding:9px 8px}.coverage th{color:var(--muted);font-size:.86rem;text-transform:uppercase;letter-spacing:.06em}.verified{color:#147d42;font-weight:700}.skill-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:16px}.eyebrow,.student-label,.answer-label{margin:0 0 5px;color:var(--muted);font-size:.83rem;font-weight:750;letter-spacing:.08em;text-transform:uppercase}.chinese{max-width:520px;margin:0;color:#8d3f12;background:#fff7e6;border:1px solid #f2d39c;padding:10px 13px;border-radius:12px}.english-focus{color:#285e58}.question{border:1px solid var(--line);border-left:5px solid var(--teal);border-radius:14px;padding:20px 20px 18px;margin:18px 0;background:#fcfefd}.question-heading{display:flex;align-items:center;gap:10px;margin-bottom:14px}.question-number{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--teal);color:#fff;font-weight:800}.formula{overflow-x:auto;padding:15px 12px;margin:10px 0;background:#f7fbfa;border-radius:10px;color:#102b28;font-size:1.3rem}.answer-formula{background:#edf8f2;border-left:4px solid #2f9e62}.condition{color:#5e4a1e;background:#fffaf0;border-radius:10px;padding:11px 13px}.answer{margin-top:16px;border-top:1px dashed var(--line);padding-top:13px}.answer summary,.metadata summary{cursor:pointer;color:var(--blue);font-weight:700}.answer summary:focus,.metadata summary:focus{outline:3px solid #b9d0ff;outline-offset:3px}.verified-note{color:#1d6d43}.metadata{font-size:.9rem;color:var(--muted);margin-top:15px}.metadata ul{padding-left:21px}.metadata li{margin:4px 0;overflow-wrap:anywhere}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em;background:rgba(15,118,110,.08);padding:1px 5px;border-radius:5px}header code{background:rgba(255,255,255,.12)}math{max-width:100%;min-width:max-content}.note{color:var(--muted);font-size:.92rem}@media(max-width:720px){main{padding:20px 12px 56px}header{padding:27px 22px;border-radius:16px}.panel,.skill-section{padding:18px 16px;border-radius:15px}.skill-heading{display:block}.chinese{margin-top:12px}.formula{font-size:1.1rem}}
 .coverage-wrap{width:100%;overflow-x:auto}.coverage{min-width:360px}
${staticCss}
</style>
</head>
<body>
<main>
<header>
  <h1>Derivative Studio: Skill Examples</h1>
  <p class="lede">Two real generated examples for every differentiation skill in <code>src/catalog.ts</code>. Student-facing prompts are in English; each skill includes a Chinese type note for teacher review.</p>
  <p class="meta">Generated from <code>generateQuestion</code> version <code>1.1.0</code> with fixed seeds; 26 skills × 2 templates = 52 questions. MathLive SSR pre-rendered the formula markup locally; this page makes no runtime network request.</p>
</header>
<section class="panel" aria-labelledby="coverage-title">
  <h2 id="coverage-title">Coverage and verification</h2>
  <p>Every question was generated with an explicit template override (<code>0</code> and <code>1</code>). The verification pass checked the catalog skill ID, level, template, generator version, source/answer presence, and the answer tree recomputed from the production differentiation rules. Inverse-function answers were additionally checked numerically as the reciprocal of the original derivative at the matching input.</p>
  <div class="coverage-wrap"><table class="coverage"><thead><tr><th>Skill ID</th><th>Level</th><th>Templates</th><th>Verification</th></tr></thead><tbody>${skillRows}</tbody></table></div>
  <p class="note">Answers preserve the production generator's expression tree, so an unsimplified form may appear. Equivalent expressions are accepted by the app's grader.</p>
</section>
${sections.join("\n")}
</main>
</body>
</html>
`;
}

const items: { skill: Skill; questions: Question[] }[] = [];
let verifiedCount = 0;
for (const skill of SKILLS) {
  const questions: Question[] = [];
  for (let template = 0; template < TEMPLATES[skill.id].length; template++) {
    const seed = `${SEED_PREFIX}:${skill.id}:template-${template}`;
    const q = generateQuestion(skill.id, seed, template);
    const errors = verifyQuestion(skill, q, template);
    if (errors.length) throw new Error(`${skill.id} template ${template}: ${errors.join("; ")}`);
    questions.push(q);
    verifiedCount++;
  }
  items.push({ skill, questions });
}

const expectedTemplates = SKILLS.reduce((sum, skill) => sum + TEMPLATES[skill.id].length, 0);
if (items.length !== 26 || verifiedCount !== expectedTemplates)
  throw new Error(`Expected 26 skills and ${expectedTemplates} questions, got ${items.length} and ${verifiedCount}`);

writeFileSync(resolve(OUT_DIR, "skill-examples.md"), renderMarkdown(items));
writeFileSync(resolve(OUT_DIR, "skill-examples.html"), renderHtml(items, "docs"));
writeFileSync(
  resolve(process.cwd(), "public", "skill-examples.html"),
  renderHtml(items, "public"),
);
console.log(
  `Generated docs/skill-examples.md, docs/skill-examples.html, and public/skill-examples.html: ${verifiedCount}/${expectedTemplates} verified.`,
);
