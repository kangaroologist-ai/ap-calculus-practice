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
| G1 | 存储打开超时或失败后怎么处理 | **显示 “无法打开已保存的进度，请重新载入页面” 与重新载入按钮，不自动进入临时模式**（避免学生在不保存的模式里做题）/ 超时后自动进入临时模式（现有的失败路径） | 第 2 轮：“local-storage problem uses "please reload"” → 推荐方案 | 2026-09-27 |

第 2 轮（2026-09-27，负责人在 1.2.1 预览上真机试用，原话）：“键盘还是会沉降，好像是输入过程中出的问题？你再排查一下”；“local-storage problem uses "please reload"”（附截图：`layer h 714.0 var 714px`，但 `kb open top 491 bottom 727`）。
→ S1 未通过，回到 Research（R3）。G1 定案。未另问、按默认处理：
- D3：存储打开**超时或失败**都显示 “请重新载入” 与 Reload 按钮；按钮下保留一个次要的 “Continue without saving” 链接进入现有的临时模式，以免存储长期不可用（如某些隐私模式）时学生完全进不去。

## Research

### R1. 键盘超出可见区域 13 px（已查明原因，待真机验证修法）

- **[F]** 负责人 iPhone（iOS Safari，底部浮动地址栏）`?debug=viewport` 读数：可见高度 714，键盘底部 727；最后一行只露出约 31 / 44 px。地址栏在可见区域之外。
- **[F]** MathLive：`body > .ML__keyboard { position: fixed }`，`.ML__keyboard { top: 0; height: 100% }`，键区贴底（`node_modules/mathlive/mathlive.mjs:13700-13760`）。
- **[I]** 固定层的 100% 高度按大视口计算，比可见高度多 13 px。候选：`height: 100dvh`，或按 `visualViewport.height` 设置；诊断面板加一项 “键盘层高度 / 100dvh 的实际值” 以便真机核对。

### R3. 修复后键盘仍然下沉（第 2 轮）

- **[F]** 真机读数：键盘层高度已等于可见高度（`layer h 714`，变量 714px），但键区仍在 491–727，比层的底边低 13 px；负责人感觉是 “输入过程中” 出现的。
- **[F]** MathLive 的键区背板 `.MLK__backdrop` 高度是 `--_keyboard-height`，在键盘显示时由 `adjustBoundingRect()` 按键区当时的高度加上下内边距（下内边距含 `env(safe-area-inset-bottom)`）算出，背板用 `bottom: -H` 加 `translateY(-H)` 贴在层的底边（`mathlive.mjs:13755-13790`、`29082-29093`）；键盘层 `overflow: hidden`。
- **[I]** 两种可能：① `--_keyboard-height` 过时——键区在测量之后变高（重绘、字体加载、⇧ 状态），背板高度不变，多出的部分向下伸出层外被裁掉；② 层本身在 iOS 上被整体下移（固定定位在输入 / 滚动时的偏移）。两者需要不同的修法。
- **[U]** 需要真机数据区分：诊断面板加入层的 top / bottom、背板的 top / bottom / 高度、`--_keyboard-height`、背板下内边距、`env(safe-area-inset-bottom)` 实测值；请负责人分别在 “刚打开键盘” 和 “输入后下沉” 时截图。

### R4. 下沉原因已在仿真中复现：顶栏在测量后变高（R3 的假设 ①）

- **[F]** WebKit iPhone 13 仿真，连续答题（`sink.cjs`，会话 scratchpad）：第 1、2 题键区 429–665、背板 423–664；**第 3 题键区 441–677**（比可见高度 664 多 13 px，与真机读数一致）；第 4 题键区 432–668、背板 426–655。
- **[F]** 顶栏高度先是 MathLive 自己的 32 px，本站注入 Hint? / Skip / 收起（最小高度 44 px）后变成 44 px，键区从 224 变成 236 px（`toolbar-h.cjs`）。MathLive 的 `ResizeObserver` 在键盘显示时观察键区并重新测量（`mathlive.mjs:28896-28900`），但每题重设布局后会重建键区，重建后的变高不一定被重新测量，`--_keyboard-height` 就停在旧值，键区伸出层外被裁掉。
- **[I]** R1 的 “100% 是大视口” 在真机上也成立（修复前层高 727 以上），但主要原因是这里：修 R1 之后层高已正确，键区仍因高度过时而下沉。修法：让顶栏从一开始就是 44 px 的固定高度，MathLive 任何时候测到的都是最终高度；R1 的修复保留。
- **[I]** 1.2.0 之前页签行里的按钮是 40 px，与 MathLive 自己的高度差得少；第 12 轮把点按高度改到 44 px（C-F6）后差值变大，问题才明显。

### R2. 本地存储（IndexedDB）打开卡住或失败

- **[F]** 一次停在 “Opening your practice…”（`boot()` 没有到第一次 `render()`），一次出现 “Temporary session: export progress before leaving”（`loadState()` 抛错后的临时模式）。仿真与已部署预览都无法复现。
- **[F]** `src/storage.ts` 用 `idb` 的 `openDB`，没有超时。
- **[U]** 负责人待试：卡住时下拉刷新能否进入；新标签页打开能否进入。

## Spec

