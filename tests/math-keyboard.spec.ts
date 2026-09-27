import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MATH_KEYS } from '../src/math-keyboard';

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mathLiveScript = path.join(repoDir, 'node_modules/mathlive/mathlive.js');

type MathState = {
  value: string;
  latex: string;
  selection: number[][];
  position: number;
  lastOffset: number;
};

async function installMathLive(page: Page): Promise<void> {
  await page.setContent('<math-field id="mf"></math-field>');
  await page.addScriptTag({ path: mathLiveScript });
  await page.waitForFunction(() => customElements.get('math-field'));
}

async function freshMathfield(
  page: Page,
  value: string,
  selectAll = false,
): Promise<void> {
  // Replacing the element clears MathLive's private inline-shortcut buffer.
  // Reusing a field after typing `sin` would make a following one-character
  // operation observe stale buffer state and produce a false comparison.
  await page.evaluate(({ value: nextValue, selectAll: shouldSelectAll }) => {
    const old = document.querySelector('#mf');
    if (!old) throw new Error('MathLive field is missing.');
    // Complete MathLive's blur lifecycle before disposing the old editor.
    (old as HTMLElement).blur();
    const field = document.createElement('math-field') as HTMLElement & {
      value: string;
      lastOffset: number;
      position: number;
      selection: [number, number];
    };
    field.id = 'mf';
    old.replaceWith(field);
    field.value = nextValue;
    if (shouldSelectAll && nextValue) field.selection = [0, field.lastOffset];
    else field.position = field.lastOffset;
    field.focus();
  }, { value, selectAll });
}

async function state(page: Page): Promise<MathState> {
  return page.locator('#mf').evaluate((element) => {
    const field = element as HTMLElement & {
      value: string;
      getValue(format: 'latex'): string;
      selection: { ranges: number[][] };
      position: number;
      lastOffset: number;
    };
    return {
      value: field.value,
      latex: field.getValue('latex'),
      selection: field.selection.ranges,
      position: field.position,
      lastOffset: field.lastOffset,
    };
  });
}

async function physical(page: Page, text: string): Promise<MathState> {
  await page.locator('#mf').focus();
  await page.keyboard.type(text);
  return state(page);
}

async function execute(page: Page, command: unknown): Promise<MathState> {
  await page.locator('#mf').evaluate((element, commandValue) => {
    const field = element as HTMLElement & {
      executeCommand(commandToRun: unknown): boolean;
    };
    field.executeCommand(commandValue);
  }, command);
  return state(page);
}

async function append(page: Page, text = 'z'): Promise<MathState> {
  return physical(page, text);
}

async function openPracticeKeyboard(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /Start practicing|Continue practicing/ }).click();
  const field = page.locator('math-field').first();
  await field.waitFor({ state: 'visible' });
  await field.focus();
  await page.evaluate(() => window.mathVirtualKeyboard.show());
  await expect.poll(() => page.evaluate(() => window.mathVirtualKeyboard.visible)).toBe(true);
}

function appKeyboardKey(page: Page, id: string) {
  const keyClass = id === 'shift' ? 'practice-shift' : `practice-key-${id}`;
  return page.locator(`.ML__keyboard .MLK__layer.is-visible .${keyClass}`);
}

