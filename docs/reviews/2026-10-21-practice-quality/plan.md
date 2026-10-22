---
task: practice-quality
phase: implement      # grill | research | spec | todo | implement | acceptance | done
scope: ap-calculus-practice / question numbers, scheduler, learning path, new abstract-function skill, site access, accounts
branch: practice-quality
version: 1.2.1 → 1.3.0 (one release, G1)
commits: []
---

<!-- Write this document in English, in the ASD-STE100 core style (see SKILL.md, Writing). Owner answers stay verbatim. -->

# Question quality, promotion speed, learning path, and an abstract-function skill

Source: the owner's request of 2026-10-21, six points (verbatim in substance):

1. 题目生成：有些题目选用的数字太怪太复杂、没有必要，请优化数字的选取。
2. 复习算法：检查练习中的复习算法是否合理，学习难题曲线怎么样，晋升速度是否有点慢。
3. 新增练习类型：把 AP Calculus 中新出现的"抽象函数"练习部分加进来，做成随机生成的题型，并作为一个独立的技能。
4. 学习路径：题目需要由浅入深，否则学生很容易放弃。请据此重新评估技能的学习路径。
5. 页面整体：请就整个页面在访问方面给出你的意见。
6. 学生进度与账号：我想让每个学生都有自己的账号来保存进度。这是否必须向 Cloudflare 付费？每月 5 美元够不够？

GRSTA signals: a new skill (user-visible, version bump), a curriculum and progress-format migration, more than three files, and work for Codex.

This task replaces `docs/reviews/2026-09-27-coefficients/plan.md` (not started). Its only open question (G1 there) is G2 here.

## Grill (decision log)

Recon: read `src/catalog.ts`, `src/templates.ts`, `src/questions.ts`, `src/progress.ts`, `src/grading.ts`, `src/math.ts`, `src/skill-inference.ts`, `src/domains.ts`, `src/compact-progress.ts` (profiles), `src/math-keyboard.ts` (alt letters), `src/main.ts` (prompt render, path view), `README.md`, `docs/design/DESIGN.md` §1–3, `docs/skill-hierarchy-review.md`, the golden and variety tests, the 2026-09-27 coefficients plan, and the owner's worksheet `../20261020 Abstract Function Practice/source/questions.tex`. Ran scratch measurements and simulations (scripts in the session scratchpad, not in the repo). Fetched Cloudflare pricing pages and checked the live site.
Size class: large - six independent topics, one new skill with a format migration, and a possible server component.

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G1 | How to split the work into releases | **A = numbers, display, scheduler order, diagnostic limit (1.3.0, no format change); B = AP-order path, abstract skill, keyboard keys, curriculum migration (1.4.0); C = accounts as a separate task** / one release for all / other | “一次发布全部。” (see L1) | 2026-10-21 |
| G2 | Number policy (R1) | **Prompt numbers 1–5 on Basic lines and 1–9 on Mixed lines; answer coefficients at most 20 on Basic and at most 60 on Mixed; higher-derivative answers at most 120; plus the special rules in S2** / no two-digit number anywhere (prompt and answer) / keep the current ranges | “你来把握，不同的题尽量多。答案至少不要出现三位数。高阶导数到二阶应该差不多，最多到三阶；三阶导数的答案里可以有不超过 200 的数。” | 2026-10-21 |
| G3 | Selection order (R2) | **Basic lines first, with one Mixed question in every three** / all Basic lines first, Mixed lines after / level by level (level N Basic, then level N Mixed) / keep the current order | Not clear to the owner. Owner's own model (with G4): “知识点可以按难度分级。简单的知识点答对一题就算掌握了 80%，可以往后走，后面就可以出现组合题。每次组合题出现时，都反过来判断前面的知识点掌握得好不好。这有点像 IRT（Item Response Theory）。请你研究一下，看能不能加到我们的算法里：不只用遗忘算法，再加一个估计每个知识点掌握情况的算法。” → R7 | 2026-10-21 |
| G4 | Diagnostic checks after a miss (R2) | **At most one check: the most advanced Ready skill that the question uses** / no diagnostic checks / keep (all Ready required skills) | Answered together with G3 (combined questions judge the earlier skills) → R7 | 2026-10-21 |
| G5 | One-question pass for easy skills (R2) | **No: keep two correct answers per line; measure again after release A** / Basic lines of levels 1–2 pass after one first-try correct answer | “要。” | 2026-10-21 |
| G6 | Learning path (R3) | **Move skills to the AP CED order (table in R3) in release B, with the same migration as the new skill** / keep the current levels | “我没明白 Release B 是什么意思。我不想改成 AP 大纲的顺序，就按我现在的顺序一点一点加。” → keep the current levels | 2026-10-21 |
| G7 | Abstract-function skill content (R4) | **Level 4 after the chain rule; Basic line = write h′(x) with one abstract layer; Mixed line = values from a table (chain, product, quotient, inverse); keyboard gets f, g and ′ on these questions** / symbolic questions only / table questions only | “放到后面做。抽象函数的内容你弄清楚就行。题目要很简单，只有一层函数，不要表格题。就像我们也没有图像题一样，这里只把最基础的技能练好。” (placement: see L2) | 2026-10-21 |
| G8 | Accounts (R6) | **Separate task after releases A and B; free Cloudflare plan; teacher-issued class code plus a personal login code; local progress stays primary; no-account use stays** / start now in this task / not needed | “可以，给每个学生一个码。但每人一个码，是不是就只能在一台设备上用？” → answered in R6 (one code, many devices) | 2026-10-21 |
| G9 | Where students open the site (R5) | **Tell us; if any student uses a mainland-China network, add a custom domain and test it from there** / all students are outside mainland China (keep `pages.dev`) | “没有学生用中国大陆的网络，都是属于海外访问。” → keep `pages.dev` | 2026-10-21 |
| G10 | Quick access fixes in release A (R5) | **Ask the browser for persistent storage and tell iPhone students to add the site to the Home Screen** / also add offline support (service worker) / no change | Answered with a question: “长期保存进度是不是有点难？能不能比如让学生导出进度？还是说必须付费，把进度保存在线上才行？” → answered in R5; asked again as L6 | 2026-10-21 |
| L1 | Loop-back on G1: does “one release” include accounts? | **No: accounts stay a separate task after this release (as in G8)** / yes, accounts in the same release | “别的按推荐” → recommended | 2026-10-21 |
| L2 | Loop-back on G7: what does “放到后面做” mean? | **Later in the path: level 5, next to implicit, inverse and higher; prerequisites chain and product** / later in time (a release after this one) | “别的按推荐” → recommended | 2026-10-21 |
| L3 | Mastery model family (R7) | **IRT/Elo-style: a continuous estimate per skill, updated by every question, with blame on the weakest skill** / BKT (mastered or not mastered) | “别的按推荐” → recommended | 2026-10-21 |
| L4 | Ready threshold of the mastery estimate (R7) | **90%** / 85% | “我觉得按85%吧，因为课上课下还能练到的。” → 85% | 2026-10-21 |
| L5 | A correct combined question also counts as an FSRS review of its due component skills (R7) | **Yes** / no | “别的按推荐” → yes | 2026-10-21 |
| L6 | Re-ask of G10 after the answer in R5 | **Add the persistent-storage request and the Home Screen tip in this release; online saving comes with the accounts task** / no change now | “别的按推荐” → recommended | 2026-10-21 |
| L7 | Spec talk-through: go-ahead? | **Agree; start with S3 on branch `practice-quality`** / change the Spec | “同意，codex的工作和你能分出的代码工作都可以交给qoder的dsf，审核可以交给codex，codex和dsf意见一致了你再看一眼就行。” Later: “记得保留qoder的session这样有修改可以直接回调” → see the delegation rule under To Do | 2026-10-21 |
| L8 | Owner during T3 review: “70太高了吧，我觉得要定一个，如果每道题都做对，product rule在10-15题就应该出现了” — how to meet ≤ 15 for an always-correct student? Measured on the branch (27 skills, T3 merged): always-correct student meets product at question 23 (15 skills come first); truth students 65 / 11 / 26 of 40. Moving cot, sec, csc, asin, acos, atan after chain (level 3): always-correct 14; truth students 32 / 8 / 23 of 40. | **Move those six skills after chain (level 3); new S4 targets: always-correct ≤ 15, truth-student median ≤ 35** / keep the order (23 is the minimum) | “我不同意只把那 6 个技能移到链式法则之后。1. tan、cot、sec、csc 放在商法则之后（tan 留在前面也可以，但建议放在商法则之后）。2. arcsin、arccos、arctan 放在反函数求导之后。3. 乘积法则一定要以 tan 为前置吗？乘积法则应该先掌握，组合放到后面再练。4. 组合本身也是一种技能，可以分成几个级别：简单的两种法则组合算第一级；商法则加链式法则、链式法则加链式法则属于更高级的组合技能。” → R8 | 2026-10-21 |
| L9 | Path from the owner's four points (R8): accept the level table? | **Yes, as in R8 (product at question 12 for an always-correct student)** / change it | “第九题我接受” → accepted, then changed by L10 | 2026-10-21 |
| L10 | Combination skills (owner point 4): re-scope `mixed` as “Combinations I” (two simple rules) and `nested` as “Combinations II” (chain+chain, quotient+chain, three rules), both on level 4 after chain, II after I | **Yes, both on level 4** / Combinations II on level 5 | Superseded (dictated): “我觉得在第三级就应该有一个 combination skill，这个 chain rule 之后再有一个 combination skill，然后在五……后面，在这个 abstract 之前又应该有一个 combination skill，然后我们的曲线和坐标现在先不要。” → three combination skills (levels 3, 4, 5) and level 6 off, see R9 | 2026-10-21 |
| L11 | Content of the three combination skills (R9) | **As in R9: I = two rules without chain (level 3); II = chain plus one rule (level 4); III = quotient+chain, chain+chain, three rules (level 5, before abstract)** / change | “都同意” → as in R9 | 2026-10-21 |
| L12 | How to turn off level 6 for now (R9) | **Teacher setting `disabledFamilies` in `public/practice-config.json`; the path shows level 6 as “Not included”; it comes back by removing the three ids** / hide the level-6 row in the path | “都同意” → teacher setting | 2026-10-21 |

