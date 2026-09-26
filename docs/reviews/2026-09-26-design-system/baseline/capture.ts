// Baseline design-review capture for docs/reviews/2026-09-26-design-system.
// Run from the repo root: node --import tsx <this file>
import { webkit, chromium, devices, type Page, type Browser } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'docs/reviews/2026-09-26-design-system/baseline';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:5173/';
const geometry: Record<string, unknown> = {};

async function openPractice(page: Page) {
  await page.goto(BASE);
  await page.getByRole('button', { name: /Start practicing|Continue practicing/ }).click();
  await page.locator('math-field').first().waitFor();
  await page.waitForTimeout(600);
}

async function keyboardGeometry(page: Page, name: string) {
  geometry[name] = await page.evaluate(() => {
    const vw = innerWidth;
    const rows = [...document.querySelectorAll('.ML__keyboard .MLK__layer.is-visible .MLK__row')].map((row) =>
      [...row.querySelectorAll<HTMLElement>('.MLK__keycap, .action, .separator')]
        .filter((k) => k.getBoundingClientRect().width > 0)
        .map((k) => {
          const r = k.getBoundingClientRect();
          const svg = k.querySelector('svg');
          const s = svg?.getBoundingClientRect();
          return {
            label: (k.getAttribute('aria-label') ?? k.textContent ?? '').trim().slice(0, 16),
            x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height),
            iconOffsetX: s ? Math.round((s.left + s.width / 2) - (r.left + r.width / 2)) : undefined,
            iconOffsetY: s ? Math.round((s.top + s.height / 2) - (r.top + r.height / 2)) : undefined,
          };
        }));
    const plate = document.querySelector('.ML__keyboard .MLK__plate')?.getBoundingClientRect();
    return { viewport: vw, plate: plate && { x: Math.round(plate.left), w: Math.round(plate.width), h: Math.round(plate.height) }, rows };
  });
}

async function phone(browser: Browser, scheme: 'light' | 'dark') {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], colorScheme: scheme });
  const page = await ctx.newPage();
  const shot = (n: string, full = false) => page.screenshot({ path: `${OUT}/390-${scheme}-${n}.png`, fullPage: full });
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await shot('01-welcome');
  await openPractice(page);
  await page.locator('math-field').first().blur();
  await page.evaluate(() => window.mathVirtualKeyboard.hide());
  await page.waitForTimeout(400);
  await shot('02-question');
  await page.getByRole('button', { name: 'Math keyboard' }).click();
  await page.locator('.ML__keyboard').waitFor();
  await page.waitForTimeout(600);
  await shot('03-keyboard-derivatives');
  await keyboardGeometry(page, `390-${scheme}-derivatives`);
  if (scheme === 'light') {
    // A tap leaves :hover on the key in mobile Safari; the tooltip appears after 1 s.
    await page.locator('.ML__keyboard .MLK__keycap.practice-key-plus:visible').first().hover();
    await page.waitForTimeout(1400);
    await shot('04-keyboard-tooltip');
  }
  await page.locator('.ML__keyboard .MLK__toolbar .MLK__toolbar-label, .ML__keyboard [data-layer]').filter({ hasText: 'Functions' }).first().click();
  await page.waitForTimeout(500);
  await shot('05-keyboard-functions');
  await keyboardGeometry(page, `390-${scheme}-functions`);
  await page.evaluate(() => window.mathVirtualKeyboard.hide());
  await page.waitForTimeout(400);
  if (scheme === 'light') {
    await page.locator('math-field').first().evaluate((el: any) => { el.value = '0'; });
    await page.getByRole('button', { name: 'Check answer' }).click();
    await page.locator('#feedback:not([hidden])').waitFor();
    await page.evaluate(() => window.mathVirtualKeyboard.hide());
    await page.waitForTimeout(500);
    await shot('06-feedback-wrong');
    await page.getByRole('button', { name: /Need a hint/ }).click();
    await page.waitForTimeout(400);
    await page.evaluate(() => window.mathVirtualKeyboard.hide());
    await shot('07-hint', true);
    await page.goto(BASE);
    await page.locator('.progress-summary').click();
    await page.waitForTimeout(400);
    await shot('08-path', true);
    await page.getByRole('button', { name: 'Move progress' }).click();
    await page.waitForTimeout(500);
    await shot('09-move-progress');
    await page.goto(BASE + 'help.html');
    await page.waitForTimeout(400);
    await shot('10-help');
  }
  await ctx.close();
}

async function desktop(browser: Browser, scheme: 'light' | 'dark') {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: scheme });
  const page = await ctx.newPage();
  const shot = (n: string) => page.screenshot({ path: `${OUT}/1280-${scheme}-${n}.png` });
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await shot('01-welcome');
  await openPractice(page);
  await shot('02-question');
  await page.getByRole('button', { name: 'Math keyboard' }).click();
  await page.locator('.ML__keyboard').waitFor();
  await page.waitForTimeout(600);
  await shot('03-keyboard-derivatives');
  await keyboardGeometry(page, `1280-${scheme}-derivatives`);
  await ctx.close();
}

const wk = await webkit.launch();
for (const s of ['light', 'dark'] as const) await phone(wk, s);
await wk.close();
const cr = await chromium.launch();
for (const s of ['light', 'dark'] as const) await desktop(cr, s);
await cr.close();
writeFileSync(`${OUT}/keyboard-geometry.json`, JSON.stringify(geometry, null, 1));
console.log('done');
