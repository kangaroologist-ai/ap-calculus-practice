import { createEmptyCard } from 'ts-fsrs';
import QRCode from 'qrcode';
import { freshProgress, stateFor, storeCard } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/progress';
import { SKILLS } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/catalog';
import { makePortableProgress, encodeProgress, decodeProgress } from '/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice/src/transfer';
const now = Date.now();
const config = { schemaVersion: 1, revision: 'jump', initialUnlockedLevel: 1, disabledFamilies: ['parametric', 'vector', 'polar'], sessionLength: 12 } as any;
const p = freshProgress(config, now);
const later = new Date(now + 30 * 86400000);
for (const s of SKILLS) {
  if (s.id === 'abstract') break;
  const st = stateFor(p, s.id, now) as any;
  st.card = storeCard(createEmptyCard(later));
  st.basic = { streak: 2, passed: true, repair: false };
  st.mix = { streak: 2, passed: true, repair: false };
  st.mastery = 0.95; st.observations = 2;
}
p.unlockedLevel = 5;
const code = encodeProgress(makePortableProgress(p, now));
decodeProgress(code);
const link = 'https://practice-quality.ap-calculus-practice.pages.dev/#progress=' + encodeURIComponent(code);
console.log(link.length);
console.log(link);
await QRCode.toFile('/private/tmp/claude-501/-Users-kangaroologist-Documents-20-Study-AP-Calculus-ap-calculus-practice/3805f1f9-cc1e-4f74-b6dc-fa053155340a/scratchpad/jump-qr.png', link, { errorCorrectionLevel: 'L', margin: 2, scale: 6 });
