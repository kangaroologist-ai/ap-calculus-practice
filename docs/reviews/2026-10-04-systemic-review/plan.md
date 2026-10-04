---
task: systemic-review
phase: grill             # grill | research | spec | todo | implement | acceptance | done
scope: ap-calculus-practice 全仓库（代码结构、测试、发布、文档与流程）
branch: (未开始；Grill 定案后另开分支)
version: n/a（本文只做评审；后续修改是否影响学生见各条 Spec）
commits: []
---

# 系统性问题评审：Codex 写成的仓库哪里需要改

来源：负责人原话：“这个repo主要是codex写的，你看一下有没有系统性问题，什么地方可以改进。按照grst这个skill的方式写文档”。

说明：全局技能 `~/.claude/skills/grsta/` 不在这次的云端会话里（见 R1），本文的格式按仓库里已有的任务文档（`2026-09-27-housekeeping-instructions/plan.md`、`2026-09-27-keyboard-polish/plan.md`）照写：Grill → Research → Spec → To Do → Acceptance，`[F]` 事实、`[I]` 推断、`[U]` 未核实。

## Grill (decision log)

Recon（2026-10-04，提交 `7bfd963`）：
- 代码：`src/` 25 个文件，`src/main.ts` 1,557 行、`src/templates.ts` 1,060 行、`src/style.css` 1,708 行；其余模块都在 420 行以内。
- 测试：单元测试 24 个文件 355 项，本地全部通过（37 s）；`npm run build` 通过，只有分块大小提示；Playwright 未在本次运行。
- 文档：Markdown 约 0.49 MB；`docs/reviews/` 16 MB，几乎全是 PNG；Git 包 12.9 MB（浅克隆，只含最近 50 个提交）。
- 最近 50 个提交中 23 个以 `Plan` / `Tick` / `Record` / `Close` 开头，只改任务文档。
- 仓库里没有 `AGENTS.md`、`CLAUDE.md` 或 `.claude/`。

Size class: large - 涉及代码、测试、发布与流程四块，每块都要负责人取舍；先一轮问题定范围，再分批做。

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G1 | 这次做到哪一步 | **分两批：第一批只做低风险、学生看不出的修改（R3、R7、R8、R9、R10、R13），第二批再拆 `main.ts`（R5、R6）** / 只出这份评审，不改代码 / 一次全部做完 | 待答 | |
| G2 | 项目指令放在哪 | **项目相关的规则移进仓库根目录 `AGENTS.md`（`CLAUDE.md` 一行 `@AGENTS.md` 引用），`../AGENTS.md` 与 `~/.claude` 只留跨项目的通用规则** / 维持现状 / 全部复制一份进仓库 | 待答 | |
| G3 | 评审截图今后放哪 | **新任务的过程截图放 `artifacts/`（已被 git 忽略），任务文档只提交 1–3 张决定性的对比图；不改写已有历史** / 用 Git LFS / 维持现状 | 待答 | |
| G4 | 发布方式 | **加一个 `npm run release` 脚本：检查工作区干净、本地 `main` 等于 `origin/main`、该提交 CI 成功，再构建并 `wrangler pages deploy`，最后打印部署地址与主包文件名** / 交给 CI 在打 tag 时自动部署 / 维持手工命令 | 待答 | |
| G5 | README 的定位 | **README 只给开发者（启动、测试、架构、发布、链接），学生行为说明以 `help.html` 为准、界面规则以 DESIGN.md 为准，README 里逐键描述的段落删去改为链接** / 维持现状 | 待答 | |
| G6 | 任务文档的提交粒度 | **任务文档跟着对应的代码提交一起改，不再单独提交 “Tick F-n” / “record the preview”；预览记录写进同一提交的说明** / 维持现状 | 待答 | |

Default assumptions (not answered): 文档用中文，与现有任务文档一致；不引入前端框架；不改出题结果（冻结的 `generator-1.1.0.json` 基准不动）；不改写 Git 历史。

## Research

### 一、流程与仓库

