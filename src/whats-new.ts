export type WhatsNewEntry = {
  version: string;
  date: string;
  title: string;
  items: string[];
};
// Newest first. Add an entry (and bump package.json) only for changes students can see.
export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: "1.2.0",
    date: "2026-09-26",
    title: "A tidier math keyboard",
    items: [
      "The math keyboard is laid out like a calculator: numbers in one block, ÷ × − + in one column, and keys that fill the width of your phone.",
      "<strong>Main</strong> has everything most answers need; <strong>More</strong> has inverse trig, log, cube root, and extra variables. No more repeated keys or “Type …” bubbles.",
      "The blue key at the bottom right checks your answer, then takes you to the next question. <strong>Hint?</strong>, <strong>Skip</strong>, and hide keyboard sit next to the page names.",
      "On a phone, your result shows right in the answer box, so it is never hidden behind the keyboard.",
      "After a correct answer, <strong>Next question</strong> is the one button to press.",
    ],
  },
  {
    version: "1.1.1",
    date: "2026-09-26",
    title: "See what changed",
    items: [
      "After an update, this window shows what is new the next time you open practice.",
      "Reopen it any time from <strong>What’s new</strong> at the bottom of the page, next to the version number.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-09-26",
    title: "Basic and Mixed practice",
    items: [
      "Each skill now has a <strong>Basic</strong> line, then a <strong>Mixed</strong> line that combines it with rules you have passed. Open <strong>Progress</strong> to see both.",
      "The math keyboard has two pages. The first row shows the variables this question uses.",
      "The question stays visible while the math keyboard is open.",
      "The page follows your device’s light or dark setting, and screen readers can read formulas aloud.",
      "Answer fields and buttons have clearer outlines, and an unreadable progress code now tells you what to do.",
    ],
  },
];
const parse = (v: string) =>
  /^\d+\.\d+\.\d+$/.test(v) ? v.split(".").map(Number) : undefined;
export function compareVersions(a: string, b: string): number {
  const x = parse(a)!,
    y = parse(b)!;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}
/** Entries newer than `seen`; an unreadable or missing marker counts as nothing seen. */
export function unseenEntries(
  entries: WhatsNewEntry[],
  seen: string | null | undefined,
): WhatsNewEntry[] {
  if (!seen || !parse(seen)) return entries;
  return entries.filter((e) => compareVersions(e.version, seen) > 0);
}
