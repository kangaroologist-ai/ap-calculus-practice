# Design review context: student accounts (1.4.0)

## Product and repository

- Repository: `/Users/kangaroologist/Documents/20_Study/AP Calculus/ap-calculus-practice` (Vite + TypeScript, static site on Cloudflare Pages with Pages Functions and D1).
- AP Calculus derivative practice for high-school students. Phone first (iPhone Safari), then laptops. English-only interface. Offline first: the browser keeps progress; accounts are optional (new in 1.4.0).
- New in this release: optional sign-in with a teacher-issued login code, online sync with a conflict prompt, sign-out, and a read-only teacher page `/teacher` with a full mastery grid.
- Main files: `src/main.ts` (header, sign-in sheet, account sheet, conflict dialog), `src/account.ts` (status and error text), `src/style.css`, `src/teacher.ts`, `src/teacher-grid.ts`, `src/teacher.css`, `teacher.html`, `help.html` (new section `#account`).

## Scope (full review: new page and new components)

Spec items S4 (sign-in on the practice site), S5 (sync and the conflict prompt, interface part only), S6 (teacher page), S8 (privacy text, approved by the owner: do not reword it, but you may comment on its placement), S9 (help, What's new). Task document: `docs/reviews/2026-10-22-accounts/plan.md` (read the Spec section).

States to review:

- Account states, `artifacts/design/1.4.0/accounts/<viewport>-<theme>-<id>.png`, viewports 390 (WebKit iPhone emulation) and 1280 (Chromium), light and dark:
  - A01 signed out (header with Sign in), A02 sign-in sheet, A03 wrong code message, A04 signed in (header status and account button), A05 account sheet, A06 offline status after an answer, A07 conflict dialog “Two copies of your progress”, A08 teacher code form, A09 teacher grid (8 demo students in “AP Calculus AB 2026”, 2 test students in “Test class”), A10 help page section “Save your progress online”.
- Standard states, `artifacts/design/1.4.0/` (signed out; compare with `artifacts/design/1.3.0/` for regressions): 01 welcome (header changed), 14 Move progress, 15 What's new (1.4.0 entry).
- Known test artifacts, not findings: in A07 both copies show the same minute because the script makes them seconds apart; A07 shows “Saving…” behind the dialog because the prompt waits for the student (known P3 in the plan).

Dev server: `http://127.0.0.1:8788` (wrangler pages dev with a local D1). Seed test values: login code `TEST-K7QM-4ZX9-B2` (Ada Test), teacher code `RJ7K-2M4X-9QWD-5T8N`. These are invented local test values.

## Rules

- Base everything on `docs/design/DESIGN.md` (new sections §5.7 account and §5.8 teacher page; §1 changed). Point out violations, and also say where DESIGN.md itself is unreasonable.
- Read-only: change no file in the repository.
- Return the report as your final reply (you cannot write report files).
- Do not use the shared browser pane. If you need more screenshots, write a Playwright script in your own scratchpad and run it with `node --import tsx`; the server above is running.
- Do not run the impeccable detector (no owner consent for this release); use the degraded-mode marker that the skill requires.
- Mark any finding that conflicts with the Spec; do not ask for Spec changes as fixes.
