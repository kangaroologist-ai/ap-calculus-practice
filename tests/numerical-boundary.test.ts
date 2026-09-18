import { expect, it } from "vitest";
import { grade } from "../src/grading";
import { generateQuestion } from "../src/questions";
it("accepts reciprocal exponential answers despite tiny nonzero denominators at some points", () => {
  const q = generateQuestion("nested", "exp-recip:nested:1:3", 1);
  expect(
    grade(q, ["\\frac{1}{e^{-((3x+2)^2)}}\\cdot2(3x+2)\\cdot3"]).status,
  ).toBe("correct");
});
it("does not penalize precision/range limitations as domain errors", () => {
  const q = generateQuestion("constant", "small-denominator", 0);
  expect(grade(q, ["\\frac{0}{10^{-40}}"]).status).toBe("inconclusive");
  expect(grade(q, ["\\frac{0}{0}"]).status).toBe("incorrect");
});

it("does not penalize rounding near an algebraic domain boundary", () => {
  const q = generateQuestion("constant", "trig-sqrt", 0);
  expect(grade(q, ["\\sqrt{1-\\sin^2(x)-\\cos^2(x)}"]).status).toBe(
    "inconclusive",
  );
  expect(grade(q, ["0/(x-(x+10^{-80}))"]).status).toBe("inconclusive");
  expect(grade(q, ["\\sqrt{-1}"]).status).toBe("incorrect");
});
