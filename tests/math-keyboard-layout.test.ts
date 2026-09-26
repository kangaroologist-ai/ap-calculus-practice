import { describe, expect, it } from 'vitest';
import { SKILLS } from '../src/catalog';
import { KEYBOARD_COLUMNS, layoutsFor, MATH_KEYS } from '../src/math-keyboard';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Expr } from '../src/types';

const LAYOUT_CASES = [
  { vars: ['x'], variable: 'x', second: 'pi' },
  { vars: ['t'], variable: 't', second: 'pi' },
  { vars: ['theta'], variable: 'theta', second: 'pi' },
  { vars: ['x', 'y'], variable: 'x', second: 'y' },
] as const;

const EXPECTED_KEY_TOOLTIPS: Record<string, string> = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  x: 'x',
  y: 'y',
  t: 't',
  plus: 'plus',
  minus: 'minus',
  multiply: 'times',
  open: 'left parenthesis',
  close: 'right parenthesis',
  decimal: 'decimal point',
  fraction: 'fraction',
  power: 'power',
  sqrt: 'square root',
  cbrt: 'cube root',
  exponential: 'e to the power',
  sin: 'sine',
  cos: 'cosine',
  tan: 'tangent',
  sec: 'secant',
  csc: 'cosecant',
  cot: 'cotangent',
  ln: 'natural log',
  log: 'log base',
  arcsin: 'inverse sine',
  arccos: 'inverse cosine',
  arctan: 'inverse tangent',
  theta: 'theta',
  pi: 'pi',
};

const EXPECTED_ACTION_TOOLTIPS: Record<string, string> = {
  '[left]': 'move left',
  '[right]': 'move right',
  '[hide-keyboard]': 'hide keyboard',
  '[backspace]': 'delete',
};

const KEY_ID_COMMANDS_ALLOWED_ON_BOTH_PAGES = new Set(['x', 'y', 't', 'theta', 'pi']);
const ALLOWED_SHARED_COMMANDS = new Set(
  MATH_KEYS.filter((key) => KEY_ID_COMMANDS_ALLOWED_ON_BOTH_PAGES.has(key.id)).map((key) =>
    JSON.stringify(key.command),
  ),
);

function keyId(keycap: { class?: string }): string | undefined {
  return keycap.class?.match(/(?:^|\s)practice-key-([^\s]+)/)?.[1];
}

function positionsOf(layout: ReturnType<typeof layoutsFor>[number], id: string) {
  const positions: Array<{ row: number; column: number; width: number }> = [];
  layout.rows.forEach((row, rowIndex) => {
    let column = 1;
    row.forEach((keycap) => {
      if (keyId(keycap) === id) positions.push({ row: rowIndex + 1, column, width: keycap.width });
      column += keycap.width;
    });
  });
  return positions;
}

function expectKeyAt(
  layout: ReturnType<typeof layoutsFor>[number],
  id: string,
  row: number,
  column: number,
  width = 1,
): void {
  expect(positionsOf(layout, id), `${id} position`).toEqual([{ row, column, width }]);
}

describe.each(LAYOUT_CASES)('math keyboard for $vars', ({ vars, variable, second }) => {
  const layouts = layoutsFor([...vars]);

  it('has Main and More pages with four rows of nine columns', () => {
    expect(layouts.map((layout) => layout.label)).toEqual(['Main', 'More']);
    layouts.forEach((layout) => {
      expect(layout.rows).toHaveLength(4);
      layout.rows.forEach((row, rowIndex) => {
        expect(
          row.reduce((sum, keycap) => sum + keycap.width, 0),
          `${layout.label} row ${rowIndex + 1}`,
        ).toBe(KEYBOARD_COLUMNS);
      });
    });
  });

  it('aligns the calculator number block and operator column', () => {
    const [main] = layouts;
    for (const [id, row, column] of [
      ['7', 1, 4],
      ['8', 1, 5],
      ['9', 1, 6],
      ['4', 2, 4],
      ['5', 2, 5],
      ['6', 2, 6],
      ['1', 3, 4],
      ['2', 3, 5],
      ['3', 3, 6],
    ] as const) {
      expectKeyAt(main, id, row, column);
    }
    expectKeyAt(main, '0', 4, 4, 2);
    expectKeyAt(main, 'decimal', 4, 6);
    for (const [id, row] of [
      ['fraction', 1],
      ['multiply', 2],
      ['minus', 3],
      ['plus', 4],
    ] as const) {
      expectKeyAt(main, id, row, 7);
    }
  });

  it('keeps navigation keys in the same row, columns, and widths on both pages', () => {
    const [main, more] = layouts;
    for (const label of ['[left]', '[right]', '[backspace]', '[hide-keyboard]']) {
      const locate = (layout: typeof main) => {
        const locations: Array<{ row: number; column: number; width: number }> = [];
        layout.rows.forEach((row, rowIndex) => {
          let column = 1;
          row.forEach((keycap) => {
            if (keycap.label === label) locations.push({ row: rowIndex + 1, column, width: keycap.width });
            column += keycap.width;
          });
        });
        return locations;
      };
      expect(locate(main), `${label} on Main`).toHaveLength(1);
      expect(locate(main), `${label} on Main`).toEqual(locate(more));
    }
  });

  it('does not repeat commands across pages except variable and constant keys', () => {
    const [main, more] = layouts;
    const commandsOn = (layout: typeof main) =>
      new Set(
        layout.rows.flatMap((row) =>
          row.flatMap((keycap) => (keycap.command === undefined ? [] : [JSON.stringify(keycap.command)])),
        ),
      );
    const mainCommands = commandsOn(main);
    const moreCommands = commandsOn(more);
    const shared = [...mainCommands].filter((command) => moreCommands.has(command));
    expect(shared.filter((command) => !ALLOWED_SHARED_COMMANDS.has(command))).toEqual([]);
  });

  it('uses only supported widths and marks every width-three key with w30', () => {
    const allowedWidths = new Set([1, 2, 3, 5]);
    layouts.forEach((layout) =>
      layout.rows.flat().forEach((keycap) => {
        expect(allowedWidths.has(keycap.width), `${layout.label} width ${keycap.width}`).toBe(true);
        if (keycap.width === 3) expect(keycap.class ?? '').toMatch(/(?:^|\s)w30(?:\s|$)/);
      }),
    );
  });

  it('puts the question variable and second variable or pi in their slots', () => {
    const [main] = layouts;
    expectKeyAt(main, variable, 3, 3);
    expectKeyAt(main, second, 4, 3);
  });
});