async function pointerPressKey(
  page: Page,
  id: string,
  holdMs = 60,
  moveBy?: { x: number; y: number },
): Promise<void> {
  const key = appKeyboardKey(page, id);
  await expect(key).toBeVisible();
  const box = await key.boundingBox();
  if (!box) throw new Error(`Math keyboard key ${id} has no visible box.`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  try {
    await page.waitForTimeout(holdMs);
    if (moveBy) await page.mouse.move(x + moveBy.x, y + moveBy.y, { steps: 5 });
  } finally {
    await page.mouse.up();
  }
  await page.waitForTimeout(180);
}

async function valueOf(page: Page): Promise<string> {
  return page.locator('math-field').first().evaluate((element) =>
    (element as HTMLElement & { value: string }).value,
  );
}

async function setValue(page: Page, value: string): Promise<void> {
  await page.locator('math-field').first().evaluate((element, nextValue) => {
    const field = element as HTMLElement & { value: string; position: number; lastOffset: number };
    field.value = nextValue as string;
    field.position = field.lastOffset;
  }, value);
}

async function shiftPressCount(page: Page): Promise<number> {
  return page.evaluate(() =>
    (window.mathVirtualKeyboard as typeof window.mathVirtualKeyboard & { shiftPressCount: number })
      .shiftPressCount,
  );
}

test('custom math keys match physical input in every editing context', async ({ page }) => {
  // This single matrix exercises 333 cases (including continuation), not one interaction.
  // CI runners need a larger total budget; per-action and assertion limits stay unchanged.
  test.setTimeout(120_000);
  await installMathLive(page);
  const initials = ['', 'x', 'x+1', '(x+1)', '\\sin(x)'];

  for (const key of MATH_KEYS) {
    for (const initial of initials) {
      for (const selectAll of [false, true]) {
        if (selectAll && !initial) continue;

        await freshMathfield(page, initial, selectAll);
        const physicalState = await physical(page, key.physical);
        const physicalAfterAppend = await append(page);

        await freshMathfield(page, initial, selectAll);
        const commandState = await execute(page, key.command);
        const commandAfterAppend = await append(page);

        expect(commandState, `${key.id} on ${JSON.stringify(initial)} selection=${selectAll}`).toEqual(physicalState);
        expect(commandAfterAppend, `${key.id} append on ${JSON.stringify(initial)} selection=${selectAll}`).toEqual(physicalAfterAppend);
      }
    }
  }
});

test('digit entry preserves smart superscript exit', async ({ page }) => {
  await installMathLive(page);

  await freshMathfield(page, 'x^{}');
  await page.locator('#mf').evaluate((element) => {
    (element as HTMLElement & { position: number }).position = 2;
  });
  const physicalState = await physical(page, '2');
  const physicalAfterAppend = await append(page, 'y');

  await freshMathfield(page, 'x^{}');
  await page.locator('#mf').evaluate((element) => {
    (element as HTMLElement & { position: number }).position = 2;
  });
  const commandState = await execute(page, MATH_KEYS.find((key) => key.id === '2')?.command);
  const commandAfterAppend = await append(page, 'y');

  expect(commandState).toEqual(physicalState);
  expect(commandAfterAppend).toEqual(physicalAfterAppend);
});

test('MathLive 0.110 shiftPressCount setter re-renders keycaps for the long-press bridge', async ({ page }) => {
  await openPracticeKeyboard(page);
  const result = await page.evaluate(() => {
    const keyboard = window.mathVirtualKeyboard as typeof window.mathVirtualKeyboard & {
      shiftPressCount: number;
      _shiftPressCount?: number;
    };
    const key = document.querySelector<HTMLElement>(
      '.ML__keyboard .MLK__layer.is-visible .practice-key-9',
    );
    if (!key) throw new Error('Could not find the 9 keycap for the MathLive upgrade guard.');
    if (!('_shiftPressCount' in keyboard)) return { hasInternalField: false };

    keyboard.shiftPressCount = 0;
    const primaryFace = key.innerHTML;
    keyboard.shiftPressCount = 1;
    const shiftedFace = key.innerHTML;
    const shiftedTooltip = key.dataset.tooltip;
    keyboard.shiftPressCount = 0;
    return { hasInternalField: true, primaryFace, shiftedFace, shiftedTooltip };
  });

  expect(
    result.hasInternalField,
    "MathLive upgrade guard: long press writes `_shiftPressCount`; re-review the bridge before upgrading MathLive.",
  ).toBe(true);
  if (!result.hasInternalField) return;
  expect(
    result.shiftedFace,
    'MathLive shiftPressCount must re-render the keycap face used by one-shot Shift and long press.',
  ).not.toBe(result.primaryFace);
  expect(result.shiftedTooltip).toBe('z');
  expect(await shiftPressCount(page)).toBe(0);
});

test('one-shot Shift, lock, and unlock use the lowercase alternate layer', async ({ page }) => {
  await openPracticeKeyboard(page);
  const shift = appKeyboardKey(page, 'shift');
  const keyboard = page.locator('.ML__keyboard');

  await pointerPressKey(page, 'shift');
  await expect(shift).toHaveAttribute('aria-pressed', 'true');
  await expect(appKeyboardKey(page, '7')).toHaveClass(/practice-alt-on/);
  const plusOpacity = await appKeyboardKey(page, 'plus').evaluate((key) => getComputedStyle(key).opacity);
  expect(plusOpacity).toBe('1');
  await pointerPressKey(page, '9');
  expect(await valueOf(page)).toBe('z');
  expect(await shiftPressCount(page)).toBe(0);
  await expect(shift).toHaveAttribute('aria-pressed', 'false');

  await setValue(page, '');
  await pointerPressKey(page, 'shift');
  await pointerPressKey(page, 'shift');
  await expect(keyboard).toHaveClass(/is-caps-lock/);
  await expect(shift).toHaveAttribute('aria-pressed', 'true');
  await pointerPressKey(page, '7');
  await pointerPressKey(page, '8');
  expect(await valueOf(page)).toBe('xy');
  expect(await shiftPressCount(page)).toBe(2);

  await pointerPressKey(page, 'shift');
  await expect(keyboard).not.toHaveClass(/is-caps-lock/);
  await expect(shift).toHaveAttribute('aria-pressed', 'false');
  expect(await shiftPressCount(page)).toBe(0);
});

test('long press inserts alts, cancels after moving away, and exposes its bubble', async ({ page }) => {
  await openPracticeKeyboard(page);

  await pointerPressKey(page, '7', 80);
  expect(await valueOf(page)).toBe('7');
  expect(await shiftPressCount(page)).toBe(0);

  await setValue(page, '');
  await pointerPressKey(page, '7', 600);
  expect(await valueOf(page)).toBe('x');
  expect(await shiftPressCount(page)).toBe(0);

  await setValue(page, '');
  await pointerPressKey(page, 'sin', 600);
  expect(await valueOf(page)).toBe('\\arcsin');
  expect(await shiftPressCount(page)).toBe(0);

  await setValue(page, '');
  await pointerPressKey(page, '7', 600, { x: 0, y: -120 });
  expect(await valueOf(page)).toBe('');
  expect(await shiftPressCount(page)).toBe(0);
  await pointerPressKey(page, '8', 80);
  expect(await valueOf(page)).toBe('8');
  expect(await shiftPressCount(page)).toBe(0);

  await setValue(page, '');
  await pointerPressKey(page, 'plus', 600);
  expect(await valueOf(page)).toBe('+');
  expect(await shiftPressCount(page)).toBe(0);
  await expect(page.locator('.practice-alt-bubble')).toHaveCount(0);

  await setValue(page, '');
  const sin = appKeyboardKey(page, 'sin');
  const box = await sin.boundingBox();
  if (!box) throw new Error('The sin key has no visible box for the bubble assertion.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  try {
    await page.waitForTimeout(600);
    await expect(page.locator('.practice-alt-bubble')).toBeVisible();
  } finally {
    await page.mouse.up();
  }
  await expect(page.locator('.practice-alt-bubble')).toHaveCount(0);
  expect(await valueOf(page)).toBe('\\arcsin');
  expect(await shiftPressCount(page)).toBe(0);
});

test('Shift leaves delete, cursor-left, and Check actions unchanged', async ({ page }) => {
  await openPracticeKeyboard(page);
  const field = page.locator('math-field').first();

  await setValue(page, 'x+1');
  await pointerPressKey(page, 'shift');
  await pointerPressKey(page, 'backspace');
  expect(await valueOf(page)).toBe('x+');
  expect(await shiftPressCount(page)).toBe(0);

  await setValue(page, 'x+1');
  const beforePosition = await field.evaluate((element) =>
    (element as HTMLElement & { position: number }).position,
  );
  await pointerPressKey(page, 'shift');
  await pointerPressKey(page, 'left');
  expect(await valueOf(page)).toBe('x+1');
  const afterPosition = await field.evaluate((element) =>
    (element as HTMLElement & { position: number }).position,
  );
  expect(afterPosition).toBeLessThan(beforePosition);
  expect(await shiftPressCount(page)).toBe(0);

  await setValue(page, '');
  await pointerPressKey(page, 'shift');
  await pointerPressKey(page, 'check');
  await expect(page.locator('.answer-box')).toHaveAttribute('data-verdict', 'invalid');
  await expect(page.locator('#answer-message')).toContainText('Enter an answer first.');
  expect(await valueOf(page)).toBe('');
  expect(await shiftPressCount(page)).toBe(0);
  await expect(appKeyboardKey(page, 'shift')).toHaveAttribute('aria-pressed', 'false');
});

// Alts are never printed on keys (plan S3). MathLive hides its corner label only below
// 415 px, which a phone-only check missed (plan R18).
test('no key prints its alt at phone, tablet or desktop width', async ({ page }) => {
  await openPracticeKeyboard(page);
  for (const width of [390, 600, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const printed = await page.evaluate(() =>
      [...document.querySelectorAll('.ML__keyboard .MLK__layer.is-visible .MLK__shift')].filter(
        (label) => getComputedStyle(label).display !== 'none',
      ).length,
    );
    expect(printed, `alt labels printed on keys at ${width} px`).toBe(0);
  }
});
