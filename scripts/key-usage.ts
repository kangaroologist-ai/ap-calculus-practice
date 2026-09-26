import { SKILLS } from '../src/catalog';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Expr } from '../src/types';

function requestedSeeds(): number {
  const option = process.argv.find((arg) => arg.startsWith('--seeds='));
  const seeds = option ? Number(option.slice('--seeds='.length)) : 40;
  if (!Number.isInteger(seeds) || seeds < 1) {
    throw new Error(`--seeds must be a positive integer; received ${option?.slice('--seeds='.length) ?? ''}`);
  }
  return seeds;
}

const seedsPerTemplate = requestedSeeds();
const questionsWithHead: Record<string, number> = {};
let questionCount = 0;
const variables: Record<string, number> = {};
let multiFieldCount = 0;

const walk = (expr: Expr, seen: Set<string>): void => {
  if (Array.isArray(expr)) {
    let head = expr[0];
    if (head === 'Power' && expr[1] === 'ExponentialE') head = 'e^';
    if (head === 'Power' && (expr[2] === 'Half' || JSON.stringify(expr[2]) === '["Rational",1,2]')) {
      head = 'Sqrt(as ^1/2)';
    }
    seen.add(head);
    expr.slice(1).forEach((part) => walk(part, seen));
  } else if (typeof expr === 'string') {
    if (['Pi', 'ExponentialE'].includes(expr)) seen.add(expr);
  } else if (!Number.isInteger(expr)) {
    seen.add('decimal');
  }
};

for (const skill of SKILLS) {
  TEMPLATES[skill.id].forEach((template, templateIndex) => {
    for (let seedIndex = 0; seedIndex < seedsPerTemplate; seedIndex += 1) {
      const question = generateQuestion(skill.id, `${skill.id}:${templateIndex}:${seedIndex}`, {
        key: template.key,
        role: template.role,
        ok: () => true,
      });
      questionCount += 1;
      if (question.answers.length > 1) multiFieldCount += 1;
      const variable = question.domain.curve ? 'x,y' : question.domain.variable;
      variables[variable] = (variables[variable] ?? 0) + 1;
      const seen = new Set<string>();
      question.answers.forEach((answer) => walk(answer, seen));
      seen.forEach((head) => {
        questionsWithHead[head] = (questionsWithHead[head] ?? 0) + 1;
      });
    }
  });
}

console.log('questions', questionCount, 'multi-field', multiFieldCount, 'vars', JSON.stringify(variables));
Object.entries(questionsWithHead)
  .sort((a, b) => b[1] - a[1])
  .forEach(([head, count]) => {
    console.log(head.padEnd(18), count, `${((100 * count) / questionCount).toFixed(1)}%`);
  });