#### R1. 项目规则不在仓库里，换一个环境就读不到
- **[F]** `docs/design/DESIGN.md:342`、`docs/design/review-workflow.md:9`、`:118` 都以 “见 `AGENTS.md`” 为依据，但该文件在仓库外的 `../AGENTS.md`；`review-workflow.md:58` 的完整审核依赖 `~/.claude/agents/design-reviewer.md` 与 `~/.claude/skills/design-review/`；G-R-S-T 流程本身在 `~/.claude/skills/grsta/`。
- **[F]** 本次云端会话的工作目录只有本仓库，以上文件一个都不存在；housekeeping 任务也记录了 “`../AGENTS.md` 不在 git 仓库内，未进提交”，改动只能以 `.diff` 文件留底。
- **[I]** 规则散在三处、两处不受版本控制：别的代理（包括 Codex 与云端 Claude）看到的是不完整的规则，规则改动也无法和代码一起评审、回退。这是 “文档同步”“版本号同步锁文件” 一类规则反复需要人提醒的根源之一。

#### R2. 同一件事写在四处，每次界面改动都要同步四处
- **[F]** 数学键盘的完整布局同时写在 README “学生操作” 第二段（一个约 1,600 字的段落）、`docs/design/DESIGN.md` 6.1、`help.html` 和 What's new；任务模板的义务 P1 就是 “README / `help.html` 同步”。
- **[F]** `docs/acceptance.md` 按日期追加了 Phase 1、Phase 2、2026-09-19、09-25、09-26 多段验收记录，与 `docs/reviews/*/plan.md` 的 Acceptance 表重复。
- **[I]** 重复本身就是漂移的来源；README 写成了逐键说明书，开发者要找的启动、架构、发布信息被埋在中间。把 “谁是权威” 定下来（G5）比每次多查一处更省事。

#### R3. 文档里的行号引用已经过期
- **[F]** `DESIGN.md:20`、`:166` 说 `updateControls()` 在 `src/main.ts:398`，实际在 `:474`；`DESIGN.md:194` 说 `modal()` 在 `src/main.ts:565`，实际在 `:1101`（565 行是 `submit()`）。`docs/skill-hierarchy-review.md` 也大量引用 `src/catalog.ts:<行>`。
- **[I]** 行号只要上方加一行就失效；改成函数名、选择器或令牌名（如 “`main.ts` 的 `updateControls()`”）不会过期，也能直接搜索。

#### R4. 提交历史里一半是记账
- **[F]** 见 Recon：50 个提交中 23 个只改任务文档（如 `b17251b Tick F-6`、`87534c5 Plan: record the fifth 1.2.1 preview`）；`docs/reviews/` 的 PNG 让 Git 包在 50 个提交内就达到 12.9 MB。
- **[I]** `git log`、`git blame` 难以看出代码为什么变；仓库体积随每个任务增长几 MB。G3、G6 处理今后的做法，已有历史不动。

### 二、代码结构

#### R5. `main.ts` 是一个 1,557 行的 “全能文件”
- **[F]** 97 个顶层函数，十几个模块级可变变量（`config`、`state`、`busy`、`temporary`、`replacing`、`heldScroll`、`autoNextTimer`、`altPress`、`shiftTap`、`altBubble`、`lastKeyboardTouch`、`pressedControl` 等），同时负责：视口与滚动修正（65–140 行）、渲染与练习流程（240–670 行）、键盘长按 / ⇧ / 气泡（688–1100 行）、对话框、导入导出界面（1101–1470 行）、启动（1474 行起）。
- **[F]** 界面靠模板字符串加 `innerHTML` 整块渲染；`questionView()`（390 行）是一行约 1,900 字符的模板。安全性靠每处手写 `esc()`：导入预览（1396 行）直接插入 `p.unlockedLevel`、`p.streak`，之所以安全，是因为 `migrate.ts:257`、`:264` 先校验了它们是整数——安全依赖远处的校验，而不是渲染处本身。
- **[I]** 这是 “一次加一个需求、每次都在原文件里补” 的典型结果：单个改动都合理，累积起来键盘逻辑和练习流程互相通过全局变量影响，iPhone 视口任务就为此连出了五个预览。不需要引入框架；按职责把键盘、视口、导入导出界面移到独立模块（纯搬移、行为不变），用现有 Playwright 测试兜底即可。

