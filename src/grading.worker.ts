import { grade } from "./grading";
self.onmessage = ({ data }) => {
  try {
    self.postMessage({
      id: data.id,
      verdict: grade(data.question, data.answers),
    });
  } catch {
    self.postMessage({
      id: data.id,
      verdict: {
        status: "inconclusive",
        message: "We could not check that expression. Please try again.",
      },
    });
  }
};
self.postMessage({ ready: true });
