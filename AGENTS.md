# AP Calculus 项目规则

## PDF language contract

All generated PDF deliverables in this project must use English-only visible content and English-only PDF metadata. Chinese may be used in internal discussion or non-PDF working notes, but it must not appear in exported PDFs. This project-level delivery rule overrides the bilingual first-use guidance below whenever the output format is PDF.

## Canonical LaTeX templates

- Notes use the A4, 11pt Hashem-inspired semantic-color layout under `资料/notes/unit-1/hashem/`.
- Slides use the installed Moloch theme through `资料/slides/themes/beamerthemeMolochClassroom.sty`, with a 17pt projected body and `aspectratio=169`. The `11pt` Beamer class option is only a structural baseline.
- The Hashem color semantics remain consistent across formats: red for definitions, blue for theorems and questions, teal for examples, amber for cautions, green for applications, and gray for notes.
- The older Sleek note and HashemInspired slide variants are comparison or legacy references, not defaults.
- Slides must remain low-density: one main claim and one visual job per slide. Shorten or split content before reducing the 17pt classroom body size.
- Use one canonical image-plus-text layout: visual left, text right, with a fixed 58/2/40 grid. Pure text and definitions stay full-width; only genuine comparisons use equal columns. Do not reverse the image/text direction or hand-tune column widths.
- Mathematical displays, including formula-focus slides, use the same 17pt nominal size and 21pt leading as body text. Use composition and whitespace for emphasis; do not add page-level formula size overrides.

## Slide visual sourcing contract

- A storyboard visual cue is a delivery requirement, not a placeholder. The finished slide must contain the actual teaching visual or a documented reason why it was omitted.
- Use editable TikZ/PGFPlots for mathematical graphs, geometric constructions, areas, tangent/secant relationships, and other native mathematical diagrams when that is the clearest representation.
- For historical people, manuscripts, scientific data graphics, and real-world contexts, locate and use a real, identity-verified source asset. Do not substitute an AI-generated historical portrait for documentary evidence.
- Prefer public-domain or clearly licensed assets from museums, libraries, archives, universities, scientific agencies, or Wikimedia Commons with complete source metadata.
- Record the source page, creator or institution, license or rights note, caption, access date, and local filename under `slides/assets/`; repeat the source in the frame's `[Sources]` speaker note.
- Photographs must add context, scale, motivation, or evidence. Do not add decorative stock imagery when a mathematical visual would teach the idea better.
- Inspect the final crop and rendering at full-slide size. Public samples must exclude classroom join codes, account data, and other private course information.

> 注：本文件放在 `ap-calculus-practice` 仓库根目录，随仓库提交。下面讲义、幻灯片部分提到的 `资料/`、`slides/` 路径位于仓库的上一级 `AP Calculus/` 文件夹，不在仓库里；从上一级目录工作时，由那里的 `CLAUDE.md` 指向本文件。

## 讲解风格

撰写讲义、概念解释、例题解析、复习材料和网页时，使用全局技能 `teaching-style`（源文件在 `claude-config` 仓库的 `skills/teaching-style/`）。它规定：先直觉后形式、有边界的类比、可靠的历史与词源、中英对照术语、多个不同应用场景、先解释术语、视觉优先，以及交付前检查。AP Calculus 在此基础上还要满足下一节。

## AP Calculus 特别要求

- 同时关注图像、数值表、解析式和文字情境之间的转换。
- 明确区分函数值、平均变化率、瞬时变化率、导数值、积分值和累积量。
- 涉及模型时说明变量、单位、初始条件、定义域和结论适用的区间。
- 说明局部信息如何支持结论，也说明何时不能把局部结论推广到全局。
- 例题解析应解释“为什么选择这个方法”，而不只是展示计算步骤。

## 练习网站文档同步

- 凡是用户能看到的行为、操作流程、按钮文字、提示信息、课程或进度规则发生变化，都必须在同一轮修改中同时更新 `README.md`（中文说明）和网站使用说明 `help.html`（学生看的 How to use 页面，只用英文）。
- 同一类用户可见的变化还要发布新版本：提升 `package.json` 的 `version`，并在 `src/whats-new.ts` 顶部新增同版本条目（英文，2–6 条要点）；老用户下次打开网站时会在 What's new 窗口看到它。不影响用户的改动不改版本、不加条目。
- 提升版本号用 `npm version <新版本> --no-git-tag-version`，它会同时改 `package.json` 和 `package-lock.json`；只手改 `package.json` 会让锁文件停在旧版本（1.2.0、1.2.1 都出过这个问题）。
- 更新前先对照代码核对两份文档中所有相关的说法，删除过时或相互矛盾的描述，不能只追加新内容。
- 修改 `help.html` 就是修改线上页面：随网站一起构建、测试、推送并部署到 Cloudflare Pages，然后确认线上 `/help` 已是新版。
- 如果某次修改不影响用户（例如纯重构、只改测试或内部文档），在任务文档或提交说明中写明“README / help 无需更新”及原因。
- 交付前检查：README 与 `help.html` 是否和当前代码、线上版本一致？版本号与 What's new 条目是否已更新？

## 练习网站设计规范与发布前设计审核

- 界面规则以 `docs/design/DESIGN.md` 为准。改界面时同一轮更新它，或在任务文档里写明不需要更新的理由。
- 凡是要提升版本号的改动，发布前必须按 `docs/design/review-workflow.md` 做设计审核。默认是**常规审核**：运行 `npm run design:capture`，只比对受本次改动影响的界面状态，不调用评审技能。只有新增界面或组件、修改 DESIGN.md 的原则或令牌、较大改版或用户要求时，才做**完整审核**：派全局子代理 `design-reviewer`（Sonnet、medium，运行全局技能 `design-review`）一次完成三个视角；评审结论与任务 Spec 冲突时，先回到任务文档的 Grill 问负责人。P0 / P1 清零后才能发布，结论写进任务文档或 `release-review.md`。
- 涉及键盘、触控或安全区的改动，发布前请项目负责人在 iPhone 真机上确认一次。
