import { test as base, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createEmptyCard, fsrs, Rating, State } from 'ts-fsrs';
import { freshProgress, PARAMETERS, storeCard } from '../src/progress';
import type { AppState, Progress, SkillState } from '../src/progress';
import { latex } from '../src/math';
import type { Config } from '../src/types';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const screenshotDir = path.resolve(appDir, 'artifacts/e2e');
mkdirSync(screenshotDir, { recursive: true });

const skillIds = [
  'constant',
  'power',
  'sum',
  'root',
  'exp',
  'log',
  'sin',
  'cos',
  'tan',
  'cot',
  'sec',
  'csc',
  'asin',
  'acos',
  'atan',
  'product',
  'quotient',
  'chain',
  'nested',
  'mixed',
  'implicit',
  'inverse',
  'higher',
  'parametric',
  'vector',
  'polar',
];

type FixtureConfig = Omit<Config, 'disabledFamilies'> & {
  disabledFamilies?: string[];
};

const configFor = (
  overrides: Partial<FixtureConfig> = {},
): Config => ({
  schemaVersion: 1,
  revision: 'e2e-fixture',
  initialUnlockedLevel: 1,
  disabledFamilies: [],
  sessionLength: 1,
  ...overrides,
});

function onlySkill(skill: string, level: number, sessionLength = 1): Config {
  return configFor({
    initialUnlockedLevel: level,
    sessionLength,
    disabledFamilies: skillIds.filter((id) => id !== skill),
  });
}

function dueReviewCard(now: number) {
  // Build a real FSRS Review card, then place its next review just before the
  // fixed test clock. The four prior Good ratings make this a legitimate
  // mature card rather than a hand-written state that production could never
  // produce.
  let reviewAt = now - 365 * 24 * 60 * 60 * 1000;
  let card = createEmptyCard(new Date(reviewAt));
  for (let i = 0; i < 5; i += 1) {
    card = fsrs(PARAMETERS).next(card, new Date(reviewAt), Rating.Good).card;
    reviewAt = card.due.getTime() + 1000;
  }
  return { ...storeCard(card), due: now - 1000 };
}

function seededEvidence(skill: string) {
  return Array.from({ length: 4 }, (_, index) => ({
    q: `e2e-seed:${skill}:${index}`,
    template: index % 2,
    correct: true,
  }));
}

function seededSkill(skill: string, now: number): SkillState {
  return {
    card: dueReviewCard(now),
    recent: seededEvidence(skill),
    needsRemediation: false,
    failureStreak: 0,
    lastFailureAt: 0,
    otherSinceFailure: 0,
    extraPracticeGiven: false,
    lastSeen: 0,
  };
}

function levelTwoFlowProgress(config: Config, now: number): Progress {
  const progress = freshProgress(config, now);
  // The foundation has four real-looking evidence events. The first constant
  // answer below supplies the fifth event and unlocks Level 2 through the UI.
  // Exponential is also seeded with a due Review card so that the first newly
  // unlocked Level 2 question is a spaced review, while Log remains a fresh
  // enabled skill used for the two remediation intervals.
  progress.skills.constant = seededSkill('constant', now);
  progress.skills.exp = seededSkill('exp', now);
  return progress;
}

async function seedCurrentState(
  page: Page,
  config: Config,
  progress = freshProgress(config),
): Promise<void> {
  // This is deliberately test-owned state. Each Playwright context has its
  // own origin storage, and the app never receives a seed in production.
  const seeded = { version: 1 as const, progress };
  await page.evaluate((state) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('derivative-studio', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('state')) {
        request.result.createObjectStore('state');
      }
    };
    request.onerror = () => reject(request.error ?? new Error('Could not seed IndexedDB.'));
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('state', 'readwrite');
      transaction.objectStore('state').put(state, 'current');
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not seed IndexedDB.'));
    };
  }), seeded);
}

