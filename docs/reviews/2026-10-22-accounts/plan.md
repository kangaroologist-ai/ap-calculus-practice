---
task: accounts
phase: implement      # grill | research | spec | todo | implement | acceptance | done
scope: ap-calculus-practice (site, new Pages Function, new D1 database, README, help.html, DESIGN.md)
branch: main
version: 1.3.0 → 1.4.0 (expected; a new user-visible feature)
commits:              # - <hash>: <key result>
  - 7b67ab0: T2 sync table and scheduler, 25 tests
  - 799a870: T1/T1b server, 510 unit tests, 8 API e2e tests (Chromium, WebKit)
  - 0f52494: T4 teacher page, 9 grid tests, visual check at 1280 and 390 px
  - 3543888: T1r P3 fixes, IPv6 /64 limit key, early 413, 40 Function tests
  - 3705dd9: T5 teacher script, 18 script tests, 16 account e2e tests
  - 07dc81d: T3 sign-in and sync, 584 unit tests, 28 account e2e, 220 existing e2e
  - dd6bf85: T10a save once per question (5 s wait), 603 unit tests
  - 21841dd: T10b design fixes and _routes.json
  - 28e6b7d: 200% zoom header fix, 42 account e2e, 220 existing e2e
---

<!-- Write this document in English, in the ASD-STE100 core style (see SKILL.md, Writing). Owner answers stay verbatim. -->

# Student accounts that save progress online

## Grill (decision log)

Recon (2026-10-22), read before the questions:

- `docs/reviews/2026-10-21-practice-quality/plan.md`: G8, L1, R5, R6. The owner approved this task there. Approved points:
  - A teacher-issued class code plus a personal login code. No email.
  - One code works on any device. The code is a key, not a device lock.
  - Local progress stays primary. One Pages Function stores the compact snapshot in D1.
  - The newer copy wins, and the student sees a prompt before a replacement.
  - Use with no account stays possible. The free Cloudflare plan is enough.
- `src/storage.ts`: IndexedDB `derivative-studio`, store `state`, keys `current`, `backup`, `pre-migration`. `saveState` queues every write. `replaceState` keeps the old state as `backup`.
- `src/transfer.ts`, `src/compact-progress.ts`: `makePortableProgress` + `encodeProgress` give the DSP2 code (profile 4). README: 1,181 characters for the frozen 26-skill fixture, 1,862 characters with all 28 skills.
- `src/progress.ts:75`: `Progress.updatedAt` changes on each answer. `src/main.ts:1399`: the import screen already compares `updatedAt`.
- `src/main.ts:307`: the header shows “On your device” and the Move progress button.
- `wrangler.toml`: Pages project only. No Functions, no bindings. README line 142: “纯静态部署，无 Workers Functions 和数据库需求”.
- README line 3 and `DESIGN.md` §1: “no accounts”, “progress only in this browser”. `help.html` #move: “Progress is not uploaded to a student database.” All three change in this task.
- `public/practice-config.json`: the teacher setting file. `public/_headers`: no-store for that file; `Referrer-Policy: no-referrer`.

Size class: large - a new server part, student data on a server, a privacy text, and a sync rule. Rounds continue until the frontier is empty.

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G1 | How the teacher makes and gives out the codes | **The owner runs a script on the laptop: input a class name and a name list; output a print sheet (one slip per student: code and a sign-in QR) and a local name list; the script writes only code hashes to D1** / a teacher page on the site, protected by a teacher code / students register themselves with the class code | “笔记本上运行脚本” → recommended (G3 changes what the script writes) | 2026-10-22 |
| G2 | What the student types to sign in (a refinement of G8 in practice-quality: the class code stays, as the first part of the one code) | **One code that includes the class, for example `CALC-K7QM-4ZX9-B2`** / two fields: class code, then personal code | “一个码，含班级” → recommended | 2026-10-22 |
| G3 | Student names on the server | **No names on the server; the teacher keeps the name list on the laptop** / the server stores names | “存姓名” → the server stores names (not the recommendation) | 2026-10-22 |
| G4 | Teacher view of student progress | **Not in this task; a later task can add a report that the script makes on the laptop** / a teacher progress table in this task | “这次做” → a teacher progress table in this task (not the recommendation) | 2026-10-22 |

Default assumptions (round 1, for the owner to correct):

- A1 Two devices: the site takes the newer copy with no prompt when only one side changed since the last sync. A prompt comes only when both sides changed. The prompt shows both times, and the other copy goes to the local backup.
- A2 First sign-in on a device with local progress: an empty account takes the local progress. An account with progress uses the A1 prompt.
- A3 Use with no account stays, as in G8. Move progress (export and QR) stays for all students.
- A4 Practice works with no network. The site syncs when the network comes back.
- A5 The teacher can give a student a new code and keep the progress, and can delete a student's or a class's data with the script. No automatic deletion.
- A6 Claude drafts the privacy text. The owner approves the wording at the Spec talk-through.
- The owner did not correct A1–A6 in round 1 (2026-10-22). They stay as assumptions.

Round 2 frontier (after G3 and G4, 2026-10-22). The teacher view is now in scope, so its form and access are open:

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G5 | Where the teacher sees progress | **A teacher page on the site (`/teacher`), opened with a teacher code; it works on any device** / an HTML report that the laptop script makes | “两个都要” → both: the teacher page and the script report | 2026-10-22 |
| G6 | What the teacher table shows | **One row per student: name, last practice, unlocked level, skills mastered, the three weakest skills; select a row to see all 28 skills** / one summary row per student only / a full 28-column grid | “完整网格” → a full grid: one row per student, one column per skill (not the recommendation) | 2026-10-22 |
| G7 | Teachers and classes | **One teacher (the owner) with one or more classes; one teacher code shows all classes** / several teachers, each sees only their classes | “只有您，可多个班” → recommended | 2026-10-22 |
| G8 | The student's name after sign-in | **Show “Signed in as <name>”, so the student can see that the code is theirs** / show no name | “显示姓名” → recommended | 2026-10-22 |

