import { describe, expect, it } from "vitest";
import { incorrectFeedbackText } from "../src/feedback";

describe("incorrect answer feedback", () => {
  it("mentions an inner derivative only for chain or nested skills", () => {
    expect(
      incorrectFeedbackText({ supportingSkills: ["power"] }),
    ).toBe("Check the rule for each part.");
    expect(
      incorrectFeedbackText({ supportingSkills: ["power", "chain"] }),
    ).toBe("Check the rule and the inner derivative.");
    expect(
      incorrectFeedbackText({
        requiredSkills: ["nested"],
        supportingSkills: ["power"],
      }),
    ).toBe("Check the rule and the inner derivative.");
    expect(
      incorrectFeedbackText({
        requiredSkills: [],
        supportingSkills: ["chain"],
      }),
    ).toBe("Check the rule for each part.");
  });
});