it('gives every keycap its expected spoken-name tooltip', () => {
  const keycaps = LAYOUT_CASES.flatMap(({ vars }) =>
    layoutsFor([...vars]).flatMap((layout) => layout.rows.flat()),
  );
  keycaps.forEach((keycap) => {
    // A spacer is not a key: it is not focusable and has no command, so it has no name.
    if (keycap.label === '[separator]') {
      expect(keycap.command).toBeUndefined();
      return;
    }
    const tooltip = keycap.tooltip ?? '';
    expect(tooltip.trim(), `${keycap.label ?? keyId(keycap) ?? 'unnamed keycap'} tooltip`).not.toBe('');
    expect(tooltip).not.toMatch(/^Type/);

    const id = keyId(keycap);
    if (id) {
      expect(tooltip, `${id} tooltip`).toBe(EXPECTED_KEY_TOOLTIPS[id]);
    } else if (keycap.label && keycap.label in EXPECTED_ACTION_TOOLTIPS) {
      expect(tooltip, `${keycap.label} tooltip`).toBe(EXPECTED_ACTION_TOOLTIPS[keycap.label]);
    }
  });
});

const ANSWER_HEAD_TO_KEY_ID: Record<string, string> = {
  Add: 'plus',
  Negate: 'minus',
  Subtract: 'minus',
  Multiply: 'multiply',
  Divide: 'fraction',
  Power: 'power',
  Sqrt: 'sqrt',
  Exp: 'exponential',
  Sin: 'sin',
  Cos: 'cos',
  Tan: 'tan',
  Sec: 'sec',
  Csc: 'csc',
  Cot: 'cot',
  Ln: 'ln',
  Rational: 'fraction',
};

function collectAnswerHeads(expr: Expr, visit: (head: string, keyId: string | undefined) => void): void {
  if (!Array.isArray(expr)) return;
  const head = expr[0];
  const key = head === 'Power' && expr[1] === 'ExponentialE'
    ? 'exponential'
    : ANSWER_HEAD_TO_KEY_ID[head];
  visit(head, key);
  expr.slice(1).forEach((part) => collectAnswerHeads(part, visit));
}

it('can enter every answer operator head from the question Main page', () => {
  const seedsPerTemplate = 10;
  for (const skill of SKILLS) {
    TEMPLATES[skill.id].forEach((template, templateIndex) => {
      for (let seedIndex = 0; seedIndex < seedsPerTemplate; seedIndex += 1) {
        const seed = `${skill.id}:template-${templateIndex}:seed-${String(seedIndex).padStart(3, '0')}`;
        const question = generateQuestion(skill.id, seed, {
          key: template.key,
          role: template.role,
          ok: () => true,
        });
        const vars = question.domain.curve ? ['x', 'y'] : [question.domain.variable];
        const [main] = layoutsFor(vars);
        const mainKeyIds = new Set(main.rows.flatMap((row) => row.map(keyId).filter((id): id is string => id !== undefined)));

        question.answers.forEach((answer) =>
          collectAnswerHeads(answer, (head, key) => {
            expect(key, `Unmapped MathJSON head "${head}" in ${question.id}`).toBeDefined();
            if (key) {
              expect(mainKeyIds, `MathJSON head "${head}" maps to unavailable Main key "${key}" in ${question.id}`).toContain(key);
            }
          }),
        );
      }
    });
  }
});