Default assumptions added after round 2 (for the owner to correct at the Spec talk-through):

- A7 Sign out: the site first saves online. Then it removes the code and the progress from this device, because the online copy keeps them. A shared school computer then shows no progress of the last student. With no network, the site does not sign out and tells the student why.
- A8 The teacher page and the script report only show data. The teacher adds, renames, and deletes students with the script.
- A9 The name is the text that the teacher types in the name list.

Frontier after round 2: empty, except the confirmation of A1–A9 and the privacy wording at the Spec talk-through.

Loop-back rounds during implementation:

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| L1 | Deploy (T9): create D1, apply the schema, make the teacher code, deploy 1.4.0, live check | **Yes, after the design review has no open P0/P1** / not yet | “同意执行，但注意cloudflare写入读取的次数限制，方法上尽量节省” → yes, plus a new requirement: use as few Cloudflare reads and writes as possible (R5) | 2026-10-22 |
| L2 | How often to save online (R5) | **When the student leaves the page, and at most once per 5 minutes during practice** / at most once per minute plus on leave / keep 20 s | “能不能每题保存一次？没多少学生” → save once per question (not the recommendation). Claude's method (R5): wait 5 s after the last change of progress, then save once, so the answer and Next of one question make one save; page hide saves at once | 2026-10-22 |


Effect of G3 and G4 on the design (Claude, 2026-10-22):

- **[I]** The server stores the name with the code hash. The privacy text must say that the teacher sees the name and the progress.
- **[I]** The teacher page can decode the stored compact snapshots in the browser with the existing `decodeProgress` code. The server stays a store of snapshots and does not read them.

Owner agrees with this understanding: 2026-10-22, after the Spec talk-through (Spec and privacy text; A7–A9 not corrected): “两件都确认” → the Spec and the privacy text are approved, and implementation can start.

## Research

Labels: **[F]** fact (source), **[I]** inference, **[U]** unknown, **[P]** problem that was there before this task.

### R1. The problem

- **[F]** Progress is only in the browser (README line 3). Safari deletes it after about 7 days of Safari use with no visit (practice-quality R5).
- **[F]** Export and QR protect only a student who exports often (practice-quality R5).
- **[I]** A signed-in student also keeps progress after “Continue without saving” (`src/main.ts`), because the server keeps the copy.

### R2. Technical method

First pass, 2026-10-22 (`researcher` subagent; page dates are the “last updated” dates on the pages). The route is not chosen until the Grill ends.

- **[F]** Pages Functions use the Workers Free quota: 100,000 requests per day, reset at 00:00 UTC. Static asset requests are free and do not count. Pages Functions Pricing (2026-09-08).
- **[F]** Workers Free: 10 ms CPU per request, network waits not counted. Over the limit: error 1027. Workers Limits (2026-10-12). **[I]** The same limit applies to Pages Functions.
- **[F]** A Pages project can “fail open” at the limit: static assets still load. Settings > Runtime. Pages Routing. `_routes.json` can limit Functions to `/api/*`.
- **[I]** At the limit, only sync fails. Practice continues from local storage.
- **[F]** D1 Free: 5 million rows read and 100,000 rows written per day. At the limit, queries stop until 00:00 UTC. D1 Pricing (2026-04-21).
- **[F]** D1 limits: 500 MB per database, 2,000,000 bytes per row, 100,000 bytes per statement, 50 queries per invocation on Free. D1 Limits (2026-04-21). **[I]** A 2 KB snapshot is far below these limits.
- **[F]** Time Travel (point-in-time restore) on Free: 7 days. D1 Time Travel (2026-04-21).
- **[F]** Binding: `[[d1_databases]]` with `binding`, `database_name`, `database_id` in `wrangler.toml`. With a `wrangler.toml`, the file is the source of truth for the project. Pages Wrangler configuration (2026-06-25).
- **[F]** Migrations: `wrangler d1 migrations create` and `wrangler d1 migrations apply --local|--remote`. A failed migration rolls back. D1 Wrangler commands (2026-04-21).
- **[F]** Local development: `wrangler pages dev ./dist` with a local D1. Pages local development cannot use the remote D1. D1 Local development (2026-06-25).
- **[F]** The Cloudflare Vitest integration (`@cloudflare/vitest-plugin`) needs Vitest 4.1 or later. Its page does not mention Vitest 5 (2026-10-17). **[U]** Whether it works with the project's Vitest 5.0.1.
- **[I]** Alternative for tests: call the Function handler directly with a small fake D1. No official page describes this.
- **[F]** Rate Limiting binding: `ratelimits` config, period 10 s or 60 s, wrangler ≥ 4.36.0. Counts are approximate and per Cloudflare location (2026-10-21). **[U]** Free-plan and Pages support are not stated.
- **[F]** WAF rate limiting on Free: 1 rule, IP only, 10 s period. Turnstile is free. WAF rate limiting rules; Turnstile plans (2026-08-14).
- **[I]** Protection against code guessing must come mainly from code length. A 10-character random part from a 32-symbol alphabet gives 50 bits. With 100 students and 3 × 10^9 guesses in a year, the chance of one hit is about 3 × 10^-4.
- **[U]** NIST SP 800-63B-4 guidance on look-up secrets: the researcher could not open the page.
- **[I]** The server can store a SHA-256 hash of the code, not the code. Slow hashing is not necessary for a long random secret, so the 10 ms CPU limit is not a problem.
- **[F]** `wrangler d1 execute <db> --remote --file=…` runs SQL from the laptop. `wrangler login` is enough on a laptop. Wrangler commands (2026-09-02).
- **[F]** D1 location: near the place of creation, or a location hint (`apac`, `weur`, …), not guaranteed. A jurisdiction (`eu`, `us`) can be set only at creation. D1 data location.

