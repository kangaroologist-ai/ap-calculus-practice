import { describe, expect, it } from "vitest";
import { SKILLS, skillById } from "../src/catalog";
import { generateQuestion } from "../src/questions";
import { TEMPLATES } from "../src/templates";

const allowAll = () => true;

function prereqClosure(id: string, found = new Set<string>()): Set<string> {
  for (const prerequisite of skillById(id).prerequisites) {
    if (found.has(prerequisite)) continue;
    found.add(prerequisite);
    prereqClosure(prerequisite, found);
  }
  return found;
}

function poolMembers(template: (typeof TEMPLATES)[string][number]): Set<string> {
  return new Set(Object.values(template.pools ?? {}).flatMap((pool) => [...pool]));
}

describe("Phase 2 curriculum constraints", () => {
  it("provides basic and mix templates for every skill", () => {
    for (const skill of SKILLS) {
      const templates = TEMPLATES[skill.id];
      expect(templates.some((template) => template.role === "basic"), skill.id).toBe(true);
      expect(templates.some((template) => template.role === "mix"), skill.id).toBe(true);
    }
  });

  it("keeps basic questions within their course prerequisites", () => {
    const violations: string[] = [];
    for (const skill of SKILLS) {
      const allowed = new Set([
        skill.id,
        ...prereqClosure(skill.id),
        ...SKILLS.filter((other) => other.level < skill.level).map((other) => other.id),
      ]);
      for (const template of TEMPLATES[skill.id].filter((item) => item.role === "basic")) {
        for (let seedIndex = 0; seedIndex < 50; seedIndex += 1) {
          const question = generateQuestion(skill.id, `curriculum-basic:${template.key}:${seedIndex}`, {
            key: template.key,
            role: "basic",
            ok: allowAll,
          });
          for (const id of question.requiredSkills ?? []) {
            if (!allowed.has(id)) violations.push(`${template.key}: ${id}`);
            if (skill.level <= 2 && (id === "chain" || id === "nested"))
              violations.push(`${template.key}: early ${id}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("declares every same-level mix dependency and keeps combinations at or below the skill level", () => {
    const violations: string[] = [];
    for (const skill of SKILLS) {
      const closure = prereqClosure(skill.id);
      for (const template of TEMPLATES[skill.id].filter((item) => item.role === "mix")) {
        const pools = poolMembers(template);
        const declared = new Set([...(template.requires ?? []), ...pools]);
        const staticSkills = [...(template.requires ?? []), ...pools];
        for (const id of staticSkills) {
          if (skillById(id).level > skill.level) violations.push(`${template.key}: ${id} is above level`);
        }
        for (let seedIndex = 0; seedIndex < 50; seedIndex += 1) {
          const question = generateQuestion(skill.id, `curriculum-mix:${template.key}:${seedIndex}`, {
            key: template.key,
            role: "mix",
            ok: allowAll,
          });
          const inferred = question.requiredSkills ?? [];
          for (const id of inferred) {
            if (skillById(id).level > skill.level) violations.push(`${template.key}: ${id} is above level`);
            if (
              skillById(id).level === skill.level &&
              !closure.has(id) &&
              !declared.has(id)
            )
              violations.push(`${template.key}: undeclared same-level skill ${id}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("keeps prerequisites within level and acyclic", () => {
    for (const skill of SKILLS) {
      for (const id of skill.prerequisites) {
        expect(skillById(id).level, `${skill.id} depends on ${id}`).toBeLessThanOrEqual(skill.level);
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string): boolean => {
      if (visiting.has(id)) return false;
      if (visited.has(id)) return true;
      visiting.add(id);
      for (const prerequisite of skillById(id).prerequisites) {
        if (!visit(prerequisite)) return false;
      }
      visiting.delete(id);
      visited.add(id);
      return true;
    };

    for (const skill of SKILLS) expect(visit(skill.id), `cycle through ${skill.id}`).toBe(true);
  });
});
