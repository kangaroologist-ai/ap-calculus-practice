export type Expr = number | string | [string, ...Expr[]];
export interface Skill {
  id: string;
  label: string;
  level: number;
  rule: string;
  prerequisites: string[];
}
export interface Config {
  schemaVersion: 1;
  revision: string;
  initialUnlockedLevel: number;
  disabledFamilies: string[];
  sessionLength: number;
}
export interface Domain {
  variable: "x" | "t" | "theta";
  intervals: [number, number][];
  curve?: { type: "circle" | "hyperbola"; parameter: number };
  guards: Expr[];
}
export interface Question {
  id: string;
  seed: string;
  generatorVersion: string;
  template: number;
  family: string;
  level: number;
  primarySkill: string;
  supportingSkills: string[];
  title: string;
  prompt: string;
  source: Expr[];
  answers: Expr[];
  labels: string[];
  domain: Domain;
  domainText: string;
  hints: string[];
  hintMath: string;
  steps: { text: string; math: string }[];
  signature: string;
}
export type Verdict =
  | { status: "correct"; evidence: "symbolic" | "numeric" }
  | { status: "incorrect"; feedbackCode: string }
  | { status: "invalid" | "inconclusive"; message: string };
