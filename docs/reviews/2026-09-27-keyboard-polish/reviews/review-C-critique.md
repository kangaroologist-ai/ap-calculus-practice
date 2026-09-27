# Reviewer C · Overall critique and polish (Sonnet, impeccable critique + polish), 2026-09-27

Verbatim report returned by the read-only reviewer for T1b. (One stray "1" before row 4 of the score table was in the original output and is kept.)

⚠️ DEGRADED: single-context (detector execution and sub-agent spawning were not authorized for this review — task instructions require read-only, screenshots-only assessment; no `impeccable detect` run, no live browser injection)

# Reviewer C — Overall Critique & Polish
Target: keyboard/answer-status redesign, `docs/reviews/2026-09-27-keyboard-polish/plan.md` (Spec S1–S6), evidence = `before-*.png` and `proto2-*.png`.

## Design Health Score — Nielsen's 10, before vs. proposed

| # | Heuristic | Before | Proposed | Key issue |
|---|---|---|---|---|
| 1 | Visibility of system status | 3 | 3 | Status now lives in-box on every device (good, consistent) but the box's height change on Check is itself an unannounced status change to a student mid-motion (see F3). |
| 2 | Match between system & real world | 2 | 3 | KaTeX-everywhere (S4) removes the sin/eˣ font mismatch; empty-box placeholders (▫/▫, e^▫, √▫) read closer to how these are written on paper than `xⁿ` did. |
| 3 | User control & freedom | 3 | 2 | Losing the visible More page removes a page a student could freely browse; recovery now depends on remembering ⇧/long-press exists at all (see Q1, F1). |
1 | 4 | Consistency & standards | 2 | 3 | One page, one alt per key, and a real ⇧ (vs. two unevenly-sized tab pages) is the single biggest structural win here. |
| 5 | Error prevention | 3 | 3 | Fraction-by-default with ÷ demoted to alt is a genuine error-prevention win per R8 (÷ is grading-ambiguous); offset by hiding "y" behind an undiscoverable alt in implicit-diff questions (F1). |
| 6 | Recognition rather than recall | 3 | 2 | This redesign trades a browsable (if ugly) second page for a memorized gesture. Net negative for anything used less than "often but not every session" — arcsin/log/∛/π are fine to bury (0–3% usage, R8), y is not (F1). |
| 7 | Flexibility & efficiency | 2 | 4 | [v] on a dedicated key, · instead of ×, fraction-first, and one-tap [v]^▫ for the 66%-frequent power case are all real speed wins backed by R3/R8 data. |
| 8 | Aesthetic & minimalist design | 2 | 4 | More page's three mismatched key widths (before-390-light-more.png) is gone; single 4×9 grid with uniform keys is a clear aesthetic upgrade. |
| 9 | Error recovery | 2 | 3 | In-box "stale" state (grey strip, border restored) after editing a wrong answer is clearer than the old design, which left the green/red panel sitting below an edited field with no indication it was stale. One gap: the specific hint text persists verbatim while greyed (F4). |
| 10 | Help & documentation | 2 | 2 | Neither version teaches the alt system in-product; before this only cost "which tab has X", after it costs "does this key even have an alt" — help.html/onboarding must carry more weight now (see Polish list). |
| **Total** | | **24/40** | **29/40** | Net improvement, concentrated in efficiency/consistency/aesthetics; the cost is concentrated in discoverability (3, 6, 10). |

## Cognitive load, high-school student, time pressure

The proposed keyboard is lower load in the modal it's actually used in 96%+ of the time (per the R8/R3 usage data: multiply, power, divide, sin/cos, e^x, sqrt dominate and all sit on primary taps or one well-worn gesture, ⇧-for-arcsin). It is higher load in the rare-but-total moments: a student who lands on their first implicit-differentiation problem set has no visible cue that "y" exists at all (it's the alt of "8"), and discovering it requires either already knowing ⇧ exists or accidentally long-pressing. Under time pressure, "I know it's here somewhere" (before, browsable More page) is a better failure mode than "I don't know this exists" (after). This is the redesign's central risk and it's already flagged by the plan's own D7 as unresolved — I'd elevate it to a shipping blocker for that one case, not for the whole redesign.

