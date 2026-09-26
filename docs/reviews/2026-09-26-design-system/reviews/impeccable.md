# 评审 C：impeccable critique + polish 视角

> 注：报告中的 `390-light-06-feedback-wrong.png` 已按其指出的问题更名为 `390-light-06-feedback-correct.png`。
>
> 来源：Sonnet 只读子代理，2026-09-26。方法：读取 pbakaus/impeccable v4.4.0 公开的 SKILL.md 及 critique / polish / craft-floor / operate / audit / animate 参考文本；**未运行** impeccable 启动器、检测器或任何下载的二进制文件，因此报告以降级标记开头。下文为子代理报告原文（英文），未改动。

⚠️ DEGRADED: single-context (Assessment A run inline by explicit instruction; Assessment B (`impeccable detect`, the live-server overlay flow, and any downloaded binary) was withheld by the task's own constraints, not by tool unavailability — no dual sub-agent, no detector, no browser)

**Method note.** This run is source-and-screenshot review only: full reads of `src/main.ts`, `src/style.css`, `src/math-keyboard.ts`, `src/whats-new.ts`, `help.html`, `docs/ui-review.md`, plus every PNG in `docs/reviews/2026-09-26-design-system/baseline/` and the measured key geometry in `keyboard-geometry.json`. No live page was opened; nothing was edited. Evidence gaps are called out where they occur rather than papered over.

---

## Assessment A — Design Review

### Design Health Score (Nielsen heuristics, Operate mode)

| # | Heuristic | Score | Key issue |
|---|-----------|:---:|---|
| 1 | Visibility of System Status | 3 | Streak, "N practiced today," "Checking…" state, and a 3 s auto-next progress bar are all present (`src/main.ts:315,382-383`). Docked by the sticky "Type +" tooltip bubble after a tap, which lingers as false status ("something is active here") — see P2 below. |
| 2 | Match Between System & Real World | 2 | Math notation and copy read like a textbook ("Equivalent forms are welcome," domain-specific wording). Undercut by a virtual key labelled **/** that does not type a slash — it inserts a fraction template (`src/math-keyboard.ts:24`). A key that lies about its own label breaks this heuristic directly, at the exact moment a student is trying to answer. |
| 3 | User Control and Freedom | 3 | Skip, Restore backup, Reset progress (with confirmation), and native `<dialog>` Escape/backdrop dismissal are all available. |
| 4 | Consistency and Standards | 2 | One token set drives both themes, but "which control is the primary action" is inconsistent: a disabled, still-blue, still-full-size Check answer button outweighs the actual next action, a bare text link (`src/main.ts:315`, `src/style.css:426-429,438-445`). The keyboard also breaks the calculator convention every phone user already has (digits not grouped — see P1 below). |
| 5 | Error Prevention | 3 | MathLive constrains input syntax; "Couldn't check" (invalid/inconclusive) is explicitly *not* scored as wrong (`src/main.ts:322-327`); destructive actions (Reset, replace-on-import) confirm first. |
| 6 | Recognition Rather Than Recall | 2 | Keyboard is always visible (good), but the digit "staircase" and the duplicate-looking fraction/÷ key force re-scanning instead of muscle memory every single question. |
| 7 | Flexibility and Efficiency | 3 | Enter submits, Enter again advances, physical keyboard works alongside the virtual one, equivalent forms accepted (no forced simplification). |
| 8 | Aesthetic and Minimalist Design | 2 | Individual screens are clean and restrained, but the post-correct actions row (disabled button + subtle button + tiny link) and the keyboard's own toolbar (tab labels + undo/redo/clipboard + hide) stack into a busy control cluster right when the student most wants a single obvious "go on" tap. |
| 9 | Error Recovery | 3 | Plain-language "Not quite." plus targeted `incorrectFeedbackText(q)`; input keeps focus and the student's own text on a miss (`src/main.ts:482`). |
| 10 | Help and Documentation | 3 | Dedicated, well-structured `help.html` with in-page anchors, contextual "Input guide" link, per-key tooltips (execution has bugs, intent is right). |
| **Total** | | **26/40** | **Acceptable — solid foundation, concentrated friction in the input method and the post-correct moment** |

### Design Specificity Verdict

**LLM assessment (unanchored).** This is not a template-interchangeable product. The dm/dx equation on the welcome screen, the Basic→Mixed→Ready progress vocabulary, and the "no account, no uploaded answers" privacy framing are all authored for this exact audience (a self-paced AP Calc student on a phone). The math keyboard is a genuinely custom component, not a generic package left at defaults. Where it slips into category-interchangeable territory is the *keyboard's internal ordering* — it reads like MathLive's stock demo ordering (variables, then operators, then trig, then digits wherever they fit) rather than a keyboard someone sat down and designed around how a student's thumb actually moves through a derivative problem.

**Deterministic scan.** Not run (constraint). The measured `keyboard-geometry.json` file substitutes for part of this — it confirms, in pixels, four of the owner's seven complaints (digit x-positions form a staircase; the last row of each tab sums to 9 and 6 grid units against 8 elsewhere; icon offsets up to 49 px at 1280 px) — see the Priority Issues below for the exact numbers.

**Visual overlays.** Not available (no browser automation permitted for this run).

### Overall Impression

The app's information architecture, copy, and accessibility floor (per `docs/ui-review.md`, already largely fixed) are ahead of where the visible surface currently sits. The single biggest opportunity is the math keyboard: it is the control the student touches on almost every screen, several times per question, and right now it actively works against calculator muscle memory instead of with it. The second-biggest opportunity is narrower but sharper: the exact moment a student gets a right answer — which should be the emotional peak of the session — currently hands them a disabled button that still looks pressable next to the real next step, shrunk to a text link.

### What's Working

- **Feedback taxonomy is genuinely well thought out.** Correct / incorrect / invalid / inconclusive are visually and semantically distinct (`src/style.css:652-676`), and "couldn't check" is explicitly protected from counting as a wrong answer — a real design decision, not a default.
- **The help page is a model Read-mode surface.** Proper `<h1>`/`<h2>` structure, in-page jump nav, `<details>` for progressive disclosure of edge cases, one closing CTA (`help.html:6-13`). This is the pattern the rest of the app's headings should be checked against (see P3, missing `<h1>` on the practice page).
- **Privacy and portability framing is confident and consistent.** "No account. No uploaded answers." plus the QR/code Move-progress flow reads as a deliberate product stance, repeated consistently across welcome, footer, and help.

### Cognitive Load Assessment

Checklist result: **3 of 8 fail** → moderate load, address soon.
- Chunking — **fail**: digits are not chunked into a recognizable 3-column block on the keyboard.
- Grouping — **fail**: operators, digits, and functions are interleaved in the same row rather than grouped by kind.
- Visual hierarchy — **fail**: the post-correct actions row has three controls with three different weights that don't map to importance (disabled-but-loud, subtle, and invisible-but-required).
- Everything else (single focus, one-thing-at-a-time, minimal choices, working memory, progressive disclosure) passes.

### Emotional Journey

Peak-end rule check: the peak (getting it right, streak counting up, confetti at higher streaks per `docs/ui-review.md`) is well built. But the very next beat — deciding what to press — is the moment this review keeps returning to: a rewarding "✓ Correct." banner is immediately followed by a control row where the most visually dominant element (blue, full-size, `Check answer`) is the one that does nothing, and the one that matters (`Next question →`) is the smallest, quietest element on the row. That's a real dip right after the peak, not a catastrophic one (the 3 s auto-advance and the JS focus-move to `#next` at `src/main.ts:479` both paper over it for most users), but it's an unforced one.

---

## Priority Issues

**[P1] Digit keys are not grouped like a calculator.**
*What:* Row 1 has `x 7 8 9 + − ( )`, row 2 has `4 5 6` at columns 4–6, row 3 has `1 2 3` at columns 6–8, and `0` sits alone in row 4 column 4 (`src/math-keyboard.ts:23-26`, confirmed pixel-for-pixel in `keyboard-geometry.json` — e.g. 390-light-derivatives row1 digits at x=79,118,157 but row2 digits at x=157,196,235).
*Why it matters:* Every phone and calculator a student has ever used groups 7-8-9/4-5-6/1-2-3/0 in one fixed block. This keyboard breaks that convention on a screen students will tap hundreds of times, forcing a visual scan instead of muscle memory (heuristic 6).
*Fix:* see the concrete redesign below — group digits into a fixed 3-column block, same columns every row.
*Suggested command:* `$impeccable layout`. Mechanical (bounded to `src/math-keyboard.ts`); the grid itself needs one round of design judgement (which side the digits sit on), already made below.

**[P1] The "/" key doesn't type "/" — it's a relabeled duplicate of the fraction key.**
*What:* `derivativeLayout` row 2 ends with `.concat([{...key('fraction'), label:'/', latex:''}])` (`src/math-keyboard.ts:24`) — same `insert('\frac{#@}{#?}')` command as the `a/b` key two slots earlier, just wearing a different face.
*Why it matters:* A key labelled "/" that inserts a fraction template instead of a division slash directly contradicts what the label promises (heuristic 2), at the one moment — entering an answer — where trust in the input method matters most.
*Fix:* Give the second slot a real, distinct job: a true division key (`typedText('/')`) so `a/b` (template) and `÷` (literal division) are two honestly-labelled keys instead of one key with two names.
*Suggested command:* `$impeccable clarify`. Mechanical, one line (`src/math-keyboard.ts:24`).

**[P1] Post-correct action hierarchy: the disabled button outweighs the real next step.**
*What:* On a correct answer, `#submit` ("Check answer") becomes `disabled` but keeps `.button.primary` styling at `opacity:0.5` (`src/main.ts:382`, `src/style.css:76-79,426-429`) — still the largest, bluest, most button-shaped element in the row. `#next` ("Next question →") renders as `.text-button.next`, no border, no fill, `var(--t-caption)` size, pushed to the far right by `margin-left:auto` (`src/main.ts:315`, `src/style.css:438-445,541-544`). This is exactly the pattern the task asked me to evaluate, and the baseline screenshot (`390-light-06-feedback-wrong.png` — mislabelled; it actually captured the *correct*-answer state, see Run Notes) confirms it visually: a large pale-blue "Check answer" sits directly left of "Show next hint," with "Next question →" isolated as a small blue link at the bottom right.
*Why it matters:* Heuristics 4 and 8. The control with zero function (disabled) has the most visual weight; the control that is the entire point of this screen state (advance) has the least. The 3 s auto-advance timer and the JS `.focus()` call on `#next` (`src/main.ts:479`) soften this for most users and for keyboard/screen-reader users specifically, but a sighted mouse/touch user scanning the row has no visual reason to look at the bottom-right corner.
*Fix:* Once `verdict.status === "correct"`, promote `#next` to `.button.primary` (or equivalent full weight) and either hide `#submit` entirely or demote it to a plain disabled-looking outline, matching the "one primary action per state" rule this app otherwise follows on welcome and all-caught-up screens.
*Suggested command:* `$impeccable layout`. Bounded to `src/main.ts:315` + a small CSS addition; the exact treatment (hide vs. restyle Check answer) needs one round of design judgement.

**[P2] Tapping a keycap leaves a stuck tooltip; the tooltip text also is the accessible name.**
*What:* Owner-confirmed and consistent with the code: every custom key sets `tooltip: 'Type ${physical}'` (`src/math-keyboard.ts:20`), which MathLive also uses as the keycap's `aria-label`. On iOS, `:hover` persists after a tap, so the bubble (e.g. "Type +", visible in `390-light-04-keyboard-tooltip.png`) stays on screen with nothing to dismiss it except tapping elsewhere.
*Why it matters:* A floating label that won't go away reads as stuck/broken state (heuristic 1), and it's pure visual noise for self-evident keys like digits and `+`/`−` (heuristic 8) — the tooltip only earns its keep on icon-only or ambiguous keys (`a/b`, `√x`, `eˣ`, the special keys).
*Fix:* Suppress the hover-triggered bubble on coarse pointers (`@media (hover: none)` targeting the tooltip layer), and only set `tooltip` on keys whose meaning isn't obvious from the label; give the rest an explicit `aria-label` (or MathLive's equivalent field, if the 0.110 API exposes one independent of `tooltip`) so removing the visible bubble doesn't also remove the accessible name.
*Suggested command:* `$impeccable harden`. Mostly mechanical (CSS); the aria-label/tooltip decoupling needs a quick check against the MathLive 0.110 `VirtualKeyboardKeycap` type before it can be called bounded.

**[P2] Last row of each tab doesn't line up with the rows above it, and the same oversized keys have off-center icons.**
*What:* Measured in `keyboard-geometry.json`: Derivatives row 4 sums to 9 grid units (`ln 1 + e^ 1 + hide-keyboard 1.5 + 0 1 + . 1 + left 1 + right 1 + backspace 1.5`) against 8 in rows 1–3; Functions row 5 sums to 6 units against 8 in rows 1–4. The same two oversized (`width:1.5`) special keys carry the worst icon-centering offsets in the file — backspace is 49 px off-center at 1280 px, hide-keyboard 6 px off at 390 px.
*Why it matters:* Columns not lining up top-to-bottom breaks the calculator-grid mental model students otherwise get from the digit fix above (heuristic 4). The icon-centering complaint is very likely the *same defect*: an icon sized for a normal keycap, rendered inside a 1.5×-wide one, isn't recentered.
*Fix:* Give `[hide-keyboard]`, `[left]`, `[right]`, and `[backspace]` explicit `width:1` (matching the rest of the row) instead of MathLive's 1.5 default, and re-verify icon centering afterward — fixing the width is likely to fix most of the centering complaint as a side effect, not two separate fixes.
*Suggested command:* `$impeccable layout`. Mechanical, bounded to `src/math-keyboard.ts` rows, contingent on MathLive's special-key syntax accepting an explicit `width` override (needs a quick API check, same caveat as P2 above).

**[P2] Functions tab duplicates six keys already on Derivatives.**
*What:* `sin, cos, tan, sec, csc, ln` appear on both tabs (`src/math-keyboard.ts:22-33`) — confirmed in `390-light-05-keyboard-functions.png`.
*Why it matters:* Owner-flagged. Six of the Functions tab's eleven "real" keys teach the student nothing they didn't already have one tap away, diluting the tab's actual job (surfacing `cot, log, arcsin, arccos, arctan, cbrt, π`) and wasting the width-2 real estate on repeats (heuristic 8).
*Fix:* see the curated Functions grid below.
*Suggested command:* `$impeccable distill`. Mechanical, bounded to `src/math-keyboard.ts:28-34`.

---

## A concrete, better keyboard — both tabs

Both proposals keep every existing command binding (`src/math-keyboard.ts:7-17`); only the grid arrangement changes.

### Derivatives (still 8 grid units × 4 rows)

| | Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | Col 7 | Col 8 |
|---|---|---|---|---|---|---|---|---|
| Row 1 | x | ( | ) | + | − | **7** | **8** | **9** |
| Row 2 | a/b | xⁿ | √x | × | ÷ | **4** | **5** | **6** |
| Row 3 | sin | cos | tan | sec | csc | **1** | **2** | **3** |
| Row 4 | ln | eˣ | ← | → | ⌫ | ⌨︎ hide | **0** | **.** |

Digits now occupy the same three right-hand columns on every row, reading top-to-bottom as `7-8-9 / 4-5-6 / 1-2-3 / _-0-.` — the standard calculator/phone-dial pattern, so the muscle memory a student already has transfers directly. `a/b` (template) and `÷` (real division, `typedText('/')`) are now two honestly distinct keys instead of one key with two labels. Every row sums to 8 units with all keys at their natural width, so no row needs an oversized 1.5-width key and the column-alignment and icon-centering issues above are addressed by the same change.

### Functions (curated, drops the 6 Derivatives duplicates)

| | Col 1–2 | Col 3–4 | Col 5–6 | Col 7–8 |
|---|---|---|---|---|
| Row 1 | x | y | t | θ |
| Row 2 | cot | log | arcsin | arccos |
| Row 3 | arctan | cbrt | π | ⌨︎ hide |
| Row 4 | ← | → | ⌫ | *(centered, not stretched)* |

Row 4 is intentionally left at 6 of 8 units and centered rather than stretched or left-justified — three navigation keys don't need to pretend to be four content keys, and a centered short row still reads as a deliberate composition rather than a misalignment. This drops the tab from 20 to 14 live keys; every remaining key is something the student cannot get from the Derivatives tab.

**Needs design judgement, not just mechanical execution:** whether `sin/cos/tan` specifically should stay on both tabs despite the duplication (a case can be made that trig is common enough to deserve zero-tap access from either tab) — flagged as a Question for the Owner below rather than decided unilaterally.

**Also flagged, lower priority (P3):** keys currently fill only ~79% of the 390 px plate width (40 px unused on each side — `keyboard-geometry.json`, 390-light-derivatives: first key starts at x=40 of a 390-wide plate) and ~62% at 1280 px (content spans x=244–1036 of 1280). `--keycap-width` is left at MathLive's default `min(100px, 10cqw)` (`src/style.css:987-995` has no override). Raising or removing that cap would let the redesigned grid above read as more confidently "full width" on the device it's used on most. Suggested command: `$impeccable layout`.

---

## Persona Red Flags

**Casey (Distracted Mobile User)** — the primary persona here, since this is explicitly phone-first. At 390 px, the keyboard plus its toolbar occupies roughly a third to a half of the visible viewport once open (226–272 px tall per `keyboard-geometry.json`, on a ~650–700 px visible viewport after browser chrome). The digit staircase costs Casey a beat of visual search on every single digit tap, one-handed, probably mid-problem-set. The unused 40 px margins on each side mean Casey's thumb has to travel further than it needs to for edge keys.

**Alex (Impatient Power User)** — doing many reps per session, Alex will learn fast that the disabled Check-answer button does nothing after a correct answer, but the interface never rewards that learning: the real target (`Next question →`) stays visually buried in the same spot every time instead of becoming the obvious, promoted control an efficient user could tap without hunting. Enter-to-advance (`src/main.ts:350`) is the actual power-user path here and it works well — but it's undocumented on-screen; a first-time Alex has to find it in the help page's "Answering" section rather than see it modeled by the UI itself.

**Jordan (Confused First-Timer)** — hits the mislabeled "/" key first (it's the second key in a familiar-looking row) and gets a fraction template instead of the division slash they typed on a real calculator; this is a small, sharp trust hit right at onboarding. The sticky tooltip bubble, meanwhile, looks like an error state to someone who doesn't know MathLive tooltips exist.

---

## Screen-by-screen (390 px / 1280 px, light / dark)

- **Welcome** (`390/1280-{light,dark}-01-welcome.png`): consistent across all four combinations — one card, one primary CTA, restrained color use, dark mode correctly inverts to near-black rather than a lazy gray-invert. No issues found beyond the pre-existing missing-`<h1>` item below.
- **Question** (`390/1280-{light,dark}-02-question.png`): clean single-focus layout; "Math keyboard" toggle reads as a secondary text action correctly. At 1280 px the card is comfortably narrower than the viewport (matches a Read-adjacent measure, good for the equation), leaving generous side margins that are appropriate for Operate mode's restrained density — not a problem, just noted as intentional-looking rather than accidental.
- **Feedback / hierarchy** (`390-light-06-feedback-wrong.png`, actually a correct-state capture — see Run Notes): covered in detail under P1 above. Not independently re-verified in dark mode or at 1280 px because no such screenshot exists in the baseline set; the underlying markup and CSS (`src/main.ts:315`, `src/style.css:426-429,438-445`) are theme-agnostic, so the same hierarchy problem is present in all four combinations by construction, not just the one captured.
- **Hint / solution** (`390-light-07-hint.png`): good progressive disclosure — hint text appears inline below the actions row rather than in a modal, and the hint button's label itself communicates state ("Need a hint?" → "Show next hint" → "Show solution" → "Solution shown," `src/main.ts:315`). No issues found.
- **Progress path** (`390-light-08-path.png`): level list with locked/preview states is legible and the numbered badges give a clear sense of sequence without needing the banned "01/02/03" kicker pattern (these numbers *do* carry sequence information, which is the stated exception). No issues found.
- **Move progress dialog** (`390-light-09-move-progress.png`): only a light-mode 390 px capture exists in the baseline; not verified at 1280 px or in dark mode. The visible focus ring on the close button is correctly high-contrast. One structural note from source rather than a screenshot: `dialog` itself scrolls (`overflow-y:auto` at `src/style.css:939-950`), and both the header's "×" close button and any primary "Got it"/action button live inside that same scrolling region — on a long dialog (see What's New below) both exits can scroll out of view together, though native `<dialog>` Escape and backdrop-click remain available as fallbacks.
- **What's New dialog**: **no screenshot exists in the baseline set for this state.** Reasoned from source only (`src/whats-new.ts`, `src/main.ts:588`, `src/style.css:857-888,939-950`). Currently two entries stack with a divider; the same "everything scrolls together" structural note above applies and will matter more once entries accumulate for a student who skips several updates — flagged as a minor, forward-looking observation, not a current defect.
- **Help page** (`390-light-10-help.png`): the strongest surface in the app structurally — real `<h1>`, in-page anchor nav, `<details>` progressive disclosure. Use this file's heading discipline as the reference when fixing the missing `<h1>` on the practice page (below).

---

## Polish pass (findings only — nothing edited)

Per `polish`'s triage order (functional → missing states → hierarchy/drift → visual/motion → cleanup):

1. **Flow/hierarchy drift:** the post-correct actions row (P1 above) is the one place in the app where the "single obvious primary action" rule the welcome and all-caught-up screens both follow is not applied. Polish should bring this screen state into line with the rest of the app's own convention, not invent a new one.
2. **Design-system drift, missing heading level:** practice page has no `<h1>` — `main.ts:280` (`<h2>Differentiation</h2>`) and `main.ts:315` (`<h2>${esc(q.title)}</h2>`) are the first headings on their respective states, while `help.html:7` correctly opens with `<h1>How to use</h1>`. This is pre-existing and already tracked as Open in `docs/ui-review.md` item 8; this pass reconfirms it is still present.
3. **Local defect, mislabeled control:** the "/" keycap (P1 above) — a one-line fix, but it's a correctness/trust defect, not merely cosmetic, so it sits above the purely visual items in triage order.
4. **Visual/motion inconsistency, component-level:** keyboard row-width and icon-centering (P2 above) — one root cause, two symptoms.
5. **Cosmetic/noise:** sticky tooltip (P2), keyboard width-fill (P3), Functions duplication (P2/distill).
6. **Pre-existing, unverified this pass:** the footer "How to use" link sitting a few pixels above its siblings (`docs/ui-review.md`, still marked Open) — not re-measured here; the current 390-light-01-welcome screenshot shows the footer links reading as aligned to the eye, so this may already be smaller than previously measured, but I did not do a pixel measurement and won't claim it's resolved.

No snapshot was closed and nothing above was applied — this section is evidence for whoever runs the next `polish` pass, per this run's read-only scope.

---

## What a DESIGN.md for this project should contain

The owner wants both a design spec and a repeatable pre-release review workflow; a `document`-generated `DESIGN.md` should pin down, at minimum:

1. **Product & audience snapshot** — phone-first, offline-first, no-account AP Calc practice tool; primary user is a student mid-problem-set, likely one-handed, short sessions. This framing is what should keep every future decision honest about "does this help a thumb on a phone."
2. **Tokens** — the existing color roles (`--tint, --success, --warning, --danger, --label, --label-2, --surface, --fill, --separator, --control-border, --focus`) with light + dark values, and the contrast rule already enforced in `tests/contrast.test.ts` (≥4.5:1 body/placeholder, ≥3:1 large text/non-text) stated as a hard constraint, not just a passing test.
3. **Type scale** — the `--t-*` rem steps, the 12 px floor from `tests/visual-tokens.spec.ts`, and which step maps to which semantic role (heading vs. button vs. caption vs. equation).
4. **Component library with states** — every button variant (`primary/subtle/danger/text-button/icon-button`) with its default/hover/focus/active/disabled states, and — this is the one that would have caught the P1 hierarchy issue before it shipped — **an explicit rule that exactly one control per screen state may use `.button.primary`, and a disabled control never keeps primary styling.**
5. **Layout grid & breakpoints** — the 700 px/900 px breakpoints already in `style.css`, the two-column workspace grid, and the four canonical review viewports (390 / 768 / 1280, light + dark) this report used.
6. **Math keyboard specification** — the canonical grid for each tab (the two tables above, once the owner picks between them and any open questions), the keycap width-fill target, and an explicit tooltip policy: which keys get a tooltip, and a rule that a key's accessible name is never solely derived from a tooltip that can be suppressed.
7. **Feedback & progress state rules** — the correct/incorrect/invalid/inconclusive visual+copy pairing, the 3 s auto-advance timing and its reduced-motion behavior, and the still-pending streak-celebration-frequency decision from `docs/ui-review.md` (U-R12) — this is exactly the kind of decision that belongs in DESIGN.md once made, so it stops being re-litigated per screen.
8. **Accessibility floor** — WCAG 2.1 AA target, 44 px touch-target minimum, focus-visible ring spec, speakable-math requirement for screen readers, referencing the existing test files as the enforcement mechanism.
9. **Content & voice** — the plain-language rules `help.html` already models (no raw error codes, no LaTeX surfaced to students), stated as a rule rather than left implicit.
10. **Pre-release design review checklist** — the exact screen list and viewport/theme matrix this report used (welcome, question, feedback in every verdict state, hint/solution, progress path, Move progress, What's New, help), plus one standing question per screen: *"does this state have exactly one unambiguous primary action?"* Treat `docs/ui-review.md` and this report as the first two entries in that review's history, so drift gets caught release over release instead of accumulating.

---

## Questions for the owner

1. **Keyboard direction:** adopt the digit-block redesign above (digits fixed in the right three columns on Derivatives) as written, or do you want digits on the *left* instead, with letters/operators on the right?
2. **Functions tab curation:** fully drop the six Derivatives duplicates (sin/cos/tan/sec/csc/ln) as proposed, or keep sin/cos/tan on both tabs for zero-tap access and only drop sec/csc/ln?
3. **Post-correct hierarchy:** when a student answers correctly, should "Next question →" become a full primary button (my recommendation) and "Check answer" disappear entirely, or should "Check answer" just be visually demoted (e.g., to `.button.subtle`) while staying present as a no-op?
4. **Sequencing:** tackle the keyboard rebuild first (it's the owner's own top complaint and touches every question), or the post-correct hierarchy first (smaller, touches the emotional peak of every session)? Either is a small, bounded change; I don't see a technical reason to sequence one before the other.
5. **DESIGN.md:** should it be drafted now against the outline above, or after the three open decisions here (digit layout, Functions curation, and the still-pending celebration-frequency decision in `docs/ui-review.md`) are made, so it's written once as settled canon rather than needing an immediate revision?

---

## Run Notes

- **Method:** single-context, inline (per explicit task constraint — not a tool-availability degradation).
- **Assessment B / detector:** not run (`impeccable detect`, the live-server overlay flow, and any downloaded binary are all out of scope for this run).
- **Browser automation:** not used (constraint); all screen evidence is the pre-captured baseline set.
- **Evidence read in full:** `src/main.ts`, `src/style.css`, `src/math-keyboard.ts`, `src/whats-new.ts`, `help.html`, `docs/ui-review.md`, `docs/reviews/2026-09-26-design-system/baseline/keyboard-geometry.json`, and all 22 PNGs in that baseline folder.
- **Evidence gaps found, not papered over:** `390-light-06-feedback-wrong.png` actually captures the *correct*-answer state, not a wrong-answer state — there is no wrong-answer screenshot in the baseline set (flag for whoever maintains the capture script). No What's New dialog screenshot exists (reasoned from source). No dark-mode or 1280 px capture exists for Move Progress, hint/solution, or the learning path. The footer-alignment item from `docs/ui-review.md` was not independently re-measured.
- **Persistence:** none — no snapshot written, per task instruction.
- **Nothing in the repo was modified.**
