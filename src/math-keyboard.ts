import type { VirtualKeyboardKeycap } from 'mathlive';

type Command = VirtualKeyboardKeycap['command'];
const typed = (text: string): Command => ['typedText', text, { focus: true, feedback: true, simulateKeystroke: true }];
const insert = (latex: string, selectionMode: 'after' | 'placeholder' = 'placeholder'): Command => ['insert', latex, { focus: true, mode: 'math', format: 'latex', selectionMode }];
// These are the same operations as MathLive's physical-key bindings/shortcuts.
// Do not pass a whole function name to typedText: MathLive 0.110 duplicates it.
export const MATH_KEYS = [
  ...'0123456789'.split('').map(text => ({ id: text, physical: text, latex: text, command: typed(text) })),
  ...['x', 't', 'y', 'z', 'u', 'v', 'w', 'r', 's'].map(text => ({ id: text, physical: text, latex: text, command: typed(text) })),
  { id: 'plus', physical: '+', latex: '+', command: typed('+') },
  { id: 'minus', physical: '-', latex: '-', command: typed('-') },
  { id: 'multiply', physical: '*', latex: '\\cdot', command: typed('*') },
  { id: 'decimal', physical: '.', latex: '.', command: typed('.') },
  { id: 'open', physical: '(', latex: '(', command: typed('(') },
  { id: 'close', physical: ')', latex: ')', command: typed(')') },
  { id: 'fraction', physical: '/', latex: '\\frac{\\placeholder{}}{\\placeholder{}}', command: insert('\\frac{#@}{#?}') },
  { id: 'power', physical: '^', latex: '\\placeholder{}^{\\placeholder{}}', command: 'moveToSuperscript' as Command },
  { id: 'sqrt', physical: 'sqrt', latex: '\\sqrt{\\placeholder{}}', command: insert('\\sqrt{#?}') },
  { id: 'exponential', physical: 'e^', latex: 'e^{\\placeholder{}}', command: typed('e^') },
  ...['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'ln', 'arcsin', 'arccos', 'arctan'].map(name => ({
    id: name,
    physical: name,
    latex: `\\${name}`,
    command: insert(`\\${name}`, 'after'),
  })),
  { id: 'log', physical: 'log', latex: '\\log_{\\placeholder{}}', command: insert('\\log_{#?}') },
  { id: 'theta', physical: 'theta', latex: '\\theta', command: insert('\\theta', 'after') },
  { id: 'pi', physical: 'pi', latex: '\\pi', command: insert('\\pi', 'after') },
];

export const KEYBOARD_COLUMNS = 9;
export type KeyboardKeycap = Omit<Partial<VirtualKeyboardKeycap>, 'width'> & { width: number };
export type KeyboardLayout = { label?: string; displayEditToolbar: boolean; rows: KeyboardKeycap[][] };

function questionVariable(vars: string[]): string {
  return vars.includes('y') ? 'x' : vars[0] ?? 'x';
}

function variableLatex(variable: string): string {
  return variable === 'theta' ? '\\theta' : variable;
}

export function altFor(id: string, vars: string[] = ['x']): { latex: string; spoken: string } | undefined {
  const variable = questionVariable(vars);
  const altLetters: Record<string, string> = {
    '7': 'x',
    '8': 'y',
    '9': 'z',
    '4': 'u',
    '5': 'v',
    '6': 'w',
    '1': 'r',
    '2': 's',
    '3': 't',
  };
  if (altLetters[id]) return { latex: altLetters[id], spoken: altLetters[id] };

  if (id === 'sin') return { latex: '\\sin^{-1}', spoken: 'inverse sine' };
  if (id === 'cos') return { latex: '\\cos^{-1}', spoken: 'inverse cosine' };
  if (id === 'tan') return { latex: '\\tan^{-1}', spoken: 'inverse tangent' };
  if (id === 'sec') return { latex: '\\sec^{2}', spoken: 'secant squared' };
  if (id === 'csc') return { latex: '\\csc^{2}', spoken: 'cosecant squared' };
  if (id === 'cot') return { latex: '\\cot^{2}', spoken: 'cotangent squared' };
  if (id === 'fraction') return { latex: '\\div', spoken: 'divide' };
  if (id === 'power') return { latex: `${variableLatex(variable)}^{\\placeholder{}}`, spoken: `${variable} to the power` };
  if (id === 'sqrt') return { latex: `\\sqrt{${variableLatex(variable)}}`, spoken: `square root of ${variable}` };
  if (id === 'open') return { latex: '\\left|\\placeholder{}\\right|', spoken: 'absolute value' };
  if (id === 'exponential') return { latex: 'e', spoken: 'e' };
  if (id === 'ln') return { latex: '\\log_{\\placeholder{}}', spoken: 'log base' };
  if (id === '0') return { latex: '\\theta', spoken: 'theta' };
  if (id === 'decimal') return { latex: '\\pi', spoken: 'pi' };
  return undefined;
}

const actionCommands: Record<string, string> = {
  left: 'performWithFeedback(moveToPreviousChar)',
  right: 'performWithFeedback(moveToNextChar)',
  backspace: 'performWithFeedback(deleteBackward)',
};
const actionLabels: Record<string, string> = {
  left: '<svg class=svg-glyph><use xlink:href=#svg-arrow-left /></svg>',
  right: '<svg class=svg-glyph><use xlink:href=#svg-arrow-right /></svg>',
  backspace: '<svg class=svg-glyph><use xlink:href=#svg-delete-backward /></svg>',
};

