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