### R3. Sync order and the saved code (decided by Claude, 2026-10-22)

- **[F]** `updatedAt` comes from the device clock (`src/progress.ts:328`, `Date.now()`).
- **[I]** Device clocks can be wrong. The sync must not order copies by `updatedAt`.
- **[I]** Method: the server gives each saved copy a revision number. The client sends the revision of its last sync. The server refuses a write with an old base revision.
- **[I]** That refusal is the “both sides changed” case of A1. Only then does the student see a prompt. The prompt shows `updatedAt` only as information.
- **[F]** Prior art: the import review panel (`src/main.ts:1399–1411`) already shows “older learning activity than this device”. The sync prompt can use the same panel pattern.
- **[F]** Safari's 7-day rule deletes all script-writable storage (practice-quality R5). That includes a login code saved in IndexedDB or localStorage.
- **[I]** After such a loss, the student must type the code again from a source outside the browser. So the printed slip and its QR (G1) are a recovery requirement, not only a convenience. Help must say: keep the slip.

### R4. Selected method (Claude, 2026-10-22, after Grill rounds 1–2)

Methods examined:

- Pages Function + D1 (selected). Same origin as the site, so no CORS. Free plan. Static pages do not use the Function quota (R2).
- A separate Worker on its own address: one more deploy and CORS. No gain.
- A third-party database service (for example Supabase): a second account and a second privacy place. No gain at this size.

Facts and decisions for the selected method:

- **[F]** `@cloudflare/vitest-plugin` 1.4.6 has the peer dependency `vitest: ^4.1.0 || ^5.0.0` (`npm view`, 2026-10-22). It works with the project's Vitest 5.0.1. This closes the R2 unknown.
- **[F]** `npx wrangler whoami` shows a signed-in account on this laptop (2026-10-22). The script can use `wrangler d1 execute --remote`.
- **[F]** `vite.config.ts` builds two pages (`index.html`, `help.html`). A third input `teacher.html` follows the same pattern.
- **[F]** `decodeProgress` (`src/transfer.ts:91`) decodes a DSP2 code, and it runs `migrateProgress`. The teacher page and the script report can use it.
- **[F]** Each skill has `mastery` (0–1) after the first read (`src/progress.ts:56`, `masteryOf`). `SKILLS` in `src/catalog.ts` gives the labels and the path order. `practice-config.json` turns off three families today.
- **[F]** Node 24.14.1 on this laptop has `node:sqlite` (SQLite 3.51.2), checked 2026-10-22.
- **[I]** Test method change (Claude, 2026-10-22, during implementation start): the Function unit tests call the handlers directly with a small D1 adapter over `node:sqlite`. No new dependency. The account end-to-end tests (T1b) run the real runtime with `wrangler pages dev` and a local D1, so they cover the Cloudflare runtime. A first `npm install` of `@cloudflare/vitest-plugin` was stopped before it changed `package.json`; `npm prune` removed its files.
- **[I]** The server stores the DSP2 code as text and does not decode it. The client and the teacher page decode it. Thus a new progress format needs no server change.
- **[I]** Code hash: SHA-256 of the normalized code (`crypto.subtle`, well below 10 ms). A long random code does not need a slow hash (R2).
- **[I]** Guessing control: a D1 counter of failed sign-ins per IP hash and 10-minute window. The free WAF rule on `/api/` is an optional extra step in the dashboard.
- **[I]** Write load: a sync after answers at most once per 20 s, and at page hide. 100 students × 60 answers per day gives at most 6,000 writes per day, 6% of the free limit.
- **[I]** Restore after a bad write: the local `backup` key (`src/storage.ts`) on each device, and D1 Time Travel (7 days) on the server.
- **[F]** `.gitignore` has `.env*` and `artifacts/`, but no folder for private name lists. The script must write names and codes to a folder outside git.

Risks:

- **[I]** A sync bug can replace good progress. Control: the revision rule (R3), the local backup on every replacement, unit tests of the decision table, and a two-browser end-to-end test.
- **[I]** Names are now personal data on Cloudflare. Control: the privacy text (S8), no names in logs, `Cache-Control: no-store` on all `/api/` answers, and a script command to delete data.
- **[I]** A lost slip after a Safari wipe: the teacher gives a new code with `reissue`, and the progress stays.

### R5. Cloudflare reads and writes (L1, 2026-10-22)

Assumption for the estimate: 100 students, 20 minutes of practice per day each, one answer about every 30 s (40 answers).

