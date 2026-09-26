import { test, expect, type Page } from '@playwright/test';
import { freshProgress, stateFor } from '../src/progress';
import { makePortableProgress, encodeProgress, splitIntoQrFrames, decodeProgress } from '../src/transfer';
import { WHATS_NEW } from '../src/whats-new';
import type { Config } from '../src/types';

const KEY = 'apcalc.whatsNewSeen';
const LATEST = WHATS_NEW[0].version;
const config: Config = { schemaVersion: 1, revision: 'whats-new-test', initialUnlockedLevel: 1, disabledFamilies: [], sessionLength: 12 };

// A returning learner: saved progress in IndexedDB and, optionally, the last notes they read.
async function seedReturning(page: Page, seen?: string) {
  await page.goto('/practice-config.json');
  const progress = freshProgress(config);
  stateFor(progress, 'constant', Date.now());
  await page.evaluate(({ saved, key, seen }) => new Promise<void>((resolve, reject) => {
    if (seen) localStorage.setItem(key, seen);
    const request = indexedDB.open('derivative-studio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('state');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction('state', 'readwrite');
      tx.objectStore('state').put(saved, 'current');
      tx.oncomplete = () => { database.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
  }), { saved: { version: 1, progress }, key: KEY, seen });
}
const seen = (page: Page) => page.evaluate((key) => localStorage.getItem(key), KEY);
const dialog = (page: Page) => page.locator('dialog.whats-new');

test('a first visit shows no notes and records the current version', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Start practicing/ })).toBeVisible();
  await expect(page.locator('#dialog')).toHaveCount(0);
  expect(await seen(page)).toBe(LATEST);
});

test('a returning learner sees every unread note once', async ({ page }) => {
  await seedReturning(page);
  await page.goto('/');
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByRole('heading', { level: 2 })).toHaveText('What’s new');
  await expect(dialog(page).locator('.whats-new-entry')).toHaveCount(WHATS_NEW.length);
  await expect(dialog(page).locator('.whats-new-entry').first()).toContainText(`Version ${LATEST}`);
  expect(await seen(page)).toBe(LATEST);
  await dialog(page).getByRole('button', { name: 'Got it' }).click();
  await expect(page.locator('#dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: /Continue practicing/ })).toBeVisible();
  await expect(page.locator('#dialog')).toHaveCount(0);
});

test('only notes newer than the last one read are listed, and Escape closes them', async ({ page }) => {
  await seedReturning(page, WHATS_NEW[1].version);
  await page.goto('/');
  await expect(dialog(page).locator('.whats-new-entry')).toHaveCount(1);
  await expect(dialog(page)).toContainText(WHATS_NEW[0].title);
  await expect(dialog(page)).not.toContainText(WHATS_NEW[1].title);
  await page.keyboard.press('Escape');
  await expect(page.locator('#dialog')).toHaveCount(0);
});

test('a progress link on a device with progress shows the import step, not the notes', async ({ page }) => {
  await seedReturning(page);
  const now = Date.now();
  const other = freshProgress(config, now);
  other.streak = 7;
  const url = new URL(splitIntoQrFrames(encodeProgress(makePortableProgress(other, now)))[0]);
  await page.goto(url.pathname + url.hash);
  await expect(page.locator('#confirm-import')).toBeVisible();
  await expect(dialog(page)).toHaveCount(0);
  expect(await seen(page)).toBeNull();
});

test('practice still opens when browser storage for the notes is blocked', async ({ page }) => {
  await seedReturning(page);
  await page.addInitScript(() => {
    const blocked = () => { throw new DOMException('Blocked', 'SecurityError'); };
    Storage.prototype.getItem = blocked;
    Storage.prototype.setItem = blocked;
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Continue practicing/ })).toBeVisible();
  await expect(page.locator('#dialog')).toHaveCount(0);
});

test('the footer shows the version, reopens all notes, and returns focus to the answer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start practicing/ }).click();
  // MathLive finishes its own initial focus 60 ms later; a real click never lands inside that window.
  await expect(page.locator('math-field').first()).toBeFocused();
  const footer = page.getByRole('button', { name: `What’s new · v${LATEST}` });
  await footer.click();
  await expect(dialog(page).locator('.whats-new-entry')).toHaveCount(WHATS_NEW.length);
  await dialog(page).getByRole('button', { name: 'Got it' }).click();
  await expect(page.locator('#dialog')).toHaveCount(0);
  await expect(page.locator('math-field').first()).toBeFocused();
});

test('the read marker stays out of saved progress and exports', async ({ page }) => {
  await seedReturning(page, LATEST);
  await page.goto('/');
  await page.getByRole('button', { name: 'Move progress' }).click();
  await page.getByRole('button', { name: 'Export progress' }).click();
  const code = await page.locator('#export-code').inputValue();
  const exported = JSON.stringify(decodeProgress(code));
  const stored = await page.evaluate(() => new Promise<string>((resolve) => {
    const r = indexedDB.open('derivative-studio', 1);
    r.onsuccess = () => {
      const g = r.result.transaction('state').objectStore('state').get('current');
      g.onsuccess = () => { resolve(JSON.stringify(g.result)); r.result.close(); };
    };
  }));
  for (const text of [exported, stored]) {
    expect(text).not.toContain('whatsNew');
    expect(text).not.toContain(LATEST);
  }
});
