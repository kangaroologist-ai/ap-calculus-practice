---
task: iphone-viewport-storage
phase: research       # grill | research | spec | todo | implement | acceptance | done
scope: ap-calculus-practice / iPhone Safari：键盘超出可见区域；本地存储打开不正常
branch: (1.2.0 发布后另开分支)
version: 1.2.0 → 1.2.1（预计，用户可见的修复）
commits: []
---

# iPhone：键盘最后一行被截、存储打开卡住或失败

来源：`docs/reviews/2026-09-27-keyboard-polish/plan.md` 的 R22、R25、R26 与 G27（负责人第 16 轮决定 1.2.0 先发布，这两个问题另开任务）。

## Grill (decision log)

Recon：键盘任务里已做的真机取数与分析，见 Research。

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

待 Grill 与真机数据后填写。

## To Do

待填写。诊断面板（`?debug=viewport`）随 1.2.0 上线，本任务结束时删除。

## Acceptance

待填写。