#### R6. 对 MathLive 内部实现的依赖散在各处
- **[F]** `main.ts:104` 改写 `_mathfield.keyboardDelegate.setValue`；键盘代码读写 `_shiftPressCount`（有守护测试）；多处选择器依赖 `.ML__keyboard`、`.MLK__keycap`、`.MLK__toolbar`、`.ML__edit-toolbar`；`main.ts:957` 起在捕获阶段拦截 MathLive 的 window `mouseup`。`mathlive` 精确锁定在 0.110.0。
- **[I]** 锁版本和守护测试是对的；问题是这些接触点分散在 1,500 行里，升级时找不全。集中到一个 `mathlive-adapter.ts`，DESIGN.md 6.5 只列这一个文件，升级就只看一处。

#### R7. 没有任何静态检查，死代码已经出现
- **[F]** `tsconfig.json` 是 `strict`，但没开 `noUnusedLocals` / `noUnusedParameters`；开启后报 9 处：`src/transfer.ts:5` 未用的 `localPracticeDay` 导入、`src/templates.ts:505` 未用的 `b`、`scripts/skill-examples.ts:11`，以及测试里 6 处。housekeeping 任务删了 Prettier 之后，仓库没有格式或 lint 工具，`src` 双引号、`tests` 单引号两种风格并存。
- **[F]** `templates.ts:505` 的 `b = int(c, 2, 15)` 虽然没用，但会消耗一次随机数；删掉它会改变 `exp.mix.square_root` 之后同一种子生成的题，`tests/generator-golden.test.ts` 会失败。
- **[I]** 开这两个编译选项几乎零成本，能挡住大部分 “改了一半” 的残留；`templates.ts:505` 要改成 `int(c, 2, 15); // 保留：消耗随机数以保持冻结的出题结果`，而不是删除。暂不需要 ESLint。

### 三、性能与可靠性

#### R8. 第一次判分要在 3 秒内下载并启动 3 MB 的 Worker
- **[F]** `Grader` 在第一次 `check()` 时才 `new Worker(...)`（`src/grader-client.ts`），全仓库没有预热；超时 3 s 从 `postMessage` 前开始计时，到点就返回 “This calculation took too long”。
- **[F]** 构建后的 `grading.worker-*.js` 为 3.16 MB（gzip 约 880 KB），包含 Compute Engine；`grading.ts:5` 在模块加载时创建 `ComputeEngine`。
- **[U]** 在慢网络或旧 iPhone 上，第一题的第一次 Check 是否会因此判成 “无法判定”。可用 Playwright 的网络 / CPU 节流复现。
- **[I]** 无论是否复现，都应在开始练习时创建 Worker 并等一次就绪消息，3 s 超时只算计算时间；改动小、只在 `grader-client.ts` 与 `startSession()`。

#### R9. 主包 1.13 MB，二维码库每次都加载
- **[F]** `main-*.js` 1,125 KB（gzip 335 KB）；`qrcode` 与 `jsqr` 在 `main.ts` 顶部静态导入（`transfer.ts:4` 也导入 `qrcode`），但只在 Move progress 对话框里用到。
- **[I]** 改为在打开对话框时 `import()`，首屏少加载这两个库；MathLive 是首屏必需，不动。具体省多少在实现时测。

### 四、测试

#### R10. 浏览器测试跑的是开发服务器，不是要部署的构建产物
- **[F]** `playwright.config.ts` 的 `webServer` 是 `npm run dev`；Worker 打包、`public/_headers`、构建时复制的 MathLive 字体（`vite.config.ts` 的 `buildStart`）都只在 `dist/` 里存在。发布任务里为此手工做了 `live-asset-check.json` 与线上冒烟截图。
- **[I]** 加一个只跑几条关键路径（打开、答一题、判分返回、打开键盘）的冒烟测试，对 `vite preview` 的 `dist/` 运行，把手工的线上资源检查变成 CI 的一步。

