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
const key = (id: string, width: 1 | 2 = 1): Partial<VirtualKeyboardKeycap> => {
  const item = MATH_KEYS.find(item => item.id === id)!;
  return {...('latex' in item ? {latex:item.latex} : {label:item.label}), command:item.command, width, class:`practice-key-${id} ${item.physical.length > 2 ? 'small' : ''}`, tooltip:`Type ${item.physical}`, variants:[]};
};
export const mathKeyboardLayouts: VirtualKeyboardLayout[] = [
  { label:'Derivatives',rows:[
    ['x','t','theta','7','8','9','plus','minus'].map(id=>key(id)),
    ['fraction','power','sqrt','4','5','6','multiply'].map(id=>key(id)).concat([{...key('fraction'),label:'/',latex:''}]),
    ['sin','cos','tan','1','2','3','open','close'].map(id=>key(id)),
    [key('ln'),key('exponential'),'[hide-keyboard]',key('0'),key('decimal'),'[left]','[right]','[backspace]'],
  ]},
  {label:'Functions',rows:[
    ['x','y','t','theta'].map(id=>key(id,2)),
    ['sin','cos','tan','ln'].map(id=>key(id,2)),
    ['sec','csc','cot','log'].map(id=>key(id,2)),
    ['arcsin','arccos','arctan','cbrt'].map(id=>key(id,2)),
    [key('pi'),'[left]','[right]','[backspace]','[hide-keyboard]'],
  ]},
];