Default assumptions (not answered): none yet.
Owner agrees with this understanding: round 2 answers, 2026-10-21 (“4我觉得按85%吧……别的按推荐”). Spec talk-through: “同意” (L7), 2026-10-21.

## Research

Labels: **[F]** fact (source), **[I]** inference, **[U]** unknown, **[P]** problem that was there before this task.

### R1. Numbers in generated questions (point 1)

- **[F]** Most templates use `int(c, 2, 15)` for coefficients and constants, and `int(c, 2, 12)` or `int(c, 2, 8)` for exponents (`src/templates.ts`). The linear inner function `lin(c)` is `ax+b` with `a` 2–9 and `b` 1–9 (`src/questions.ts:66-68`).
- **[F]** Measurement: 120 seeds per template; the answer was simplified by the compute engine; the value is the largest number in the simplified answer (scratch `nums.ts`, output `nums.txt`).
  - `higher.basic.third_power`: median 2,352, maximum 19,800 (`f(x)=15x^{12}` → `19800x^9`).
  - `constant.mix.power_sum` and `power.mix.negative_sum`: median 54, maximum 180.
  - 20 templates of the form `a·g(x) + b·x^n`: median 40, maximum 120 (`15x^8` → `120x^7`).
  - `inverse.basic.cubic`: `f(x)=x^3+15x`, `f(9)=864`, answer `1/258`.
  - `parametric.basic.power_second`: answer `3/(784t)`.
- **[F]** Unnatural forms:
  - `power.mix.polynomial_sum` can repeat an exponent: `12x^5+14x^5+4`.
  - `product.basic.function_pair` can pick the same function twice: `9·e^x·e^x`.
  - `log.basic.scaled` gives `2 ln x / ln 16`; `constant.basic.rational` gives `13 + 5/3`.
  - Implicit constants go up to 400 (median 64); polar constants go up to 20.
- **[F]** Display: `latex()` in `src/math.ts` writes every product with `\cdot` and puts parentheses around a negated term. Prompts show `15·x^{12}`, `ln(x) − (15·e^x)` and `2·y^2 − (5·x^2) − 60 = 0`.
- **[F]** The owner said on 2026-09-27: “出题的系数尽量不要两位数吧，计算量不是考察要点。” (`docs/reviews/2026-09-27-coefficients/plan.md`).
- **[F]** Limits for the new ranges:
  - `tests/generator-variety.test.ts:59-62` needs at least 10 distinct questions and 6 distinct answers per template.
  - `tests/generator-golden.test.ts` compares no byte-identical template now, so new ranges do not break it.
  - Saved questions keep their own source and answers, so new ranges do not change saved work.
- **[I]** Narrow ranges reduce variety. For example, `x^n` with `n` 2–5 gives only 4 questions. Variety must come from structure (two small parameters, more templates), not from large numbers.
- **[I]** `latex()` output also feeds the grader's normalisation (`src/grading.ts`, `normalize`). A display change must keep the parse result equal; the math corpus and grading tests check this.

### R2. Review algorithm and promotion speed (point 2)

- **[F]** Mechanism (`src/progress.ts`):
  - One FSRS-6 card per skill (`ts-fsrs` 5.4.2, retention 0.9, maximum 180 days, steps 1 min and 10 min).
  - The rating is Good for a first-try correct answer without a hint, else Again. The card changes only when it is due.
  - A line (Basic or Mixed) passes after two first-try correct answers on different questions. A pass is permanent.
  - A level opens when every Basic line of the level below has passed.
- **[F]** FSRS intervals, all Good: 10 min → 2 d → 11 d → 46 d → 163 d → 181 d. With one Again at the third review: 10 min → 1 d → 3 d → 7 d → 17 d (scratch `fsrs.ts`). **[I]** These intervals are normal. The FSRS parameters need no change.
- **[F]** Selection order (`chooseNext`): diagnostic checks, then rebuild questions, then due reviews, then each skill in catalog order with its Basic line before its Mixed line. So the Mixed line of every earlier skill comes before the Basic line of every later skill.
- **[F]** The README says the Mixed line does not block later Basic lessons. That is true for the level gate. The selection order still puts Mixed questions in front of later Basic lines.
- **[F]** Diagnostic checks: the first miss on a skill adds every Ready skill in the question's `requiredSkills` to the check queue. A mixed question can add up to 5 checks.
- **[F]** Simulation, 45 s per question, scratch `sim.ts`:
  - A student who is always correct: level 3 opens at question 70, level 6 at 110, all skills Ready at 127.
  - A student who is correct 80% of the time: level 3 at 124, level 6 at 228, all Ready at 279.
- **[I]** Accuracy model for the comparison (an assumption, not data): 0.92, 0.88, 0.80, 0.75, 0.72, 0.70 for levels 1–6, and 0.08 less on Mixed questions.
- **[F]** Comparison, 40 runs, median (scratch `sim2.ts`, output `variants.txt`). “First P/C” is the first product, quotient or chain question.

  | Variant | First P/C | All Basic passed | All Ready |
  |---|---:|---:|---:|
  | Current | 120 | 313 | 342 |
  | Diagnostic limit 1 | 107 | 232 | 247 |
  | Level by level + limit 1 | 99 | 203 | 226 |
  | Basic first, 1 Mixed in 3 + limit 1 | 84 | 183 | 209 |
  | All Basic first + limit 1 | 57 | 131 | 202 |
  | All Basic first + limit 1 + one-question pass (levels 1–2) | 38 | 117 | 184 |

