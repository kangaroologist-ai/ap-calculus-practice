import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Grader } from '../src/grader-client';
import type { Question, Verdict } from '../src/types';

const question = {
  id: 'grader-client-test',
  source: ['x'],
  answers: ['1'],
} as Question;
const answers = ['1'];
const correct: Verdict = { status: 'correct', evidence: 'numeric' };

type Posted = { id: number; question: Question; answers: string[] };

class FakeWorker {
  static instances: FakeWorker[] = [];
  posted: Posted[] = [];
  terminated = false;
  private listeners = new Map<string, Set<(event: Event) => void>>();

  constructor() {
    FakeWorker.instances.push(this);
  }
  addEventListener(type: string, listener: (event: Event) => void) {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: (event: Event) => void) {
    this.listeners.get(type)?.delete(listener);
  }
  postMessage(message: Posted) {
    this.posted.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  emit(type: 'message' | 'error', event: Event) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
  }
  ready() {
    this.emit('message', new MessageEvent('message', { data: { ready: true } }));
  }
  answer(id: number, verdict: Verdict = correct) {
    this.emit('message', new MessageEvent('message', { data: { id, verdict } }));
  }
  fail() {
    this.emit('error', new Event('error'));
  }
}

function onlyWorker(): FakeWorker {
  const [worker] = FakeWorker.instances;
  if (!worker) throw new Error('The grader did not create a worker.');
  return worker;
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeWorker.instances = [];
  vi.stubGlobal('Worker', FakeWorker);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Grader', () => {
  it('waits out a slow worker start before the calculation limit begins', async () => {
    const grader = new Grader();
    const checking = grader.check(question, answers);
    const worker = onlyWorker();

    await vi.advanceTimersByTimeAsync(5_000);
    expect(worker.posted).toHaveLength(0);
    worker.ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(worker.posted).toEqual([{ id: 1, question, answers }]);

    await vi.advanceTimersByTimeAsync(2_900);
    worker.answer(1);
    await expect(checking).resolves.toEqual(correct);
    expect(worker.terminated).toBe(false);
  });

  it('reports a start that takes longer than 20 s without terminating the worker', async () => {
    const grader = new Grader();
    const checking = grader.check(question, answers);
    const worker = onlyWorker();

    await vi.advanceTimersByTimeAsync(20_000);
    await expect(checking).resolves.toEqual({
      status: 'inconclusive',
      message: 'The checker is still loading. Try again in a moment.',
    });
    expect(worker.terminated).toBe(false);
    expect(worker.posted).toHaveLength(0);

    // The worker keeps loading and the next check reuses it.
    worker.ready();
    await vi.advanceTimersByTimeAsync(0);
    const second = grader.check(question, answers);
    await vi.advanceTimersByTimeAsync(0);
    expect(FakeWorker.instances).toHaveLength(1);
    expect(worker.posted).toEqual([{ id: 1, question, answers }]);
    worker.answer(1);
    await expect(second).resolves.toEqual(correct);
  });

  it('keeps the 3 s calculation limit and replaces a terminated worker', async () => {
    const grader = new Grader();
    const warm = grader.warm();
    const worker = onlyWorker();
    worker.ready();
    await expect(warm).resolves.toBeUndefined();
    await expect(grader.warm()).resolves.toBeUndefined();

    const checking = grader.check(question, answers);
    await vi.advanceTimersByTimeAsync(3_000);
    await expect(checking).resolves.toEqual({
      status: 'inconclusive',
      message: 'This calculation took too long. Try a shorter equivalent answer.',
    });
    expect(worker.terminated).toBe(true);
    expect(worker.posted).toHaveLength(1);

    const second = grader.check(question, answers);
    expect(FakeWorker.instances).toHaveLength(2);
    const replacement = onlyWorkerAt(1);
    replacement.ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(replacement.posted).toEqual([{ id: 2, question, answers }]);
    replacement.answer(2);
    await expect(second).resolves.toEqual(correct);
  });

  it('reports a worker error as a checker that could not start', async () => {
    const grader = new Grader();
    const checking = grader.check(question, answers);
    const worker = onlyWorker();

    worker.fail();
    await expect(checking).resolves.toEqual({
      status: 'inconclusive',
      message: 'The checker could not start. Please try again.',
    });
    expect(worker.terminated).toBe(true);
  });

  it('reports a failed worker construction as a checker that could not start', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('No workers here.');
        }
      },
    );
    const grader = new Grader();
    await expect(grader.warm()).resolves.toBeUndefined();
    await expect(grader.check(question, answers)).resolves.toEqual({
      status: 'inconclusive',
      message: 'The checker could not start. Please try again.',
    });
  });
});

function onlyWorkerAt(index: number): FakeWorker {
  const worker = FakeWorker.instances[index];
  if (!worker) throw new Error(`The grader did not create worker ${index}.`);
  return worker;
}
