---
task: iphone-viewport-storage
phase: implement      # grill | research | spec | todo | implement | acceptance | done
scope: ap-calculus-practice / iPhone Safari：键盘超出可见区域；本地存储打开不正常
branch: fix-iphone-keyboard-viewport
version: 1.2.0 → 1.2.1（预计，用户可见的修复）
commits:
  - 8e85af7: keyboard layer follows innerHeight; 1.2.1; unit 355, Playwright 190 pass
---

# iPhone：键盘最后一行被截、存储打开卡住或失败

来源：`docs/reviews/2026-09-27-keyboard-polish/plan.md` 的 R22、R25、R26 与 G27（负责人第 16 轮决定 1.2.0 先发布，这两个问题另开任务）。

## Grill (decision log)

Recon：键盘任务里已做的真机取数与分析，见 Research。

第 1 轮（2026-09-27，1.2.0 发布后，原话）：“这个遮挡问题也改了吧”
→ **本轮只修键盘超出可见区域（R1）；存储问题（R2、G1）留在本任务稍后处理。** 未另问、按默认处理：
- D1：这是学生能看到的修复，按 `AGENTS.md` 升级为 1.2.1，并加一条 What's new（英文 1 条）。
- D2：修法先部署预览，请负责人用 `?debug=viewport` 在 iPhone 上确认读数（键盘底部 ≤ 可见高度）后再发布。

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G1 | 存储打开超时后怎么处理 | **显示 “无法打开已保存的进度，请重新载入页面” 与重新载入按钮，不自动进入临时模式**（避免学生在不保存的模式里做题）/ 超时后自动进入临时模式（现有的失败路径） | 待答 | 2026-09-27 |

## Research

### R1. 键盘超出可见区域 13 px（已查明原因，待真机验证修法）

- **[F]** 负责人 iPhone（iOS Safari，底部浮动地址栏）`?debug=viewport` 读数：可见高度 714，键盘底部 727；最后一行只露出约 31 / 44 px。地址栏在可见区域之外。
- **[F]** MathLive：`body > .ML__keyboard { position: fixed }`，`.ML__keyboard { top: 0; height: 100% }`，键区贴底（`node_modules/mathlive/mathlive.mjs:13700-13760`）。
- **[I]** 固定层的 100% 高度按大视口计算，比可见高度多 13 px。候选：`height: 100dvh`，或按 `visualViewport.height` 设置；诊断面板加一项 “键盘层高度 / 100dvh 的实际值” 以便真机核对。

### R2. 本地存储（IndexedDB）打开卡住或失败

- **[F]** 一次停在 “Opening your practice…”（`boot()` 没有到第一次 `render()`），一次出现 “Temporary session: export progress before leaving”（`loadState()` 抛错后的临时模式）。仿真与已部署预览都无法复现。
- **[F]** `src/storage.ts` 用 `idb` 的 `openDB`，没有超时。
- **[U]** 负责人待试：卡住时下拉刷新能否进入；新标签页打开能否进入。

## Spec

- **S1 键盘底部在可见区域内。** 手机上键盘打开时，键盘的底边不超过当前可见高度（`window.innerHeight`），最后一行完整可见；地址栏展开、收起、页面滚动后都成立。*Accept:* 浏览器测试（键盘层高度等于 `innerHeight`，键区底边 ≤ `innerHeight` + 1）；负责人 iPhone 上 `?debug=viewport` 读数与截图。*From:* R1、第 1 轮
- **S2 版本与文档。** 1.2.1，What's new 一条；README / help 如有相关说法同步（预计无需改动，核对后写明）；DESIGN.md 6.5 记录这条限制与修法。*Accept:* What's new 测试；检索。*From:* D1、`AGENTS.md`

## To Do

- [x] **T1** (S1) `src/main.ts`、`src/style.css`：把 `window.innerHeight` 写进 CSS 变量（`resize`、`visualViewport` 的 `resize` 时更新），`body > .ML__keyboard` 的高度改用它（替代 MathLive 的 `height: 100%`）；诊断面板加 “键盘层高度” 一项。*Verify:* 新测试；三种宽度截图；预览真机读数。*Owner:* Claude - 改动小，依赖真机验证
  **结果**：`syncViewportHeight()` 把 `innerHeight` 写进 `--practice-viewport-height`；`body > .ML__keyboard { height: var(...) }`；诊断面板加 “layer h”。WebKit 390：layer h 664 = innerHeight 664（键区底边 665，是 MathLive 自身 1 px 边框，修改前后相同）。
- [x] **T2** (S1) `tests/app.spec.ts` 或 `tests/math-keyboard.spec.ts`：键盘层高度与 `innerHeight` 一致、键区底边不超出。*Owner:* Claude
  **结果**：`tests/math-keyboard.spec.ts` “the keyboard layer follows the visible height…”：三种高度下变量等于 `innerHeight`、键盘层取变量的高度、resize 后回到 `innerHeight`、键区超出 ≤ 1 px；在去掉修复的代码上失败，修复后三种引擎通过。注：仿真里 100% 与 `innerHeight` 本来相等，所以测试检查的是机制，真实效果靠 P5。
- [x] **T3** (S2) `package.json` 1.2.1、`src/whats-new.ts` 新条目、DESIGN.md 6.5、README / help 核对。*Owner:* Claude - 文档不委派
  **结果**：`package.json` 1.2.1；What's new 1.2.1 两条（项目规则要求 2–6 条，第一次写 1 条被 What's new 单元测试拦下后补了第二条）；DESIGN.md 6.5 新增一条。另记 **[P]**：`package-lock.json` 的版本仍是 1.1.1，1.2.0 时就没同步，本次不改。

Project obligations:
- [x] **P1** README / `help.html`：applies — 核对是否有涉及的说法。
  **结果**：检索后两处都没有涉及键盘被截的说法，无需修改。
- [x] **P2** 版本与 What's new：applies — 1.2.1。
  **结果**：见 T3。
- [x] **P3** DESIGN.md：applies — 6.5。
  **结果**：6.5。
- [x] **P4** 设计审核：applies，常规审核（改的是既有键盘的定位，不新增组件）：390 深浅色键盘打开状态比对。
  **结果（常规审核）**：仿真中键盘外观与 1.2.0 相同（`after-390-light.png`、`after-390-dark.png`），差异只在 iPhone 真机上出现，由 P5 确认。无 P0 / P1。
- [ ] **P5** iPhone 真机确认：applies — 键盘底部读数与最后一行可见。
- [ ] **P6** 部署与线上核对：applies — 预览 → 真机确认 → 合并 `main` → 部署 → 线上 `/` 与 `/help`。
  **进展**：预览（提交 `8e85af7`）https://fix-iphone-keyboard-viewport.ap-calculus-practice.pages.dev ，部署 `6cb8c958`，返回 `main-D6IQTFAP.js`，与本地构建一致；正式站点仍为 1.2.0。等负责人真机确认（P5）。

诊断面板（`?debug=viewport`）随 1.2.0 上线，本任务结束时删除。

## Acceptance

待填写。
