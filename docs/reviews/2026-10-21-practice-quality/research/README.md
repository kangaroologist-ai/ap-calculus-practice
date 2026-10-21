# Research scripts (2026-10-21)

Scratch scripts that produced the numbers in `../plan.md`. They are records, not product code. They import the project source by absolute path and were run with `npx tsx <file>` from the repository root.

| File | Produces | Used in |
|---|---|---|
| `nums.ts` → `nums.txt` | Largest number in the simplified answer, per template (120 seeds) | R1 |
| `sim.ts` | Promotion milestones for uniform-accuracy students | R2 |
| `progress-v.ts`, `sim2.ts` → `variants.txt` | Scheduler variants (order, diagnostic limit, one-question pass) | R2 |
| `sim3.ts` | Question reasons per variant | R2 |
| `sim4.ts` | AP-order path variants (rejected in G6) | R3 |
| `fsrs.ts` | FSRS intervals | R2 |
| `parse.ts`, `parse2.ts` | Compute-engine parse of abstract-function answers | R4 |
| `mastery.ts`, `sim5.ts` → `mastery-results.txt` | Mastery-model prototype (BKT and Elo/IRT-style) against the current scheduler, with a truth model that has one hidden weak skill per student | R7 |