const action = (id: string, tooltip: string, width = 1): KeyboardKeycap => {
  const shortcut = `[${id}]`;
  const command = actionCommands[id];
  const label = actionLabels[id];
  const className = `action hide-shift practice-key-${id}`;
  return {
    key: shortcut,
    label,
    command,
    class: className,
    tooltip,
    width,
    shift: { label, command, class: className, tooltip },
  };
};

const enter = (): KeyboardKeycap => {
  const command: Command = ['insert', '', { insertionMode: 'insertAfter' }];
  const className = 'action practice-enter practice-key-check hide-shift';
  return {
    label: 'Check',
    class: className,
    tooltip: 'check answer',
    width: 2,
    command,
    shift: { label: 'Check', command, class: className, tooltip: 'check answer' },
  };
};

function alternateCommand(id: string, vars: string[]): Command {
  const alternate = altFor(id, vars)!;
  const variable = questionVariable(vars);
  if (id === 'sin') return MATH_KEYS.find(item => item.id === 'arcsin')!.command;
  if (id === 'cos') return MATH_KEYS.find(item => item.id === 'arccos')!.command;
  if (id === 'tan') return MATH_KEYS.find(item => item.id === 'arctan')!.command;
  if (id === 'sec' || id === 'csc' || id === 'cot') return insert(alternate.latex, 'after');
  if (id === 'fraction') return insert('\\div', 'after');
  if (id === 'power') return insert(`${variableLatex(variable)}^{#?}`);
  if (id === 'sqrt') return insert(`\\sqrt{${variableLatex(variable)}}`, 'after');
  if (id === 'open') return insert('\\left|#?\\right|');
  // Alts run while MathLive is shifted, and shifted typedText capitalises letters (e → E),
  // so letter alts insert LaTeX instead (plan R13).
  if (id === 'exponential') return insert('e', 'after');
  if (id === 'ln') return insert('\\log_{#?}');
  if (id === '0') return MATH_KEYS.find(item => item.id === 'theta')!.command;
  if (id === 'decimal') return MATH_KEYS.find(item => item.id === 'pi')!.command;
  return insert(alternate.latex, 'after');
}

function key(id: string, vars: string[], width = 1): KeyboardKeycap {
  const item = MATH_KEYS.find(item => item.id === id)!;
  const alternate = altFor(id, vars);
  const classNames = [`practice-key-${id}`];
  if (alternate) classNames.push('practice-has-alt');
  if (item.physical.length > 2) classNames.push('small');

  const keycap: KeyboardKeycap = {
    latex: item.latex,
    command: item.command,
    width,
    class: classNames.join(' '),
    tooltip: ({
      plus: 'plus', minus: 'minus', multiply: 'times', decimal: 'decimal point',
      open: 'left parenthesis', close: 'right parenthesis', fraction: 'fraction',
      power: 'power', sqrt: 'square root', exponential: 'e to the power',
      sin: 'sine', cos: 'cosine', tan: 'tangent', sec: 'secant', csc: 'cosecant',
      cot: 'cotangent', ln: 'natural log', log: 'log base', theta: 'theta', pi: 'pi',
    } as Record<string, string>)[id] ?? id,
  };

  if (alternate) {
    const altClassNames = [`practice-key-${id}`, 'practice-has-alt', 'practice-alt-on'];
    if (item.physical.length > 2) altClassNames.push('small');
    keycap.shift = {
      latex: alternate.latex,
      command: alternateCommand(id, vars),
      class: altClassNames.join(' '),
      tooltip: alternate.spoken,
    };
  }
  return keycap;
}

const shiftLabel = [
  '<svg class="practice-shift-off" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.5 3.8 12.2h4.6v5.3h7.2v-5.3h4.6z" /></svg>',
  '<svg class="practice-shift-on" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.5 3.8 12.2h4.6v5.3h7.2v-5.3h4.6z" /></svg>',
  '<svg class="practice-shift-lock" viewBox="0 0 24 26" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.5 3.8 12.2h4.6v5.3h7.2v-5.3h4.6z" /><rect x="8.4" y="20.5" width="7.2" height="2.2" rx="0.6" /></svg>',
].join('');

const shiftKey = (): KeyboardKeycap => ({
  class: 'shift practice-shift',
  tooltip: 'shift',
  label: shiftLabel,
  width: 1,
});

export function layoutsFor(vars: string[]): KeyboardLayout[] {
  const variable = questionVariable(vars);
  return [{
    displayEditToolbar: true,
    rows: [
      [key('sin', vars), key('cos', vars), key('tan', vars), key('7', vars), key('8', vars), key('9', vars), key('fraction', vars), key(variable, vars), shiftKey()],
      [key('sec', vars), key('csc', vars), key('cot', vars), key('4', vars), key('5', vars), key('6', vars), key('multiply', vars), key('power', vars), key('sqrt', vars)],
      [key('open', vars), key('close', vars), key('exponential', vars), key('1', vars), key('2', vars), key('3', vars), key('minus', vars), action('backspace', 'delete', 2)],
      [action('left', 'move left'), action('right', 'move right'), key('ln', vars), key('0', vars, 2), key('decimal', vars), key('plus', vars), enter()],
    ],
  }];
}

export const mathKeyboardLayouts = layoutsFor(['x']);