- **[F]** Each online save is one Function request, one D1 row write (`UPDATE students … WHERE code_hash = ? AND revision = ?`, unique-index lookup), and about two rows read (the guessing-limit check and the update). `functions/api/progress.ts`, `functions/_lib/attempts.ts`.
- **[F]** Each page open of a signed-in student is one request and about three rows read (`POST /api/session`). Each teacher-page load reads every student row once.
- **[F]** Failed sign-ins write one `login_failures` row and delete old ones. Correct sign-ins write nothing.
- **[F]** Today the client saves at most once per 20 s (`SAVE_INTERVAL_MS`, `src/sync.ts`) and at page hide (`visibilitychange` hidden and `pagehide`, `src/main.ts`).
- **[I]** Estimate per day for 100 students: 20 s gives about 4,100 writes and 4,200 requests; 60 s about 2,100; 5 minutes plus page hide about 500 writes and 600 requests. Free limits: 100,000 writes, 100,000 requests (R2), 5,000,000 rows read. Reads stay below 1%.
- **[F]** The Functions request limit is per Cloudflare account, shared with any other Worker or Pages Function in it (R2).
- **[I]** The online copy only has to be current when the student moves to another device or the teacher looks. The page-hide save covers the first case; the timed save is only a safety net and feeds the teacher page.
- **[I]** Cost of a 5-minute interval: the teacher page can lag up to 5 minutes behind a student who is still practising; a second device that opens while the first is still in use gets progress up to 5 minutes old. Practice itself never waits for the network.
- **[I]** With a long interval, “Saving…” during the wait would be wrong. The status needs a state for “newest answers are on this device, the online save comes later” (design review finding 1 and Codex T3 round 3 point to the same problem).
- **[U]** Whether Pages adds a `_routes.json` that limits Functions to `/api/*`. **[I]** An explicit `public/_routes.json` makes sure that static files never run a Function.
- **[F]** One question changes `progress.updatedAt` twice: `recordOutcome` once per question (`current.recorded`, `src/progress.ts:240`), then `finishQuestion` on Next or Skip (`src/progress.ts:496`). A hint before the answer also records.
- **[I]** L2 method: a trailing wait of 5 s after the last change, then one save. Answer and Next fall in one window, so one question gives about one save. Estimate: 30 students × 40 questions ≈ 1,200 writes and 1,300 requests per day (about 1.3% of the free limits); 100 students about 4,000.
- **[I]** The status needs no separate waiting state: “Saving…” lasts at most about 5 s plus the request.

### R6. Full design review (P4, 2026-10-22)

