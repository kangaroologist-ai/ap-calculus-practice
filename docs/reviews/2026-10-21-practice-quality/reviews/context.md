# Design review context — release 1.3.0 (full review)

- Repository: `/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice`, branch `practice-quality`. Product: AP Calculus derivative practice, phone first (iPhone Safari), offline-capable static site, no accounts, English-only interface. Main files: `src/main.ts`, `src/style.css`, `src/math-keyboard.ts`, `help.html`, `src/whats-new.ts`.
- Task document: `docs/reviews/2026-10-21-practice-quality/plan.md` (Spec S1–S8). Design rules: `docs/design/DESIGN.md` (judge against it, and say where DESIGN.md itself is wrong). Workflow: `docs/design/review-workflow.md`.
- Why a full review: new keys on the math keyboard (S6) and new path status texts (S4/S8).
- Dev server: `http://127.0.0.1:5174/` (Vite, already running; do not stop it).
- Screenshots: candidate `artifacts/design/1.3.0/` (from `npm run design:capture`); previous release baseline `artifacts/design/1.2.0/`.

## Scope (states to look at)
1. Question display (02, 06–10): formulas now write `15x^8`, `ln x − 15e^x`, `-4ln(x)`; numbers are small (S1–S3).
2. Learning path (11): new level titles (The foundations; Essential functions; Products & quotients; The chain rule; Beyond the basics; Curves & coordinates), skill statuses “Learning · NN%”, “Basic ✓ · NN%”, “Ready”, “Rebuilding”, level 6 “Not included” (S4, S8).
3. Math keyboard on an abstract-function question (NEW, not in the capture set): tan, sec, csc, cot become g(▫), f(▫), f′(▫), g′(▫) (S6, DESIGN §6.1). Make your own screenshots at 390 px light/dark (WebKit) and 1280 px (Chromium) with a Playwright script in your scratchpad: copy the setup of `tests/app.spec.ts` test “abstract questions replace tan, sec, csc, cot with f and g keys” (line ~1291; helpers `openApp`, `onlySkill('abstract', 5)`). Check legibility of the f′(▫) key face, alignment, spoken names, and that nothing else moved.
4. What's new (13): new 1.3.0 entry with five items.
5. Help page (14): rewritten “Follow your learning path”, the f/g key paragraph, the iPhone Home Screen paragraph.

## Rules
- Read-only: change no file in the repository.
- Return the report as text (your final reply is the report).
- Do not use the shared browser pane; for extra screenshots run Playwright from your scratchpad with `node --import tsx`.
- Do not run the impeccable detector executable (the owner has not agreed); put impeccable's degraded-mode marker at the top of the report.
- Mark any finding that conflicts with the Spec; do not propose changing a Spec decision without saying so.
