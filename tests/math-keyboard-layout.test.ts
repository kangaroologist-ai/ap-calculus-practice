import { describe, expect, it } from 'vitest';
import { SKILLS } from '../src/catalog';
import { altFor, KEYBOARD_COLUMNS, layoutsFor, MATH_KEYS } from '../src/math-keyboard';
import { generateQuestion } from '../src/questions';
import { TEMPLATES } from '../src/templates';
import type { Expr } from '../src/types';

const LAYOUT_CASES = [
  { vars: ['x'], variable: 'x', latex: 'x' },
  { vars: ['t'], variable: 't', latex: 't' },
  { vars: ['theta'], variable: 'theta', latex: '\\theta' },
  { vars: ['x', 'y'], variable: 'x', latex: 'x' },
] as const;

const EXPECTED_PRIMARY_TOOLTIPS: Record<string, string> = {
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
  z: 'z',
  u: 'u',
  v: 'v',
  w: 'w',
  r: 'r',
  s: 's',
  t: 't',
  theta: 'theta',
  plus: 'plus',
  minus: 'minus',
  multiply: 'times',
  open: 'left parenthesis',
  close: 'right parenthesis',
  decimal: 'decimal point',
  fraction: 'fraction',
  power: 'power',
  sqrt: 'square root',
  exponential: 'e to the power',
  sin: 'sine',
  cos: 'cosine',
  tan: 'tangent',
  sec: 'secant',
  csc: 'cosecant',
  cot: 'cotangent',
  ln: 'natural log',
};

const EXPECTED_ALT_TOOLTIPS: Record<string, string> = {
  '0': 'theta',
  '1': 'r',
  '2': 's',
  '3': 't',
  '4': 'u',
  '5': 'v',
  '6': 'w',
  '7': 'x',
  '8': 'y',
  '9': 'z',
  decimal: 'pi',
  exponential: 'e',
  fraction: 'divide',
  ln: 'log base',
  open: 'absolute value',
  power: 'to the power',
  sec: 'secant squared',
  csc: 'cosecant squared',
  cot: 'cotangent squared',
  sin: 'inverse sine',
  cos: 'inverse cosine',
  tan: 'inverse tangent',
  sqrt: 'square root of',
};

const EXPECTED_ACTION_TOOLTIPS: Record<string, string> = {
  left: 'move left',
  right: 'move right',
  backspace: 'delete',
  check: 'check answer',
};

function keyId(keycap: { class?: string }): string | undefined {
  return keycap.class?.match(/(?:^|\s)practice-key-([^\s]+)/)?.[1];
}

function shiftObject(keycap: { shift?: string | Partial<import('mathlive').VirtualKeyboardKeycap> }) {
  return typeof keycap.shift === 'object' && keycap.shift !== null ? keycap.shift : undefined;
}

function keyAt(layout: ReturnType<typeof layoutsFor>[number], rowNumber: number, columnNumber: number) {
  let column = 1;
  for (const keycap of layout.rows[rowNumber - 1]) {
    if (columnNumber >= column && columnNumber < column + keycap.width) return keycap;
    column += keycap.width;
  }
  throw new Error(`No key at row ${rowNumber}, column ${columnNumber}`);
}

function mathKeycaps(layout: ReturnType<typeof layoutsFor>[number]) {
  const mathIds = new Set(MATH_KEYS.map(key => key.id));
  return layout.rows.flat().filter(keycap => {
    const id = keyId(keycap);
    return id !== undefined && mathIds.has(id);
  });
}

const EXPECTED_POSITIONS: Array<Array<{ id: string; width?: number }>> = [
  [
    { id: 'sin' }, { id: 'cos' }, { id: 'tan' }, { id: '7' }, { id: '8' }, { id: '9' },
    { id: 'fraction' }, { id: 'variable' }, { id: 'shift' },
  ],
  [
    { id: 'sec' }, { id: 'csc' }, { id: 'cot' }, { id: '4' }, { id: '5' }, { id: '6' },
    { id: 'multiply' }, { id: 'power' }, { id: 'sqrt' },
  ],
  [
    { id: 'open' }, { id: 'close' }, { id: 'exponential' }, { id: '1' }, { id: '2' },
    { id: '3' }, { id: 'minus' }, { id: 'backspace', width: 2 },
  ],
  [
    { id: 'left' }, { id: 'right' }, { id: 'ln' }, { id: '0', width: 2 },
    { id: 'decimal' }, { id: 'plus' }, { id: 'check', width: 2 },
  ],
];

const expectedInsert = (latex: string, selectionMode: 'after' | 'placeholder' = 'placeholder') => [
  'insert', latex, { focus: true, mode: 'math', format: 'latex', selectionMode },
];
const expectedTyped = (text: string) => [
  'typedText', text, { focus: true, feedback: true, simulateKeystroke: true },
];