#### R11. 手机键盘的几何与控制测试只在 Chromium 跑
- **[F]** `tests/app.spec.ts:972`、`:1027`、`:1072`、`:1145` 等用 `test.skip(browserName !== 'chromium', 'Mobile keyboard geometry is verified once in Chromium.')`；共 20 处 `test.skip`，上次全量为 56 项跳过。最近两个任务的真问题（⇧ 被兼容 `mouseup` 复位、输入幂与根号时页面跳动）都只出现在 iOS Safari。
- **[I]** Playwright 的 WebKit 不等于 iOS Safari，真机仍需要；但手机路径至少应在 WebKit 跑，它比 Chromium 更接近。逐条看这 20 处跳过，凡是手机相关的改为 Chromium + WebKit。

#### R12. 生成文件没有 CI 检查
- **[F]** `docs/skill-examples.md`、`docs/skill-examples.html`、`public/skill-examples.html` 由 `scripts/skill-examples.ts` 生成，CI 不检查是否最新。本次重新生成：101/101 验证通过，`git diff` 为空——目前是同步的。
- **[I]** 改出题模板时容易忘记重新生成；CI 加 “重新生成后 `git diff --exit-code`” 一步即可。

### 五、发布

#### R13. 部署与 CI 之间没有连接
- **[F]** README “Cloudflare Pages” 一节：本机 `npm run build` 后 `wrangler pages deploy dist`，提交不会触发部署；任务文档靠手写记录部署 ID 与主包文件名（如 `cbc7817d (main-DKL8AnjN.js)`）。housekeeping 任务新增的规则 “发布前核对本地与 `origin/main`，只用快进” 也是为此而设。
- **[I]** 现在线上版本是否等于某个 CI 通过的提交，只能靠人记得核对。一个发布脚本（G4 推荐项）把这些核对变成机器检查，同时保留负责人决定何时发布。

### 六、值得保留的做法（不改）

- **[F]** SymPy 独立核对 10,100 道生成题（`npm run test:math`）；冻结的旧格式样本与 `legacy-fixtures.test.ts`；所有进度入口统一经过 `migrateProgress` 并拒绝未知身份；依赖全部精确锁版本；判分在 Worker 里、有超时；What's new 与版本号由单元测试绑定。
- **[I]** 数据与数学这一侧的工程质量高于界面一侧；系统性问题集中在 `main.ts`、测试覆盖的浏览器选择、发布与文档流程。

## Spec

草案，Grill 定案后改写。按 G1 推荐分两批；全部不改出题结果，不改学生看到的界面，所以不提升版本号（R8 若改变了首题行为，再按 AGENTS 规则判断是否需要 What's new）。

第一批：
- **S1 指令进仓库。** 根目录新增 `AGENTS.md`，收入 `../AGENTS.md` 中与本项目相关的规则（文档同步、版本与锁文件、发布、取证文件）和 G-R-S-T 任务文档格式要点；`CLAUDE.md` 引用它；`DESIGN.md`、`review-workflow.md` 的引用改为仓库内路径。*Accept:* 新克隆的仓库里能读到全部项目规则；检索 `../AGENTS.md` 为 0。*From:* G2、R1
- **S2 文档不写行号。** `DESIGN.md`、`docs/skill-hierarchy-review.md` 的 `文件:行号` 改为函数名、选择器或令牌名。*Accept:* 检索 `\.(ts|css):[0-9]` 在这两个文件为 0。*From:* R3
- **S3 编译期发现未用代码。** `tsconfig.json` 开启 `noUnusedLocals`、`noUnusedParameters`；9 处逐一处理，`templates.ts:505` 保留随机数调用并注释原因。*Accept:* `npm run build` 通过；`generator-golden` 测试不变。*From:* R7
- **S4 Worker 预热。** 开始练习时创建判分 Worker 并等待就绪；3 s 超时只计算判分本身。*Accept:* 新单元测试：Worker 就绪前的等待不计入超时；节流条件下首次 Check 不再返回超时（R8 [U] 一并核实）。*From:* R8
- **S5 二维码库按需加载。** `qrcode`、`jsqr` 在打开 Move progress 时加载。*Accept:* 构建后主包不含 `jsQR`；导入导出相关 Playwright 测试通过。*From:* R9
- **S6 构建产物冒烟测试。** 新增对 `vite preview` 运行的冒烟测试并进 CI。*Accept:* CI 中该步骤通过；故意删掉 `dist` 中的字体时失败。*From:* R10
- **S7 手机路径在 WebKit 也跑。** 逐条审 20 处 `test.skip`，手机相关的放开到 WebKit。*Accept:* 每处保留的跳过都有理由；WebKit 下通过。*From:* R11
- **S8 生成文件检查。** CI 重新生成 skill-examples 并要求无差异。*Accept:* 改模板不重新生成时 CI 失败。*From:* R12
- **S9 发布脚本。** 按 G4 定案。*Accept:* 工作区不干净、未推送或 CI 未通过时拒绝发布。*From:* G4、R13
- **S10 文档权威与截图规则。** 按 G3、G5、G6 定案改 README、`AGENTS.md`。*Accept:* README 不再逐键描述键盘；规则写进 `AGENTS.md`。*From:* G3、G5、G6、R2、R4

