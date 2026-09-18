import { afterEach, describe, expect, it, vi } from "vitest";
import { Grader } from "../src/grader-client";
import { generateQuestion } from "../src/questions";
class TestWorker extends EventTarget {
  static instances: TestWorker[] = [];
  terminated = false;
  message: any;
  constructor() {
    super();
    TestWorker.instances.push(this);
  }
  postMessage(message: unknown) {
    this.message = message;
  }
  terminate() {
    this.terminated = true;
  }
  respond(verdict: unknown) {
    this.dispatchEvent(
      new MessageEvent("message", { data: { id: this.message.id, verdict } }),
    );
  }
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  TestWorker.instances = [];
});
describe("worker boundary", () => {
  it("terminates a calculation at three seconds and recreates the worker for the next answer", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", TestWorker);
    const grader = new Grader(),
      q = generateQuestion("power", "worker");
    const result = grader.check(q, ["x"]);
    await vi.advanceTimersByTimeAsync(3000);
    expect((await result).status).toBe("inconclusive");
    expect(TestWorker.instances[0].terminated).toBe(true);
    const next = grader.check(q, ["x"]);
    expect(TestWorker.instances).toHaveLength(2);
    TestWorker.instances[0].respond({
      status: "incorrect",
      feedbackCode: "stale",
    });
    TestWorker.instances[1].respond({
      status: "correct",
      evidence: "symbolic",
    });
    expect((await next).status).toBe("correct");
  });
  it("returns no-score feedback when browser cannot create a worker", async () => {
    vi.stubGlobal(
      "Worker",
      class {
        constructor() {
          throw Error("blocked");
        }
      },
    );
    expect(
      (await new Grader().check(generateQuestion("power", "worker"), ["x"]))
        .status,
    ).toBe("inconclusive");
  });
});
