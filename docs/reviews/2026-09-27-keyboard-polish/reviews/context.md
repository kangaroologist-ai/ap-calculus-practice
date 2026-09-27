# Shared context for the three-perspective quick review (T1b)

**What this is.** A quick design pass, before implementation, on a proposed redesign of the math keyboard and of how answer results are shown. Depth: medium. Aim for the 5–10 findings that matter most, not an exhaustive audit.

## Product

AP Calculus derivative practice, a static web app: mobile-first, offline, no accounts, English UI. Students type derivatives in a MathLive `math-field` and use a custom MathLive virtual keyboard on phones. Repo: `/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice`. Main files: `src/math-keyboard.ts` (layout), `src/main.ts` (app, keyboard controls, verdict display), `src/style.css`. Design rules: `docs/design/DESIGN.md` (in Chinese; section 2 principles, section 5 components, section 6 keyboard). Review with DESIGN.md as the baseline: flag violations, and flag places where DESIGN.md itself should change because of this redesign.

## The proposal (full spec: `docs/reviews/2026-09-27-keyboard-polish/plan.md`, sections Spec S1–S6 and Research R1–R9)

1. **One keyboard page instead of two (Main / More).** 4 rows × 9 units. Layout (main / alt):

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | sin / sin⁻¹ | cos / cos⁻¹ | tan / tan⁻¹ | 7 / x | 8 / y | 9 / z | ▫/▫ fraction / ÷ | [v] question variable | ⇧ |
| 2 | sec / sec² | csc / csc² | cot / cot² | 4 / u | 5 / v | 6 / w | · | ▫^▫ / [v]^▫ | √▫ / √[v] |
| 3 | ( / \|▫\| | ) | e^▫ / e | 1 / r | 2 / s | 3 / t | − | ⌫ (2 wide) | |
| 4 | ← | → | ln / log▫ | 0 / θ (2 wide) | | . / π | + | Check/Next (2 wide) | |

   sin⁻¹ etc. are labels only; they insert arcsin etc. (the grader accepts arcsin).
2. **Alt functions.** Each key has at most one alt. Two ways to reach it: (a) **⇧**: tap once = next key only, then back; double-tap = locked; in ⇧ mode keycaps show their alt and keys without an alt are dimmed. (b) **Long press** (300 ms): a bubble shows the alt; release inserts it; sliding off the key cancels. Alts are **not** printed on the keys (the owner tried small corner labels and rejected them as cramped and ugly; see `proto-alt11-light.png`).
3. **All math keycaps use the KaTeX math font**, the same as the question formulas. Check/Next and the top-row buttons use the UI font.
4. **Keyboard top row** (was the Main/More tabs): Hint? and Skip on the left, hide-keyboard icon on the right.
5. **Results inside the answer box, on every device.** A status strip inside the box border: correct shows "✓ Correct" with a 3 s countdown line; incorrect shows "! Not quite." plus a hint sentence; can't-check shows "i Couldn't check." plus the reason. After a wrong answer, focus stays in the field; editing turns the border back to normal and greys the strip, but it stays until the next Check. The old feedback panel and "Next in 3s" bar below the field are gone visually but stay as a screen-reader live region. On desktop the "Next question →" button stays.

## Evidence (all in `docs/reviews/2026-09-27-keyboard-polish/`)

- Before (current v1.2.0 preview): `before-390-light-main.png`, `before-390-light-more.png`, `before-390-light-correct.png`, `before-1280-light-correct.png`.
- Rejected corner-label prototype: `proto-alt11-light.png`, `proto-alt13-light.png`, `proto-alt11-dark.png`, `proto-shift-light.png`.
- **Prototype 2 (the one to review):** `proto2-normal-light.png`, `proto2-shift-light.png` (⇧ one-shot), `proto2-lock-dark.png` (⇧ locked), `proto2-incorrect-light.png`, `proto2-stale-light.png` (after editing a wrong answer), `proto2-correct-dark.png`, `proto2-desktop-incorrect-light.png`, `proto2-desktop-correct-light.png`.
- The prototypes are runtime CSS/JS injections rendered in Playwright WebKit at iPhone 13 size (390 × 664 viewport, 3×) and 1280 wide. The long-press bubble is **not** mocked yet: judge it from the description. The strip mock's colours and spacing are approximate.
- Data: in 4,040 generated answers, multiply 94%, power 66%, divide 53%, cos/sin ~23% each, e^x 17%, sqrt 13%, sec/csc 8–9%, tan/cot 4–5%, ln 3%; inverse trig, log, cube root and π 0%. Variables: x (3,400 questions), x and y implicit (160), t (320), θ (160).

## Rules

- **Read-only.** Do not change any file in the repo. Your final reply is your report.
- Don't use the shared browser pane. If you need a measurement, write a Playwright script in your own scratchpad and run it with `node --import tsx` against the dev server at http://127.0.0.1:5173 (already running; it serves the current code, not the prototype).
- Don't install or run third-party executables.
- Separate fact from opinion: name the element, file:line or selector, and measurement; say whether it came from a screenshot, emulation or reasoning.
- Grade each finding P0–P3 (P0 blocks the task or hides content; P1 clearly violates DESIGN.md principles or keyboard rules, seriously misleads, or fails WCAG AA; P2 hurts the experience but has a workaround; P3 polish). Give a concrete recommendation for each.