async function openApp(
  page: Page,
  config: Config,
  viewport?: { width: number; height: number },
  progress = freshProgress(config),
) {
  if (viewport) await page.setViewportSize(viewport);
  await page.route('**/practice-config.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(config),
  }));

  // Navigate to a same-origin resource before seeding so IndexedDB belongs to
  // the app origin, then let the real app boot from the seeded state.
  await page.goto('/practice-config.json');
  await seedCurrentState(page, config, progress);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Start practicing/ })).toBeVisible();
}

async function setMathfield(field: ReturnType<Page['locator']>, value: string): Promise<void> {
  await field.evaluate((element, nextValue) => {
    const mathfield = element as HTMLElement & { value: string };
    mathfield.focus();
    mathfield.value = nextValue as string;
    mathfield.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: nextValue as string,
    }));
  }, value);
}

async function hideMathKeyboard(page: Page): Promise<void> {
  await page.evaluate(() => window.mathVirtualKeyboard?.hide());
}

async function screenshot(page: Page, name: string): Promise<void> {
  const browserName = page.context().browser()?.browserType().name() ?? 'unknown';
  await page.screenshot({
    path: path.join(screenshotDir, `${browserName}-${name}.png`),
    fullPage: true,
  });
}

async function scrollDialogToBottom(page: Page): Promise<void> {
  const metrics = await page.locator('#dialog').evaluate((dialog) => {
    const element = dialog as HTMLDialogElement;
    const before = { scrollHeight: element.scrollHeight, clientHeight: element.clientHeight };
    element.scrollTop = element.scrollHeight;
    return { ...before, after: element.scrollTop };
  });
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(metrics.after).toBeGreaterThan(0);
}

const test = base;

test.describe('Derivative Studio browser flows', () => {
  test('constant first question: zero, blur, hint, export/import, restore, and damaged code', async ({ page }) => {
    const config = onlySkill('constant', 1);
    await openApp(page, config);
    await screenshot(page, 'constant-01-welcome');

    await page.getByRole('button', { name: /Start practicing/ }).click();
    await expect(page.locator('.skill-name')).toHaveText('Constants');
    const field = page.locator('math-field').first();
    await expect(field).toHaveAttribute('aria-label', "f'(x)");
    await setMathfield(field, '0');

    // A real click outside the custom math field exercises its blur path and
    // checks that the draft is retained by the app's input listener.
    await page.locator('.question-body h2').click();
    await expect(field).toHaveJSProperty('value', '0');
    await screenshot(page, 'constant-02-zero-after-blur');

    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('#feedback')).toContainText('Correct');
    await expect(page.locator('#next')).toHaveText('Next question →');

    // Help remains available after a submitted answer; this keeps the test's
    // zero submission independent while still exercising the hint rendering.
    await page.getByRole('button', { name: 'Need a hint?' }).click();
    await expect(page.locator('#hints')).toContainText(/A NUDGE IN THE RIGHT DIRECTION|HINT/);
    await screenshot(page, 'constant-03-hint');

    await page.getByRole('button', { name: 'Move progress' }).click();
    await page.getByRole('button', { name: 'Export progress' }).click();
    const exportCode = page.locator('#export-code');
    await expect(exportCode).toBeVisible();
    const code = await exportCode.inputValue();
    expect(code).toMatch(/^DSP1\.[a-f0-9]{8}\.[A-Za-z0-9_-]+$/);
    await screenshot(page, 'constant-04-export');
    await scrollDialogToBottom(page);
    await screenshot(page, 'constant-04-export-bottom');

    await page.locator('#close-modal').click();
    await expect(page.locator('#dialog')).toHaveCount(0);
    await page.locator('#reset').click();
    await expect(page.locator('#confirm-reset')).toBeVisible();
    await page.locator('#confirm-reset').click();
    await expect(page.getByRole('button', { name: /Start practicing/ })).toBeVisible();

    // Reset created a local backup. Restore swaps the full prior app state
    // back in, including the submitted question and its feedback.
    await page.locator('#restore').click();
    await expect(page.locator('#confirm-restore')).toBeVisible();
    await page.locator('#confirm-restore').click();
    await expect(page.locator('#feedback')).toContainText('Correct');
    await screenshot(page, 'constant-05-restored');

    // Reset again so the imported snapshot visibly replaces a fresh state.
    await page.locator('#reset').click();
    await expect(page.locator('#confirm-reset')).toBeVisible();
    await page.locator('#confirm-reset').click();
    await expect(page.getByRole('button', { name: /Start practicing/ })).toBeVisible();

    await page.getByRole('button', { name: 'Move progress' }).click();
    await page.getByRole('button', { name: 'Import progress' }).click();
    await page.locator('#import-code').fill(code);
    await page.getByRole('button', { name: 'Review import' }).click();
    await expect(page.locator('#import-preview')).toContainText('Review this snapshot');
    await expect(page.locator('#import-preview')).toContainText('Replace with this progress');
    await screenshot(page, 'constant-06-import-preview');
    await scrollDialogToBottom(page);
    await screenshot(page, 'constant-06-import-preview-bottom');

    // Closing the preview is a true cancellation: fresh welcome state remains.
    await page.locator('#close-modal').click();
    await expect(page.getByRole('button', { name: /Start practicing/ })).toBeVisible();

    await page.getByRole('button', { name: 'Move progress' }).click();
    await page.getByRole('button', { name: 'Import progress' }).click();
    await page.locator('#import-code').fill(code);
    await page.getByRole('button', { name: 'Review import' }).click();
    await page.getByRole('button', { name: 'Replace with this progress' }).click();
    await expect(page.getByRole('button', { name: /Start practicing/ })).toBeVisible();
    await screenshot(page, 'constant-07-import-replaced');

    await page.getByRole('button', { name: 'Move progress' }).click();
    await page.getByRole('button', { name: 'Import progress' }).click();
    await page.locator('#import-code').fill('DSP1.00000000.AAAA');
    await page.getByRole('button', { name: 'Review import' }).click();
    await expect(page.locator('#modal-error')).toContainText('incomplete or damaged');
    await screenshot(page, 'constant-08-damaged-code');
  });
});