- **[F]** In the current variant, an average run has 321 questions and 62 misses. The misses cause 97 diagnostic checks and 106 rebuild questions: about 3.3 extra questions per miss (scratch `sim3.ts`).
- **[I]** Conclusion: promotion is slow mainly at the start. A typical student does about 120 questions (about 90 minutes) of single-function work before the first product or chain question. The causes, in order of effect: the diagnostic fan-out, the Mixed-before-Basic order, and the 11 skills of level 2 (44 questions minimum). The two-answer pass rule is not the main cause.
- **[U]** Real accuracy: the site keeps no answer history, so the model numbers are not measured.

### R3. Learning path (point 4)

- **[F]** Owner decision G6: keep the current levels and order. The AP-order proposal below is a record only.

- **[F]** Current levels (`src/catalog.ts`): 1 constant, power, sum, root; 2 exp, log, sin, cos, tan, cot, sec, csc, asin, acos, atan; 3 product, quotient, chain; 4 nested, mixed; 5 implicit, inverse, higher; 6 parametric, vector, polar.
- **[F]** AP CED order (Fiveable unit pages for the CED topic list): 2.5 power rule; 2.6 constant, sum, difference, constant multiple; 2.7 cos x, sin x, eˣ, ln x; 2.8 product; 2.9 quotient; 2.10 tan, cot, sec, csc; 3.1 chain; 3.2 implicit; 3.3 inverse functions; 3.4 inverse trigonometric functions; 3.5 selecting procedures; 3.6 higher-order derivatives; Unit 9 (BC) parametric, vector, polar.
- **[I]** A class that follows the CED learns product and quotient before tan and sec, and the chain rule before arcsin. On the site, product, quotient and chain stay locked until seven of these later skills pass. A student who practises along with the class finds locked content that the class already learned, and drills content that the class did not teach yet.
- **[F]** No ramp inside a line: the first question of a line is a random template of that role with full-range numbers. For example, the first quotient question can be `(x²+13)/(11x+14)`.
- **[F]** Proposed AP-order levels (skill IDs do not change):

  | Level | Skills | CED |
  |---|---|---|
  | 1 Foundations | constant, power, sum, root | 2.5–2.6 |
  | 2 Essential functions | sin, cos, exp, log | 2.7 |
  | 3 Product and quotient | product, quotient, tan, cot, sec, csc | 2.8–2.10 |
  | 4 Chain rule | chain, abstract (new), nested, asin, acos, atan | 3.1, 3.4 |
  | 5 Implicit, inverse, higher | implicit, inverse, higher, mixed | 3.2, 3.3, 3.5, 3.6 |
  | 6 Curves and coordinates | parametric, vector, polar | Unit 9 |

- **[F]** `product` lists `tan` as a prerequisite; in the AP order `tan` is on the same level, so the prerequisite must go.
- **[F]** Simulation of the AP-order path (scratch `sim4.ts`): with level by level + limit 1, the first P/C question comes at 61 (current path: 99); with all Basic first + limit 1, at 45 (current path: 57).
- **[I]** The totals for the AP path look a little higher (for example 233 against 226 Ready). The cause is the model: it gives lower accuracy to skills on higher levels, and tan, sec and the other moved skills are on higher levels now. The main gain of the AP order is the match with class teaching, not the total.
- **[I]** Migration: `unlockedLevel` keeps its number but levels hold other skills. A rule must make sure that no student loses a skill that was open: new `unlockedLevel` = the larger of the old value and the new level of every skill that the student started.

### R4. Abstract-function skill (point 3)

- **[F]** Source: the owner's worksheet (`../20261020 Abstract Function Practice/source/questions.tex`, 9 questions):
  - Q1: write h′(x) for `f(x^3)`, `[f(x)]^3`, `e^{f(x^2)}`, `√f(x)`, `1/[f(sin x)]^2`, `f(g(x))`, `f(f(x))`, `x^2 f(3x)`, `f(x^2)/g(x)`, `ln g(x)`, `f(x) arcsin 2x`.
  - Q2: read values from a table of f, f′, g, g′.
  - Q3: find h′(a) from the table (chain, product, quotient, power).
  - Q4–Q5: inverse values from the table, and two or three layers.
  - Q6 and Q9: f′ given by a formula, plus f(a).
  - Q7: f′(u) compared with d/dx f(u). Q8: inverse value with a formula.
- **[F]** Parsing (scratch `parse.ts`, `parse2.ts`): the compute engine reads `f'(x^3)` as `["Apply",["Derivative","f",1],["Power","x",3]]` with no set-up. It reads `f(x)` as the product `f·(x)`, unless `f` is declared as a function; then it reads `["f","x"]`.
- **[I]** Declare `f` and `g` only in a second engine instance for abstract questions, so the parse of all other questions stays the same.
- **[F]** The grader compares values at sample points of x only, with an operator whitelist (`src/grading.ts`).
- **[I]** Grading route: at grade time, replace `f` and `g` by 3–4 hidden concrete functions with known derivatives. Evaluate the expected tree and the student tree for each choice. Accept only if all choices agree.
- **[I]** Places that must change: `parseAnswer`; `derivative()` and `latex()` for f-nodes; `inferSkills` (`f(u)` with u ≠ x means chain); `checkExtraDomains` (`√f`, `ln g`, `1/f`); the SymPy oracle (`Function('f')`); the keyboard.
- **[F]** The keyboard has no `f`, `g` or prime key (`src/math-keyboard.ts`, `altFor`: x y z, u v w, r s t).
- **[I]** On iPhone, symbolic answers need these keys. A keyboard change brings `DESIGN.md` §6, the layout tests, a full design review and an iPhone check.
- **[F]** The prompt is drawn by MathLive `convertLatexToMarkup` (`src/main.ts:240`). **[U]** How a table looks at 390 px, and how a screen reader reads it; an HTML table can be better.
- **[F]** A new skill changes the curriculum:
  - `CURRICULUM_VERSION` goes from `ap-derivatives-2` to `ap-derivatives-3`.
  - The compact profiles fix the skill order (`PROFILE3_SKILLS`, 26 skills), so a profile 4 is necessary.
  - `src/migrate.ts` needs a registered path, and a new frozen fixture is necessary.
  - `tests/generator-golden.test.ts` uses `SKILLS.length * 2 * 20`; it must use the frozen count 26.
- **[I]** This is a data-format migration that must land with its readers (owner: Claude).
- **[I]** Release A must limit the diagnostic checks first. The abstract skill uses chain, product and quotient, so each miss now adds three or more checks.

### R5. Site access (point 5)

