---
task: housekeeping-instructions
phase: implement         # grill | research | spec | todo | implement | acceptance | done
scope: ap-calculus-practice 仓库杂项；项目指令 ../AGENTS.md；全局指令 ~/.claude/CLAUDE.md
branch: housekeeping-instructions
version: n/a（不影响学生）
commits: []
---

# 遗留问题收尾，并把 iPhone 视口任务的经验写进指令

来源：`docs/reviews/2026-09-27-iphone-viewport-storage/plan.md` Acceptance 的 [P] 遗留，负责人原话：“older issue也解决了吧。感觉有些内容需要沉淀到系统指令或者项目指令”。

## Grill (decision log)

Recon：`package.json` 1.2.1、`package-lock.json` 1.1.1（两处）；`prettier` 在 devDependencies，仓库里没有配置、脚本或 CI 步骤用到它；按默认配置检查 `src`、`tests`、`scripts` 共 45 个文件不符合，且 `src` 用双引号、`tests` 用单引号两种风格并存。`../AGENTS.md` 150 行（不在 git 仓库内），`~/.claude/CLAUDE.md` 18 行。
Size class: medium - 写进指令的内容要负责人选，一轮问题。

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G1 | Prettier 怎么处理 | **删除这个未使用的依赖** / 全仓格式化并在 CI 检查 / 不动 | 第 1 轮：“这个是干什么的？”；再问后：“所以到底是干什么用的？有什么利弊？”——待回答后再定 | 2026-09-27 |
| G2 | 写进项目指令 `../AGENTS.md` 的条目 | 版本号同步锁文件 / iPhone 问题的复现方法 / 发布只快进并先核对 origin / 取证大文件不进仓库 | 选：版本号同步锁文件、发布只快进并先核对 origin、取证大文件不进仓库（**未选** iPhone 复现方法） | 2026-09-27 |
| G3 | 写进全局指令 `~/.claude/CLAUDE.md` 的条目 | 浏览器滚动要修源头 / 子代理与共享环境 / 真机问题先取证 / 都不写 | 选：子代理与共享环境、真机问题先取证 | 2026-09-27 |

Default assumptions (not answered): 指令文字用各文件已有的语言（`../AGENTS.md` 练习网站各节为中文，`~/.claude/CLAUDE.md` 为英文）；写成规则加一句理由，不写本次事故经过。
Shared understanding confirmed: G2、G3 由负责人选定即开始；G1 待定。

## Research

### R1. `package-lock.json` 版本号
- **[F]** `package-lock.json` 顶层与 `packages[""]` 的 `version` 都是 1.1.1；1.2.0、1.2.1 发布时只改了 `package.json`。
- **[I]** `npm version <x> --no-git-tag-version` 会同时改两处，今后提升版本时用它即可避免再次不同步。

### R2. “不符合 Prettier”
- **[F]** 见 Recon。`prettier` 自首次提交（`a20391a`）起就在 devDependencies，从未接入。
- **[I]** 这不是格式缺陷，而是一个没人用的依赖；全仓格式化会改 45 个文件、统一引号，历史 diff 与 blame 都会被打乱。

### R3. 值得沉淀的经验（候选，待负责人选）
见第 1 轮问题。

## Spec

新增要求（不影响学生，不改版本）：

- **S1 锁文件版本一致。** `package-lock.json` 的版本与 `package.json` 相同（1.2.1）。*Accept:* 检索；`npm ci` 通过。*From:* R1
- **S2 项目指令。** `../AGENTS.md` 练习网站部分新增三条：提升版本时用 `npm version` 同步锁文件；发布前核对本地与 `origin/main`，只用快进移动 `main`；取证的视频与逐帧图不进仓库。*Accept:* 读文件。*From:* G2
- **S3 全局指令。** `~/.claude/CLAUDE.md` 新增两条：子代理在用共享开发服务器 / 模拟器时，改代码前先通知它，模拟器任务说明 `simctl openurl` 每次开新标签页；只在真机出现、复现不了的问题，先加只在调试参数下出现的事件记录（带变化来源）、请负责人截图取数，再定修法，任务结束删除。*Accept:* 读文件。*From:* G3
- **S4 Prettier。** 待 G1。

## To Do

- [x] **T1** (S1) `package-lock.json`：`npm version 1.2.1 --no-git-tag-version --allow-same-version`。*Verify:* 两处 `version` 为 1.2.1；`npm ci` 与单元测试。*Owner:* Claude - 一条命令
  **结果**：`package-lock.json` 顶层与 `packages[""]` 均为 1.2.1，diff 只有这两行。`npm ci` 未在本地重跑（只改了版本字段），推送后由 CI 的 `npm ci` 验证。
- [x] **T2** (S2) `../AGENTS.md`：三条规则写进 “练习网站” 相关小节。*Verify:* 读回。*Owner:* Claude - 指令文件不委派
  **结果**：“文档同步” 一节加 `npm version` 一条；新增 “练习网站发布与取证文件” 一节两条。差异见 `AGENTS.md.diff`。
- [x] **T3** (S3) `~/.claude/CLAUDE.md`：两条规则。*Verify:* 读回。*Owner:* Claude - 指令文件不委派
  **结果**：新增 “Subagents and shared environments”（2 条）与 “Device-only bugs: gather evidence before fixing”（1 段）。差异见 `CLAUDE.md.diff`。
- [ ] **T4** (S4) 待 G1。

Project obligations:
- [x] **P1** README / `help.html`：not applicable - 学生看不到任何变化。
- [x] **P2** 版本与 What's new：not applicable - 不影响学生。
- [x] **P3** DESIGN.md、设计审核、真机确认：not applicable - 不改界面。
- [ ] **P4** 提交与推送：applies - 本仓库改动合并 `main` 并推送；`../AGENTS.md` 与 `~/.claude/CLAUDE.md` 不在仓库内，只在任务文档记录。

## Acceptance

待填写。