test('valid import preview is cleared before a damaged code is reviewed', async ({ page }) => {
  const config = onlySkill('constant', 1);
  await openApp(page, config);
  await page.getByRole('button', { name: 'Move progress' }).click();
  await page.getByRole('button', { name: 'Export progress' }).click();
  const validCode = await page.locator('#export-code').inputValue();
  await page.locator('#close-modal').click();

  await page.getByRole('button', { name: 'Move progress' }).click();
  await page.getByRole('button', { name: 'Import progress' }).click();
  await page.locator('#import-code').fill(validCode);
  await page.getByRole('button', { name: 'Review import' }).click();
  await expect(page.locator('#confirm-import')).toBeVisible();

  await page.locator('#import-code').fill('DSP1.00000000.AAAA');
  await expect(page.locator('#confirm-import')).toHaveCount(0);
  await page.getByRole('button', { name: 'Review import' }).click();
  await expect(page.locator('#modal-error')).toContainText('incomplete or damaged');
  await expect(page.locator('#confirm-import')).toHaveCount(0);
});

test('immediate MathLive draft survives reset and restore', async ({ page }) => {
  const config = onlySkill('constant', 1);
  await openApp(page, config);
  await page.getByRole('button', { name: /Start practicing/ }).click();
  const field = page.locator('math-field').first();
  await setMathfield(field, '7');

  // Do not blur or wait after the input event: reset must flush the latest
  // draft before replacing the live state, then restore must recover it.
  await page.locator('#reset').click();
  await page.locator('#confirm-reset').click();
  await expect(page.getByRole('button', { name: /Start practicing/ })).toBeVisible();
  await page.locator('#restore').click();
  await page.locator('#confirm-restore').click();
  await expect(page.locator('math-field').first()).toHaveJSProperty('value', '7');
});

const levelCases = [
  { skill: 'constant', level: 1, label: 'Constants', values: ['0'] },
  { skill: 'exp', level: 2, label: 'Exponential functions', values: ['e^x'] },
  { skill: 'product', level: 3, label: 'Product rule', values: ['x'] },
  { skill: 'nested', level: 4, label: 'Nested chain rule', values: ['x'] },
  { skill: 'implicit', level: 5, label: 'Implicit differentiation', values: ['x/y'] },
  { skill: 'vector', level: 6, label: 'Vector derivatives', values: ['t', 'cos(t)'] },
] as const;