- **[F]** First visit (live site, this machine): main script 326 KB (brotli), style sheet 13 KB, grading worker 876 KB brotli (3.2 MB raw) at the first check. Time to first byte 0.33 s (Cloudflare location TPE).
- **[F]** There is no service worker and no `navigator.storage.persist()` call (`src/main.ts`). `DESIGN.md` §1 says the site is offline first.
- **[I]** Later visits use the browser cache for the scripts, but the site does not open with no network.
- **[F]** Safari deletes all script-writable storage of a site, IndexedDB included, after 7 days of Safari use with no user interaction on that site. Home Screen web apps are exempt (WebKit policy, summarised by Didomi; WebKit Bugzilla 211775).
- **[I]** An iPhone student who stops for a holiday can lose all progress. **[U]** Whether `persist()` gives an exemption in Safari.
- **[F]** The Cloudflare China Network FAQ says Pages is not available in mainland China (the `pages.dev` certificate). Community reports describe intermittent blocks.
- **[U]** Where the students open the site.
- **[F]** Accessibility work is in place: contrast tests, spoken text for formulas (`role="math"` with `aria-label`), reduced motion, and focus management (`DESIGN.md`, tests). **[I]** This recon found no large accessibility gap; no new audit ran.
- **[F]** G9: all students are outside mainland China. The `pages.dev` address stays.
- Answer to the owner's G10 question (2026-10-21):
  - **[F]** Export exists now: Move progress → Export progress gives a code and a QR image (README).
  - **[I]** Export protects only a student who remembers it. Safari deletes the data with no warning, so most students will not have a recent code.
  - **[F]** A site on the iPhone Home Screen is exempt from the 7-day rule (WebKit Bugzilla 211775 comment).
  - **[U]** Whether `navigator.storage.persist()` stops the 7-day rule in Safari. The call costs one line, so it is still worth it.
  - **[I]** Online saving is the robust fix. It needs accounts (R6), and it is free at this size. Payment is not necessary.

### R6. Accounts and Cloudflare cost (point 6)

- **[F]** Cloudflare Workers pricing page:
  - Free: 100,000 requests per day; 10 ms CPU per request.
  - Paid: USD 5 per month minimum; 10 million requests per month; 30 million CPU ms.
  - Pages Functions are billed as Workers.
- **[F]** Cloudflare D1 pricing page (updated 2026-04-21):
  - Free: 5 million rows read per day, 100,000 rows written per day, 5 GB storage. At the daily limit, queries stop.
  - Paid: 25 billion rows read and 50 million rows written per month, 5 GB storage.
- **[I]** Load estimate: 100 students × 60 questions per day × 1 write is 6,000 rows per day, 6% of the free write limit. Requests are of the same order.
- **[I]** A paid plan is not necessary at class or school size. USD 5 per month is much more than enough.
- **[I]** The paid plan matters only in three cases:
  - Password hashing needs more than 10 ms CPU (**[U]**, not measured).
  - Login by email code needs Cloudflare Email Sending (beta, paid plan only).
  - Use grows past about 1,000 active students per day.
- **[F]** Cloudflare Access (Zero Trust) is free for up to 50 users, according to third-party pages. **[U]** Not checked on the official plan page.
- **[F]** The README and `DESIGN.md` §1 say the site has no accounts and no student database. Accounts move student data to a server, so privacy and the help text change.
- **[I]** Proposed design for task C:
  - Local progress stays primary.
  - One Pages Function stores the existing compact snapshot (about 1.2 KB per student, README) in D1.
  - The newer `updatedAt` wins, and the student sees a prompt before a replacement.
  - Use with no account stays possible.
- **[I]** Login options:
  - Teacher-issued class code plus a personal login code: no email, works in mainland China. A random code needs no slow hashing.
  - Email one-time code: needs Email Sending (paid, beta) or Cloudflare Access.
  - Google sign-in: blocked in mainland China.
- Answer to the owner's G8 question (one code, one device?), 2026-10-21:
  - **[I]** No. The code is a key, not a device lock. A student types the same code on a phone and on a laptop, and both load the same progress from the server.
  - **[I]** Each answer sends the new copy to the server. When the site opens, it gets the newest copy.
  - **[I]** The only conflict: two devices that practise at the same time with no network. Then the newer copy wins, and the student sees a prompt first. The README rule “no automatic merge of two histories” stays.

### R7. Mastery model (owner's G3 and G4 answer)

- **[F]** The owner's model: grade skills by difficulty; one correct answer on an easy skill means 80% mastery and opens the next skill; later combined questions judge the earlier skills again; add a mastery estimate next to the forgetting model (FSRS).
- **[F]** Prior art:
  - Bayesian Knowledge Tracing (BKT, Corbett and Anderson 1995): a probability that a skill is in the “mastered” state.
  - Conjunctive knowledge tracing (Koedinger, Pavlik, Stamper, Nixon, Ritter, EDM 2011): when a step needs several skills, a simple update lowers all of them after an error. Their Bayesian update gives the blame to the likely cause. In their tutor logs, about one third of the problems (441 of 1,370) were not necessary.
  - Elo for learner models (Pelánek, Computers & Education 2016): each answer is a match between student and item; it estimates skill and item difficulty online. Abdi et al. (arXiv 1910.12581) extend Elo to items with several concepts.
  - Math Academy FIRe (Skycak): a correct advanced review also gives fractional review credit to the simpler skills inside it; a failure penalty flows up to the advanced skills, not down.
- **[I]** IRT needs answer data from many students to calibrate item difficulty. The site keeps no answer data, so a full IRT model is not possible now. An Elo-style update is the online form of the same idea, with difficulty set by hand. With accounts (task C), answer logs can calibrate the difficulty of each template later.
- **[F]** Prototype (`research/mastery.ts`, `research/sim5.ts`), two families:
  - BKT: state probability with slip 0.08, guess 0.05, learn 0.1; priors by level.
  - IRT/Elo-style: estimate = chance to apply the skill correctly. Start values by level: 0.62, 0.58, 0.45, 0.40, 0.35, 0.35. Combined question: predicted chance = product of the estimates. Update = gradient step: a correct answer raises each skill by `K(1 − m)`; a wrong answer lowers each skill by `K·P(1 − m)/(1 − P)`, so the weakest skill gets most of the blame. Step `K = max(1, 2.6/(1 + 0.6n))`, half on component skills.
  - Both: pass (move on) at 80%; Ready at the threshold, sticky; weak below 60% → targeted Basic practice after two other questions; one combined question in every three; FSRS stays for review timing; a correct combined question also counts as an FSRS review of due component skills.
- **[I]** With these start values, one correct answer passes a level 1 or level 2 skill (0.62 → 0.81, 0.58 → 0.80). Level 3 and higher need two. This matches G5.
- **[F]** Truth model for the test (an assumption): each skill has a real chance to be applied correctly (0.90 at level 1 down to 0.55 at level 6) that grows with practice. Each student has one hidden weak skill from levels 1–3, stuck at 0.5 until 3 targeted practice questions. A question is correct only if each skill in it is applied correctly.
- **[F]** Results, 40 students, median (`research/mastery-results.txt`, `evidence/mastery-model.png`):

  | Scheduler | First P/C | All Basic passed | Level 6 | Extra questions | Share on weak skill | Weak skill found | Weak skill marked mastered |
  |---|---:|---:|---:|---:|---:|---:|---:|
  | Current | 106 | 256 | 208 | 150 | 7% | 40/40 | 1/40 |
  | BKT | 43 | 110 | 90 | 1 | 0% | 12/40 | 37/40 |
  | IRT/Elo, Ready 90% | 68 | 236 | 183 | 6 | 89% | 40/40 | 1/40 |
  | IRT/Elo, Ready 85% | 63 | 227 | 189 | 4 | 40% | 22/40 | 21/40 |

- **[I]** BKT is fastest, but it marks the hidden weak skill as mastered in 37 of 40 students. Its binary state does not fit partial knowledge. Reject it.
- **[I]** IRT/Elo with Ready at 90% finds the weak skill in all 40 students and puts 89% of its extra practice on it. The current scheduler adds 150 extra questions, and 93% of them go to other skills. The time saved goes to new and combined questions.
- **[I]** The speed gain is clear at the start (first P/C 106 → 68) and moderate later (level 6 208 → 183). The mix ratio and the start values can change the speed; the implementation must tune them against this simulation as a test.
- **[I]** The “all Ready” totals are not comparable: today Ready means two correct answers per line; in the model it is an estimate threshold.
- **[I]** Format: the estimate and its observation count are new fields per skill. They go into the same curriculum migration as the abstract skill (`ap-derivatives-3`, profile 4). Migration seeds the estimate from today's state: Ready → 0.92, Basic passed → 0.82, repair → 0.55, not started → the start value.
- **[I]** Implicit FSRS credit (FIRe precedent: credit flows down, penalties do not) is a separate choice (L5). It cuts separate reviews of simple skills.
- **[U]** Real student behaviour: no answer data exists. The truth model and the parameters are assumptions.