function variableLatex(variable: string): string {
  return variable === 'theta' ? '\\theta' : variable;
}

function expectedAltCommand(id: string, variable: string, latex: string) {
  if (id === 'sin') return MATH_KEYS.find(key => key.id === 'arcsin')?.command;
  if (id === 'cos') return MATH_KEYS.find(key => key.id === 'arccos')?.command;
  if (id === 'tan') return MATH_KEYS.find(key => key.id === 'arctan')?.command;
  if (id === 'sec' || id === 'csc' || id === 'cot') return expectedInsert(latex, 'after');
  if (id === 'fraction') return expectedInsert('\\div', 'after');
  if (id === 'power') return expectedInsert(`${variableLatex(variable)}^{#?}`);
  if (id === 'sqrt') return expectedInsert(`\\sqrt{${variableLatex(variable)}}`, 'after');
  if (id === 'open') return expectedInsert('\\left|#?\\right|');
  if (id === 'exponential') return expectedTyped('e');
  if (id === 'ln') return expectedInsert('\\log_{#?}');
  if (id === '0') return MATH_KEYS.find(key => key.id === 'theta')?.command;
  if (id === 'decimal') return MATH_KEYS.find(key => key.id === 'pi')?.command;
  return expectedTyped(latex);
}

describe.each(LAYOUT_CASES)('math keyboard for $vars', ({ vars, variable, latex: variableFace }) => {
  const layouts = layoutsFor([...vars]);

  it('provides one edit-toolbar layout with four rows of nine units', () => {
    expect(layouts).toHaveLength(1);
    expect(layouts[0].displayEditToolbar).toBe(true);
    expect(layouts[0].label).toBeUndefined();
    const [layout] = layouts;
    expect(layout.rows).toHaveLength(4);
    layout.rows.forEach((row, rowIndex) => {
      expect(row.reduce((sum, keycap) => sum + keycap.width, 0), `row ${rowIndex + 1}`).toBe(KEYBOARD_COLUMNS);
    });
  });

  it('places every primary key and width at the specified grid position', () => {
    const [layout] = layouts;
    EXPECTED_POSITIONS.forEach((row, rowIndex) => {
      let column = 1;
      row.forEach(({ id, width = 1 }) => {
        const keycap = keyAt(layout, rowIndex + 1, column);
        if (id === 'shift') {
          expect(keycap.class?.split(/\s+/)).toContain('shift');
        } else if (id === 'variable') {
          expect(keyId(keycap)).toBe(variable);
          expect(keycap.latex).toBe(variableFace);
        } else {
          expect(keyId(keycap)).toBe(id);
        }
        expect(keycap.width).toBe(width);
        column += width;
      });
    });
  });

  it('uses a KaTeX LaTeX face and the existing primary command for every math key', () => {
    const [layout] = layouts;
    mathKeycaps(layout).forEach(keycap => {
      const id = keyId(keycap)!;
      expect(keycap.latex, `${id} face`).toBeDefined();
      expect(keycap.label, `${id} should render through LaTeX`).toBeUndefined();
      expect(keycap.command, `${id} primary command`).toEqual(MATH_KEYS.find(key => key.id === id)?.command);
      expect(keycap.tooltip, `${id} spoken name`).toBe(EXPECTED_PRIMARY_TOOLTIPS[id]);
    });
    expect(keyAt(layout, 2, 7).latex).toBe('\\cdot');
    expect(keyAt(layout, 3, 7).latex).toBe('-');
    expect(keyAt(layout, 1, 7).latex).toBe('\\frac{\\placeholder{}}{\\placeholder{}}');
    expect(keyAt(layout, 2, 8).latex).toBe('\\placeholder{}^{\\placeholder{}}');
    expect(keyAt(layout, 2, 9).latex).toBe('\\sqrt{\\placeholder{}}');
    expect(keyAt(layout, 3, 1).latex).toBe('(');
    expect(keyAt(layout, 3, 3).latex).toBe('e^{\\placeholder{}}');
    expect(keyAt(layout, 4, 3).latex).toBe('\\ln');
  });

  it('gives every alternate its face, insertion command, class, and spoken name', () => {
    const [layout] = layouts;
    mathKeycaps(layout).forEach(keycap => {
      const id = keyId(keycap)!;
      const alternate = altFor(id, [...vars]);
      if (!alternate) {
        expect(keycap.shift, `${id} should not have an alternate`).toBeUndefined();
        expect(keycap.class?.split(/\s+/)).not.toContain('practice-has-alt');
        return;
      }

      expect(keycap.class?.split(/\s+/)).toContain('practice-has-alt');
      const shift = shiftObject(keycap)!;
      expect(shift).toMatchObject({
        latex: alternate.latex,
        command: expectedAltCommand(id, variable, alternate.latex),
        class: expect.stringContaining(`practice-key-${id}`),
        tooltip: id === 'power'
          ? `${variable} ${EXPECTED_ALT_TOOLTIPS[id]}`
          : id === 'sqrt'
            ? `${EXPECTED_ALT_TOOLTIPS[id]} ${variable}`
            : EXPECTED_ALT_TOOLTIPS[id],
      });
      expect(shift.class?.split(/\s+/)).toContain('practice-has-alt');
      expect(shift.class?.split(/\s+/)).toContain('practice-alt-on');
      expect(shift.label).toBeUndefined();
    });
    expect(altFor('power', [...vars])?.latex).toBe(`${variableFace}^{\\placeholder{}}`);
    expect(altFor('sqrt', [...vars])?.latex).toBe(`\\sqrt{${variableFace}}`);
    expect(altFor('unknown', [...vars])).toBeUndefined();
  });

  it('keeps navigation and Check unchanged when Shift is active', () => {
    const [layout] = layouts;
    for (const [row, column] of [[4, 1], [4, 2], [3, 8], [4, 8]] as const) {
      const keycap = keyAt(layout, row, column);
      expect(keycap.class?.split(/\s+/)).toContain('hide-shift');
      expect(shiftObject(keycap)).toMatchObject({
        label: keycap.label,
        command: keycap.command,
        class: keycap.class,
        tooltip: keycap.tooltip,
      });
    }
    const [shift] = layout.rows[0].slice(-1);
    expect(shift.class?.split(/\s+/)).toContain('shift');
    expect(shift.tooltip).toBe('shift');
    expect(shift.label).toContain('practice-shift-off');
    expect(shift.label).toContain('practice-shift-on');
    expect(shift.label).toContain('practice-shift-lock');
    expect(shift.label?.match(/aria-hidden="true"/g)).toHaveLength(3);
  });

  // Variables are the one allowed repeat: the question's variable has its own key and
  // the same letter is also a digit alt, so every letter sits in the same place in any question.
  const VARIABLE_COMMANDS = new Set(
    MATH_KEYS.filter(item => /^[a-z]$|^theta$/.test(item.id)).map(item => JSON.stringify(item.command)),
  );

  it('does not repeat a math command among primaries and alternates, except variables', () => {
    const commands = new Set<string>();
    mathKeycaps(layouts[0]).forEach(keycap => {
      for (const command of [keycap.command, shiftObject(keycap)?.command]) {
        if (command === undefined || VARIABLE_COMMANDS.has(JSON.stringify(command))) continue;
        const serialized = JSON.stringify(command);
        expect(commands.has(serialized), `duplicate command ${serialized}`).toBe(false);
        commands.add(serialized);
      }
    });
  });

  it('keeps the Check key behavior and action names', () => {
    const [layout] = layouts;
    const check = keyAt(layout, 4, 8);
    expect(check.label).toBe('Check');
    expect(check.class?.split(/\s+/)).toContain('action');
    expect(check.tooltip).toBe(EXPECTED_ACTION_TOOLTIPS.check);
    expect(check.command).toEqual(['insert', '', { insertionMode: 'insertAfter' }]);
    expect(check.width).toBe(2);
    expect(check.insert).toBeUndefined();
    expect(check.key).toBeUndefined();
    expect(check.latex).toBeUndefined();

    for (const [row, column, id] of [[4, 1, 'left'], [4, 2, 'right'], [3, 8, 'backspace']] as const) {
      const action = keyAt(layout, row, column);
      expect(keyId(action)).toBe(id);
      expect(action.tooltip).toBe(EXPECTED_ACTION_TOOLTIPS[id]);
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
  expr.slice(1).forEach(part => collectAnswerHeads(part, visit));
}

it('can enter every answer operator head using a primary or alternate key', () => {
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
        const [layout] = layoutsFor(vars);
        const availableKeyIds = new Set(layout.rows.flatMap(row => row.flatMap(keycap => {
          const id = keyId(keycap);
          if (!id || !MATH_KEYS.some(key => key.id === id)) return [];
          return [id, ...(shiftObject(keycap)?.command === undefined ? [] : [id])];
        })));

        question.answers.forEach(answer =>
          collectAnswerHeads(answer, (head, id) => {
            expect(id, `Unmapped MathJSON head "${head}" in ${question.id}`).toBeDefined();
            if (id) {
              expect(availableKeyIds, `MathJSON head "${head}" has no keyboard key in ${question.id}`).toContain(id);
            }
          }),
        );
      }
    });
  }
});