`design-reviewer` (report in this task's `reviews/`): 2 P1, 6 P2, 7 P3, no Spec conflict. Claude checked the key claims in the code: the footer is set only in `render()` (`src/main.ts:415`); the ≤ 430 px rule that hides the brand name is new in T3 and not scoped to signed-in (absent in `87ba656`); `.teacher-table thead th { z-index: 3 }` outranks `.teacher-name-heading { z-index: 6 }`. Claude's grading and decisions:

- P1-1 footer says “progress saved online” while offline: fix. The footer becomes “Signed in as <name>”; only the header shows the save state.
- P1-2 sign-in error below the button, likely under the iPhone keyboard: fix (error under the field, `aria-describedby`, `aria-invalid`, reserved height). iPhone check in P5.
- P2-3 status text truncated at ≤ 375 px: fix (wrap to two lines, never truncate; test at 375 and 320).
- P2-4 teacher Name header under other headers after scroll: fix (selector specificity).
- P2-5 teacher selects 23 px tall in WebKit: fix (`appearance: none`, chevron, 44 px).
- P2-6 brand name hidden for signed-out phones: fix (scope to signed-in).
- P2-7 signed-in copy still says “saved in this browser” / “No account needed”: fix (signed-in variants).
- P2-8 Sign out as a red danger button with no explanation: fix as proposed (subtle button and the sentence “Signing out saves your progress online, then removes it from this device.”); §5.1 stays.
- P3 accepted for this release: 9 (narrower Name column on phones: fix, cheap), 10 (“Nothing to save yet”: fix), 11 (“Signing in…”: fix), 12 (gap in “Signed in as”: fix), 13 (header 12 px vs content 16 px: fix with 3). Not changed: 14 (masked teacher code; the teacher chooses where to type it), 15 (no “newer” hint in the conflict dialog; device clocks are not trusted, R3).

## Spec

Draft for the talk-through, 2026-10-22. Version 1.3.0 → 1.4.0.

Requirements that stay: local IndexedDB progress stays primary; Move progress (export, QR, import, Restore backup, Reset) does not change; the DSP2 format and profile 4 do not change; use with no account stays (A3).
Requirements that change: README, `help.html` and `DESIGN.md` §1 no longer say “no accounts” and “no student database”.
New requirements: S1–S9.

Terms:

- **Login code**: the code that a student types to sign in. It has the class prefix and a random part, for example `CALC-K7QM-4ZX9-B2`.
- **Teacher code**: a longer random code that opens the teacher page.
- **Online copy**: the DSP2 code of a student's progress in D1, with its revision number.
- **Revision**: a number that the server adds 1 to at each accepted save (R3).

- **S1 Online store.** *From:* G8 (practice-quality), R2, R4
  - Pages Functions under `functions/api/` and one D1 database bound as `DB` in `wrangler.toml`. Static pages do not call a Function.
  - Tables: `classes` (prefix, name), `students` (id, code hash `UNIQUE`, class prefix, name, online copy, revision, `updatedAt` from the client, server save time), `teacher` (code hash), `login_failures` (IP hash, window, count). The student `id` stays the same when the teacher gives a new code (`reissue`). A migration file in `migrations/` makes the tables.
  - Endpoints: `POST /api/session` (login code → name, class, revision, online copy); `PUT /api/progress` (login code, base revision, DSP2 code, `updatedAt` → new revision, or 409 with the newer online copy); `POST /api/teacher` (teacher code → all classes and students with online copies).
  - The server checks: body ≤ 16 KB; the DSP2 code has the form `DSP2.<8 hex digits>.<URL-safe Base64>` (`src/transfer.ts:87`); the base revision is a whole number. The server does not decode the code.
  - All `/api/` answers have `Cache-Control: no-store`. The server logs no names and no codes.
  - The Pages project uses “fail open”, so the site loads when the daily limit is reached.
  - `public/_routes.json` limits Functions to `/api/*`, so static files never count as Function requests (L1, R5).
  - *Accept:* Function tests (handlers called directly, D1 adapter over `node:sqlite`, R4) for each endpoint, the 409 case, a wrong code, an oversized body, and a bad code text.
- **S2 Codes.** *From:* G2, G7, R2, R4
  - Login code: class prefix of 2–8 letters, then 10 random characters from the Crockford Base32 alphabet (50 bits), shown as `PREFIX-XXXX-XXXX-XX`.
  - Input is not case-sensitive. The site ignores spaces and hyphens, and reads `O` as `0` and `I`/`L` as `1`.
  - Teacher code: 16 random characters (80 bits). One teacher code shows all classes (G7).
  - The server stores only SHA-256 hashes of the normalized codes.
  - *Accept:* unit tests for generation, normalization, and the alphabet.
- **S3 Guessing control.** *From:* R2, R4
  - A class can sign in from one school network, so all students share one IP. Thus the limit counts only failed sign-ins, and it is high: after 60 failed sign-ins from one IP in 10 minutes, the server answers 429 until the window ends. Correct sign-ins do not count. This applies to login codes and to the teacher code.
  - **[I]** The guessing control comes mainly from the 50-bit code (R2). 60 failures in 10 minutes is about 3 × 10^6 guesses per year per IP; the chance of one hit with 100 students is below 10^-6.
  - The site then says: “Too many attempts. Wait 10 minutes, then try again.”
  - *Accept:* Function tests: 30 students sign in from one IP with correct codes and 20 typing errors, with no 429; 61 bad codes from one IP give 429.
- **S4 Sign-in on the practice site.** *From:* G2, G8, A3, A7
  - Signed out: the header keeps “On your device” and shows a **Sign in** button next to Move progress.
  - The sign-in sheet has one code field, a short privacy note (S8), and **Sign in**. Use without an account stays the default.
  - The slip QR opens `/#login=<code>`. The site fills the field, clears the address bar, and asks the student to confirm. The fragment does not go to the server.
  - Signed in: the header shows “Signed in as <name>” and the sync status: “Saved online”, “Saving…”, or “Offline: saved on this device”.
  - Sign out (A7): the site saves online first, then removes the code and the progress from this device. With no network, sign out stops and the site says why.
  - The device keeps the login code, name, class, and last synced revision in IndexedDB key `account`.
  - Wrong code: “This code doesn't match a student. Check the code on your slip.”
  - Design review fixes (R6, 2026-10-22): the footer shows “Signed in as <name>” and no save claim; the sign-in error appears directly under the code field (`aria-describedby`, `aria-invalid`, reserved height) and the button says “Signing in…” during the request; the status text wraps to two lines on narrow phones and is never cut off; the brand name hides only for signed-in phones; signed-in copy: “Your work is saved on this device and online.” on the welcome card and no “No account needed.” in Move progress; the account sheet has a subtle **Sign out** button under the sentence “Signing out saves your progress online, then removes it from this device.”, and shows “Nothing to save yet” before the first online save.
  - *Accept:* end-to-end tests for sign-in, a wrong code, the QR link, and sign out; full design review; iPhone check by the owner (keyboard on the code field).
- **S5 Sync rule.** *From:* G8 (practice-quality), R3, A1, A2, A4
  - The `account` key keeps the revision and the `progress.updatedAt` of the last sync.
  - **Changed** means: `progress.updatedAt` is not equal to the value at the last sync. A save of the current question or the draft does not change `updatedAt` (`src/main.ts:278`), so it does not count.
  - **Equal copies** means: the decoded progress of the two copies is the same, with `exportedAt` removed (as `replaceState` compares, `src/storage.ts`). Two codes of the same progress have different text, because `exportedAt` changes.
  - On open, the site gets the online copy. Then it uses this table:

    | Online revision | This device | Action |
    |---|---|---|
    | same as last sync | not changed | nothing |
    | same as last sync | changed | save online |
    | newer | not changed | use the online copy, with no prompt |
    | newer | changed | prompt, unless the copies are equal |

  - First sign-in on this device (no last sync) uses this table:

    | Account | This device | Action |
    |---|---|---|
    | empty | no progress | nothing |
    | empty | has progress | save this device's progress online |
    | has progress | no progress | use the online copy |
    | has progress | has progress | prompt, unless the copies are equal |

  - Save timing (changed by L2, 2026-10-22): after a change of progress the site waits 5 s for more changes, then saves online once; one question (answer and Next) gives about one save. At page hide it saves at once (`keepalive`). Only one server call runs at a time. A 409 answer goes to the first table as “newer”.
  - Reset progress and Import progress while signed in: the confirmation says that the online copy changes too. The next sync saves the result online.
  - Prompt “Two copies of your progress”: for each copy, the time of the last practice, the unlocked level, and the number of skills started. Buttons: **Use the online copy** and **Keep this device's copy**. The copy that loses goes to the local backup, and Restore backup brings it back.
  - With no network, practice continues. The site saves online when the network comes back.
  - The site never merges two histories (README rule).
  - *Accept:* unit tests for every row of both tables, the 409 path, a draft save that does not count as changed, and the 5 s wait (answer plus Next within 5 s gives one save); an end-to-end test with two browser contexts and one login code (practice on A, open B, B shows A's progress; offline change on both, prompt, backup kept).
- **S6 Teacher page.** *From:* G4, G5, G6, G7, A8
  - `/teacher` (new page `teacher.html`) asks for the teacher code. The page keeps the code only in `sessionStorage`. It has `noindex`.
  - Full grid (G6): one row per student, grouped by class; one column per skill in path order. Skills of families that `practice-config.json` turns off do not show.
  - Each cell shows the mastery estimate in percent, with a color scale and a text value (not color only). A skill that the student has not started is empty.
  - Fixed columns before the skills: name, last practice, unlocked level. The name column stays in view during horizontal scroll. On a phone, the grid scrolls horizontally.
  - A class filter and a sort by name or by last practice.
  - The page only shows data (A8).
  - Design review fixes (R6): the Name header stays above the other headers during horizontal scroll; the class and sort selects are 44 px tall in WebKit too; on phones the Name column is about 7rem wide and long names wrap.
  - An online copy from a newer site version (`NewerProgressError`) shows “Reload the page to update”, as import does. A damaged copy shows “Can't read” in that row only.
  - *Accept:* unit test for the row data from a fixture DSP2 code; end-to-end test with a local D1; full design review at 390 px and 1280 px.
- **S7 Teacher script.** *From:* G1, G3, G5, A5, A8, A9
  - `scripts/accounts.ts` (run with `npm run accounts -- <command>`), with `wrangler d1 execute --remote`:
    - `create-class <PREFIX> "<class name>"`
    - `add-students <PREFIX> <names.txt>`: one name per line. It makes the codes, writes names and code hashes to D1, and writes a print sheet (one slip per student: name, code, sign-in QR, a short “keep this slip” note) and a CSV of names and codes.
    - `reissue <PREFIX> "<name>"`: a new code; the progress stays.
    - `delete-student <PREFIX> "<name>"`, `delete-class <PREFIX>`: ask for confirmation, then delete.
    - `teacher-code`: makes a new teacher code and replaces the old one.
    - `report [PREFIX]`: an HTML file with the same grid as S6, for saving or printing.
  - The script writes print sheets, CSV files and reports to a private folder outside the repository (default: `~/Documents/20_Study/AP Calculus/accounts-private/`). It writes nothing with names or codes into git.
  - *Accept:* unit tests for the SQL text it makes (names with quotes); a run against the local D1; one real run by the owner for the class.
- **S8 Privacy text.** *From:* G3, G4, A6
  - Places: the sign-in sheet (short), `help.html` (full), README (Chinese).
  - Content: what the site stores online (the name that the teacher typed, the class, the progress snapshot, save times); where (Cloudflare); who can see it (the teacher, and any person with the login code); how to delete it (ask the teacher); that use without an account stores nothing online.
  - Draft site text for the owner's approval (English only on the site):

    Sign-in sheet (short):

    > Signing in saves your progress online so you can continue on any device. Your teacher can see your name and your progress. Keep your code private.

    `help.html` (full, in the Move progress section):

    > **Saving online.** When you sign in with the code from your teacher, Practice stores your name, your class, your progress snapshot, and when it was saved on Cloudflare's servers. Your teacher can see this to follow your progress. Anyone who has your code can open your progress, so keep your slip private, and keep it safe: if your browser deletes its data, you need the code to sign in again. To delete your online progress, ask your teacher. If you do not sign in, nothing is stored online.

    README (Chinese): the same facts, plus the D1 tables and the teacher script.
  - *Accept:* the owner approves the wording before release. Approved 2026-10-22 (“两件都确认”). A later change of wording goes back to the owner.
- **S9 Documents and release.** *From:* AGENTS.md
  - README, `help.html`, `DESIGN.md` §1 and new components; What's new 1.4.0; version 1.4.0 with `npm version`; full design review (new page and new components); iPhone check by the owner; deploy; check live `/help`, `/teacher`, and one live sync.

## To Do

Owners follow the owner rule of 2026-10-22: DeepSeek-Flash writes code steps through `code-loop`, Codex reviews, Claude checks. T1 with T1b, T2, and T4 have separate file sets and can run in parallel worktrees. T3 needs T1, T1b and T2. T5 needs T1 and T4. T1b and T4 both touch `vite.config.ts`: Claude merges that file.

- [x] **T1** (S1, S2, S3) `wrangler.toml`, `migrations/0001_accounts.sql`, `functions/api/session.ts`, `functions/api/progress.ts`, `functions/api/teacher.ts`, `functions/_lib/*.ts`, `src/account-code.ts` (shared code rules), `tests/helpers/d1-sqlite.ts`, `tests/functions/*.test.ts`, `tests/account-code.test.ts`, `tsconfig.json` (include `functions`): build the store, code rules, and guessing control. *Verify:* Function tests pass; Claude reads the diff. *Owner:* DeepSeek (code-loop) - clear endpoints and tests from S1–S3. Done 2026-10-22 (`799a870`): DeepSeek-Flash wrote it (Qoder session `29c1e09b-75d7-4d2e-816b-cb340f700219`), Codex reviewed 3 rounds (round 1: count test, UTF-8 body size, concurrent limit; round 2: type errors, a future `updatedAt` refused; round 3: NO FINDINGS). Claude: `tsc` clean, 510 unit tests pass, diff read.
- [x] **T1b** (S4, S5, S6) `playwright.accounts.config.ts`, `playwright.config.ts` (ignore `tests/accounts/`), `vite.config.ts` (`/api` proxy for `npm run dev`), `scripts/local-d1.ts`, `tests/helpers/account-seed.ts`, `tests/accounts/api-smoke.spec.ts`, `package.json` (`test:e2e:accounts`, `db:local`): Vite dev does not run `functions/`. Make the account end-to-end tests run against `wrangler pages dev ./dist` with a local D1 that the migration and a seed class set up. The existing `test:e2e` stays on Vite. *Verify:* one smoke spec signs in with the seed code. *Owner:* DeepSeek (code-loop) - with T1, same file area. Done 2026-10-22 (`799a870`): 8 API end-to-end tests pass on `wrangler pages dev` in Chromium and WebKit. Claude fix: `wrangler d1 migrations apply --local` waits for a confirmation that a test server cannot give, so `scripts/local-d1.ts` runs the migration SQL with `d1 execute --file` (the SQL uses `IF NOT EXISTS`).
- [x] **T1r** (S1, S3) reviewer pass on T1. *Verify:* no P0–P2 open. *Owner:* `reviewer` - security and persistence are high risk (CLAUDE.md gate). Done 2026-10-22: `reviewer` NO FINDINGS at P0–P2. P3 notes, not blocking: body read before the size check; IPv6 clients can change address inside a /64, and the IP hash has no secret; non-ASCII case folding (for example `ı` → `I` → `1`) accepts equivalent codes; the test D1 batch is not a transaction; the placeholder `database_id` until T9; errors give 503 with no diagnostics. Claude fixed two of them after the review (2026-10-22): failures from IPv6 now count per /64 (`limitKey`), and a declared `Content-Length` over 16 KB gives 413 before the body is read. 40 Function tests pass. The others stay as accepted notes.
- [x] **T2** (S5) `src/sync.ts`, `tests/sync.test.ts`: the sync decision table as a pure function, and the 20 s save timer. *Verify:* a test for each table row and the 409 path. *Owner:* Claude - subtle logic; a wrong rule loses progress. Done 2026-10-22: `decideSync` (actions none / adopt / upload / download / prompt), `sameProgress` (compares encoded snapshots with one shared export time), `createSaveScheduler` (one save at a time, at most one per 20 s, `flush` with keepalive). 25 tests pass, including clock skew, a draft save, the 409 path, and an emptied account; `tsc` clean. Extra rule found while writing: an account that the teacher emptied takes this device's progress (upload).
- [x] **T3** (S4, S5) `src/main.ts`, `src/storage.ts`, `src/account.ts` (client calls), `src/style.css`, `tests/storage.test.ts`, `tests/account.spec.ts`: sign-in sheet, header states, QR link, sign out, sync wiring, conflict prompt. *Verify:* unit and end-to-end tests, including the two-context test. *Owner:* DeepSeek (code-loop) - UI wiring on the T2 interface. Done 2026-10-22 (`07dc81d`): DeepSeek-Flash (Qoder session `63f780f3-af20-41aa-b5be-c074cc22901d`), Codex 3 rounds (round 1: stale session response, offline sign-out, keepalive; round 2: changes during sign-out, status hidden on phones; round 3 left 2 P1 + 2 P2). Claude fixed round 3: one lock (`exclusive`) so only one server call runs at a time (a sign-in upload and an answer save could race into a conflict with the device's own copy); `noteSave` makes sign-in uploads count for the 20 s interval; Saving… while a save waits, Offline at once when the browser reports offline; practice blocked while sign-out runs. Claude also corrected 6 round-3 tests (an export adds the seeded mastery fields; two tests encoded the old race) and two e2e specs (practice cannot start offline: `practice-config.json`, as before this task). Deviation from the step text, accepted: at 390 px the status text stays visible (Codex: S4 needs readable status); the brand name and the Move label shrink instead. Checks: 584 unit tests, 28 account e2e (Chromium, WebKit), 220 existing e2e (65 browser-conditional skips).
- [x] **T3r** (S4, S5) reviewer pass on T3. *Verify:* no P0–P2 open. *Owner:* `reviewer` - persistence and module interface (high risk). Done 2026-10-22: `reviewer` found 3 P2, no P0/P1; Claude fixed all three in `07dc81d`: (1) a replaced code with unsaved answers could never sign out → message tells the student to export, then **Remove progress and sign out** clears after an explicit choice; (2) sign-out in a temporary session could fail or hang on IndexedDB → no clear in a temporary session, 5 s limit otherwise; (3) a silent download overwrote the only backup (a conflict loser could be lost) → `replaceState(…, keepBackup)`; only the conflict choice replaces the backup. New tests for each. P3 notes accepted: a conflict prompt closed with ✕ stays unresolved until the next sync event (no loss); no timeout on a hung request; one dead `continue` in `syncOnce`; in a temporary session the conflict loser has no restorable backup.
- [x] **T4** (S6) `teacher.html`, `src/teacher.ts`, `src/teacher-grid.ts`, `src/teacher.css`, `vite.config.ts`, `public/_headers`, `tests/teacher-grid.test.ts`: teacher page and the shared grid. *Verify:* unit tests; the end-to-end test comes in T5, because the seed data comes from T1b in a parallel worktree. *Owner:* DeepSeek (code-loop) - clear layout from S6. Done 2026-10-22 (`0f52494`): DeepSeek-Flash (Qoder session `0aa03038-b47e-40d0-9e85-98e626aeb461`) asked one question (where the step Spec file is), then Codex reviewed 3 rounds to NO FINDINGS. Claude found and fixed a runtime error that Codex missed: D1 returns the student `id` as a number, and the grid called string methods on it; one new test. 9 grid tests pass. Visual check on `wrangler pages dev` with 8 demo students: grid, level groups, bands, the empty row; at 390 px the name column stays in view and the page has no horizontal scroll. Evidence: `evidence/teacher-grid-1280.jpg`, `evidence/teacher-grid-390.jpg`.
- [x] **T5** (S6, S7) `scripts/accounts.ts`, `tests/accounts-script.test.ts`, `tests/accounts/teacher.spec.ts`, `package.json` (script): teacher script; uses `src/account-code.ts` from T1 and `src/teacher-grid.ts` from T4. *Verify:* unit tests and a run against the local D1. *Owner:* DeepSeek (code-loop) - bounded script. Runs after T1 and T4. Done 2026-10-22 (`3705dd9`): DeepSeek-Flash (Qoder session `824f52ac-6557-4f20-b90b-cbe39f27ade5`), Codex 3 rounds; round 1 and 2 findings fixed by DeepSeek (remote result parsing, names and codes in logs, file overwrite, symlinks, Wrangler disk logs, codes lost when a write fails). Round 3 left two P2 findings; Claude fixed them: the output folder is refused in every worktree of the repository (`git worktree list`), and private files are written with mode 600 in a 700 folder. Checks: 18 script tests; a local run of create-class, add-students (names with `'`, `,`, `ë`, `ü`), list, reissue, report, and a refused folder in the main checkout; 16 account e2e tests in Chromium and WebKit. Evidence: `evidence/slips-demo.png`, `evidence/report-demo.png` (demo names and local test codes).
- [x] **T6** (S1–S7) Claude review of each delegated step: read the diff, run `npm test`, `npm run build`, `npm run test:e2e`. *Verify:* all pass. *Owner:* Claude - final review. Done 2026-10-22: each step's diff read; on `main` after all merges: `tsc` clean, 604 unit tests, build; account e2e and existing e2e results as in T3. Steps that needed Claude fixes are named in T1b, T4, T5, T3, T3r.
- [x] **T7** (S8, S9) `README.md`, `help.html`, `docs/design/DESIGN.md`: privacy text, sign-in and sync help, teacher page, new components; remove “no accounts” and “no student database”. *Verify:* compare each statement with the code. *Owner:* Claude - docs are not delegated. Done 2026-10-22: README (new section “学生账号与在线保存”: login code, sign-in, sync table, sign-out, privacy, server, teacher page, teacher script; local dev; tests; first-time D1 steps; removed “无账号”, “无需学生数据库”, “纯静态部署”), `help.html` (new section “Save your progress online” with the approved privacy text; #move and iPhone text updated), DESIGN.md (§1 constraint and second user; new §5.7 account UI, §5.8 teacher page). Each label and message checked against `src/main.ts`, `src/account.ts`, `src/teacher.ts`, `scripts/accounts.ts`.
- [x] **T8** (S9) `package.json`, `package-lock.json`, `src/whats-new.ts`: `npm version 1.4.0 --no-git-tag-version`; What's new entry. *Verify:* the What's new unit test passes. *Owner:* Claude. Done 2026-10-22: `npm version 1.4.0 --no-git-tag-version` (package.json and lock), What's new 1.4.0 “Save your progress online” with 4 items; the What's new unit test passes (604 unit tests).
- [x] **T10a** (S5) `src/sync.ts`, `src/account.ts`, `tests/sync.test.ts`, `tests/account-client.test.ts`: save timing of L2: the scheduler waits 5 s after the last change, then saves once; `flush` saves at once; one save at a time; remove the 20 s interval and `noteSave`. *Verify:* unit tests for the wait, answer plus Next as one save, flush, failures. *Owner:* Claude - subtle timing in Claude's T2 code. Done 2026-10-22: `createSaveScheduler` waits `SAVE_DELAY_MS` (5 s) after the last change, then saves once; `flush` saves at once with keepalive (or right after a running save); one save at a time; `noteSave` and the 20 s interval removed. Tests: 8 scheduler tests (answer plus Next within 5 s is one save), 5 client tests moved to the 5 s wait, one obsolete test removed. README and help say “after each question”.
- [x] **T10b** (S1, S4, S6) `src/main.ts`, `src/style.css`, `src/teacher.css`, `public/_routes.json`, `tests/accounts/account.spec.ts`, `tests/accounts/teacher.spec.ts`: `_routes.json` and the R6 design fixes. *Verify:* account e2e and existing e2e. *Owner:* DeepSeek (code-loop) - mechanical fixes with exact targets. Done 2026-10-22 (`21841dd`, `28e6b7d`): DeepSeek-Flash (Qoder session `89a9b7a7-9b8f-45a4-b7ab-ea1999b3d9e3`), Codex passed in round 1. Claude found one regression in the existing suite: at 200% page zoom the signed-out header ran 32 px off the page (`tests/app.spec.ts`), because the fix kept the header tools from shrinking and media queries do not see page zoom. Claude fix: at ≤ 430 px the brand name yields first and Move progress reads “Move” for everyone (accessible name unchanged). Checks: 603 unit tests, 42 account e2e, 220 existing e2e (65 browser-conditional skips).
- [x] **T10c** (S4, S6, P4) Re-capture the account states and the teacher grid after T10 and check the R6 fixes (routine check of the affected states). *Verify:* each R6 item fixed or accepted with a reason. *Owner:* Claude. Done 2026-10-22: 42 screenshots re-captured in `artifacts/design/1.4.0/accounts-after/`. Checked: 1 footer “Signed in as Ada Test” while offline; 2 error under the field (`evidence/after-390-sign-in-error.png`); 3 status on one line at 390, wrap and no truncation asserted at 375 and 320 in e2e; 4 Name header on top after scroll (e2e `elementFromPoint`); 5 selects 44 px with a chevron (`evidence/after-390-teacher-grid.png`); 6 brand name signed out; 7 signed-in copy; 8 subtle Sign out with the sentence; 9 Name column about 7rem; 10 “Nothing to save yet”; 11 “Signing in…”; 12 no gap; 13 header 16 px. Not changed with reasons: 14, 15 (R6). iPhone keyboard and real iOS selects stay for P5.
- [ ] **T9** (S1, S7) Cloudflare: `wrangler d1 create`, put the id in `wrangler.toml`, `wrangler d1 migrations apply --remote`, “fail open” in the dashboard, make the teacher code. *Verify:* `wrangler d1 execute --remote` lists the tables. *Owner:* Claude - with the owner's go-ahead at that step (account change). Owner go-ahead: L1 (2026-10-22), after T10c. The owner sets “fail open” in the dashboard (no tool here can change it).

Project obligations:

- [x] **P1** README and `help.html` sync: applies (T7). Done: T7.
- [x] **P2** Version 1.4.0 and What's new: applies (T8). Done: T8.
- [x] **P3** DESIGN.md update: applies - §1 constraint, sign-in sheet, sync status, conflict prompt, teacher grid (T7). Done: T7 (§1, §5.7, §5.8).
- [x] **P4** Full design review: applies - new page and new components. `design-reviewer` with `reviews/context.md` first. Review done 2026-10-22 (R6): 2 P1 and 6 P2 go to T10; check in T10c. Closed by T10b and T10c: no P0/P1 open.
- [ ] **P5** iPhone check by the owner: applies - code field and keyboard on the sign-in sheet; the teacher grid on a phone.
- [ ] **P6** Deploy and live check: applies - `/help`, `/teacher`, one live sign-in and sync on two devices.
- [ ] **P7** First class set-up by the owner with `add-students`, and the slips printed: applies after P6.

## Acceptance

<pending>
