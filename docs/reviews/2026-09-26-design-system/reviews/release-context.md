# Shared context for the v1.2.0 pre-release design review (read-only)

Repo: /Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice (Vite + TypeScript, no framework; MathLive 0.110 math fields and on-screen keyboard).
Product: AP Calculus AB/BC derivative-practice web app for high-school students. Phone-first (iPhone Safari), also used on laptops. Offline-first, progress in the browser, no accounts. UI copy is English only.
Dev server: http://127.0.0.1:5173/ (running; don't start or stop it). Help page: /help.html.

Design spec to judge against: docs/design/DESIGN.md (Chinese). Point out violations of it, and also point out where DESIGN.md itself is wrong or missing something.

What changed in this release (candidate = branch design-keyboard-1.2, version 1.2.0; previous release = v1.1.1):
- Math keyboard rebuilt: pages "Main" and "More", 4 rows × 9 equal columns filling the phone width; digits in a calculator block (columns 4–6), operator column (fraction, ×, −, +), navigation keys in the same place on both pages, no function repeated across pages, spoken aria-labels, no hover bubble, no undo/redo/clipboard toolbar, centred action icons, neutral pressed state.
- After a correct answer, Check answer and Need a hint? hide and Next question becomes the only primary button.
- On phones, wrong/invalid-answer feedback and new hints are scrolled above the fixed action bar (they used to be hidden behind it).
- Spacing/radius/shadow/motion tokens; buttons radius 12 px; press state scale(0.97); hover only on fine pointers; feedback colour transition; dialogs fade/scale in; reduced motion keeps colour/opacity only.
- Dialogs open with focus on their title; the site title is the page h1; Math keyboard button uses an SVG icon; Move progress dialog titled "Move your progress"; footer links aligned.
- Owner decisions not to relitigate: celebrations unchanged (full-screen confetti on every correct answer from a streak of 10); 9 columns chosen over 8 (keys ~39 px wide on a 390 px phone).

Screenshots:
- Candidate: artifacts/design/1.2.0/ (viewport screenshots; 390 px = WebKit iPhone 13 emulation, 1280 px = Chromium; light and dark; plus keyboard-geometry.json).
- Previous release for comparison: docs/reviews/2026-09-26-design-system/baseline/ (v1.1.1; fewer states, different file names).
File names: <width>-<scheme>-<NN>-<state>.png.

Rules for you:
- READ-ONLY on the repo: do not edit, create or delete any file in it.
- Return your report as the text of your final reply (you cannot write report files).
- Do not use the shared browser pane or Chrome tools (other reviewers run in parallel). For extra states, write a Playwright script in your own scratchpad folder and run it with `cd <repo> && node --import tsx <script>`; save images there. Use viewport screenshots, not fullPage (full-page captures draw the fixed keyboard mid-page).
- Do not install anything; do not run third-party binaries (impeccable's launcher/detector is not approved for this release).
- Separate measured facts from opinions; say whether a result comes from Playwright emulation or a real device (you only have emulation).
- Keep the report under ~1,800 words. End with findings ranked P0–P3 (P0/P1 block the release: broken task, hidden content, clear DESIGN.md violation, WCAG AA failure), each marked mechanical or needs-judgement.
