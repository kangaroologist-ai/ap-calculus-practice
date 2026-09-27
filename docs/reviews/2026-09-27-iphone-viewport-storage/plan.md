---
task: iphone-viewport-storage
phase: implement      # grill | research | spec | todo | implement | acceptance | done
scope: ap-calculus-practice / iPhone Safari：键盘超出可见区域；本地存储打开不正常
branch: fix-iphone-keyboard-viewport
version: 1.2.0 → 1.2.1（预计，用户可见的修复）
commits:
  - 82ff58f: 44 px top row from the start (R4), storage timeout and reload screen (S3); unit 355, Playwright 195 pass
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

第 3 轮（2026-09-27，负责人在第二次预览上真机试用，原话）：“每次输入幂和根号的时候屏幕会跳动一下，但是键盘已经不会挡住了。能调查到原因嘛？写好文档就行，后面再 implement”
→ **S1 真机通过**（键盘不再被挡）。新问题：输入幂和根号时页面跳动 → R5；本轮只调查并写文档，不改代码。

第 4 轮（2026-09-27，新会话，原话）：“把上一个session没完成的键盘调整完成”
→ 开始实施 T7、T8。未另问、按默认处理：
- D4：T7（事件记录）与 T8（`onScrollIntoView` 修法）放进**同一次预览**，省一次真机往返。诊断模式下加 `&mlscroll=1` 可恢复 MathLive 自己的滚动，负责人可以在同一个预览上先录 “修法前”、再录 “修法后”；若修法后仍跳，事件记录会显示是否为 iOS 原生滚动（H2）。
- D5：真机确认 S4 后再发布 1.2.1（P6）；若仍跳且确认是 H2，再问负责人是否先发布。

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

### R5. 输入幂和根号时页面跳一下（第 3 轮，只调查）

**现象（真机）**：负责人在 1.2.1 第二次预览上输入幂（▫^▫）和根号（√▫）时，“屏幕会跳动一下”；键盘不再遮挡。

**已查明的事实**
- **[F]** 仿真里没有复现：WebKit iPhone 13 与 iPhone 15 Pro Max，页面在顶部或先滚到 scrollY 150，依次按 3、x、幂、2、→、+、根号、x，`scrollY`、答题框位置与高度（66 px）、答题框内部 `scrollTop`、公式位置都不变（脚本 `jump.cjs`、`jump2.cjs`，会话 scratchpad）。所以是 iOS 真机特有的行为。
- **[F]** MathLive 每次按键后都调用答题框的 `scrollIntoView()`（仿真里一次按键 1–3 次，`jump.cjs` 计数）。它会做三件事（`mathlive.mjs:39720-39785`）：① `host.scrollIntoView({ block: "nearest" })`；② 若答题框底边低于键盘顶边，再 `scrollBy(底边 − 键盘顶边 + 8)` 滚动整页；③ 按光标或选区的位置，距答题框上下边缘不足 20 px 时滚动答题框内部，左右同理。
- **[F]** 幂与根号的共同点：按下后 MathLive 选中一个空的占位框（选区不为空），③ 就改用选区的上下边界计算；上标和根号的占位框位置比正文高。其他常用键（数字、变量、运算符）之后光标是折叠的。
- **[F]** MathLive 用一个固定定位、裁剪掉的 `contenteditable` 元素（`.ML__keyboard-sink`）接收输入，并在命令后把焦点留在它上面（`mathlive.mjs:13159-13171`、`39180`）。
- **[F]** MathLive 提供 `onScrollIntoView` 选项：设置后不做 ①②，改由页面自己决定怎么滚（`mathlive.mjs:39724`）。
- **[F]** 更正（第 4 轮复读源码，`mathlive.mjs:39738-39780`）：③ **不受** `onScrollIntoView` 影响，仍会执行。答题框内容没有溢出时 `host.scroll()` 不起作用，所以 H3 只在公式高过答题框时才可能出现；事件记录会记下答题框 `scrollTop` 的变化来确认。

**推测（按可能性）**
- **[I] H1**：真机上 KaTeX 字形或行高与仿真略有差别，加了上标或根号后答题框内容变高几像素，底边越过 “键盘顶边 − 8 px”，触发 ②，整页被滚动一下。与 “只有幂和根号” 最吻合。
- **[I] H2**：选中占位框后，iOS 为了 “露出” 聚焦的可编辑元素里的选区，做了原生滚动（仿真不模拟这一行为）。
- **[I] H3**：③ 让答题框内部上下滚了一下，公式在框里跳动（看起来像 “屏幕跳”）。

**取证方法（待实施）**：诊断面板（`?debug=viewport`）加一个事件记录，按时间列出：最近按的键、`scrollY` 变化及来源（`window.scrollBy` / `scrollingElement.scrollBy` / `scrollIntoView` 调用 / 无调用的原生滚动）、答题框高度与内部 `scrollTop` 的变化、`visualViewport.offsetTop` 的变化。请负责人输入 “x 幂 2” 与 “根号 x” 后截图，就能区分 H1–H3。

**修法候选（取证后选定）**
- 对 H1、H3：给答题框设置 `onScrollIntoView`，改用本站自己的 `keepAnswerVisible()`（只在答题框真的被键盘挡住时滚，留 16 px 余量，不滚答题框内部的上下方向）。这也让页面滚动只有一个来源。
- 对 H2：若是 iOS 原生滚动，需要另找办法（例如让输入元素的位置固定在答题框内、或在滚动后立即还原）；先看数据。

### R2. 本地存储（IndexedDB）打开卡住或失败

