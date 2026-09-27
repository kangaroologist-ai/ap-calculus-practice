# Post-implementation design review (P4), 2026-09-27

Reviewer: `design-reviewer` subagent (Sonnet, medium effort, `design-review` skill), read-only. Context: `context-post.md`. The report below is the subagent's final message, kept in substance; Claude's verification follows it.

## Reviewer summary

The single-page keyboard, shift/long-press mechanics and in-box results match Spec S1–S6 in every 390 px state checked, plus the 1280 px correct state. One screenshot-confirmed P1: at 1280 px, MathLive's default alt labels print in blue on every key with an alt, reversing the owner's round-4 decision and S3 ("键上不印 alt"); not a Spec conflict, since fixing it brings desktop in line with the Spec. Everything else is P2/P3 or already accepted.

| # | Grade | Lens | Finding | Fix | Spec conflict? |
|---|---|---|---|---|---|
| 1 | P1 | A, C | At 1280 px each key with an alt shows MathLive's corner alt label (sin⁻¹, x, y, ÷, sec², u v w, e, log▫, θ, π, √x), light and dark (`1280-*-03-keyboard-open.png`). MathLive hides the span only at ≤ 414 px (plan R9); the override was never applied at other widths. | Hide `.MLK__shift` at every width; note in DESIGN.md 6.3 that the rule is width-independent. | No |
| 2 | P3 | B, C | The long-press bubble for first-column keys sits exactly over Hint? while held (already accepted in T3's result). | None. | n/a |
| 3 | P3 | A (ux-copy) | "Check your input" covers both invalid input and inconclusive grading; after a valid-looking answer a student may hunt for a typo that isn't there. | None proposed: the owner chose the merged label in round 8 (G22). | **Yes** (S6 / G22) |
| 4 | P3 | C | `3x·sin(` gets "Use an evaluated expression with supported functions.", which doesn't name the bracket (grader copy; already a leftover in Acceptance). | None in this task. | No |

Checked and fine (reviewer): 390 light/dark keyboard open, after tap, ⇧ one-shot, ⇧ locked (iOS-style states, blue arrow; no-alt keys stay `--label`, verified by pixel sampling); long-press bubble legible in both themes; correct / incorrect / invalid in-box results at 390 and 1280 with the reason under the box; help page and What's new copy; the top row fits on one line at 390.

Design rules (reviewer): DESIGN.md should state that the alt-label hiding rule applies at every width.

Not verified (reviewer): real iPhone touch and iOS's press-and-hold menu (P5); a VoiceOver pass over `aria-pressed` and the synced alt names; widths between 415 and 700 px for finding 1.

## Claude's verification and handling

- **#1 — confirmed, fixed (R18, T3f).** Crop of the 1280 screenshot shows the labels (`../p4-1280-alt-labels-before.png`). Added `.ML__keyboard .MLK__shift { display: none }` at every width and the DESIGN.md 6.3 note. Measured visible corner labels: 0 at 390, 600 and 1280 px (Chromium); `../p4-1280-alt-labels-after.png`. New test "no key prints its alt at phone, tablet or desktop width" fails on the previous CSS and passes now in Chromium, Firefox and WebKit. This also answers the reviewer's "not verified" item about 415–700 px (600 px checked).
- **#2 — no action**, already accepted.
- **#3 — Spec conflict, not changed; goes back to the owner** as a Grill question (G23), with the recommendation to keep the owner's round-8 choice because the reviewer brings no new evidence beyond what G22 weighed.
- **#4 — no action in this task**; stays a leftover in Acceptance.
- **Also noticed while verifying #1 (Claude, P3, not raised by the reviewer):** at 1280 px the keycap faces stay 19 px inside 80 px keys, so the boxed faces (fraction, e^▫, power) look small. Not a Spec item; recorded as a leftover.

Result: no P0; the one P1 is fixed and retested; P4 can close once the owner answers G23.