for (const item of levelCases) {
  test(`level ${item.level} ${item.label} accepts its answer fields`, async ({ page }) => {
    await openApp(page, onlySkill(item.skill, item.level));
    await page.getByRole('button', { name: /Start practicing/ }).click();
    await expect(page.locator('.skill-name')).toHaveText(item.label);
    await expect(page.locator('.card-top .tag')).toContainText(`LEVEL ${item.level}`);

    const fields = page.locator('math-field');
    await expect(fields).toHaveCount(item.values.length);
    for (const [index, value] of item.values.entries()) {
      await setMathfield(fields.nth(index), value);
    }
    await page.locator('.question-body h2').click();
    for (const [index, value] of item.values.entries()) {
      await expect(fields.nth(index)).toHaveJSProperty('value', value);
    }
    await screenshot(page, `level-${item.level}-${item.skill}-input`);

    // Submit as part of the UI path so worker grading and the feedback region
    // are exercised for one-field and multi-field questions alike.
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('#feedback')).toBeVisible();
  });
}

test('mobile vector layout has no horizontal clipping', async ({ page }) => {
  await openApp(page, onlySkill('vector', 6), { width: 390, height: 844 });
  await page.getByRole('button', { name: /Start practicing/ }).click();
  await expect(page.locator('.skill-name')).toHaveText('Vector derivatives');
  await setMathfield(page.locator('math-field').nth(0), 't');
  await setMathfield(page.locator('math-field').nth(1), 'cos(t)');
  await page.locator('.question-body h2').click();
  await hideMathKeyboard(page);

  const metrics = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const fields = Array.from(document.querySelectorAll('math-field')).map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    });
    const card = document.querySelector('.practice-card')?.getBoundingClientRect();
    return {
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      fields,
      card: card ? { left: card.left, right: card.right } : undefined,
    };
  });
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  for (const field of metrics.fields) {
    expect(field.left).toBeGreaterThanOrEqual(-1);
    expect(field.right).toBeLessThanOrEqual(metrics.viewport + 1);
  }
  expect(metrics.card?.left ?? -1).toBeGreaterThanOrEqual(-1);
  expect(metrics.card?.right ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(metrics.viewport + 1);
  await screenshot(page, 'mobile-vector-no-clipping');
});

async function readStoredState(page: Page): Promise<AppState> {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('derivative-studio', 1);
    request.onerror = () => reject(request.error ?? new Error('Could not read IndexedDB.'));
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('state', 'readonly');
      const get = transaction.objectStore('state').get('current');
      get.onsuccess = () => {
        database.close();
        resolve(get.result as AppState);
      };
      get.onerror = () => reject(get.error ?? new Error('Could not read current state.'));
    };
  }));
}

async function readStoredProgress(page: Page): Promise<Progress> {
  return (await readStoredState(page)).progress;
}