## The four questions

**Q1 — Is one page + ⇧/long-press a net improvement over two pages, given the alts are invisible?**
Yes, on the numbers: R8 shows arcsin/log/∛/π combined appear in 0% of 4,040 generated answers, and reverse trig, log, cube root are exactly the things being demoted off any visible key. Burying zero-frequency content behind a gesture is correct triage — it stops the More page from existing solely to hold things nobody taps. The one place this logic doesn't hold is "y" (needed in ~4% of questions, but in ~100% of the implicit-diff subset the student is working through in a given session) — see F1. Net verdict: yes, with that one carve-out fixed before shipping.

**Q2 — Is the digit-alt variable mapping (x–z, u–w, r–t, θ, π on digits) good, and are there better homes?**
The θ↔0 and π↔. mappings are defensible mnemonics (θ resembles a struck-through 0; π often follows a decimal in "value" contexts). x/y/z, u/v/w, r/s/t on 7-8-9/4-5-6/1-2-3 have no mnemonic tie to the digits — it's a "put the alphabet somewhere" allocation, and per the data, r/s/t/u/v/w/z see ~0% real usage (the question's own variable is already the dedicated [v] key; these are exposed only for a student who wants to write in a different letter than the problem uses, which the grader would reject anyway per R8 "Use only x…and supported functions"). Better home for the one variable that matters, "y": put it as the long-press/alt of **[v] itself**, not of digit 8 — it's the natural "other half" of the question's variable in implicit-diff, sits one key away from ⇧, and doesn't require memorizing an arbitrary digit. The other five letters (u,v,w,r,s,t) could be dropped to reclaim ⇧-mode visual bandwidth (see F5) — the plan cites no usage need for them, only "may test the meaning of derivative with different variable names" (Grill, round 1), which is speculative future scope, not current spec.

**Q3 — Does the in-box status strip beat the old feedback panel below the field?**
Yes for consistency (identical treatment on 390 and 1280, one design instead of two) and for reducing eye travel (result sits directly under the input instead of in a separate card below). Two concrete regressions versus the old panel:
- The old "✓ Correct." panel was a fully-filled color block, high-contrast at a glance; the new strip is a thin hairline-divided sliver inside a thin border — lower visual weight for the single most emotionally important moment in the loop (getting it right). Worth confirming the correct-state affordance is still glanceable at a fast scroll/skim, not just on close inspection (F2).
- The box literally changes height when the strip appears (compare proto2-normal vs proto2-incorrect — the border grows to wrap two lines of hint text), which pushes the entire keyboard down at the exact moment the student's thumb is mid-motion toward "Check" or the next key. This is a layout-shift risk right after the highest-frequency action in the whole app (F3).

**Q4 — Top-row layout (Hint?/Skip left, hide right)?**
Reasonable: it consolidates the space freed by dropping Main/More tabs, and keeps low-frequency actions (hint, skip) away from the high-frequency Check button in the bottom-right, reducing accidental taps. No heuristic objection. Minor: Hint?/Skip still render as plain blue text with no button chrome (true in "before" too, not a regression) — could read as informational rather than tappable on a first-run screen (P3, polish list).

## Findings (P0–P3)