### R8. Path from the owner's four points (L8, 2026-10-21)

- **[F]** Point 3: `product` lists `tan` as a prerequisite only because of one Mixed template, `product.mix.tangent_secant` (x^n·tan x or x^n·sec x). That template has its own pool gate (`pools: { h: ["tan","sec"] }`), so it opens by itself after tan or sec passes. Removing `tan` from the product prerequisites is safe.
- **[F]** Proposed levels (skill IDs unchanged; order inside a level is the catalog order):

  | Level | Skills | Prerequisite changes |
  |---|---|---|
  | 1 Foundations | constant, power, sum, root | none |
  | 2 Essential functions | exp, log, sin, cos | none |
  | 3 Products and quotients | product, quotient, tan, cot, sec, csc | product: sum, power, sin, cos, exp (no tan); tan, cot, sec, csc: quotient |
  | 4 Chains and combinations | chain, mixed (Combinations I), nested (Combinations II) | mixed: product, quotient, chain; nested: chain, mixed |
  | 5 Implicit, inverse and more | implicit, inverse, asin, acos, atan, higher, abstract | asin, acos: inverse, root; atan: inverse |
  | 6 Curves and coordinates | parametric, vector, polar | none |

- **[F]** Simulation on the branch (T3 merged, 27 skills; scratch tests, same truth model as S4):
  - Always-correct student: product at question 12 (today 23); chain at 30 (today 29); tan at 18; arcsin at 65.
  - Truth students, 40, median: first product/quotient/chain 29 (today 65); remedial 10 (today 11); weak skill targeted 30/40 (today 26/40).
- **[I]** This order is close to the AP CED order (R3), but it comes from the owner's own points.
- **[I]** Owner point 4 maps onto two existing skills. Today `mixed` (Mixed differentiation) has product+chain, quotient+chain, three-rule and log·product templates; `nested` (Nested chain rule) has chain+chain templates. Re-scope: Combinations I = two simple rules (product+chain with a linear inside, product with a logarithm of a polynomial, product with a quotient of simple factors); Combinations II = chain+chain, quotient+chain, three rules. The quotient+chain and three-rule templates move from `mixed` to `nested` with new keys. Old saved questions keep grading because they carry their own trees.
- **[I]** The per-skill Mixed lines stay: they combine a skill only with skills that already passed, one question in three.
- **[I]** Cost: catalog levels, order, prerequisites, labels and rules; template moves; level titles in `src/main.ts`; the migration (T7) must keep every open skill open; README, help, skill examples and `docs/skill-hierarchy-review.md`.

### R9. Three combination skills and level 6 off (L10, 2026-10-21)

