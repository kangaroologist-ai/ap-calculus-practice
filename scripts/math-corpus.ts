import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKILLS } from '../src/catalog';
import { GENERATOR_VERSION, generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Question } from '../src/types';

const SEEDS_PER_TEMPLATE = 100;

interface CorpusQuestion extends Question {
  corpus: {
    templateIndex: number;
    seedIndex: number;
  };
}

interface MathCorpus {
  schemaVersion: 1;
  generatorVersion: string;
  seedsPerTemplate: number;
  skillCount: number;
  questionCount: number;
  counts: Record<string, number>;
  // Per-skill template counts, so an independent checker (check_math.py) can
  // validate corpus size without hardcoding "2 templates per skill".
  templateCounts: Record<string, number>;
  questions: CorpusQuestion[];
}

function outputPath(): string {
  const explicit = process.argv.find((arg) => arg.startsWith('--out='));
  if (explicit) return resolve(process.cwd(), explicit.slice('--out='.length));
  return resolve(dirname(dirname(fileURLToPath(import.meta.url))), 'artifacts', 'math-corpus.json');
}

function makeSeed(skillId: string, templateIndex: number, seedIndex: number): string {
  return `${skillId}:template-${templateIndex}:seed-${String(seedIndex).padStart(3, '0')}`;
}

function generateCorpus(): MathCorpus {
  const questions: CorpusQuestion[] = [];
  const counts: Record<string, number> = {};
  const templateCounts: Record<string, number> = {};

  for (const skill of SKILLS) {
    counts[skill.id] = 0;
    const templateCount = TEMPLATES[skill.id].length;
    templateCounts[skill.id] = templateCount;
    for (let templateIndex = 0; templateIndex < templateCount; templateIndex += 1) {
      for (let seedIndex = 0; seedIndex < SEEDS_PER_TEMPLATE; seedIndex += 1) {
        const seed = makeSeed(skill.id, templateIndex, seedIndex);
        const question = generateQuestion(skill.id, seed, templateIndex);
        if (question.template !== templateIndex) {
          throw new Error(`${skill.id} generated template ${question.template}, expected ${templateIndex}`);
        }
        if (question.seed !== seed) {
          throw new Error(`${skill.id} changed the requested seed ${seed}`);
        }
        if (question.family !== skill.id || question.primarySkill !== skill.id) {
          throw new Error(`${skill.id} returned an inconsistent family identity`);
        }
        questions.push({ ...question, corpus: { templateIndex, seedIndex } });
        counts[skill.id] += 1;
      }
    }
  }

  for (const skill of SKILLS) {
    const expected = templateCounts[skill.id] * SEEDS_PER_TEMPLATE;
    if (counts[skill.id] !== expected) {
      throw new Error(`${skill.id} has ${counts[skill.id]} questions, expected ${expected}`);
    }
  }

  return {
    schemaVersion: 1,
    generatorVersion: GENERATOR_VERSION,
    seedsPerTemplate: SEEDS_PER_TEMPLATE,
    skillCount: SKILLS.length,
    questionCount: questions.length,
    counts,
    templateCounts,
    questions,
  };
}

const corpus = generateCorpus();
const target = outputPath();
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(corpus, null, 2)}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      output: target,
      generatorVersion: corpus.generatorVersion,
      skills: corpus.skillCount,
      questions: corpus.questionCount,
    },
    null,
    2,
  ),
);