第二批（第一批完成后再开任务）：
- **S11 拆分 `main.ts`。** 纯搬移：`keyboard.ts`（长按、⇧、气泡、顶栏控制）、`viewport.ts`（滚动修正）、`transfer-ui.ts`（导入导出对话框）、`mathlive-adapter.ts`（所有 MathLive 内部接触点）；`main.ts` 只留状态、渲染与流程。*Accept:* 行为不变：单元测试、`test:math`、Playwright 三引擎全量通过；`main.ts` 不超过约 600 行；`_mathfield`、`_shiftPressCount`、`MLK__` 只出现在 `mathlive-adapter.ts`。*From:* R5、R6

## To Do

Grill 定案后填写负责人与顺序。初步拆分：

- [ ] **T1** (S1) `AGENTS.md`、`CLAUDE.md`、`DESIGN.md`、`review-workflow.md`。*Verify:* 检索。*Owner:* Claude - 指令文件不委派
- [ ] **T2** (S2) `DESIGN.md`、`docs/skill-hierarchy-review.md`。*Verify:* 检索。*Owner:* Claude
- [ ] **T3** (S3) `tsconfig.json` 与 9 处未用代码。*Verify:* `npm run build`、`npm test`。*Owner:* 可委派 - 机械修改，`templates.ts:505` 按 R7 处理
- [ ] **T4** (S4) `src/grader-client.ts`、`startSession()`、新测试；先用节流复现 R8。*Verify:* 新测试旧代码失败、新代码通过。*Owner:* Claude
- [ ] **T5** (S5) `main.ts`、`transfer.ts` 动态导入。*Verify:* 构建产物检索；导入导出 Playwright。*Owner:* 可委派
- [ ] **T6** (S6) 新 `tests/smoke-dist.spec.ts`、Playwright 第二个 `webServer` 或独立配置、CI 一步。*Verify:* CI。*Owner:* Claude
- [ ] **T7** (S7) `tests/*.spec.ts` 中 20 处跳过。*Verify:* WebKit 全量。*Owner:* 可委派，Claude 复核放宽的断言
- [ ] **T8** (S8) `.github/workflows/check.yml`。*Verify:* 故意不同步时失败。*Owner:* Claude
- [ ] **T9** (S9) `scripts/release.mjs`、`package.json`、README。*Verify:* 三种拒绝条件各试一次。*Owner:* Claude
- [ ] **T10** (S10) README、`AGENTS.md`。*Verify:* 读回。*Owner:* Claude - 文档不委派

Project obligations:
- [ ] **P1** README / `help.html`：applies（S10 改 README）；`help.html` not applicable。
- [ ] **P2** 版本与 What's new：not applicable - 第一批学生看不出变化；T4 若改变首题体验另行判断。
- [ ] **P3** DESIGN.md、设计审核、真机确认：S2 改 DESIGN.md 文字；不改界面，不需要设计审核。
- [ ] **P4** 提交与推送：每个 To Do 一个提交，任务文档随代码一起改（G6）。

## Acceptance

尚未开始。