- **[F]** Today two skills hold combinations: `mixed` (Mixed differentiation: `product_chain`, `quotient_chain`, `quotient_power`, `log_product`) and `nested` (Nested chain rule: four chain+chain templates). Per-skill Mixed lines also combine one skill with skills already passed; they stay.
- **[I]** Proposed mapping (owner's two earlier grades plus the three positions):
  - **Combinations I** — new skill `combine`, level 3, last in level 3. Two rules, no chain: product with quotient, sums of products and quotients, with power, exp, log and the six trig functions. Prerequisites: product, quotient.
  - **Combinations II** — `mixed` re-scoped, level 4, after chain. The chain rule with one other rule, simple inside (linear or x²): product+chain such as (x²+3)·sin(2x), x·e^{3x}, ln(x²+1)·sin x. Keeps `product_chain`, `log_product`. Prerequisites: product, chain.
  - **Combinations III** — `nested` re-scoped, level 5, after higher and before abstract. Quotient+chain, chain+chain, three rules, and inverse-trig with chain. Takes `quotient_chain` and `quotient_power` from `mixed` (new keys `nested.basic.quotient_chain`, `nested.mix.quotient_power`) and keeps the four chain+chain templates. Prerequisites: mixed, quotient.
- **[F]** Level 6 off: `config.disabledFamilies` already removes skills from the path and the scheduler; a level with no enabled skill shows “Not included” (`src/main.ts:330`). `unlock()` treats a disabled skill as passed, so level 6 never blocks anything.
- **[I]** Full order (28 skills): constant, power, sum, root | exp, log, sin, cos | product, quotient, tan, cot, sec, csc, combine | chain, mixed | implicit, inverse, asin, acos, atan, higher, nested, abstract | parametric, vector, polar (off).
- **[I]** T7 must wait for this step: profile 4 freezes the skill table, which now has 28 skills.

### R10. Full design review findings (P4, 2026-10-22)

Report: `design-reviewer` (Sonnet), scope `reviews/context.md`, screenshots `reviews/shots/`. Claude's grading:
- **F1 P1 (confirmed by Claude in `artifacts/e2e/webkit-mobile-abstract-function-keyboard.png`)**: at 390 px the faces f(▫), f′(▫), g(▫), g′(▫) are wider than the 39 px keys; they clip and run into each other. Decision: keep the faces (DESIGN §6.1 rule 7, empty box) but draw these four keys smaller so they fit at 390 and 320 px; add a measurement test.
- **F3 P3**: the prompt shows `f (5x)` with a gap. Fix with F1 (cheap, mechanical).
- **F4 P3**: level 6 “Not included” still expands to “No enabled skills in this level.” Decision: a level with no enabled skill is a plain row without chevron and without body.
- **F5 P3**: “1 skills ready” → singular. Fix (mechanical).
- **F2 P2**: the first-use tip shows on abstract questions though the four keys have no alt. Accept; note in DESIGN §6.1.
- **F6 P3 (opinion)**: the percentage has no in-app caption. Not changed: it adds copy outside S4/S8; offer to the owner.
- Device-only items stay for the owner's iPhone check (P6), including “Math keyboard opens on the first tap on an abstract question”.

### R11. “Check your input” on the first answer (owner's iPhone, 2026-10-22)

- **[F]** Owner's iPhone screenshot (`evidence/owner-iphone-check-your-input.webp`): first question of the preview jump link, `h(x)=f(cos(x))`, answer `f′(cos x)·(−sin x)` (correct), result “Check your input”.
- **[F]** The same LaTeX (`f^{\prime}\left(\cos x\right)\cdot\left(-\sin x\right)`, read from the real keys in WebKit) grades `correct` in Node (75–104 ms) and in the browser.
- **[F]** Cause: `src/grader-client.ts` creates the grading worker on the first check and starts the 3-second timer at the same moment, so the timer also covers the download and start of the worker (3.2 MB raw, 876 KB brotli) and the compute-engine start. On timeout it shows “This calculation took too long. Try a shorter equivalent answer.” under “Check your input”, and it terminates the worker, so the next check starts cold again.
- **[F]** Reproduced: with the worker download delayed by 4 s in WebKit 390 px, the first check of a correct answer gives exactly that message (`evidence/slow-first-check-repro.png`).
- **[P]** This existed before 1.3.0 (any first answer on a slow phone connection); the jump link made it visible because the first question was checked at once.
- **[I]** Fix: start the worker when a question appears and wait for its `ready` message; the 3-second limit counts only the calculation after `ready`; a separate, longer start limit with its own message.

## Spec

Final draft after round 2, for the talk-through. One release (G1); version 1.2.1 → 1.3.0. Accounts are a separate task after this release (L1).

Requirements that stay: the 6 levels and their order (G6); the Basic and Mixed lines and their kinds of question; the FSRS parameters; the grading thresholds; use with no account; English-only student text; the `pages.dev` address (G9).
Requirements that change: number ranges (S1, S2), display (S3), progression and remediation (S4). New: storage request and Home Screen tip (S5), the abstract-function skill (S6), the curriculum and progress format (S7).

- **S1 Number limits.** *From:* G2, R1
  - Prompt coefficients and constants: 1–5 on Basic lines, 1–9 on Mixed lines. Exponents: 2–6; negative exponents −1 to −4; fractional exponents with denominator 2 or 3.
  - In the simplified answer, every whole number is less than 100. A third-derivative answer can have numbers up to 200.
  - Higher derivatives are mostly second order. Each line has at most one third-order template.
  - Variety stays: each template gives at least 10 different questions and 6 different answers.
  - *Accept:* a new test generates 200 questions per template and checks these limits; `tests/generator-variety.test.ts` passes.
- **S2 Natural forms.** *From:* R1
  - No repeated exponent in one sum. No product of a function with itself.
  - Bases of exponentials and logarithms come from {2, 3, 5, 10}.
  - Inverse-function points come from {−1, 0, 1, 2}, and f(a) is less than 100.
  - Constants in implicit equations are at most 36; polar constants are at most 9.
  - *Accept:* the S1 test checks these forms.
- **S3 Natural display.** *From:* R1
  - A number in front of a letter, a power or a function has no dot (`15x^{8}` style). A negative term shows as a subtraction with no parentheses.
  - The grader result stays the same for every question.
  - *Accept:* display snapshot test; `npm run test:math`; the grading regression tests.
- **S4 Mastery model.** *From:* G3, G4, G5, L3, L4, L5, R7
  - Each skill has a mastery estimate: the chance that the student applies the skill correctly (IRT/Elo-style, L3). Every graded question updates the estimate of each skill that it uses.
  - A correct answer raises each skill; a wrong answer lowers each skill, most for the skill with the lowest estimate (conjunctive update, R7).
  - Start values depend on the level. One first-try correct answer passes a level 1 or level 2 skill; level 3 and higher need two.
  - A skill at 80% or more passes (sticky) and opens the skills and levels that need it.
  - A skill at 85% or more is Ready (sticky, L4). A passed skill under 60% is weak (clarified 2026-10-21 during T3: before its first pass a skill is still in normal learning, as in the R7 prototype; without this rule the simulation gave 72 remedial questions): it gets targeted Basic practice after two other questions, until it is at 80% again. A weak skill shows as not Ready until then.
  - One question in every three is a combined (Mixed) question when one is available (phase decided 2026-10-21 during T3: the third, sixth … question by `Math.floor(sequence / 2) % 3 === 0`; the earlier prompt value `=== 2` gave first P/C 71 > 70, `=== 0` gives 65 / 9 / 28 of 40).
  - The diagnostic queue for all Ready required skills and the two-correct rebuild rule go away.
  - FSRS stays for review timing. A hint or a wrong first try still rates Again. A correct combined question also counts as a Good review of each component skill that is due (L5).
  - The interface keeps its labels, except the path status of a started skill: the streak counts (“Basic ✓ · Mixed 1/2”, “Basic 1/2”) become the estimate (“Basic ✓ · 82%”, “Learning · 45%”), because the streak counts no longer exist. Recorded during T3 preparation, 2026-10-21; to report to the owner. README and help describe the new rules.
  - Until T7, the compact export does not carry the estimates; an imported code seeds them from the line state (same rule as the migration).
  - *Accept:* unit tests for the update; a simulation test with the R7 truth model, 40 students, median: first product or chain question ≤ 70; extra (remedial) questions ≤ 20; weak skill found in ≥ 20 of 40 (prototype at 85%: 63, 4, 22/40); the existing no-deadlock simulations pass.
- **S5 Keep progress on iPhone.** *From:* R5, L6
  - The site asks the browser for persistent storage once at start.
  - Help tells iPhone students to add the site to the Home Screen, and to export a code before a long break.
  - *Accept:* unit test for the call; help text check.
- **S6 Abstract-function skill.** *From:* G7, L2, R4
  - New skill `abstract` on level 5, after implicit, inverse and higher in the path. Prerequisites: chain and product (Mixed templates that divide also need quotient).
  - Questions are random and symbolic, with one layer of composition and no tables.
  - Basic forms: `f(x^n)`, `f(ax)`, `f(sin x)`, `f(cos x)`, `f(e^x)`, `f(ln x)`, `[f(x)]^n`, `e^{f(x)}`, `ln f(x)`, `√f(x)`, `sin f(x)`.
  - Mixed forms: `x^n·f(x)`, `f(x)/x^n`, `f(x)·g(x)`, `f(x)/g(x)`, `f(g(x))`.
  - Numbers follow S1. The answer uses `f`, `f′`, `g`, `g′`.
  - On these questions only, the keyboard keys tan, sec, csc and cot change to `f(□)`, `f′(□)`, `g(□)` and `g′(□)`. These questions do not use tan, sec, csc or cot. The exact arrangement is set in implementation and checked by the design review.
  - The grader puts 3–4 hidden concrete functions in place of `f` and `g`; all must agree. The parse of other questions does not change.
  - *Accept:* generator, grader and SymPy-oracle tests; full design review; iPhone check by the owner.
- **S8 Learning path.** *From:* L8, L9, L10, L11, L12, R8, R9
  - Order and levels (28 skills): 1 constant, power, sum, root; 2 exp, log, sin, cos; 3 product, quotient, tan, cot, sec, csc, combine (Combinations I); 4 chain, mixed (Combinations II); 5 implicit, inverse, asin, acos, atan, higher, nested (Combinations III), abstract; 6 parametric, vector, polar (off by the teacher setting).
  - Prerequisites as in R8/R9 (product no longer needs tan; tan..csc need quotient; inverse trig needs inverse).
  - Combination content as in R9; the quotient+chain and three-rule templates move from `mixed` to `nested`.
  - Level titles: The foundations; Essential functions; Products & quotients; The chain rule; Beyond the basics; Curves & coordinates.
  - *Accept:* an always-correct student meets the first product question at question ≤ 15 (owner target 10–15); S4 truth-student median for the first product/quotient/chain question ≤ 35 (replaces ≤ 70); path tests for order, levels, prerequisites and combination content.
- **S7 Curriculum `ap-derivatives-3`.** *From:* R4, R7
  - Profile 4 holds the 28 skills of S8 and the mastery fields.
  - Level change: a migrated student gets `unlockedLevel` = the larger of the old value and the new level of every skill with Basic passed, so every passed skill keeps its reviews; a started skill that is not passed waits for its new level and prerequisites. A registered migration from `ap-derivatives-2` seeds the estimates (R7).
  - Old codes (DSP1, profiles 1–3) still import. A new frozen fixture is added; the golden test keeps the frozen count of 26.
  - *Accept:* migration and transfer tests; legacy-fixture tests.

## To Do

Branch `practice-quality` from `main`. Order: T1, then T2 and T3 at the same time (no shared files), then T4, T5, T6, T7, T8, then the obligations. One commit per item after review.

Delegation rule (owner, L7, 2026-10-21; it replaces the default Claude/Codex split for this task):
- **dsf** = Qoder CLI (`qodercli`) with model `DeepSeek-Flash`. dsf writes the code of every T item.
- **Codex** (`gpt-6.1-sol`, high, read-only sandbox) reviews each dsf result against the Spec and the step prompt.
- dsf fixes the findings or answers them with a reason, in the same Qoder session. Codex reviews again in its same session. The loop stops when Codex approves, or after 3 rounds (then Claude decides).
- Claude writes each step prompt and the design decisions in it, takes a last look (diff, full tests), commits, and writes all documents.
- Keep every Qoder session (no `--no-session-persistence`). Record each session id under the T item, so a later change can resume it (`qodercli -r <id>`).
- dsf runs with `--permission-mode bypass_permissions` and denied commands: `git commit`, `git push`, `npx wrangler`, `npm install`.

The owner tags below follow this rule: “dsf → Codex → Claude”.

- [x] **T1** (S3) `src/math.ts` (`latex`), `tests/notation.test.ts` or a new display test: write number–letter products without a dot and negative terms as subtraction. *Verify:* display test; `npm test`; `npm run test:math`; grading regression tests unchanged. *Owner:* dsf → Codex → Claude (L7). Done 2026-10-21: Codex approved in round 0; Claude check: `tsc` pass, unit 361/361, `test:math` 10,100 checked, 0 failures. Sessions: Qoder `56306ebb-cf46-4849-be8e-54f271e4b7db`, Codex `01a15e52-c2d1-7cd3-a8fc-efbce7477cd2`.
- [x] **T1b** (S3) `src/math.ts` (`latex`), `tests/latex-display.test.ts`: a leading negative coefficient shows as a minus sign (`-4\ln(x)`, `-x`), found by Claude in the T2 sample (`(-4)·ln x`). *Owner:* dsf (resumed T1 Qoder session `56306ebb-cf46-4849-be8e-54f271e4b7db`) → Codex (`01a15e6d-77d2-7eb0-8915-c51faabd8867`) → Claude. Done 2026-10-21: approved r0; unit 392/392; `test:math` 0 failures.
- [x] **T2** (S1, S2) `src/templates.ts`, new `tests/number-policy.test.ts`: apply the number limits and natural forms to every existing template. *Verify:* new test (200 seeds per template); variety test; `npm run test:math`. *Owner:* dsf → Codex → Claude (L7). Done 2026-10-21 in worktree `pq-t2`, cherry-picked: Codex approved in round 1 (two findings fixed: cubic inverse kept increasing, exponent check widened). Claude check: unit 389/389 after merge, `test:math` 0 failures; re-measured answers: largest number 54 on non-third-derivative templates, third derivatives ≤ 192. Sessions: dsf=81cde0ee-82b6-416b-a351-3bf25d6b9505 codex=01a15e61-f09b-7a33-9365-9a1b623c2334 .
- [ ] **T3** (S4) [running: round 2 after the plan-owner decision on weak = passed skills only] new `src/mastery.ts`; `src/progress.ts` (`recordOutcome`, `chooseNext`, readiness helpers, `SkillState`); `tests/mastery.test.ts`; `tests/progress.test.ts`; `tests/simulation.test.ts`; `tests/helpers/simulate.ts`: build the mastery model and the new selection rules. *Verify:* unit tests; S4 simulation thresholds; no-deadlock simulations. *Owner:* dsf → Codex → Claude (L7).
- [x] **T4** (S6) `src/math.ts` (derivative, evaluation, display of `f`/`g` nodes), `src/grading.ts` (second parse engine, substitution grading), `src/domains.ts`, `src/skill-inference.ts`, `scripts/math-corpus.ts`, `scripts/check_math.py`: abstract-function math and grading, to a node design that Claude writes in the step prompt. *Verify:* new grader tests (correct, wrong, equivalent forms, `f'` notation, no change for other questions); SymPy oracle with `Function('f')`. *Owner:* dsf → Codex → Claude (L7). Done 2026-10-21: Codex approved in round 0; Claude check: `tsc` pass, unit 381/381, SymPy self-test 8/8, `test:math` 10,100 / 0 failures, 8 extra wrong-answer probes graded right. Sessions: Qoder `8fe724ef-288b-43f1-92e7-c90d8cfaa788`, Codex `01a15e5c-f5f5-7350-bcaf-7a6d106fbb8a`.
- [x] **T5** (S6) `src/catalog.ts`, `src/templates.ts` (abstract templates), `src/questions.ts` (hints, rule formula); after dsf's question, 2026-10-21: Fn support in `tests/number-policy.test.ts`, `tests/generator-variety.test.ts`, `tests/latex-display.test.ts`; `tests/generator-golden.test.ts` pins 26: add skill `abstract` with its Basic and Mixed templates. *Verify:* generator tests; variety and number-policy tests; skill examples. *Owner:* dsf → Codex → Claude (L7). Done 2026-10-21 in worktree `pq-t5`, cherry-picked: Codex approved round 1. Claude check: 400/402 unit (2 known profile-3 failures until T7), `test:math` 10,600 checked (500 abstract) 0 failures, sample of 20 questions read. Sessions: dsf=edc8d2d4-343b-4e5f-b332-ffcad7693acb codex=01a15e77-7cf9-7a20-8e09-f9f843e4fdc1 .
- [x] **T6** (S6) `src/math-keyboard.ts`, `src/main.ts` (pass the question kind), `tests/math-keyboard-layout.test.ts`, `tests/math-keyboard.spec.ts` (after dsf's question, 2026-10-21: only to exclude the four template keys from the typing-equivalence matrix): `f(□)`, `f′(□)`, `g(□)`, `g′(□)` keys on abstract questions. *Verify:* layout tests; browser test that types an abstract answer; screenshots at 390 px and 1280 px, light and dark. *Owner:* dsf → Codex → Claude (L7). Code done 2026-10-21 (Codex approved r0; unit 385/385); browser test and screenshots stay open until T5 gives abstract questions. Sessions: Qoder `d6123eba-53b3-4ce8-86cd-31bdf0c7cea7`, Codex `01a15e65-e013-7382-b507-b791b6ea4538`.
- [x] **T9** (S8) `src/catalog.ts`, `src/templates.ts`, `src/questions.ts`, `src/main.ts` (level titles), `public/practice-config.json`, path and simulation tests: new order, levels, prerequisites, three combination skills, level 6 off; S4 threshold ≤ 35. *Verify:* `tests/learning-path.test.ts`; S4 and always-correct simulations; `npm run test:math`. *Owner:* dsf → Codex → Claude (L7). Runs before T7. Done 2026-10-21: after dsf's questions, also `tests/generator-golden.test.ts` (legacy `mixed:1` → moved key) and `scripts/check_math.py` (combine family); always-correct chain bound ≤ 50 (measured 47). Codex approved round 1. Claude check: unit 432/434 (2 known profile-3 failures until T7), `test:math` 11,200 checked, 0 unsupported, 0 failures; S8 product at 12; S4 medians 29 / 9 / 31 of 40; 42 combination questions read. Sessions: dsf=80cd29c2-927e-4822-a21e-2d62cb17712c codex=01a15ec7-1029-70c2-98b2-a95f52f1c6bf .
- [x] **T7** (S7) `src/catalog.ts` (`CURRICULUM_VERSION`), `src/compact-progress.ts` (profile 4), `src/migrate.ts`, `src/transfer.ts`, `scripts/capture-fixtures.ts`, new frozen fixture, `tests/migrate.test.ts`, `tests/transfer.test.ts`, `tests/compact-progress.test.ts`, `tests/legacy-fixtures.test.ts`, `tests/generator-golden.test.ts`: curriculum `ap-derivatives-3` with the mastery fields and the new skill. *Verify:* all migration, transfer and legacy tests; QR size audit. *Owner:* dsf → Codex → Claude (L7). Done 2026-10-21: after dsf's questions, also `tests/progress.test.ts` (rounding) and `tests/app.spec.ts:396` (format 3); the v2 invariant “streak 2 implies passed” removed on purpose. Codex approved round 1 (corrupt v2 input now validated before conversion). Claude check: unit 443/443, `test:math` 0 failures, existing fixtures unchanged, new frozen fixtures `dsp2-profile3.txt`, `local-state-v2.json`. QR: frozen 26-skill fixture 1,200 → 1,181 chars, v28-M → v27-M; full 28-skill snapshot 1,862 chars, one QR v31-L. Sessions: dsf=268cfd6e-d8c0-4db8-814f-75649cf10e8c codex=01a15ede-ee00-7480-b38c-e33f7ebd508a .
- [x] **T8** (S5) `src/storage.ts` or `src/main.ts`: request persistent storage once. *Verify:* unit test with a stub. *Owner:* dsf → Codex → Claude (L7). Done 2026-10-21: Codex approved round 0; unit 448/448. Sessions: dsf=aeeca4c0-2094-4a36-8174-d8e8db9d7066 codex=01a15eeb-96f4-75a2-b7d7-266f291c19aa .

- [x] **T11** (S4, S6, S7, S8) `tests/*.spec.ts`: adapt the browser tests to the intended behaviour changes (first e2e run 2026-10-21: 181 passed, 23 failed in 3 browsers, all from new path / one-answer pass / repair rule / level 6 off) and add the abstract-keyboard browser test left open in T6. *Verify:* `npx playwright test` all pass. *Owner:* dsf → Codex → Claude (L7). Done 2026-10-21: Codex approved round 0 (one nit: the level-4 representative test still says “Nested chain rule”; accepted, rename later). Claude check: `npx playwright test` 208 passed, 62 skipped, 0 failed (Chromium, Firefox, WebKit). Sessions: dsf=4d0f6b58-98e2-430e-9449-966541b79f4f codex=01a15f07-800f-7e60-a51b-801b0b75b757 .
- [x] **T12** (P7) `scripts/skill-examples.ts`: notes for `combine`, `abstract`, re-scoped `mixed`/`nested`; skill count from the catalog. Regenerated: 28 skills, 112/112 verified. *Owner:* Claude (content notes). Done 2026-10-21, commit 8f8aa7c.

- [x] **T13** (S6, S8; R10 F1, F3, F4, F5) `src/math-keyboard.ts`, `src/style.css`, `src/math.ts` (`latex` of Fn), `src/main.ts` (path level row, “skill”/“skills”), `tests/math-keyboard.spec.ts`, `tests/math-keyboard-layout.test.ts`, `tests/latex-display.test.ts`, `tests/app.spec.ts`; after dsf's questions also `tests/abstract-grading.test.ts` (display strings) and one path rule in `src/style.css` (cursor): fix the design-review findings. *Verify:* face-fit measurement at 390 and 320 px; unit and e2e suites. *Owner:* dsf (resumed T6 Qoder session) → Codex → Claude (L7). Done 2026-10-22: Codex approved round 1. Claude check: unit 449/449; faces fit at 390 and 320 px (`reviews/shots/webkit-abstract-keys-390.png`, `-320.png`); prompt shows `f(5x)`. Sessions: dsf=d6123eba-53b3-4ce8-86cd-31bdf0c7cea7 codex=01a16104-cbc4-7372-af8b-b71975234b37 .

- [x] **T14** (S9; R11) `src/grader-client.ts`, `src/main.ts` (start the worker when a question appears), new `tests/grader-client.test.ts`, `tests/app.spec.ts` (slow-download test), `tests/worker.test.ts` (approved by Claude 2026-10-22 during review: minimal adaptation of the existing worker test to the ready-message protocol), `tests/flow.spec.ts:335` (approved by Claude 2026-10-22 after review round 3: wait until the countdown panel is visible before interrupting it; the earlier timing let the test race the warmed checker): checker start outside the 3-second limit. *Verify:* unit and browser tests; redeploy the preview. *Owner:* dsf (resumed T4 Qoder session) → Codex → Claude (L7). Done 2026-10-22: three review loops; Codex found no code problem in the last round, only the scope of `tests/worker.test.ts` and `tests/flow.spec.ts:335`, which Claude approved. Claude check: unit 454/454, e2e 220 passed / 65 skipped / 0 failed; README and What's new updated. Sessions: dsf=8fe724ef-288b-43f1-92e7-c90d8cfaa788 codex=01a1616e-f9af-7260-82e7-4ca635c5b9e0 .

Project obligations:
- [x] **P1** README and `help.html`: numbers, mastery rules, new skill, keyboard keys, storage tip. *Owner:* Claude (docs are not delegated).
- [x] **P2** `npm version 1.3.0 --no-git-tag-version`; What's new entry in `src/whats-new.ts`. *Owner:* Claude.
- [x] **P3** `docs/design/DESIGN.md` §6: the abstract-question keys. *Owner:* Claude.
- [x] **P4** Full design review: `npm run design:capture`, then the `design-reviewer` subagent with `reviews/context.md`; P0 and P1 cleared before release. *Owner:* Sonnet (design-reviewer), graded by Claude.
- [ ] **P5** [preview deployed 2026-10-22 with the owner's approval (“部署预览”): https://practice-quality.ap-calculus-practice.pages.dev (deployment af2695b1; redeployed 2026-10-22 with T14 as 090c8dbf, checked in WebKit with the worker download delayed 4 s: the first check returns a verdict, not “took too long”), footer v1.3.0, config level 6 off, help text new; production unchanged (revision 2026-09-19-1)] Build, test, e2e, push, deploy to Cloudflare Pages, check live `/` and `/help` (deploy after the owner's approval). *Owner:* Claude.
- [ ] **P6** [2026-10-22: owner asked for a way to jump to abstract questions on the preview; Claude made a test progress link (`research/jump.mts`, `evidence/preview-abstract-jump-link.txt`, QR `evidence/preview-abstract-jump-qr.png`): levels 1–5 passed except `abstract`, cards due in 30 days; checked in WebKit 390 px: first question `h(x)=f(2x)`] iPhone check by the owner: keyboard keys on an abstract question. *Owner:* owner.
- [x] **P7** Regenerate `skill-examples` (docs and public page); `npm run test:math`. *Owner:* Claude.
- [x] **P8** Mark `docs/reviews/2026-09-27-coefficients/plan.md` as replaced by this task. *Owner:* Claude.

## Acceptance

Not started.

## Status at pause (2026-10-21, usage limit)

- Done and committed on `practice-quality`: T1, T1b, T2, T3, T4, T5, T6, T7, T8, T9, T11, T12; P1, P2 (1.3.0), P3, P7. Unit 448/448, e2e 208 passed / 0 failed, `test:math` 11,200 / 0 failures, build passes.
- Closed 2026-10-22: P4 full design review (see R10, `release-review.md`; final e2e 218 passed / 0 failed, unit 449/449, build passes). Was open: P4 full design review (the `design-reviewer` subagent was started; screenshots in `artifacts/design/1.3.0/`, scope in `reviews/context.md`). Claude found one likely P1 before the review: at 390 px the keys f(▫), f′(▫), g′(▫) are clipped (`artifacts/e2e/webkit-mobile-abstract-function-keyboard.png`); also `f\left(5x\right)` renders with a gap (“f (5x)”). Fix both through the T6 Qoder session `d6123eba-53b3-4ce8-86cd-31bdf0c7cea7` (keys) and the T4 session `8fe724ef-288b-43f1-92e7-c90d8cfaa788` (latex of Fn).
- Open: P5 deploy (needs the owner's approval), P6 iPhone check by the owner, P8 mark the coefficients plan replaced, worktrees removed 2026-10-22, acceptance walk.
