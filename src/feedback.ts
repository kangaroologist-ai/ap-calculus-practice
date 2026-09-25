import type { Question } from "./types";

export function incorrectFeedbackText(
  question: Pick<Question, "requiredSkills" | "supportingSkills">,
): string {
  const skills = question.requiredSkills ?? question.supportingSkills;
  const usesInnerDerivative = skills.some(
    (skill) => skill === "chain" || skill === "nested",
  );
  return usesInnerDerivative
    ? "Check the rule and the inner derivative."
    : "Check the rule for each part.";
}
