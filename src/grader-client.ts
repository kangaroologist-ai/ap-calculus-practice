import type { Question, Verdict } from "./types";
export class Grader {
  private worker: Worker | null = null;
  private seq = 0;
  private create() {
    return (this.worker ??= new Worker(
      new URL("./grading.worker.ts", import.meta.url),
      { type: "module" },
    ));
  }
  async check(question: Question, answers: string[]): Promise<Verdict> {
    let worker: Worker;
    try {
      worker = this.create();
    } catch {
      return {
        status: "inconclusive",
        message: "The checker could not start. Please try again.",
      };
    }
    const id = ++this.seq;
    return new Promise((resolve) => {
      let finished = false;
      const done = (v: Verdict, reset = false) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        worker.removeEventListener("message", receive);
        worker.removeEventListener("error", error);
        if (reset) {
          worker.terminate();
          this.worker = null;
        }
        resolve(v);
      };
      const timer = setTimeout(
        () =>
          done(
            {
              status: "inconclusive",
              message:
                "This calculation took too long. Try a shorter equivalent answer.",
            },
            true,
          ),
        3000,
      );
      const error = () =>
        done(
          {
            status: "inconclusive",
            message: "The checker could not start. Please try again.",
          },
          true,
        );
      const receive = ({ data }: MessageEvent) => {
        if (data.id === id) done(data.verdict);
      };
      worker.addEventListener("error", error);
      worker.addEventListener("message", receive);
      try {
        worker.postMessage({ id, question, answers });
      } catch {
        error();
      }
    });
  }
}