test('cross-context transfer preserves FSRS fields and imports a generated QR image', async ({ browser }) => {
  const config = onlySkill('constant', 1);
  const sourceContext = await browser.newContext();
  const targetContext = await browser.newContext();
  const qrContext = await browser.newContext();
  const source = await sourceContext.newPage();
  const target = await targetContext.newPage();
  const qrTarget = await qrContext.newPage();
  try {
    await openApp(source, config);
    // A fresh snapshot remains a single QR frame, which keeps the generated
    // PNG fixture deterministic while the next export exercises a real FSRS
    // review with the larger text code.
    await source.getByRole('button', { name: 'Move progress' }).click();
    await source.getByRole('button', { name: 'Export progress' }).click();
    await expect(source.locator('#qr-label')).toHaveText('QR 1 of 1');
    const qrCode = await source.locator('#export-code').inputValue();
    expect(qrCode).toMatch(/^DSP1\.[a-f0-9]{8}\.[A-Za-z0-9_-]+$/);
    const qrDataUrl = await source.locator('#qr').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL('image/png'));
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    await source.locator('#close-modal').click();

    await source.getByRole('button', { name: /Start practicing/ }).click();
    await setMathfield(source.locator('math-field').first(), '0');
    await source.locator('.question-body h2').click();
    await source.getByRole('button', { name: 'Check answer' }).click();
    await expect(source.locator('#feedback')).toContainText('Correct');
    const sourceProgress = await readStoredProgress(source);

    await source.getByRole('button', { name: 'Move progress' }).click();
    await source.getByRole('button', { name: 'Export progress' }).click();
    const code = await source.locator('#export-code').inputValue();

    await openApp(target, config);
    await target.getByRole('button', { name: 'Move progress' }).click();
    await target.getByRole('button', { name: 'Import progress' }).click();
    await target.locator('#import-code').fill(code);
    await target.getByRole('button', { name: 'Review import' }).click();
    await target.getByRole('button', { name: 'Replace with this progress' }).click();
    await expect(target.locator('#dialog')).toHaveCount(0);
    await expect.poll(async () => (await readStoredProgress(target)).sequence).toBe(sourceProgress.sequence);
    await expect(target.getByRole('button', { name: /Start practicing/ })).toBeVisible();
    const targetProgress = await readStoredProgress(target);
    expect(targetProgress.skills.constant.card).toEqual(sourceProgress.skills.constant.card);
    expect(targetProgress.skills.constant.recent).toEqual(sourceProgress.skills.constant.recent);
    expect(targetProgress.skills.constant.card.due).toBe(sourceProgress.skills.constant.card.due);
    await screenshot(target, 'cross-context-imported-fsrs');

    await openApp(qrTarget, config);
    await qrTarget.getByRole('button', { name: 'Move progress' }).click();
    await qrTarget.getByRole('button', { name: 'Import progress' }).click();
    await qrTarget.locator('#qr-file').setInputFiles({
      name: 'derivative-progress.png',
      mimeType: 'image/png',
      buffer: qrBuffer,
    });
    await expect(qrTarget.locator('#import-preview')).toContainText('Review this snapshot');
    await screenshot(qrTarget, 'qr-image-import-preview');
  } finally {
    await sourceContext.close();
    await targetContext.close();
    await qrContext.close();
  }
});

test('delayed start config keeps global actions disabled until session starts', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The delayed network race is covered once in Chromium.');
  const config = onlySkill('constant', 1);
  let configRequests = 0;
  let releaseStart: (() => void) | undefined;
  const startGate = new Promise<void>((resolve) => { releaseStart = resolve; });
  await page.route('**/practice-config.json', async (route) => {
    configRequests += 1;
    if (configRequests >= 3) await startGate;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(config) });
  });
  await page.goto('/practice-config.json');
  await seedCurrentState(page, config);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Start practicing/ })).toBeVisible();

  await page.getByRole('button', { name: /Start practicing/ }).click();
  await expect(page.locator('#start')).toBeDisabled();
  await expect(page.locator('#transfer')).toBeDisabled();
  await expect(page.locator('#restore')).toBeDisabled();
  await expect(page.locator('#reset')).toBeDisabled();
  releaseStart?.();
  await expect(page.locator('.skill-name')).toHaveText('Constants');
  await expect(page.locator('#transfer')).toBeEnabled();
});

