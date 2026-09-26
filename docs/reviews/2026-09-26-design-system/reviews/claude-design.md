# 评审 A：Claude design 插件视角（design-critique / accessibility-review / design-system / ux-copy）

> 来源：Sonnet 只读子代理，2026-09-26。方法：通过 Skill 工具调用四个 `design:*` 技能；读取源码、`baseline/` 截图与几何数据，另用 Playwright 补拍（WebKit iPhone 13 390 px、Chromium 1280 px，浅色 / 深色），补拍图在会话 scratchpad，其中 What's new 一张已复制为 `baseline/390-light-11-whats-new.png`。下文为子代理报告原文（英文），只删去了“报告无法写入文件”的说明。

## 1. Math keyboard

### 1.1 Root causes (facts)

- **Digit staircase**: `derivativeLayout` rows in `src/math-keyboard.ts:23-26` place 7/8/9 in row1 cols2-4, 4/5/6 in row2 cols4-6, 1/2/3 in row3 cols6-8, 0 in row4 col4. Confirmed in `keyboard-geometry.json`.
- **Functions tab duplicates**: `functionLayout` rows (`math-keyboard.ts:29-33`) repeat sin/cos/tan/sec/csc/ln.
- **Sticky tooltip**: every key gets `tooltip:\`Type ${item.physical}\`` (`math-keyboard.ts:20`). MathLive turns `keycap.tooltip` into both `data-tooltip` and (via `getKeycapAriaLabel`, `mathlive.mjs:27887-27893`, which prefers `tooltip`) the `aria-label`. The bubble is pure CSS: `[data-tooltip]:hover::after { transition-delay: 1s; }` (`mathlive.mjs:13360-13366`), not gated by `(hover: hover)`. iOS Safari keeps `:hover` after a tap, so the bubble appears ~1 s after any tap and stays until the user taps elsewhere.
- **Off-centre action-key icons**: 4–6 px offsets at 390 px; 49 px for backspace at 1280 px.
- **Row-width mismatch**: row 4 = 9 units vs 8 (`[hide-keyboard]` and `[backspace]` default to width 1.5, `mathlive.mjs:28425/28459`); Functions last row = 6 units. Very likely also the cause of the icon offsets.
- **Width underuse**: keycap width `min(var(--_keycap-max-width, 100px), 10cqw)` (`mathlive.mjs:13848`) against a `container-type: inline-size` ancestor (`mathlive.mjs:13817`). `.ML__keyboard` (`src/style.css:988-995`) never sets `--keycap-width` or `--keycap-max-width`.
- **Duplicate `/`**: `math-keyboard.ts:24` appends a second `/`-labelled key with the same fraction command as `a/b`.
- **Tab switcher isn't a real tab control**: `makeLayoutsToolbar` (`mathlive.mjs:28067-28085`) renders plain `<div>`s with no `role="tab"`, `aria-selected`, or `tabindex` — upstream MathLive behaviour.

### 1.2 Curated layout proposal (8 columns, every row = 8 units, no cross-tab duplicates)

Derivatives:

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
|1| x (ctx var) | ( | ) | sin | cos | 7 | 8 | 9 |
|2| xⁿ | √x | ln | sec | csc | 4 | 5 | 6 |
|3| eˣ | tan | + | − | × | 1 | 2 | 3 |
|4| ◀ | ▶ | a/b | . | ⌨ hide | 0 (w2) | ⌫ | |

Functions (3 rows, width-2 keys): `y t θ π` / `cot log ∛ ◀▶` / `arcsin arccos arctan ⌫⌨`.

Open questions: two-variable slot for curve questions; rename "Functions" (e.g. "More").

## 2. Design critique (whole app)

- One clear primary action per screen; consistent across breakpoints and themes.
- Footer "How to use" baseline mismatch still present (`docs/ui-review.md` #9).
- Dialog heading style reused correctly across Move progress / What's new.
- Keyboard toggle uses a keyboard emoji while every other icon is SVG/CSS — inconsistent rendering (opinion).
- At 1280 px the card stays capped at 800 px with a mostly empty side column once the keyboard opens — deliberate, not a defect (opinion).
- Works well: auto-next bar, hint escalation copy, "0/26 skills ready" language; dark mode is a clean token swap.

## 3. Accessibility (WCAG 2.1 AA)

| # | Issue | Criterion | Severity | Evidence |
|---|---|---|---|---|
| 1 | Keyboard tab switcher has no `role`, `aria-selected`, `tabindex` | 4.1.2, 2.1.1 | Major | `mathlive.mjs:28067-28085` (library) |
| 2 | Sticky touch tooltip covers adjacent keys | adjacent content on hover | Minor–Major | `390-light-04-keyboard-tooltip.png` |
| 3 | Keycap width ~37 px at 390 px (below the 44 px used elsewhere in the app; height is 44 px) | 2.5.5 (AAA) / 2.5.8 | Minor | `keyboard-geometry.json` |
| 4 | No `h1` on the practice page | 1.3.1 | Minor | pre-existing |
| 5 | Tooltip text doubles as accessible name — removing `tooltip` would also remove the name unless replaced | 4.1.2 | Pass (incidental) | `getKeycapAriaLabel` |

Verified passing: dialog close `aria-label="Close"`; formulas `role="math"` with speakable labels; focus-visible outlines; primary button contrast (dark ≈ 6.96:1); 44 px min-height on buttons.

## 4. Design-system / token audit

- Present: semantic colour set with dark redefinition; `--t-*` type scale (16 tokens), no raw font sizes.
- **No spacing scale**: 27+ distinct hard-coded px values.
- **No radius scale**: 2, 3, 4, 8, 9, 10, 11, 12, 14, 16, 17, 20 px (`.button` 9, `.practice-card` 20/16, `dialog` 17, `.path-level` 14).
- **No motion tokens**: 650 ms / 800 ms and `ease-out` hard-coded in keyframes.
- **No elevation scale**: three independent `box-shadow` values plus dark overrides.
- **Keyboard token surface incomplete**: missing `--keycap-width` / `--keycap-max-width` / `--keycap-gap`.

Proposed: `--space-1..8` (4/8/12/16/20/24/32/40), `--radius-sm/md/lg/pill` (8/12/17/999), `--duration-fast/base/slow` + `--ease-standard/--ease-out`, `--elevation-1/2`, keycap sizing trio.

## 5. UX copy

- Works: hint escalation labels; storage error copy; confirmation buttons name the action.
- "Type x" tooltips are redundant for digits and operators; keep a tooltip only where the glyph is ambiguous.
- "Functions" overpromises after curation → "More".
- Dialog heading "Take your progress with you" vs trigger "Move progress" — different verbs for the same action.

## Priorities

- **P0** row-width mismatch — mechanical.
- **P0** digit staircase + Functions duplication — mechanical once the grid is chosen.
- **P1** sticky tooltip on touch — mechanical; needs a real-device check.
- **P1** keyboard width — mechanical; verify at 320/390/700/900/1280 px.
- **P1** missing tokens — judgement for values, then mechanical replacement.
- **P2** icon centring — re-measure after the row-width fix.
- **P2** duplicate `/` — mechanical.
- **P2** tab switcher accessibility — upstream; judgement (patch / file upstream / accept).
- **P3** footer baseline, missing `h1` — mechanical.
- **P3** copy nits — judgement, low cost.