**F1 — [P1] "y" for implicit-differentiation questions has no visible key and no discoverability path.**
Evidence: final spec table (plan.md S-table) and D7 note it explicitly — y only exists as the alt of digit "8", with no on-screen indicator (alts aren't printed per the owner's 4th-round decision). In the before state, y had its own always-visible key on the More page (before-390-light-more.png). A student starting an implicit-diff unit needs y on nearly every problem in that session and currently has zero on-screen cue it exists.
Recommendation: move y to be the long-press/⇧ alt of the **[v] key** itself (the question's own-variable key), not of an arbitrary digit — and/or, when the question is detected as implicit (has both x and y), give ⇧ or [v] a one-time visual nudge (brief pulse, or the Hint? text mentioning "long-press the x key for y") the first time that question type appears in a session. This is the one item worth blocking on before implementation (T2/T3), matching the plan's own flagged D7.

**F2 — [P2] Correct-state affordance loses visual weight versus the old solid-fill panel.**
Evidence: before-390-light-correct.png (solid pale-green filled card, bold "✓ Correct.") vs proto2-correct-dark.png (thin green border + hairline-divided strip, same font weight as body text). Recommendation: give the correct strip a light background fill within the box (not just a border), matching `--success`'s existing tint use elsewhere, so the "you got it" moment doesn't get quieter than it was before.

**F3 — [P2] Answer-box height changes on Check, shifting the keyboard immediately after the highest-frequency action.**
Evidence: proto2-normal-light.png (box ~620px tall) vs proto2-incorrect-light.png (box grows to fit two-line hint, keyboard visibly lower). Recommendation: reserve a fixed-height status-strip slot (sized for the longest expected hint, 2 lines) at all times so Check never changes the box's total height — or animate the shift only if P2 of DESIGN.md ("high-frequency operations get no animation") is read as applying to input, not to result transitions specifically.

**F4 — [P2] Stale (post-edit) hint keeps the exact wrong-answer wording, only greyed.**
Evidence: proto2-stale-light.png shows "Check the rule and the inner derivative." still verbatim, greyed, while the field now contains a different, unchecked expression. Recommendation: on edit, either clear the hint text (keep only a greyed generic "Not quite" chip) or make the greyed state visually distinct enough (e.g., strike-through or "(previous attempt)" prefix) that a student doesn't anchor on stale, possibly-inapplicable advice.

**F5 — [P3] ⇧-active view exposes 6 variable keys (u,v,w,r,s,t) with ~0% real usage per R8/R3 data, adding noise exactly when the student is trying to find sin⁻¹/÷/² etc.**
Evidence: proto2-shift-light.png / proto2-lock-dark.png — full alphabet-style grid appears under ⇧ even though the data (Grill recon, R8) shows only x, y, t, θ ever appear in actual answers. Recommendation: drop u,v,w,r,s,t from the alt layer (fold "different variable name" into a future/explicit feature if ever needed) and use the reclaimed visual quiet to make sin⁻¹/cos⁻¹/tan⁻¹ and ÷ easier to scan under ⇧.

**F6 — [P3] Hint?/Skip remain unstyled text links with no button affordance (pre-existing, not introduced by this redesign).**
Evidence: before-390-light-main.png and proto2-normal-light.png both render them as plain blue text. Recommendation: while touching the top row for S5 anyway, consider a minimal tap-target affordance (larger hit area at minimum, per WCAG 2.5.5 — verify current hit area ≥44×44pt) since this is now the only thing left in that row besides the hide icon.

**F7 — [P3] Long-press bubble content and iOS "text selection/magnifier" conflict is unverified (R9 [U]).**
Evidence: plan.md explicitly flags this as unresolved and the prototype doesn't mock the bubble. Recommendation: this is already correctly gated behind P5 (iPhone real-device check) in the plan — just confirm that check happens before shipping S3, not after.

## Polish list (quick wins, no new findings above)
- Confirm the KaTeX "·" for multiplication (S2) renders large enough at 390px that it doesn't visually disappear next to "x" and "." on adjacent keys — same font-size concern the plan already logged for arccos at 13px (T1 progress notes).
- The stale-strip divider line (proto2-stale-light.png) sits very close to the text baseline above it ("sin(x³)|") — worth a hair more padding so the caret and the divider don't visually compete.
- Desktop incorrect view (proto2-desktop-incorrect-light.png) keeps "Check answer / Need a hint? / Skip" as full buttons below the box while the box also shows the strip — confirm this isn't read as two competing action zones once the box's own border is colored amber; a little more vertical separation between box and button row would help.

Overall: the redesign is a net improvement — heuristics 4, 7, 8 (consistency, efficiency, aesthetics) gain clearly and are backed by real usage data (R3/R8), which is the right way to make this call. The debt is concentrated in discoverability of one specific, high-stakes case (y for implicit differentiation, F1) and two in-box-strip polish issues (F2, F3) that are cheap to fix before T2/T3 land. None of these are P0s; F1 is the only one I'd treat as a real go/no-go gate.
