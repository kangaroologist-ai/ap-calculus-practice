import type { VirtualKeyboardLayout, VirtualKeyboardKeycap } from 'mathlive';
type Command = VirtualKeyboardKeycap['command'];
const typed = (text: string): Command => ['typedText', text, { focus: true, feedback: true, simulateKeystroke: true }];
const insert = (latex: string, selectionMode: 'after' | 'placeholder' = 'placeholder'): Command => ['insert', latex, { focus: true, mode: 'math', format: 'latex', selectionMode }];
// These are the same operations as MathLive's physical-key bindings/shortcuts.
// Do not pass a whole function name to typedText: MathLive 0.110 duplicates it.
export const MATH_KEYS = [
  ...'0123456789xty+-.*()'.split('').map(text => ({id: text === '*' ? 'multiply' : text === '(' ? 'open' : text === ')' ? 'close' : text === '.' ? 'decimal' : text === '+' ? 'plus' : text === '-' ? 'minus' : text, physical:text, label:text === '*' ? '×' : text, command:typed(text)})),
  {id:'fraction',physical:'/',latex:'\\frac{a}{b}',command:insert('\\frac{#@}{#?}')},
  {id:'power',physical:'^',latex:'x^{n}',command:'moveToSuperscript' as Command},
  {id:'sqrt',physical:'sqrt',latex:'\\sqrt{x}',command:insert('\\sqrt{#?}')},
  {id:'cbrt',physical:'cbrt',latex:'\\sqrt[3]{x}',command:insert('\\sqrt[3]{#?}')},
  {id:'exponential',physical:'e^',latex:'e^x',command:typed('e^')},
  ...['sin','cos','tan','cot','sec','csc','ln','arcsin','arccos','arctan'].map(name=>({id:name,physical:name,label:name,command:insert(`\\${name}`,'after')})),
  {id:'log',physical:'log',label:'log',command:insert('\\log_{#?}')},
  ...['theta','pi'].map(name=>({id:name,physical:name,latex:`\\${name}`,command:insert(`\\${name}`,'after')})),
];
export const KEYBOARD_COLUMNS = 9;
export type KeyboardKeycap = Omit<Partial<VirtualKeyboardKeycap>, 'width'> & { width: number };
export type KeyboardLayout = Pick<VirtualKeyboardLayout, 'label'> & { rows: KeyboardKeycap[][] };
const spokenNames: Record<string, string> = {
  plus:'plus', minus:'minus', multiply:'times', open:'left parenthesis', close:'right parenthesis', decimal:'decimal point',
  fraction:'fraction', power:'power', sqrt:'square root', cbrt:'cube root', exponential:'e to the power',
  sin:'sine', cos:'cosine', tan:'tangent', sec:'secant', csc:'cosecant', cot:'cotangent', ln:'natural log', log:'log base',
  arcsin:'inverse sine', arccos:'inverse cosine', arctan:'inverse tangent', theta:'theta', pi:'pi',
};
const key = (id: string, width = 1): KeyboardKeycap => {
  const item = MATH_KEYS.find(item => item.id === id)!;
  const face = ['x','y','t'].includes(id) ? {latex:id}
    : id === 'minus' ? {label:'−'}
    : id === 'log' ? {latex:'\\log_{\\placeholder{}}'}
    : 'latex' in item ? {latex:item.latex} : {label:item.label};
  // MathLive has no width-3 mapping; the app's keyboard CSS supplies w30.
  return {...face, command:item.command, width, class:`practice-key-${id} ${item.physical.length > 2 ? 'small' : ''}${width === 3 ? ' w30' : ''}`, tooltip:spokenNames[id] ?? id, variants:[]};
};
// Shortcut overrides retain MathLive's SVG labels, commands, and action classes.
const action = (label: string, tooltip: string, width = 1): KeyboardKeycap => ({label, tooltip, width});
export function layoutsFor(vars: string[]): KeyboardLayout[] {
  const variable = vars.includes('y') ? 'x' : vars[0] === 'θ' ? 'theta' : vars[0];
  return [
    {label:'Main',rows:[
      ['sin','cos','tan','7','8','9','fraction','open','close'].map(id=>key(id)),
      ['sec','csc','cot','4','5','6','multiply','power','sqrt'].map(id=>key(id)),
      [...['exponential','ln',variable,'1','2','3','minus'].map(id=>key(id)),action('[left]','move left'),action('[right]','move right')],
      [action('[hide-keyboard]','hide keyboard',2),key(vars.includes('y') ? 'y' : 'pi'),key('0',2),key('decimal'),key('plus'),action('[backspace]','delete',2)],
    ]},
    {label:'More',rows:[
      ['arcsin','arccos','arctan'].map(id=>key(id,3)),
      ['log','cbrt','pi'].map(id=>key(id,3)),
      [key('y',2),key('t',2),key('theta',3),action('[left]','move left'),action('[right]','move right')],
      [action('[hide-keyboard]','hide keyboard',2),{label:'[separator]',width:5},action('[backspace]','delete',2)],
    ]},
  ];
}
export const mathKeyboardLayouts = layoutsFor(['x']);