test('delayed QR decode cannot restore a preview after the code changes', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The delayed QR revision race is covered once in Chromium.');
  await page.addInitScript(() => {
    const original = window.createImageBitmap.bind(window) as (...args: any[]) => Promise<ImageBitmap>;
    const scope = window as unknown as {
      __e2eBitmapStarted?: boolean;
      __e2eReleaseBitmap?: () => void;
    };
    scope.__e2eBitmapStarted = false;
    Object.defineProperty(window, 'createImageBitmap', {
      configurable: true,
      value: async (...args: any[]) => {
        scope.__e2eBitmapStarted = true;
        const bitmap = await original(...args);
        await new Promise<void>((resolve) => { scope.__e2eReleaseBitmap = resolve; });
        return bitmap;
      },
    });
  });
  const config = onlySkill('constant', 1);
  await openApp(page, config);
  await page.getByRole('button', { name: 'Move progress' }).click();
  await page.getByRole('button', { name: 'Export progress' }).click();
  const qrDataUrl = await page.locator('#qr').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL('image/png'));
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  await page.locator('#close-modal').click();
  await page.getByRole('button', { name: 'Move progress' }).click();
  await page.getByRole('button', { name: 'Import progress' }).click();
  await page.locator('#qr-file').setInputFiles({ name: 'delayed.png', mimeType: 'image/png', buffer: qrBuffer });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __e2eBitmapStarted?: boolean }).__e2eBitmapStarted)).toBe(true);

  await page.locator('#import-code').fill('DSP1.00000000.AAAA');
  await page.evaluate(() => (window as unknown as { __e2eReleaseBitmap?: () => void }).__e2eReleaseBitmap?.());
  await expect(page.locator('#import-preview')).toBeEmpty();
  await expect(page.locator('#confirm-import')).toHaveCount(0);
});

