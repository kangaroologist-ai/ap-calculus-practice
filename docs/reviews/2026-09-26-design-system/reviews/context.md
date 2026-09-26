# Shared context for design reviewers (read-only review)

Repo: /Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice (Vite + TypeScript, no framework; MathLive 0.110 math fields and virtual keyboard).
Product: AP Calculus AB/BC derivative-practice web app for high-school students. Phone-first (iPhone Safari is the main device), also used on laptops. Offline-first, progress stored in the browser, no accounts. UI copy is English only.
Live dev server: http://127.0.0.1:5173/ (already running; do not start or stop it). Help page: /help.html.

Key files: src/main.ts (all screens, rendered as HTML strings), src/style.css (tokens at top, components, breakpoints at bottom, reduced-motion block at end), src/math-keyboard.ts (custom MathLive keyboard layouts), src/celebration.ts (streak confetti), src/whats-new.ts, help.html, index.html.
MathLive keyboard internals are in node_modules/mathlive/mathlive.mjs (special keys [left]/[right]/[backspace]/[hide-keyboard] at ~line 28377–28515; tooltip CSS ~line 13316; keycap width var `--keycap-width: min(var(--_keycap-max-width,100px), 10cqw)`; edit toolbar via `editToolbar`).

Baseline screenshots (already captured, WebKit iPhone 13 emulation for 390 px, Chromium for 1280 px):
docs/reviews/2026-09-26-design-system/baseline/*.png and keyboard-geometry.json (per-key x/width and icon-centre offsets).
Previous review with already-known open items: docs/ui-review.md (h1 missing, footer "How to use" misaligned, celebration frequency decision pending).

The owner's own complaints about the phone math keyboard (confirmed by the lead):
1. Digits are not grouped: 7 8 9 are columns 2–4, 4 5 6 columns 4–6, 1 2 3 columns 6–8 (a staircase), 0 in column 4.
2. The Functions tab duplicates sin/cos/tan/sec/csc/ln from the Derivatives tab; needs curation.
3. Tapping a key leaves a "Type +" tooltip bubble (sticky :hover on iOS + MathLive data-tooltip after 1 s). The tooltip text is also used as the keycap aria-label.
4. Function-key icons (arrows, backspace, hide keyboard) are not centred (measured offsets 4–6 px; backspace 49 px off at 1280).
5. Bottom row is 9 units wide vs 8 in other rows ([hide-keyboard] and [backspace] default to width 1.5), so columns do not line up; Functions last row is 6 units vs 8.
6. Keys only use ~79% of the width at 390 px (40 px side margins) — owner wants the keyboard to fill the width more.
7. Overall ordering feels odd. Also: duplicate fraction and "/" keys, undo/redo/clipboard toolbar.

Rules for you:
- READ-ONLY on the repo. Do not edit, create, or delete any file inside the repo. Write only inside your own output folder in the scratchpad given in your prompt.
- Do NOT use the Claude Browser pane or Chrome tools (other reviewers run in parallel). If you need more screenshots/states, write a Playwright script (import { webkit, chromium, devices } from '@playwright/test') into your scratchpad folder and run it with `cd <repo> && node --import tsx <script path>`; save images to your scratchpad folder. Useful states: welcome, question, keyboard open (button "Math keyboard"), Functions tab, wrong/correct feedback, hint (button "Need a hint?"), progress path (click .progress-summary), "Move progress" dialog, help page, dark mode (colorScheme: 'dark'), prefers-reduced-motion.
- Do not install anything and do not download or execute third-party binaries.
- Be concrete: name the element, the file:line or selector, the measured value, and the fix. Separate facts (observed/measured) from opinions.
- Keep the report under ~1,800 words. End with a prioritised list (P0–P3) and, for each item, whether it is mechanical (clear spec, bounded files) or needs design judgement / visual iteration.
