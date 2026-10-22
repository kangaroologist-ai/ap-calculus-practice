import type { Question, Verdict } from "./types";

const START_LIMIT_MS = 20_000;
const CALCULATION_LIMIT_MS = 3_000;
const START_FAILED = "The checker could not start. Please try again.";
const STILL_LOADING = "The checker is still loading. Try again in a moment.";
const TOO_LONG =
  "This calculation took too long. Try a shorter equivalent answer.";

export class Grader {
  private worker: Worker | null = null;
  private startup: Promise<boolean> | null = null;
  private seq = 0;

  // Starts the download and start-up early; safe to call on every question and to ignore.
  warm(): Promise<void> {
    return this.start().then(() => undefined);
  }

  // Resolves true once the worker has loaded, false if it could not start.
  private start(): Promise<boolean> {
    if (this.startup) return this.startup;
    let worker: Worker;
    try {
      worker = this.worker = new Worker(
        new URL("./grading.worker.ts", import.meta.url),
        { type: "module" },
      );
    } catch {
      return Promise.resolve(false);
    }
    this.startup = new Promise((resolve) => {
      let settled = false;
      const finish = (ready: boolean) => {
        if (settled) return;
        settled = true;
        worker.removeEventListener("message", receive);
        worker.removeEventListener("error", fail);
        if (!ready) this.reset(worker);
        resolve(ready);
      };
      const receive = ({ data }: MessageEvent) => {
        if (data?.ready) finish(true);
      };
      const fail = () => finish(false);
      worker.addEventListener("message", receive);
      worker.addEventListener("error", fail);
    });
    return this.startup;
  }

  private async waitForStart(): Promise<"ready" | "timeout" | "failed"> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const limit = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), START_LIMIT_MS);
    });
    try {
      return await Promise.race([
        this.start().then((ok) => (ok ? ("ready" as const) : ("failed" as const))),
        limit,
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  private reset(worker: Worker) {
    worker.terminate();
    if (this.worker === worker) {
      this.worker = null;
      this.startup = null;
    }
  }

  async check(question: Question, answers: string[]): Promise<Verdict> {
    const state = await this.waitForStart();
    if (state === "timeout")
      return { status: "inconclusive", message: STILL_LOADING };
    const worker = this.worker;
    if (state === "failed" || !worker)
      return { status: "inconclusive", message: START_FAILED };
    const id = ++this.seq;
    return new Promise((resolve) => {
      let finished = false;
      const done = (v: Verdict, reset = false) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        worker.removeEventListener("message", receive);
        worker.removeEventListener("error", error);
        if (reset) this.reset(worker);
        resolve(v);
      };
      const timer = setTimeout(
        () => done({ status: "inconclusive", message: TOO_LONG }, true),
        CALCULATION_LIMIT_MS,
      );
      const error = () =>
        done({ status: "inconclusive", message: START_FAILED }, true);
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