test('Level 2 remediation round trip preserves FSRS and due across contexts', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'The sequential virtual-clock transfer flow runs once in Chromium.');
  const fixedNow = Date.UTC(2026, 8, 18, 0, 0, 0);
  const config = configFor({
    sessionLength: 8,
    disabledFamilies: skillIds.filter((id) => !['constant', 'exp', 'log'].includes(id)),
  });
  const seeded = levelTwoFlowProgress(config, fixedNow);
  const desktopContext = await browser.newContext();
  const mobileContext = await browser.newContext();
  const desktop = await desktopContext.newPage();
  const mobile = await mobileContext.newPage();
  try {
    await desktop.clock.install({ time: fixedNow });
    await openApp(desktop, config, undefined, seeded);
    await desktop.getByRole('button', { name: /Start practicing/ }).click();
    await expect(desktop.locator('.skill-name')).toHaveText('Constants');
    await setMathfield(desktop.locator('math-field').first(), '0');
    await desktop.locator('.question-body h2').click();
    await desktop.getByRole('button', { name: 'Check answer' }).click();
    await expect(desktop.locator('#feedback')).toContainText('Correct');
    const unlocked = await readStoredProgress(desktop);
    expect(unlocked.unlockedLevel).toBe(2);

    await desktop.locator('#next').click();
    await expect(desktop.locator('.skill-name')).toHaveText('Exponential functions');
    await setMathfield(desktop.locator('math-field').first(), '0');
    await desktop.locator('.question-body h2').click();
    await desktop.getByRole('button', { name: 'Check answer' }).click();
    await expect(desktop.locator('#feedback')).toBeVisible();
    await expect(desktop.locator('#feedback')).not.toContainText('Correct');
    const relearning = await readStoredProgress(desktop);
    const relearningSkill = relearning.skills.exp;
    expect(relearningSkill.needsRemediation).toBe(true);
    expect(relearningSkill.otherSinceFailure).toBe(0);
    expect(relearningSkill.failureStreak).toBeGreaterThan(0);
    expect(relearningSkill.recent.at(-1)?.correct).toBe(false);
    expect(relearningSkill.card.state).toBe(State.Relearning);
    expect(relearningSkill.card.due).toBeGreaterThan(fixedNow);

    await desktop.getByRole('button', { name: 'Move progress' }).click();
    await desktop.getByRole('button', { name: 'Export progress' }).click();
    const mobileImportCode = await desktop.locator('#export-code').inputValue();
    expect(mobileImportCode).toMatch(/^DSP1\.[a-f0-9]{8}\.[A-Za-z0-9_-]+$/);
    await screenshot(desktop, 'level2-flow-desktop-relearning-export');
    await desktop.locator('#close-modal').click();

    await mobile.clock.install({ time: fixedNow });
    await openApp(mobile, config, { width: 390, height: 844 });
    await mobile.getByRole('button', { name: 'Move progress' }).click();
    await mobile.getByRole('button', { name: 'Import progress' }).click();
    await mobile.locator('#import-code').fill(mobileImportCode);
    await mobile.getByRole('button', { name: 'Review import' }).click();
    await expect(mobile.locator('#import-preview')).toContainText('Review this snapshot');
    await mobile.getByRole('button', { name: 'Replace with this progress' }).click();
    // The UI click handler is intentionally fire-and-forget; wait for its
    // async IndexedDB replacement rather than treating the underlying welcome
    // screen as proof that the transaction has committed.
    await expect(mobile.locator('#dialog')).toHaveCount(0);
    await expect.poll(async () => (await readStoredProgress(mobile)).sequence).toBe(relearning.sequence);
    await expect(mobile.getByRole('button', { name: /Start practicing/ })).toBeVisible();
    const imported = await readStoredProgress(mobile);
    expect(imported).toEqual(relearning);
    await screenshot(mobile, 'level2-flow-mobile-imported-relearning');

    const advanceBy = relearningSkill.card.due - fixedNow + 1000;
    await mobile.clock.fastForward(advanceBy);
    const advancedNow = await mobile.evaluate(() => Date.now());
    expect(advancedNow).toBeGreaterThan(relearningSkill.card.due);
    await mobile.getByRole('button', { name: /Start practicing/ }).click();
    await expect(mobile.locator('.skill-name')).toHaveText('Logarithmic functions');
    await mobile.locator('#next').click();
    await expect(mobile.locator('.skill-name')).toHaveText('Logarithmic functions');
    await mobile.locator('#next').click();
    await expect(mobile.locator('.skill-name')).toHaveText('Exponential functions');

    // Read the actual question persisted by the UI so this orchestration test
    // remains independent of chooser seed details. Mathematical equivalence
    // and worker grading are covered by the separate math and grader suites.
    await expect.poll(async () => (await readStoredState(mobile)).session?.current?.question.primarySkill).toBe('exp');
    const retryState = await readStoredState(mobile);
    const retryAnswer = latex(retryState.session!.current!.question.answers[0]);
    await setMathfield(mobile.locator('math-field').first(), retryAnswer);
    await mobile.locator('.question-body h2').click();
    await mobile.getByRole('button', { name: 'Check answer' }).click();
    await expect(mobile.locator('#feedback')).toContainText('Correct');
    const recovered = await readStoredProgress(mobile);
    expect(recovered.skills.exp.needsRemediation).toBe(false);
    expect(recovered.skills.exp.otherSinceFailure).toBe(2);
    expect(recovered.skills.exp.recent.at(-1)?.correct).toBe(true);
    expect(recovered.skills.exp.card.state).not.toBe(State.Relearning);
    expect(recovered.skills.exp.card.due).toBeGreaterThan(advancedNow);
    await screenshot(mobile, 'level2-flow-mobile-recovered');

    await mobile.getByRole('button', { name: 'Move progress' }).click();
    await mobile.getByRole('button', { name: 'Export progress' }).click();
    const desktopReturnCode = await mobile.locator('#export-code').inputValue();
    expect(desktopReturnCode).toMatch(/^DSP1\.[a-f0-9]{8}\.[A-Za-z0-9_-]+$/);
    await mobile.locator('#close-modal').click();

    await desktop.getByRole('button', { name: 'Move progress' }).click();
    await desktop.getByRole('button', { name: 'Import progress' }).click();
    await desktop.locator('#import-code').fill(desktopReturnCode);
    await desktop.getByRole('button', { name: 'Review import' }).click();
    await expect(desktop.locator('#import-preview')).toContainText('Review this snapshot');
    await desktop.getByRole('button', { name: 'Replace with this progress' }).click();
    await expect(desktop.locator('#dialog')).toHaveCount(0);
    await expect.poll(async () => (await readStoredProgress(desktop)).sequence).toBe(recovered.sequence);
    await expect(desktop.getByRole('button', { name: /Start practicing/ })).toBeVisible();
    const returned = await readStoredProgress(desktop);
    expect(returned).toEqual(recovered);
    expect(returned.skills.exp.card.due).toBe(recovered.skills.exp.card.due);
    await screenshot(desktop, 'level2-flow-desktop-returned-recovered');
  } finally {
    await desktopContext.close();
    await mobileContext.close();
  }
});

