import { createEmptyCard, fsrs, Rating } from 'ts-fsrs';
import { PARAMETERS } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/progress';
const f = fsrs(PARAMETERS);
for (const pattern of [['G','G','G','G','G','G','G'], ['G','G','A','G','G','G','G']]) {
  let card = createEmptyCard(new Date('2026-01-01T00:00:00Z')); let now = card.due; const out: string[] = [];
  for (const g of pattern) { card = f.next(card, now, g === 'G' ? Rating.Good : Rating.Again).card; const mins = (card.due.getTime() - now.getTime()) / 60000; out.push(`${g}->${mins < 60 ? mins.toFixed(0) + 'm' : (mins / 1440).toFixed(1) + 'd'}`); now = card.due; }
  console.log(pattern.join(''), out.join('  '));
}
