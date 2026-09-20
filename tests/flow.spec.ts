import { test as base, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { SKILLS } from '../src/catalog';
import { freshProgress, localPracticeDay } from '../src/progress';
import { latex } from '../src/math';
import type { AppState, Progress } from '../src/progress';
import type { Config } from '../src/types';

const appDir = path.resolve(process.cwd());
const screenshotDir = path.resolve(appDir, 'artifacts/e2e');
mkdirSync(screenshotDir, { recursive: true });

const FIXED_NOW = Date.UTC(2026, 8, 19, 0, 0, 0);

function flowConfig(): Config {
  return {
    schemaVersion: 1,
    revision: 'flow-e2e',
    initialUnlockedLevel: 1,
    sessionLength: 3,
    disabledFamilies: SKILLS
      .filter(({ id }) => id !== 'constant' && id !== 'power')
      .map(({ id }) => id),
  };
}

async function seedCurrentState(
  page: Page,
  config: Config,
  progress = freshProgress(config, FIXED_NOW),
): Promise<void> {
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
  progress = freshProgress(config, FIXED_NOW),
): Promise<void> {
  if (viewport) await page.setViewportSize(viewport);
  await page.route('**/practice-config.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(config),
  }));
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

async function readStoredState(page: Page): Promise<AppState> {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('derivative-studio', 1);
    request.onerror = () => reject(request.error ?? new Error('Could not read IndexedDB.'));
    request.onsuccess = () => {
      const database = request.result;
      const get = database.transaction('state', 'readonly').objectStore('state').get('current');
      get.onsuccess = () => {
        database.close();
        resolve(get.result as AppState);
      };
      get.onerror = () => reject(get.error ?? new Error('Could not read current state.'));
    };
  }));
}

async function currentAnswer(page: Page, fieldIndex = 0): Promise<string> {
  let value = '';
  await expect.poll(async () => {
    const state = await readStoredState(page);
    const answer = state.session?.current?.question.answers[fieldIndex];
    value = answer === undefined ? '' : latex(answer);
    return value;
  }).not.toBe('');
  return value;
}

async function sessionCompleted(page: Page): Promise<number> {
  return (await readStoredState(page)).session?.completed ?? -1;
}

async function currentPrimarySkill(page: Page): Promise<string> {
  return (await readStoredState(page)).session?.current?.question.primarySkill ?? '';
}

async function keyboardVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => window.mathVirtualKeyboard.visible);
}

const test = base;