test('camera denial shows the paste-or-image fallback', async ({ page, context }) => {
  await context.clearPermissions();
  await page.addInitScript(() => {
    const devices = navigator.mediaDevices;
    if (devices) {
      Object.defineProperty(devices, 'getUserMedia', {
        configurable: true,
        value: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
      });
    }
  });
  await openApp(page, onlySkill('constant', 1));
  await page.getByRole('button', { name: 'Move progress' }).click();
  await page.getByRole('button', { name: 'Import progress' }).click();
  await page.getByRole('button', { name: 'Scan with camera' }).click();
  await expect(page.locator('#modal-error')).toContainText(/Camera access is unavailable|Camera scanning needs HTTPS/);
  await screenshot(page, 'camera-denied-fallback');
});

test('mobile visual representatives: 360, 390 keyboard, 430, landscape, and 200% zoom', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Representative visual states use Chromium; functional paths run on all projects.');
  const config = onlySkill('vector', 6);
  await openApp(page, config, { width: 360, height: 800 });

  const renderState = async (
    name: string,
    viewport: { width: number; height: number },
    mode?: 'keyboard' | 'zoom',
  ) => {
    await page.setViewportSize(viewport);
    await page.goto('/practice-config.json');
    await seedCurrentState(page, config);
    await page.goto('/');
    await page.getByRole('button', { name: /Start practicing/ }).click();
    await setMathfield(page.locator('math-field').first(), 't');
    await setMathfield(page.locator('math-field').nth(1), 'cos(t)');
    await page.locator('.question-body h2').click();
    if (mode === 'keyboard') {
      await page.getByRole('button', { name: 'Math keyboard' }).click();
      await expect(page.locator('.ML__keyboard')).toBeVisible();
    }
    if (mode === 'zoom') {
      await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    }
    await screenshot(page, name);
  };

  await renderState('mobile-360-portrait', { width: 360, height: 800 });
  await renderState('mobile-390-keyboard', { width: 390, height: 844 }, 'keyboard');
  await renderState('mobile-430-portrait', { width: 430, height: 932 });
  await renderState('mobile-landscape', { width: 844, height: 390 });
  await renderState('mobile-200-percent-zoom', { width: 390, height: 844 }, 'zoom');
});

test('Functions math keyboard exposes y and inverse-trig insertion', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'MathLive keyboard insertion is verified in the Chromium representative.');
  await openApp(page, onlySkill('implicit', 5), { width: 390, height: 844 });
  await page.getByRole('button', { name: /Start practicing/ }).click();
  const field = page.locator('math-field').first();
  await field.focus();
  await page.getByRole('button', { name: 'Math keyboard' }).click();
  await expect(page.locator('.ML__keyboard')).toBeVisible();

  const toolbarText = await page.locator('.MLK__toolbar').allTextContents();
  expect(toolbarText.join(' ')).toContain('Derivatives');
  expect(toolbarText.join(' ')).toContain('Functions');
  const functionKeys = await page.locator('.ML__keyboard .MLK__keycap').evaluateAll((keys) =>
    keys.map((key) => key.getAttribute('aria-label')).filter(Boolean),
  );
  expect(functionKeys).toEqual(expect.arrayContaining([
    'y',
    'arcsin',
    'arccos',
    'arctan',
    'sec',
    'csc',
    'cot',
  ]));
  const keyText = await page.locator('.ML__keyboard .MLK__keycap').allTextContents();
  expect(keyText.some((label) => /√|∛|root|sqrt/i.test(label))).toBe(true);

  await page.locator('.MLK__toolbar .layer-switch').filter({ hasText: 'Functions' }).click();
  await page.locator('.ML__keyboard .MLK__keycap[aria-label="y"]').click();
  await expect(field).toHaveJSProperty('value', 'y');
  await page.locator('.ML__keyboard .MLK__keycap[aria-label="arcsin"]').click();
  const inserted = await field.evaluate((element) => (element as HTMLElement & { value: string }).value);
  expect(inserted).toContain('arcsin');
  expect(inserted).toContain('y');
  await screenshot(page, 'mobile-functions-keyboard-insertion');
});