- **S1 键盘底部在可见区域内。** 手机上键盘打开时，键盘的底边不超过当前可见高度（`window.innerHeight`），最后一行完整可见；地址栏展开、收起、页面滚动后都成立。*Accept:* 浏览器测试（键盘层高度等于 `innerHeight`，键区底边 ≤ `innerHeight` + 1）；负责人 iPhone 上 `?debug=viewport` 读数与截图。*From:* R1、第 1 轮
- **S3 存储打不开时提示重新载入（G1、D3）。** 启动时本地存储约 5 秒内没有打开，或打开失败，页面不再停在 “Opening your practice…” 或直接进入临时模式，而是说明无法打开已保存的进度，给出 Reload 按钮，以及次要的 “Continue without saving”。*Accept:* 浏览器测试模拟超时与失败两种情况；真机确认。*From:* R2、G1、D3
- **S2 版本与文档。** 1.2.1，What's new 一条；README / help 如有相关说法同步（预计无需改动，核对后写明）；DESIGN.md 6.5 记录这条限制与修法。*Accept:* What's new 测试；检索。*From:* D1、`AGENTS.md`

## To Do

- [x] **T1** (S1) `src/main.ts`、`src/style.css`：把 `window.innerHeight` 写进 CSS 变量（`resize`、`visualViewport` 的 `resize` 时更新），`body > .ML__keyboard` 的高度改用它（替代 MathLive 的 `height: 100%`）；诊断面板加 “键盘层高度” 一项。*Verify:* 新测试；三种宽度截图；预览真机读数。*Owner:* Claude - 改动小，依赖真机验证
  **结果**：`syncViewportHeight()` 把 `innerHeight` 写进 `--practice-viewport-height`；`body > .ML__keyboard { height: var(...) }`；诊断面板加 “layer h”。WebKit 390：layer h 664 = innerHeight 664（键区底边 665，是 MathLive 自身 1 px 边框，修改前后相同）。
- [x] **T2** (S1) `tests/app.spec.ts` 或 `tests/math-keyboard.spec.ts`：键盘层高度与 `innerHeight` 一致、键区底边不超出。*Owner:* Claude
  **结果**：`tests/math-keyboard.spec.ts` “the keyboard layer follows the visible height…”：三种高度下变量等于 `innerHeight`、键盘层取变量的高度、resize 后回到 `innerHeight`、键区超出 ≤ 1 px；在去掉修复的代码上失败，修复后三种引擎通过。注：仿真里 100% 与 `innerHeight` 本来相等，所以测试检查的是机制，真实效果靠 P5。
- [x] **T6** (S1) `src/style.css`：`.ML__keyboard .MLK__layer > .MLK__toolbar` 固定高度 44 px（与按钮的点按高度相同）；`tests/math-keyboard.spec.ts`：连续答几题后键区底边 ≤ `innerHeight` + 1、背板与键区高度一致。*Verify:* 新测试在旧样式上失败；`sink.cjs` 各题一致。*Owner:* Claude - 复核中定位的一行修复
  **结果**：顶栏 `height: 44px`（`box-sizing: border-box`）。新测试 “the key block stays on screen across several questions”（用 Skip 连换 4 题）在旧样式上第 3 题超出 13 px、三种引擎都失败，修正后通过；`sink.cjs` 4 题键区都在 429–665。写测试时第一次用 “答 0” 换题，第 3 题不是常数题而失败，改用 Skip。
- [x] **T4** (S1) `src/main.ts`：R3 的诊断读数（只在 `?debug=viewport` 时）。*Verify:* 仿真里各值合理；部署预览请负责人截两张图。*Owner:* Claude - 需要真机数据
  **结果**：诊断面板加了层 / 背板 / 键区高度、背板下内边距、`env(safe-area-inset-bottom)` 实测值和键区底边的最近 3 次变动；靠它在仿真里定位了 R4，真机读数随下一次预览再取。
- [x] **T5** (S3) `src/main.ts`、`src/storage.ts`（如需）、`src/style.css`：存储打开加超时（约 5 秒）；超时或失败时显示 “Couldn’t open your saved progress.” 说明、Reload 按钮和次要的 “Continue without saving”（进入现有临时模式）。测试：模拟打开超时与失败。*Owner:* Claude - 涉及启动流程与数据安全
  **结果**：`loadStateWithin(5000)` 与 `chooseAfterStorageFailure()`（`src/main.ts`），`.boot-actions`（`src/style.css`）。测试 “when opening saved progress hangs / fails, practice asks for a reload”：卡住用真实的 IndexedDB 升级事务阻塞模拟（第一次用假的请求对象，`idb` 立即失败，并没有测到卡住，已改），失败用 `indexedDB.open` 抛错；两者在旧代码上失败、修正后通过。README、`help.html`、What's new 1.2.1 第二条、DESIGN.md 6.5 同步。
- [x] **T3** (S2) `package.json` 1.2.1、`src/whats-new.ts` 新条目、DESIGN.md 6.5、README / help 核对。*Owner:* Claude - 文档不委派
  **结果**：`package.json` 1.2.1；What's new 1.2.1 两条（项目规则要求 2–6 条，第一次写 1 条被 What's new 单元测试拦下后补了第二条）；DESIGN.md 6.5 新增一条。另记 **[P]**：`package-lock.json` 的版本仍是 1.1.1，1.2.0 时就没同步，本次不改。

Project obligations:
- [x] **P1** README / `help.html`：applies — 核对是否有涉及的说法。
  **结果**：检索后两处都没有涉及键盘被截的说法，无需修改。第 2 轮后：存储提示写入 README 与 `help.html`（Move 一节）。
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