test.describe('session transition flows', () => {
  test('Enter advances the focused next button exactly once', async ({ page, browserName }) => {
    const config = flowConfig();
    // Keep this direct-key flow on the real clock so the app's debounced draft
    // save can settle before the navigation action.
    await openApp(page, config);
    await page.getByRole('button', { name: /Start practicing/ }).click();
    await expect.poll(() => currentPrimarySkill(page)).toBe('constant');
    await expect(page.locator('#streak')).toContainText('0 in a row');
    await expect(page.locator('#today-count')).toContainText('practiced today');
    await expect(page.locator('.answer-equation')).toBeVisible();

    const field = page.locator('math-field').first();
    await setMathfield(field, await currentAnswer(page));
    await field.press('Enter');
    await expect(page.locator('#feedback')).toContainText('Correct');
    await expect(page.locator('#streak')).toContainText('1 in a row');
    await expect(page.locator('#today-count')).toContainText('1 practiced today');
    await page.screenshot({
      path: path.join(screenshotDir, `${browserName}-flow-streak-desktop.png`),
      fullPage: true,
    });
    await expect(page.locator('#next')).toBeFocused();
    await expect(page.locator('#next')).toBeEnabled();
    await expect.poll(() => sessionCompleted(page)).toBe(0);

    await page.keyboard.press('Enter');
    await expect.poll(() => currentPrimarySkill(page)).toBe('constant');
    await expect.poll(() => sessionCompleted(page)).toBe(1);

    // The scheduler needs two independent constant examples before moving on
    // to the enabled power-rule skill. This also proves continuous practice
    // does not stop after the first two completed questions.
    await setMathfield(page.locator('math-field').first(), await currentAnswer(page));
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('#feedback')).toContainText('Correct');
    await expect(page.locator('#next')).toBeEnabled();
    await page.locator('#next').click();
    await expect.poll(() => currentPrimarySkill(page)).toBe('power');
    await expect.poll(() => sessionCompleted(page)).toBe(2);
  });

  test('immediate Enter grades the visible value before a delayed input event', async ({page}) => {
    await openApp(page, flowConfig());
    await page.getByRole('button', {name:/Start practicing/}).click();
    const field = page.locator('math-field').first();
    await expect(field).toBeFocused();
    // Reproduce MathLive's visible-value update preceding draft notification.
    await field.evaluate((element) => { (element as HTMLElement & {value:string}).value = '0'; });
    await page.keyboard.press('Enter');
    await expect(page.locator('#feedback')).toContainText('Correct');
    await expect(page.locator('#next')).toBeFocused();
  });

  test('the three-second countdown advances only once', async ({ page }) => {
    const config = flowConfig();
    await page.clock.install({ time: FIXED_NOW });
    await openApp(page, config);
    await page.getByRole('button', { name: /Start practicing/ }).click();
    await expect.poll(() => currentPrimarySkill(page)).toBe('constant');

    await setMathfield(page.locator('math-field').first(), await currentAnswer(page));
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('#feedback')).toContainText('Correct');
    await expect(page.locator('#auto-next')).toBeVisible();
    await expect(page.locator('#next')).toBeEnabled();
    await expect.poll(() => sessionCompleted(page)).toBe(0);

    await page.clock.fastForward(3_001);
    await expect.poll(() => currentPrimarySkill(page)).toBe('constant');
    await expect.poll(() => sessionCompleted(page)).toBe(1);

    // A cleared interval must not finish the same question a second time.
    await page.clock.fastForward(3_001);
    await expect.poll(() => sessionCompleted(page)).toBe(1);
    await expect.poll(() => currentPrimarySkill(page)).toBe('constant');
  });

  test('an incorrect answer restores focus to its original math field', async ({ page }) => {
    const config = flowConfig();
    await page.clock.install({ time: FIXED_NOW });
    await openApp(page, config);
    await page.getByRole('button', { name: /Start practicing/ }).click();
    await expect.poll(() => currentPrimarySkill(page)).toBe('constant');

    const field = page.locator('math-field').first();
    await setMathfield(field, '1');
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('#feedback')).toBeVisible();
    await expect(page.locator('#feedback')).not.toContainText('Correct');
    await expect(page.locator('#streak')).toContainText('0 in a row');
    await expect(page.locator('#today-count')).toContainText('1 practiced today');
    await expect(field).toBeFocused();
    await expect(page.locator('#auto-next')).toBeHidden();
    await expect.poll(() => sessionCompleted(page)).toBe(0);

    // A retry may update the visible verdict, but the same question is only
    // counted once in the daily total and cannot turn the failed streak back
    // into a correct streak.
    await setMathfield(field, await currentAnswer(page));
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('#feedback')).toContainText('Correct');
    await expect(page.locator('#streak')).toContainText('0 in a row');
    await expect(page.locator('#today-count')).toContainText('1 practiced today');
  });

  test('every success celebrates from five, with full-screen celebration from ten', async ({ page }) => {
    const config = flowConfig();
    await page.clock.install({ time: FIXED_NOW });
    const cases = [
      { before: 4, className: 'celebrate' },
      { before: 5, className: 'celebrate' },
      { before: 8, className: 'celebrate' },
      { before: 9, className: 'celebrate' },
      { before: 10, className: 'celebrate' },
    ] as const;

    for (const item of cases) {
      const progress = freshProgress(config, FIXED_NOW) as Progress;
      progress.streak = item.before;
      progress.practiceDays = { [localPracticeDay(FIXED_NOW)]: item.before };
      await openApp(page, config, undefined, progress);
      await page.getByRole('button', { name: /Start practicing/ }).click();
      await expect.poll(() => currentPrimarySkill(page)).toBe('constant');
      await setMathfield(page.locator('math-field').first(), await currentAnswer(page));
      await page.getByRole('button', { name: 'Check answer' }).click();
      await expect(page.locator('#feedback')).toContainText('Correct');
      await expect(page.locator('#streak')).toHaveClass(new RegExp(`\\b${item.className}\\b`));
      await expect(page.locator('#streak')).toContainText(`${item.before + 1} in a row`);
      await expect(page.locator('.full-celebration')).toHaveCount(item.before >= 9 ? 1 : 0);
      if (item.before === 9) {
        await page.clock.runFor(350);
        await page.screenshot({path:'artifacts/ux-refresh/verified-celebration.png'});
        await expect(page.locator('.full-celebration')).toHaveCSS('pointer-events','none');
      }
      await expect(page.locator('#today-count')).toContainText(`${item.before + 1} practiced today`);
    }
  });

  test('reduced motion keeps the streak without full-screen animation', async ({page}) => {
    await page.emulateMedia({reducedMotion:'reduce'});
    const config = flowConfig();
    const progress = freshProgress(config, FIXED_NOW);
    progress.streak = 9;
    await openApp(page, config, undefined, progress);
    await page.getByRole('button', {name:/Start practicing/}).click();
    await setMathfield(page.locator('math-field').first(), await currentAnswer(page));
    await page.getByRole('button', {name:'Check answer'}).click();
    await expect(page.locator('#streak')).toContainText('10 in a row');
    await expect(page.locator('.full-celebration')).toHaveCount(0);
    await expect(page.locator('#streak')).toHaveCSS('animation-name','none');
  });

  test('opening a modal cancels an armed automatic advance', async ({ page }) => {
    const config = flowConfig();
    await page.clock.install({ time: FIXED_NOW });
    await openApp(page, config);
    await page.getByRole('button', { name: /Start practicing/ }).click();
    await setMathfield(page.locator('math-field').first(), await currentAnswer(page));
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('#feedback')).toContainText('Correct');
    await expect(page.locator('#auto-next')).toBeVisible();
    await expect(page.locator('#next')).toBeEnabled();

    await page.getByRole('button', { name: 'Input guide' }).click();
    await expect(page.locator('#dialog')).toBeVisible();
    await expect(page.locator('#auto-next')).toBeHidden();
    await page.clock.fastForward(5_000);
    await expect.poll(() => sessionCompleted(page)).toBe(0);
    await expect.poll(() => currentPrimarySkill(page)).toBe('constant');

    await page.locator('#close-modal').click();
    await page.clock.fastForward(5_000);
    await expect.poll(() => sessionCompleted(page)).toBe(0);
  });

  for (const interruption of ['editing', 'background'] as const) {
    test(`${interruption} cancels the countdown without restarting it`, async ({ page }) => {
      await page.clock.install({time: FIXED_NOW});
      await openApp(page, flowConfig());
      await page.getByRole('button', {name:/Start practicing/}).click();
      const field = page.locator('math-field').first();
      await setMathfield(field, await currentAnswer(page));
      await page.getByRole('button', {name:'Check answer'}).click();
      await expect(page.locator('#auto-next')).toBeVisible();
      if (interruption === 'editing') await field.focus();
      else {
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', {configurable:true, value:true});
          document.dispatchEvent(new Event('visibilitychange'));
          Object.defineProperty(document, 'hidden', {configurable:true, value:false});
          document.dispatchEvent(new Event('visibilitychange'));
        });
      }
      await expect(page.locator('#auto-next')).toBeHidden();
      await page.clock.fastForward(5_000);
      expect(await sessionCompleted(page)).toBe(0);
      await page.locator('#next').click();
      await expect.poll(() => sessionCompleted(page)).toBe(1);
    });
  }

  test('on a 390px viewport, the open math keyboard and input survive Next', async ({ page, browserName }) => {
    const config = flowConfig();
    await page.clock.install({ time: FIXED_NOW });
    await openApp(page, config, { width: 390, height: 844 });
    await page.getByRole('button', { name: /Start practicing/ }).click();
    await expect.poll(() => currentPrimarySkill(page)).toBe('constant');

    const firstField = page.locator('math-field').first();
    await firstField.focus();
    await page.getByRole('button', { name: 'Math keyboard' }).click();
    await expect.poll(() => keyboardVisible(page)).toBe(true);
    await setMathfield(firstField, await currentAnswer(page));
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('#feedback')).toContainText('Correct');
    await expect.poll(() => keyboardVisible(page)).toBe(true);
    await expect(page.locator('#next')).toBeEnabled();

    await page.locator('#next').click();
    await expect.poll(() => currentPrimarySkill(page)).toBe('constant');
    await expect.poll(() => keyboardVisible(page)).toBe(true);
    const nextField = page.locator('math-field').first();
    await expect(nextField).toBeFocused();
    await setMathfield(nextField, await currentAnswer(page));
    await expect(nextField).toHaveJSProperty('value', await currentAnswer(page));

    await page.screenshot({
      path: path.join(screenshotDir, `${browserName}-flow-mobile-390-next-input.png`),
      fullPage: true,
    });
  });
});
