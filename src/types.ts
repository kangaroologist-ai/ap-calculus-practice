export type Expr = number | string | [string, ...Expr[]];
export interface Skill {
  id: string;
  label: string;
  level: number;
  rule: string;
  prerequisites: string[];
}
// Metadata a template attaches to the questions it produces. Numeric template
// indices used to carry this meaning implicitly (template 1 = third
// derivative, template 1 = odd root, ...); readers should prefer these
// explicit fields and fall back to the old index-based meaning only for
// questions saved by generator <= 1.1.0, which lack `meta`.
export type Role = "basic" | "mix";
export interface QuestionMeta {
  derivativeOrder?: number;
  oddRoot?: boolean;
}
export interface Config {
  schemaVersion: 1;
  revision: string;
  initialUnlockedLevel: number;
  disabledFamilies: string[];
  sessionLength: number;
}
// A curve constrains a two-variable implicit question's sample points.
// `circle`/`hyperbola` are the original single-parameter shapes (kept forever
// so questions saved by generator <= 1.1.0 keep grading); `graph` is the
// general form (SPEC-G4): the non-free variable equals one of `branches`,
// evaluated at the free variable, so any implicit curve solvable for y (or x)
// can be sampled the same way.
export type Curve =
  | { type: "circle" | "hyperbola"; parameter: number }
  | { type: "graph"; free: "x" | "y"; branches: Expr[] };
export interface Domain {
  variable: "x" | "t" | "theta";
  intervals: [number, number][];
  curve?: Curve;
  guards: Expr[];
}
export interface Question {
  id: string;
  seed: string;
  generatorVersion: string;
  template: number;
  templateKey: string;
  // Absent on questions saved before Phase 2; treat those as "basic".
  role?: Role;
  meta?: QuestionMeta;
  family: string;
  level: number;
  primarySkill: string;
  supportingSkills: string[];
  // The skills this specific question actually exercises, inferred from its
  // expression tree (SPEC-G3). Optional because questions saved by generator
  // <= 1.1.0 predate this field; readers should use
  // `q.requiredSkills ?? q.supportingSkills`.
  requiredSkills?: string[];
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
