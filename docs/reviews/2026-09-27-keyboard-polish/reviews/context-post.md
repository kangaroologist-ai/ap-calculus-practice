# Context for the post-implementation design review (P4)

For the `design-reviewer` subagent. This replaces `context.md` (which described the prototypes before implementation) for this review.

## Product

AP Calculus derivative practice, a static web app: mobile-first, offline, no accounts, English UI. Students type derivatives in a MathLive `math-field` and use a custom MathLive virtual keyboard. Repo: `/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice`. Main files: `src/math-keyboard.ts` (layout and alts), `src/main.ts` (keyboard controls, long press, results), `src/style.css`. Design rules: `docs/design/DESIGN.md` (Chinese; updated for this change in §5.3, §6, §7, §10). Dev server: http://127.0.0.1:5173 (running; serves the implemented code). The impeccable detector is **not** allowed for this review.

## Task and Spec

Task document: `docs/reviews/2026-09-27-keyboard-polish/plan.md`. Review against Spec **S1–S6** (S7–S8 are docs and process). The Grill log (rounds 1–11) records the owner's decisions; findings that would undo one of them are **Spec conflicts** — report them, marked. Key decisions the owner made after seeing prototypes: no alt labels printed on keys; ⇧ states follow the iOS shift key with a blue arrow; results shown inside the answer box on every device; no explanation sentence on screen for wrong answers; "Check your input" plus a small amber reason under the box for invalid input.

## Scope: the states to look at

Screenshots in `artifacts/design/1.2.0/` (`npm run design:capture`, WebKit 390 × 664 iPhone emulation and Chromium 1280 × 860, light and dark). Changed states:

1. Keyboard open (`*-03-keyboard-open`), after a tap (`*-04-keyboard-after-tap`), ⇧ one-shot (`*-keyboard-shift`), ⇧ locked (`*-keyboard-shift-locked`), long press on sin with the bubble (`*-keyboard-long-press`), at 390 light and dark and 1280.
2. Results in the answer box: correct (`*-06-correct-feedback`), incorrect (`*-07-incorrect-feedback`), invalid with the reason under the box (`*-08-invalid-input`), at 390 and 1280; with the phone keyboard open and closed.
3. Keyboard top row: Hint? and Skip on the left, the first-use tip "Hold a key or tap ⇧ for more", hide on the right.
4. Help page (`390-light-14-help`) and What's new (`*-13-whats-new`): wording for the new keyboard.

Implementation evidence already checked by Claude (don't repeat unless you find a gap): `docs/reviews/2026-09-27-keyboard-polish/l1-*.png`, `l2-*.png`, `l3-*.png`; long-press paths (tap, hold, slide-off, no-alt key, ⇧ once / locked) pass in WebKit and Chromium with a mouse pointer; Playwright tests cover them (`tests/math-keyboard.spec.ts`, `tests/app.spec.ts`). Not yet verified anywhere: real touch on an iPhone and iOS's own press-and-hold menu.

## Earlier review

The pre-implementation three-perspective review and Claude's synthesis are in `reviews/review-*.md` and `reviews/synthesis.md`; check whether the accepted fixes landed (for example no dimming under ⇧, 450 ms long press with 8 px cancel, 44 px top-row targets), and don't re-raise the rejected ones without new evidence.