- **[F]** 一次停在 “Opening your practice…”（`boot()` 没有到第一次 `render()`），一次出现 “Temporary session: export progress before leaving”（`loadState()` 抛错后的临时模式）。仿真与已部署预览都无法复现。
- **[F]** `src/storage.ts` 用 `idb` 的 `openDB`，没有超时。
- **[U]** 负责人待试：卡住时下拉刷新能否进入；新标签页打开能否进入。

## Spec

- **S1 键盘底部在可见区域内。** 手机上键盘打开时，键盘的底边不超过当前可见高度（`window.innerHeight`），最后一行完整可见；地址栏展开、收起、页面滚动后都成立。*Accept:* 浏览器测试（键盘层高度等于 `innerHeight`，键区底边 ≤ `innerHeight` + 1）；负责人 iPhone 上 `?debug=viewport` 读数与截图。*From:* R1、第 1 轮
- **S3 存储打不开时提示重新载入（G1、D3）。** 启动时本地存储约 5 秒内没有打开，或打开失败，页面不再停在 “Opening your practice…” 或直接进入临时模式，而是说明无法打开已保存的进度，给出 Reload 按钮，以及次要的 “Continue without saving”。*Accept:* 浏览器测试模拟超时与失败两种情况；真机确认。*From:* R2、G1、D3
- **S4 输入时页面不跳动（第 3 轮）。** 在键盘打开时输入任何键（包括幂、根号、分式），页面与答题框内的公式都不跳动；只有答题框确实被键盘挡住时才滚动，且只滚一次到位。*Accept:* 真机上 `?debug=viewport` 的事件记录里输入幂、根号时没有 `scrollY` 或答题框内部滚动；负责人确认。*From:* R5、第 3 轮
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
- [x] **T7** (S4) `src/main.ts`：R5 的诊断事件记录（只在 `?debug=viewport` 时）：键盘按键、`scrollBy` / `scrollTo` / `scrollIntoView` / 元素 `scroll` 调用、`scroll` 事件（附 `scrollY` 变化，标注最近 100 ms 内有无脚本滚动调用，没有即 “native”）、答题框高度与 `scrollTop` 变化、`visualViewport.offsetTop` 变化；面板显示最近 10 条。*Verify:* 仿真里输入 “x 幂 2 → 根号 x”，记录里能看到键名与滚动来源。*Owner:* Claude - 需要真机数据（D4）
  **结果**：诊断面板末尾的 “events” 最近 10 条：键名、`scrollY a→b` 加最近 100 ms 内的页面级滚动调用（`window.*`、`page.*`、`math-field.*`，没有就是 `native`）、`vv top` 变化、答题框高度 / `scrollTop` 变化；只记页面级调用，因为 MathLive 每键都会横向滚动自己的内部 `field`。WebKit iPhone 13（答题框被推到键盘下）：修法后 `scrollY 0→600 window.scrollBy+…`；`&mlscroll=1` 时 `page.scrollBy+…scrollIntoView` 并紧跟一次 592→593，来源区分得开（`eventlog.png`、`eventlog-mlscroll.png`，会话 scratchpad）。面板改为自动换行，长行不再被截掉。
- [x] **T8** (S4) `src/main.ts`：答题框设置 `onScrollIntoView`：手机键盘打开时交给 `keepAnswerVisible()`（只在被挡时滚），其余情况保持 MathLive 的 `scrollIntoView({ block: "nearest" })`；`?debug=viewport&mlscroll=1` 时不设置（D4）。`tests/math-keyboard.spec.ts`：答题框可见时输入幂与根号页面不滚、MathLive 的 `scrollBy` 不再被调用；答题框被键盘挡住时输入仍滚到位。*Verify:* 新测试在未设置时失败、设置后三种引擎通过；预览真机 S4。*Owner:* Claude - 小改动，依赖真机验证
  **结果**：`mountInputs()` 里设置 `mf.onScrollIntoView`；`keepMathLiveScroll` 读 `?debug=viewport&mlscroll=1`。新测试 “typing a power or a root does not scroll the page unless the keyboard covers the answer”：去掉修法时答题框的 `scrollIntoView` 被调用 14 次、三种引擎失败；修法后 0 次、`scrollY` 不变，答题框被推到键盘下时按一键后距键盘 ≥ 15 px，三种引擎通过。全套：unit 355、Playwright 198 通过（60 跳过）。真机效果待 T9。
- [ ] **T10** (S2、S4) `src/whats-new.ts` 1.2.1 加第三条（输入时页面不再跳动），真机确认 S4 后再写，以免写了没做到的事；`docs/design/DESIGN.md` 6.5 加一条输入时滚动的规则（已写）；README / `help.html`：检索后没有关于输入时滚动的说法，无需修改。*Owner:* Claude - 文档不委派
- [ ] **T9** (S4) 部署预览（D4），请负责人真机按 R5 的方法截图（修法后；需要时加 `&mlscroll=1` 录修法前）。*Owner:* Claude
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
  **进展**：预览（提交 `8e85af7`）https://fix-iphone-keyboard-viewport.ap-calculus-practice.pages.dev ，部署 `6cb8c958`，返回 `main-D6IQTFAP.js`，与本地构建一致；正式站点仍为 1.2.0。等负责人真机确认（P5）。 第二次预览（第 2 轮修正后，提交 `82ff58f`）：部署 `cabe3a6f`，别名同上，均返回 `main-BOy_zPim.js`，与本地构建一致；正式站点仍为 1.2.0（`main-DKL8AnjN.js`）。

诊断面板（`?debug=viewport`）随 1.2.0 上线，本任务结束时删除。

## Acceptance

待填写。
