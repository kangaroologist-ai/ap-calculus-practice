---
task: coefficients
phase: grill          # grill | research | spec | todo | implement | acceptance | done
scope: ap-calculus-practice / 出题器参数范围
branch: (未开始；1.2.0 发布后另开分支)
version: 1.2.0 → 待定
commits: []
---

# 出题系数尽量不用两位数

来源：`docs/reviews/2026-09-27-keyboard-polish/plan.md` 第 12 轮第 7 点，负责人原话：“出题的系数尽量不要两位数吧，计算量不是考察要点。”第 13 轮决定单独立任务，1.2.0 发布后开始（G26）。

## Grill (decision log)

Recon：尚未开始。已知事实见 Research R1。

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G1 | “系数不要两位数” 指答案里的系数、题目里的系数，还是两者都要 | 待开始时提出 | | |

Default assumptions (not answered): 无。

## Research

### R1. 已知事实（来自键盘任务的初步调查）

- **[F]** 参数范围多为 `int(c, 2, 15)`，指数常见 `int(c, 2, 12)`（`src/templates.ts:303-375` 一带），所以答案常出现两位数系数，如 x¹² → 12x¹¹，积和链式法则还会把两个参数相乘。
- **[F]** 出题结果有冻结的基准文件 `tests/fixtures/generator-1.1.0.json`（`tests/generator-golden.test.ts`，技能数 × 2 × 20 条）；改范围会让同一随机种子生成不同的题。
- **[U]** 题目标识（`src/question-identity.ts`）与已保存的进度、复习队列是否依赖参数值，需要在开始时核实。

## Spec

尚未开始。

## To Do

尚未开始。

## Acceptance

尚未开始。
