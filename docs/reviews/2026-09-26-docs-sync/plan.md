# 2026-09-26 README 与网站使用说明同步

用户问 GitHub 上的 README 是否过时，并要求：每次修改后同时更新 README 和网站上的使用说明（`help.html`），并把这条规则写进项目的 AGENTS.md。本文件在任何改动之前写入。

## Research

GitHub `main` 与本地一致（`dec26fc`），因此问题在内容，不在推送。对比代码后：

- **S1 · 事实 · README 对庆祝规则前后矛盾。** “学生操作”一节写“从第 5 题起每次播放局部庆祝，从第 10 题起每次增加全屏彩纸”；“连对与今日题数”一节写“5 连对播放一次轻量动画”。代码 `src/main.ts:298-302` 为 `streak >= 5` 每次播放徽章动画、`>= 10` 每次全屏，与前者及 `help.html` 一致，后者错误。
- **S2 · 事实 · 数学键盘的描述已经过时（README 和 help 都是）。** `e045ae3` 之后键盘有 Derivatives / Functions 两页；第一页第一行放当前题所用的变量（x、y、t、θ），并包含 sec、csc；Functions 页有 cot、log、反三角、立方根、π（`src/math-keyboard.ts:22-58`）。README 只写“手机可打开 Math keyboard 输入分式、根式、指数和函数”，但 1280px 桌面上同样可以打开（见 `../2026-09-26-release/keyboard-matrix-1280-light.png`）。help 只写键盘沿用打字的编辑规则。
- **S3 · 事实 · README 没写欢迎按钮的变化。** 有进度时按钮为 “Continue practicing”，下方显示下一个技能（`src/main.ts:275-278`）；README 只写 “Start practicing”。
- **S4 · 事实 · 无法读取进度代码时的提示，两份文档都没写。** `fff90bd` 之后，结构损坏的代码统一提示 “This progress code can’t be read. Copy the whole code again, or export a new one on the other device.”（`src/transfer.ts`）；README 只写了版本过新时的提示。
- **S5 · 事实 · 两份文档都没提深色模式和读屏支持。** 页面跟随系统的浅色/深色设置（`src/style.css` 的 `prefers-color-scheme`，`49c0af7`）；公式以 `role="math"` 加可朗读文本提供给读屏软件（`e045ae3`）。
- **S6 · 事实 · 没有文档同步的规则。** 上级目录 `../AGENTS.md`（`AP Calculus/AGENTS.md`）是用户所说的项目 AGENTS.md，不在任何 git 仓库中；本仓库没有 AGENTS.md。**推断：** Codex CLI 只从仓库根目录（`ap-calculus-practice/`）向下加载 AGENTS.md，因此在本仓库工作的 Codex 读不到上级这份文件。Claude Code 会读取上级目录的这份文件（本会话已加载）。
- **S7 · 事实 · 改 `help.html` 就是改线上页面。** 它由 Vite 构建为 `dist/help.html`，需要重新部署 Cloudflare Pages。`tests/ux-refresh.spec.ts` 检查帮助页，`tests/visual-tokens.spec.ts` 检查字号不小于 12px。

## Spec

课程、判分、调度、数据格式与界面行为均不变。

| 编号 | 性质 | 可观察行为与验收条件 |
|---|---|---|
| U1 | 更正 | README 对庆祝、键盘、欢迎按钮、无法读取的代码、深色/读屏的描述与代码一致（S1–S5）；不留相互矛盾的说法。 |
| U2 | 更正 | 线上 `help.html` 说明两页键盘、题目所用变量、无法读取代码时怎么办；页面文字只用英文；现有帮助页测试通过；390/1280 实际渲染检查无溢出。 |
| U3 | 新增流程规则 | `../AGENTS.md` 规定：凡用户可见的行为或流程变化，都在同一轮更新 README 与 `help.html`，并随网站一起部署；不影响用户的改动须写明“无需更新文档”的理由。 |
| U4 | 交付 | 推送后 CI 通过；Cloudflare 线上 `/help` 与本地 `dist/help.html` 的 SHA-256 一致。 |

## To Do

- [x] **T1 · U1** — `README.md`：修正 S1–S5。验证：逐条对照 S1–S5 引用的代码位置，并 grep 确认“播放一次”已删除。**结果：** 改了 5 处（欢迎按钮、键盘两页与变量、深色/读屏、无法读取的代码、庆祝规则）；grep 已找不到“播放一次”，庆祝规则两处说法一致。
- [x] **T2 · U2** — `help.html`：在 Typing formulas 里补键盘两页与题目变量；在 Move progress 里补无法读取代码时的做法。验证：`tests/ux-refresh.spec.ts`、`tests/visual-tokens.spec.ts` 通过；查看 390/1280 帮助页截图。**结果：** 两个 spec 共 12 项通过，12 项按设计只在 Chromium 运行而跳过；展开所有折叠区后截图：390 light 与 1280 dark 都没有横向溢出，新文字排版正常（本目录 `help-answer-*.png`、`help-move-*.png`）。提示文字与 `src/transfer.ts`、`src/migrate.ts` 中的实际消息一致。
- [x] **T3 · U3** — `../AGENTS.md`：新增“练习网站文档同步”一节。验证：重新阅读该节；在最终回复中说明 S6 的 Codex 加载范围问题。**结果：** 已在 `../AGENTS.md` 末尾新增“练习网站（ap-calculus-practice）文档同步”一节，共 5 条（同轮更新两份文档、先核对再改、help 随网站部署、无需更新时写明理由、交付前检查），并重新读过。该文件不在 git 中，因此没有提交哈希。
- [ ] **T4 · U1/U2/U4** — `npm test`、`npm run build`，提交并推送，等待 CI。验证：CI 成功。
- [ ] **T5 · U4** — `wrangler pages deploy dist`，比对线上 `/help` 与关键资源的 SHA-256。验证：全部一致。

## Progress log
