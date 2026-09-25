import { expect, it } from "vitest";
import { grade } from "../src/grading";
import { derivative, latex } from "../src/math";
import { generateQuestion } from "../src/questions";
import type { Expr } from "../src/types";
it("accepts reciprocal exponential answers despite tiny nonzero denominators at some points", () => {
  const q = generateQuestion("nested", "exp-recip:nested:1:3", {
    key: "nested.basic.function_quadratic",
    role: "basic",
    ok: (id) => id === "chain" || id === "exp",
  });
  const powered = (q.source[0] as Expr[])[1] as Expr[];
  const linear = powered[1];
  const linearLatex = latex(linear);
  const slope = latex(derivative(linear, "x"));
  q.domain.intervals = [
    [-2.5, -0.2],
    [0.2, 2.5],
  ];
  const reciprocalAnswer = `\\frac{1}{e^{-(${linearLatex})^2}}\\cdot2(${linearLatex})\\cdot${slope}`;
  expect(grade(q, [reciprocalAnswer]).status).toBe("correct");
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
