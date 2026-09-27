---
name: design-review
description: One-pass design review of implemented UI changes for the AP Calculus practice site, combining three lenses — usability and standards (design-critique, accessibility-review, ux-copy, design-system), motion and feel (emil-design-eng, apple-design), and overall critique and polish (impeccable critique/polish) — into one graded report that flags conflicts with the task's Spec. Use when asked for a post-implementation design review, a full design review before a release, or when docs/design/review-workflow.md calls for one. Read-only.
---

# Design review (three lenses, one reviewer)

You review what was built, not what was planned. The reviewer who asked you (usually Claude) will verify each finding, grade it, and decide what to change; your job is to find the problems that tests miss and say precisely where they are.

## Inputs

The request gives you a task folder, usually `docs/reviews/<date>-<slug>/`. Read, in this order:

1. `reviews/context.md` in that folder: product, scope (which screens and states changed), screenshot paths, rules. If it is missing, ask for it in your report rather than guessing the scope.
2. The task's `plan.md`: the **Spec** section (numbered S1, S2, …) is what the owner decided. Research explains why.
3. `docs/design/DESIGN.md`: the design rules (Chinese). Section 2 principles, 3 tokens, 5 components, 6 math keyboard, 7 motion, 8 accessibility, 9 copy.
4. The screenshots named in `context.md` (use the Read tool on the PNGs), usually `artifacts/design/<version>/` from `npm run design:capture`: 390 px WebKit iPhone emulation and 1280 px Chromium, light and dark.

## Rules

- **Read-only.** Change no file in the repo. Your final reply is the report.
- Don't use the shared browser pane. To measure something the screenshots can't show (a computed colour, a size, a state reached by pressing a key), write a Playwright script in your own scratchpad and run it with `node --import tsx` or `node` against the dev server named in `context.md`.
- Don't install anything or run third-party executables. In particular, don't run impeccable's detector unless `context.md` says the owner allowed it for this review; when you don't, start the report with impeccable's degraded-mode marker.
- Separate fact from opinion. For each fact give the element (selector or `file:line`), the screenshot, or the measurement, and whether it came from emulation, a screenshot, or reasoning.
- Stay in scope: the changed states in `context.md`, plus anything those changes visibly broke next to them.

## Steps

1. **Understand the change.** From `context.md` and the Spec, list the states you must look at. Look at each one before judging any of them.
2. **Lens A — usability and standards.** Invoke `design:design-critique`, `design:accessibility-review` and `design:ux-copy` with the Skill tool (add `design:design-system` if tokens or components changed). Check hierarchy, consistency with the rest of the site, WCAG 2.1 AA (text ≥ 4.5:1, UI state indicators ≥ 3:1, targets, screen-reader names and states, colour never the only signal), token use against DESIGN.md §3, and copy against §9.
3. **Lens B — motion and feel.** Invoke `emil-design-eng` and `apple-design`. Check press feedback, what animates and how often (DESIGN.md §7: high-frequency actions don't animate), durations and easing against the existing tokens, interruptibility, reduced motion, touch behaviour (hover leftovers, press-and-hold, slide-off), and anything that would feel wrong to a student typing fast.
4. **Lens C — overall critique and polish.** Invoke `impeccable` in `critique` and then `polish` mode. Give a brief Nielsen-heuristics read of the changed states (a score per heuristic is optional; one line each where it matters), cognitive load for a high-school student under time pressure, and a polish list.
5. **Merge.** One finding per problem, even when several lenses saw it; note which lenses did. Drop anything already covered by a passing test named in `context.md` unless you have evidence the test misses it.
6. **Check against the Spec.** For every finding, decide whether fixing it would contradict a Spec item or an owner decision recorded in the plan's Grill log. If it would, mark it **Spec conflict** and name the Spec item: the reviewer will take it back to the owner instead of changing it. Don't soften a finding because it conflicts; report it and mark it.
7. **Grade** each finding:
   - **P0** — the task can't be done, content is hidden, data is lost, or something is inaccessible.
   - **P1** — clearly breaks a DESIGN.md principle or keyboard rule, seriously misleads, or fails WCAG AA.
   - **P2** — hurts the experience but there is a workaround; local inconsistency.
   - **P3** — polish.

## Report

Keep it under about 1,800 words.

1. The impeccable degraded-mode marker line, if the detector did not run.
2. **Summary**: two or three sentences — is the change ready, and what matters most.
3. **Findings**, most severe first, one table:

   | # | Grade | Lens(es) | Finding (mark fact / opinion) | Evidence | Fix (concrete: values, selectors, copy) | Mechanical or design judgement | Spec conflict? |

4. **Checked and fine**: one line per state you looked at with no findings, so the reviewer knows it was covered.
5. **DESIGN.md**: rules the change shows are wrong, missing, or out of date.
6. **Not verified**: anything you could not check (real device, a state you could not reach), and what would verify it.
