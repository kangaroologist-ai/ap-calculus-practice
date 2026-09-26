# 2026-09-26 数学键盘重排与设计改进

**目标**：① 重排手机数学键盘（数字成组、两页精选不重复、去掉“Type …”气泡、功能键图标居中、行宽一致、左右占满）；② 借此机会按多套设计方法复审整个 UI / UX / 动效并落实改进；③ 为了让改进不回退，建立设计规范（`docs/design/DESIGN.md`）和“新版本上线前的设计审核工作流”。

**性质**：事前计划。本轮只做调研、截图、独立评审和计划，除附录 W0 外没有任何实现；To Do 全部未勾选。基线提交 `d3a404c`（v1.1.1）。

**证据位置**：本目录 `baseline/`（WebKit iPhone 13 仿真 390×664 与 Chromium 1280×860，浅色 / 深色）、`baseline/keyboard-geometry.json`（每个按键的位置、宽度和图标偏移）、`user-report-iphone-keyboard.webp`（用户 iPhone 实拍）、`reviews/`（三份独立评审原文，以及派给评审者的共同背景 `context.md`）。

**负责人约定**：Claude 负责设计决策、跨模块或细节多的逻辑、小改动、所有复核、提交和部署；Luna max 负责规格清楚、文件范围有限的大块改动（样式表重组、测试改写、脚本、文档撰写），它的沙盒不能起服务器，浏览器测试由 Claude 运行；Sonnet 只做视觉检查（截图矩阵、前后对比、技能化设计评审）。每个 Luna / Sonnet 项后面都有一个 Claude 复核项。

---

## 1. Research

### 1.1 数学键盘（用户报告，已全部复现）

用户实拍（iPhone Safari，Derivatives 页，点过 + 之后）：

![用户实拍：iPhone，练习页，键盘打开，+ 键上方出现 Type + 气泡](user-report-iphone-keyboard.webp)

复现截图（390 px，浅色，Derivatives 页 / 点按后气泡 / Functions 页）：

![390 浅色，Derivatives 页](baseline/390-light-03-keyboard-derivatives.png)
![390 浅色，悬停 1.4 秒后出现 Type + 气泡](baseline/390-light-04-keyboard-tooltip.png)
![390 浅色，Functions 页](baseline/390-light-05-keyboard-functions.png)

1280 px 浅色（桌面同样存在错位与退格图标偏移）：

![1280 浅色，Derivatives 页](baseline/1280-light-03-keyboard-derivatives.png)

| # | 问题 | 实际（事实，数据来自 `keyboard-geometry.json`） | 预期 | 根因 |
|---|---|---|---|---|
| K-R1 | 数字不成组 | 7 8 9 在第 2–4 列，4 5 6 在第 4–6 列，1 2 3 在第 6–8 列，0 在第 4 列，呈阶梯状 | 3×3 数字块加 0，同一组列 | `src/math-keyboard.ts` 的 `derivativeLayout` 每行把数字接在不同数量的函数键后面 |
| K-R2 | 两页大量重复 | sin cos tan sec csc ln 两页都有；另有两个分式键（`a/b` 和标成 `/` 的同一命令） | 每个键只出现一次（导航键除外） | `functionLayout` 与主页各自列全；第二行 `.concat` 复制了 fraction |
| K-R3 | 点按后出现“Type +”气泡 | MathLive 用 `data-tooltip` 在 `:hover` 1 秒后显示；iOS 点按后保留 `:hover`，所以气泡留着。Emil 评审测得指针离开 50 ms 后 `opacity` 仍为 1 | 触屏上不出现任何气泡 | `key()` 给每个键设了 `tooltip: "Type …"`；MathLive 的气泡样式没有用 `(hover: hover)` 限定（`mathlive.mjs` 约 13316 行起） |
| K-R4 | 读屏名称差 | 同一个 `tooltip` 也被 MathLive 用作 `aria-label`：两个分式键都读 “Type /”，还有 “Type ^”、“Type *” | 读出含义：“fraction”、“power”、“times” | `getKeycapAriaLabel()` 优先取 `tooltip` |
| K-R5 | 功能键图标不居中 | 390 px：← → 图标下偏 4 px，收起键盘键下偏 6 px，退格右偏 6 px、上偏 4 px；1280 px：退格右偏 **49 px** | 偏移 ≤ 1 px | MathLive 的 `svg-glyph` 在自定义宽度键帽里的对齐方式；退格键带 `bottom right` 类 |
| K-R6 | 行宽不一致、列不对齐 | 前三行 8 个单位；最后一行 9 个单位（`[hide-keyboard]` 与 `[backspace]` 默认 1.5 宽），所以整行左移 19 px。Functions 页最后一行只有 6 个单位 | 每页每行单位数相同，各列上下对齐 | 使用了 MathLive 特殊键的默认宽度 |
| K-R7 | 左右留白过大 | 390 px 时按键区域 40→350 px，只占 79%；键宽 37 px | 左右各留约 4 px，与 iOS 系统键盘接近 | MathLive 键宽 `min(100px, 10cqw)`，8 列只用 80% 宽 |
| K-R8 | 两页高度不同 | Derivatives 页 226 px，Functions 页 272 px；切换时题目和操作栏跳动 | 两页高度一致 | Functions 页多一行 |
| K-R9 | 工具栏杂乱 | 撤销、重做、剪贴板（粘贴）三个图标；390 px 时页签文字贴到屏幕左边（约 2 px） | 只保留有用的控件，页签有正常边距 | MathLive `editToolbar` 默认值；页签没有左内边距 |
| K-R10 | 键帽字形不统一 | 减号键是连字符 `-`，而不是减号 `−`；`x` 键是正体无衬线，而输入框里的 x 是数学斜体 | 键帽与输入框里的数学字形一致 | 键帽用 `label` 纯文本 |

**哪些键真正需要（事实，按题库统计）**：用生成器对 101 个模板各生成 40 题，共 4,040 题，统计标准答案里出现各符号的题目比例：乘 94%、幂 66%、加 63%、除 / 分式 53%、负号 44%、cos 24%、sin 22%、eˣ 17%、√ 13%、sec 9%、csc 8%、tan 5%、cot 4%、ln 3%；**arcsin/arccos/arctan、log、∛、π 在答案中为 0%**。变量：x 84%、t 8%、θ 4%、x 与 y（隐函数）4%。多答案框题 4%。统计脚本为 `baseline/key-usage.ts`，基线截图脚本为 `baseline/capture.ts`（导入路径是本机绝对路径，K-4 与 W-1 会把它们整理进 `scripts/`）。
- **推断**：主页应放 0–9、`.`、`+ − ×`、括号、分式、幂、√、eˣ、ln、六个三角函数和本题变量；第二页只放低频键，不需要重复。
- **限制**：学生可以写等价形式，标准答案里没出现的符号仍可能被用到，所以低频键保留在第二页，不删除。

### 1.2 整体 UI / UX / 动效（三份独立评审的综合）

三份评审各自独立进行，互不可见（原文见 `reviews/`）：
- **A · Claude design 插件**（design-critique、accessibility-review、design-system、ux-copy）：`reviews/claude-design.md`
- **B · Emil Kowalski**（emil-design-eng、apple-design）：`reviews/emil-kowalski.md`
- **C · impeccable**（critique 与 polish，降级运行：没有检测器）：`reviews/impeccable.md`。Nielsen 十项总分 26/40（“可接受”）。

A 与 C 从代码和几何数据独立确认了 K-R1、K-R2、K-R4 至 K-R7 的根因，B 用实测确认了 K-R3；A 与 C 还各自推断，K-R5 的图标偏移很可能主要来自 1.5 宽的特殊键，行宽统一后需要重新测量。以下是它们在键盘之外的发现，按优先级排序；“来源”一列说明哪份评审提出，“核实”一列说明我是否亲自确认过。

| # | 发现 | 来源 | 核实 | 优先级 |
|---|---|---|---|---|
| U-R1 | **答对后主次颠倒**：`Check answer` 变成禁用状态，但仍保留主按钮的蓝色和尺寸（`opacity: 0.5`）；`Need a hint?` 仍在；真正的下一步 `Next question →` 是右下角的 caption 字号文字链接（`src/main.ts:315`、`src/style.css:426-445`）。C 认为这是“峰值之后的低谷”：答对的一刻，最显眼的按钮什么也不做。自动前进倒计时和焦点移动能缓解，但看屏幕操作的用户没有理由去看右下角 | C（A 未提） | 是，见下图 | P1 |
| U-R2 | **没有任何按压反馈**：样式表里没有 `:active` 规则；实测按住 `#submit` 时 `transform` 为 `none`。MathLive 键帽自带按压态，本身是正确的 | B | 是（grep 结果为 0） | P1 |
| U-R3 | **状态切换全部是瞬变**：反馈框、对话框、`<details>`、键盘打开时的操作栏，实测 `transition-duration` 都是 0 s。键盘本身用 280 ms 滑入，操作栏却在第一次 resize 时直接跳到位 | B | 部分（代码中确实没有 transition；时长数据来自 B 的实测） | P2 |
| U-R4 | **满屏彩纸太频繁**：连对 ≥ 10 以后每题都放（`src/main.ts:304`），每次 1.6 s | B | 是 | P1（待用户决定） |
| U-R5 | **减少动态的规则一刀切**：`* { animation: none !important; transition: none !important }` 会把将来加的颜色 / 透明度过渡一起关掉 | B | 是 | P3（D3 落地后变 P1） |
| U-R6 | **悬停规则没有限定指针类型**：3 条 `:hover` 在触屏上也会生效 | B | 是 | P2 |
| U-R7 | **令牌缺失**：没有间距刻度（27+ 个不同的 px 值）、圆角刻度（12 个不同值，按钮 9、卡片 20/16、对话框 17、路径 14 px）、阴影层级、动效令牌 | A | 是（抽查） | P1（规范的前提） |
| U-R8 | **“⌨ Math keyboard” 用的是 emoji**：WebKit 仿真中渲染成小蓝块（iOS 真机未核对），其他图标都是 SVG / CSS | A | 是，见 `baseline/390-light-06-feedback-correct.png` | P2 |
| U-R9 | **键盘页签不是真正的页签控件**：MathLive 生成的是普通 `<div>`，没有 `role="tab"` 或 `tabindex`，键盘和读屏都无法切换 | A | 是（`mathlive.mjs:28067-28085`） | P2，上游问题 |
| U-R10 | **键宽低于 44 px**：390 px 时 37 px（WCAG 2.5.8 AA 只要求 24 px；44 px 是 AAA 和 Apple HIG 的标准） | A | 是 | 并入 K2 |
| U-R11 | **文案不一致**：弹窗标题 “Take your progress with you” 与按钮 “Move progress” 动词不同；键盘页签改名后 “Functions” 名不副实 | A | 是 | P3 |
| U-R12 | **对话框打开时的焦点环很重**：关闭按钮 × 一打开就显示 3 px 方形焦点环，与圆角对话框不协调；长对话框里 “Got it” 在首屏之外（C 指出头部与主按钮都在同一个滚动区域内） | 我、C | 是，见下图 | P3 |
| U-R13 | 页面没有 `h1`；页脚 How to use 比其他链接高几像素（C 目测时未看出偏差，但没有测量） | `docs/ui-review.md` 遗留 | 是（`h1`）/ 未测（页脚） | P3 |
| U-R14 | iOS Safari 从未实现 `navigator.vibrate()`，网页无法触发触觉反馈；键盘手感只能靠视觉按压态 | B | 推断（与公开兼容性资料一致，未在真机测试） | 不做 |

![390 浅色，答对后：Check answer 仍是变淡的主按钮，Next question 只是右下角文字链接](baseline/390-light-06-feedback-correct.png)
![390 浅色，What's new 打开：× 上的方形焦点环；Got it 在首屏之外](baseline/390-light-11-whats-new.png)

**评审意见不一致之处及我的判断：**
- **C 建议加一个“真正的除号”键（typedText('/')）**，与 a/b 分开。**不采纳**：`src/math-keyboard.ts` 的注释写明键盘命令与 MathLive 的实体键绑定一致，而在 MathLive 中输入 `/` 本身就会生成分式，所以这个键和 a/b 的效果相同，只会再造一个重复键。K-1 实验中顺便验证。
- **A 与 C 都给出 8 列、数字在右三列的方案；我的方案是 9 列、数字居中，并有一列计算器式运算列。** 取舍：8 列键宽约 44 px，但要装下全部 32 个常用键就没有余量，隐函数题的 y 放不下，只能把某个函数移到 More 页；9 列键宽约 39 px（与 iOS 系统键盘的 32–35 px 相比仍然更宽），常用键全部留在 Main 页，另有 1 个空位可放 y。列为第 4 节问题 2，由用户决定。
- **C 建议 More 页最后一行只放 3 个导航键、居中不拉伸；A 建议把 More 页减到 3 行。** 都**不采纳**：会造成两页高度不同，或导航键在两页位置不同，违反 K1 的“两页高度一致、导航键位置不变”（Apple 空间一致性原则，B 的方法）。

**证据缺口**：基线截图中没有真正的“答错”状态（原来的 `06-feedback-wrong` 实为答对，已改名；A 补拍的“答错”图是整页截图，键盘浮在页面中间，并且没有显示反馈，已弃用）；Move progress 与路径页只有 390 浅色截图。以上由 W-1 的截图矩阵补齐。

### 1.3 设计规范与审核流程现状

- **事实**：没有 `DESIGN.md`。`docs/ui-review.md` 是一次性的审查记录。已有自动检查：`tests/contrast.test.ts`（令牌对比度）、`tests/visual-tokens.spec.ts`（12 px 字号下限、键盘根容器透明）、`tests/app.spec.ts` 的手机键盘几何断言。发布流程（AGENTS.md）只要求同步 README / help / 版本号，没有设计审核这一步。
- **推断**：v1.1.1 的键盘遮挡回归（`docs/reviews/2026-09-26-release/`）和本次键盘问题，都是“几何断言通过，但没人从使用者角度看过”造成的，需要固定的截图矩阵加人眼 / 模型审核。
- **未知**：第三方技能是否要正式安装。本次只读取了公开的 SKILL.md 文本作为评审方法；impeccable 的检测器是需要下载的二进制，**没有运行**。

---

## 2. Spec

课程、判分、FSRS 调度、进度数据格式和迁移规则**都不变**。以下是新增或修改的用户可见要求。

### 2.1 数学键盘（修改）

**K1 · 布局**：两页（“Main” 和 “More”），每页 4 行 × 9 个单位，每行单位数相同，各列上下对齐；两页高度相同。

Main 页（推荐方案；`[v]` 为本题变量，`[v2]` 在隐函数题为 y，否则为 π）：

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| 行 1 | sin | cos | tan | 7 | 8 | 9 | a/b | ( | ) |
| 行 2 | sec | csc | cot | 4 | 5 | 6 | × | xⁿ | √ |
| 行 3 | eˣ | ln | [v] | 1 | 2 | 3 | − | ← | → |
| 行 4 | ⌨↓（2 格） | ⌨↓ | [v2] | 0（2 格） | 0 | . | + | ⌫（2 格） | ⌫ |

- 左侧 3 列是函数块（按题库频率：最常用的 sin/cos/tan 在最上行）；中间是标准 3×3 数字块，0 在底行占两格，小数点在 3 的正下方（计算器习惯）。
- 第 7 列是运算列，从上到下为 ÷（分式）、×、−、+，与计算器和 Desmos 的运算列顺序一致。
- 右侧是结构键和编辑键：括号在右上，退格在右下（与 iOS 系统键盘一致）。

More 页（只放低频键，不与 Main 重复；导航键与 Main 页位置完全相同）：

| | 1–3 | 4–6 | 7–9 |
|---|---|---|---|
| 行 1 | arcsin | arccos | arctan |
| 行 2 | log▫ | ∛ | π |
| 行 3 | y（2 格）· t（2 格）· θ（3 格） | | ← 在第 8 列，→ 在第 9 列 |
| 行 4 | ⌨↓ 在 1–2 格，空白 5 格，⌫ 在 8–9 格 | | |

备选方案（评审 A 的 8 列版本，键宽约 44 px；用于第 4 节问题 2 的比较）：

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| 行 1 | [v] | ( | ) | sin | cos | 7 | 8 | 9 |
| 行 2 | xⁿ | √ | ln | sec | csc | 4 | 5 | 6 |
| 行 3 | eˣ | tan | + | − | × | 1 | 2 | 3 |
| 行 4 | ← | → | a/b | . | ⌨↓ | 0（2 格） | 0 | ⌫ |

这个版本里 cot 和 y 只能放在 More 页；运算符不成列；退格不在右下角（最右下是 0）。如果用户选 8 列，K1 验收中的“每行 9 单位”改为 8，其余要求不变。

验收：
- 自动测试断言每页每行单位数都是 9；0–9 位于第 4–6 列且组成 3×3 加 0 的块；除 ← → ⌫ ⌨↓ 和变量 / 常数键（x、y、t、θ、π）外，没有任何命令同时出现在两页（**实施前修订**：原文只豁免导航键，但单变量题 Main 页的 `[v2]` 是 π，More 页也需要 π 和各变量，原规则自相矛盾；函数和结构键仍然严格不重复）；两页键盘高度差 ≤ 1 px。
- 题库中出现的每种答案结构都能只用 Main 页输入（现有 `tests/math-keyboard.spec.ts` 的键盘与实体键等价测试继续通过）。

**K2 · 占满宽度**：390 px 时按键区左右留白各 ≤ 6 px、键间距 4 px，键宽约 39 px、高 44 px；1280 px 时整块键盘宽度不超过 760 px 并居中。验收：几何测试断言留白与键宽；截图矩阵复核。

**K3 · 没有悬停气泡**：在触屏（`hover: none`）上点任意键，1.5 秒后截图，看不到任何气泡；桌面也不显示“Type …”。验收：自动测试检查按键伪元素 `::after` 的 `opacity` 或 `display`，加上截图。

**K4 · 读屏名称**：每个键帽的 `aria-label` 读出含义（例如 “fraction”、“power”、“times”、“minus”、“square root”、“e to the power”、“sine”），不再有 “Type …”。验收：测试列出全部 `aria-label`，与预期表逐项相等。

**K5 · 图标居中**：所有功能键图标中心与键帽中心的偏移 ≤ 1 px（390 / 1280，浅色 / 深色）。验收：几何测试。

**K6 · 工具栏与字形**：去掉撤销 / 重做 / 剪贴板工具栏（`editToolbar: "none"`，桌面仍可用 ⌘Z）；页签有 ≥ 12 px 左边距；减号键显示 `−`；变量键用与输入框一致的数学斜体。验收：截图；测试确认工具栏不存在。

**K7 · 按压手感**：按下时立即有按压态（背景变深，不用缩放，避免键帽之间抖动），松开后恢复；不加任何动画时长。验收：测试检查 `.is-pressed` 或 `:active` 下的计算样式与常态不同；Sonnet 看截图。

以上各项同时继续满足 v1.1.1 发布记录（`docs/reviews/2026-09-26-release/`）里的键盘要求：键盘根容器透明，打开键盘时仍能看到题目和操作栏。

### 2.2 其他设计改进（新增 / 修改）

- **D1 · 答对后只有一个主操作**（U-R1，修改）：答对后 `Check answer` 与 `Need a hint?` 隐藏，`Next question →` 显示为主按钮（`.button.primary`）并获得焦点；答错、无效时保持现状。按 Enter 继续、3 秒自动前进的行为不变。规则写进 DESIGN.md：“每个界面状态只有一个主按钮；禁用的按钮不保留主按钮样式。”验收：`tests/app.spec.ts` 断言三种判定下各按钮的可见性、样式类与焦点；截图。
- **D2 · 按压与悬停**（U-R2、U-R6，新增）：`.button`、`.text-button`、`.icon-button` 有 `:active` 按压态（`scale(0.97)`，时长为 `--dur-press`；小于 32 px 的图标按钮只变背景）；所有 `:hover` 规则放进 `@media (hover: hover) and (pointer: fine)`。MathLive 键帽不叠加这套规则（K7 另行规定）。验收：样式测试读取计算样式。
- **D3 · 动效令牌与策略**（U-R3、U-R5，新增）：令牌 `--dur-press 100ms`、`--dur-fast 150ms`、`--dur-base 200ms`、`--dur-chrome 220ms`、`--ease-out cubic-bezier(0.23,1,0.32,1)`、`--ease-in-out cubic-bezier(0.77,0,0.175,1)`。策略：
  - 高频操作不做动画，包括按键、输入、提交按钮本身的状态。
  - 反馈框的颜色 / 背景用 `--dur-fast` 过渡。
  - 对话框与遮罩用 `@starting-style` 从 `scale(0.95)` 加透明度进入，时长 `--dur-base`，退出不慢于进入。
  - 键盘打开时，操作栏的 `bottom` 用 `--dur-chrome` 跟随键盘滑入。
  - 减少动态模式下去掉位移与缩放，保留颜色和透明度过渡；替换掉现在一刀切的通配规则。

  验收：样式测试（正常模式与 `reducedMotion: 'reduce'` 下的计算样式）；Sonnet 看截图，并在慢放录屏里看操作栏是否与键盘同步。
- **D4 · 图标与文案**（U-R8、U-R11，修改）：`⌨ Math keyboard` 改用内联 SVG 键盘图标；Move progress 弹窗标题的动词与按钮统一（改为 “Move your progress”）；键盘页签为 Main / More。验收：截图；文案测试。
- **D5 · 对话框焦点**（U-R12，修改）：对话框打开时焦点落在标题上（`tabindex="-1"`），不再让 × 一打开就显示焦点环；按 Tab 仍能到达 ×，焦点环规格不变。长对话框里，头部（含 ×）保持固定。验收：浏览器测试检查打开后的 `document.activeElement` 与 Tab 顺序；截图。
- **D6 · 既有遗留**（U-R13）：页面有唯一 `h1`（站点标题）；页脚链接基线对齐（先测量）。验收：测试断言 `h1` 数量为 1；几何断言页脚链接顶部差 ≤ 1 px。
- **D7 · 庆祝频率**（U-R4，需用户决定，见第 4 节问题 1）：推荐只在连对 10 / 25 / 50 / 100 时放满屏彩纸，其余答对只让连对数字轻微跳动。

**本轮不做（记录在案）**：
- U-R9，键盘页签的可访问性：这是 MathLive 上游问题。要给上游提 issue 属于对外发布内容，需要用户另行同意。
- U-R14，iOS 触觉反馈：平台不支持。
- 桌面端 1280 px 下键盘打开时侧栏空着：评审 A 认为这是有意为之，不改。

### 2.3 设计规范与审核工作流（新增）

- **S1 · `docs/design/DESIGN.md`**（新增；大纲综合评审 A 的令牌审计和评审 C 的十节建议）：
  1. 产品与使用场景（手机优先、单手、练习间隙）；
  2. 设计原则（每个状态只有一个主操作、高频操作不做动画、导航键位置不变等）；
  3. 令牌：颜色、字号、间距、圆角、阴影、动效，含浅色 / 深色取值；
  4. 布局与断点（700 / 900 px；审查视口 390 / 1280）；
  5. 组件及其全部状态（默认 / 悬停 / 按下 / 焦点 / 禁用）：按钮、输入框、反馈框、对话框、学习路径；
  6. 数学键盘规格（K1–K7，含布局表和提示气泡策略）；
  7. 反馈与进度状态（四种判定、自动前进、庆祝规则）；
  8. 无障碍底线（对比度、12 px 字号下限、24 / 44 px 目标、焦点、读屏名称）；
  9. 文案规则；
  10. 发布前审核清单（指向 S4）。

  每条规则都要注明对应的代码位置或测试。验收：S-4 逐条对照。
- **S2 · 令牌落地**：`src/style.css` 中写死的间距、圆角、阴影、时长全部改用 S-1 决定的令牌。**（实施前修订：原写“逐像素差异为 0”。实际统计显示 10/14/18/22 px 等值共 50 多处，吸附到 4 px 网格必然产生 ≤ 2 px 的变化，“差异为 0”做不到，也不是目标。）** 验收：每处数值变化 ≤ 2 px（超出的必须逐条列出理由）；改前改后截图矩阵的差异图由 Sonnet 检查，没有破版、换行变化或裁切；不属于节奏的尺寸（0、1–3 px 的细线、≥ 64 px 的布局尺寸）允许保留字面值。
- **S3 · 截图矩阵脚本**：`npm run design:capture` 生成固定状态集（欢迎、题目、键盘两页、键盘点按后 1.5 s、答对、答错、无效、提示、完整解析、路径、Move progress、What's new、帮助页、reduced-motion）× 390 / 1280 × 浅色 / 深色，加上键盘几何 JSON，输出到 `artifacts/design/<version>/`。390 px 用 WebKit iPhone 仿真，1280 px 用 Chromium。截图一律用视口截图，不用整页截图（整页截图会把固定定位的键盘画到页面中间）。
- **S4 · 上线前设计审核工作流**（写在 `docs/design/review-workflow.md`，并在 AGENTS.md 中登记为发布步骤）：凡是版本号要提升的用户可见改动，发布前都要 ① 运行 S3；② 并行派 Sonnet 做只读评审（固定三套视角：Claude design 插件、Emil 动效 / 手感、impeccable critique 与 polish），与上一版本截图对比；③ Claude 综合评审并按 P0–P3 定级，P0 / P1 阻塞发布；④ 结论与截图存进 `docs/reviews/<date>-<topic>/`。验收：本次发布本身就按这个流程走一遍（R-3）。

---

## 3. To Do

（负责人理由见文件开头约定；每个 Luna / Sonnet 项后面都有 Claude 复核项。）

**负责人调整（2026-09-26，用户追加：尽量交给 Luna max；本次特别允许使用 GPT Astra 6 medium，即 `gpt-6-astra`、medium 推理强度）。** 分工原则：
- **Astra medium**：规格清楚，但带一定逻辑判断的代码步骤（需要读 MathLive 源码确认 API 的键盘模块、判定状态与焦点逻辑）。
- **Luna max**：机械性的大块改动（测试、样式表、脚本、文档）。
- **Claude**：只保留必须开浏览器迭代的工作（K-1 实验、K-3 键盘样式）、设计决策（S-1）、指令文件（W-3）、全部复核、提交、部署。

Codex 沙盒不能起服务器，所有浏览器测试和截图都由 Claude 运行。以下各项的负责人以本表为准，覆盖下文 To Do 中原来写的负责人：

| 项 | 原负责人 | 新负责人 | 理由 |
|---|---|---|---|
| K-2 | Claude | **Astra medium** | 布局表已定，但动态变量槽、特殊键宽度覆盖、`aria-label` 需要读 MathLive 源码确认，属于有判断的实现 |
| D-1 + D-3 中 `src/main.ts` 的部分 | Claude | **Astra medium**（合成一步） | 判定、焦点、自动前进逻辑交织，规格已定；两项都改 `src/main.ts`，合成一步可避免冲突 |
| D-3 中的 CSS（页脚对齐、对话框头部固定） | Claude | **Luna max**，并入 D-2 | 与 D-2 同在 `src/style.css`，数值明确 |
| W-2 `review-workflow.md` | Claude | **Luna max**（起草），Claude 复核 | S4 已规定流程要素，属于文档撰写 |
| R-1 版本号、What's new、README / help 同步 | Claude | **Luna max**，Claude 对照代码复核 | 文档撰写；AGENTS.md 规定了要核对的内容 |
| K-1、K-3、S-1、W-3、所有复核、R-2 / R-4 | Claude | 不变 | 需要浏览器迭代、设计决策、指令文件或发布权限 |

**第 4 节问题的处理**：用户说“分完可以开始实施”，但没有逐条答复。问题 2（9 列）和问题 3（去掉工具栏）按推荐方案执行，两者都容易回退，用户可以随时改；问题 1（庆祝频率）属于产品决定，D-4 继续等待；问题 4 不安装第三方技能。

**分支**：在 `design-keyboard-1.2` 分支上实施，发布时合并到 `main`。

**执行顺序与分组**（同一文件不会同时有两个人改；并行的 Codex 步骤各自使用独立的 git worktree，由 Claude 提交后 cherry-pick 回来）：

| 顺序 | Claude | Astra medium | Luna max | Sonnet |
|---|---|---|---|---|
| 1 | K-1 实验（只在 scratchpad）；S-1 决策 | 步骤 A1：K-2（`src/math-keyboard.ts`，以及 `src/main.ts` 中的键盘设置几行） | 步骤 L2：W-1 + W-2（`scripts/design-capture.ts`、`package.json`、`docs/design/review-workflow.md`） | — |
| 2 | K-3（`src/style.css` 键盘部分）；复核 A1 / L2 | — | 步骤 L1：K-4（A1 合并后）；步骤 L4：S-2（S-1 完成后，只动 `docs/design/DESIGN.md`） | — |
| 3 | K-6 复核；运行浏览器测试 | — | 步骤 L3：K-5（`tests/app.spec.ts`、`tests/visual-tokens.spec.ts`） | K-7 |
| 4 | K-8；S-4 复核 | 步骤 A2：D-1 + D-3 的 `src/main.ts` / `index.html` / `tests/app.spec.ts` 部分（L3 合并后） | 步骤 L5：S-3（`src/style.css`，K-3 合并后） | — |
| 5 | D-5 复核 | — | 步骤 L6：D-2 + D-3 的 CSS 部分（`src/style.css`、`tests/motion.spec.ts`，L5 合并后） | D-6 |
| 6 | W-3、W-4；R-2、R-4；D-4（等问题 1 的答复） | — | 步骤 L7：R-1 | R-3 |

### 阶段 K · 数学键盘

- [ ] **K-1 · K2/K3/K5 · Claude**（需要摸清 MathLive 内部行为）— 验证 MathLive 能否被覆盖：`--keycap-width` / 容器宽度、`.MLK__keycap::after` 气泡、`svg-glyph` 对齐、`editToolbar`。在 scratchpad 写最小实验页，记录可行的写法。验证：实验截图，并把结论写回本文件 Research。
- [ ] **K-2 · K1/K4/K6 · Claude**（小而细，涉及动态变量槽）— 重写 `src/math-keyboard.ts`：Main / More 两页、9 单位行、`[v]` / `[v2]` 动态槽、去掉重复分式键、每个键设含义明确的 `aria-label`、减号字形、变量用 LaTeX 斜体；`src/main.ts` 中 `layoutsFor()` 的调用与 `editToolbar` 设置。验证：`npm test`、`tsc --noEmit`。
- [ ] **K-3 · K2/K3/K5/K6/K7 · Claude**（需要视觉迭代）— `src/style.css` 的键盘部分：宽度、间距、气泡隐藏、图标居中、页签边距、按压态。验证：390 / 1280 × 浅色 / 深色截图，几何 JSON 偏移 ≤ 1 px。
- [ ] **K-4 · K1/K4 · Luna max**（纯数据断言，文件范围有限，可在沙盒里跑 vitest）— 新增 `tests/math-keyboard-layout.test.ts`：每行 9 单位、数字块位置、两页不重复、`aria-label` 表；把 `key-usage.ts` 移到 `scripts/key-usage.ts`，加断言“题库答案用到的结构都能在 Main 页找到”。文件：只动这两个新文件。
- [ ] **K-5 · K1–K7 · Luna max**（改写测试，范围有限；它跑不了 Playwright，由 Claude 运行）— 更新 `tests/app.spec.ts` 中依赖 “Type y” / “Type arcsin” 的键盘用例；在 `tests/visual-tokens.spec.ts` 加几何与气泡断言（留白、键宽、图标偏移、两页高度、`::after` 不可见、工具栏不存在）。文件：只动这两个测试文件。
- [ ] **K-6 · 复核 K-4/K-5 · Claude** — 读 diff，查有没有为了通过而放宽断言；运行 vitest 与三引擎 Playwright。
- [ ] **K-7 · K1–K7 · Sonnet**（视觉检查）— 对比 `baseline/` 与改后截图矩阵（WebKit 390 两页、点按后 1.5 s、深色、1280），逐条对照 K1–K7 报告通过 / 不通过。
- [ ] **K-8 · 复核 K-7 · Claude** — 核实 Sonnet 结论；不通过的项回到 K-3。然后请用户在真机 iPhone 上确认一次（我无法操作真机）。

### 阶段 D · 其他设计改进（依赖阶段 S 的令牌）

- [ ] **D-1 · D1 · Claude**（状态、焦点与自动前进逻辑交织）— 修改 `src/main.ts` 操作按钮的渲染与焦点（约 315、382、479 行附近），以及 `src/style.css` 中 `.next` 的主按钮样式；更新 `tests/app.spec.ts` 的相关断言。验证：三种判定的浏览器测试和截图。
- [ ] **D-2 · D2/D3 · Luna max**（样式表内的机械改动，数值已定）— 在 `src/style.css` 中加按压态、限定悬停、给反馈框 / 对话框 / 操作栏加过渡、重写减少动态的规则；另新建 `tests/motion.spec.ts`，断言正常模式与 reduced-motion 下的计算样式。文件：只动这两个。必须在 S-3 之后执行。
- [ ] **D-3 · D4/D5/D6 · Claude**（多处小改动）— `src/main.ts`：SVG 图标、弹窗标题文案、对话框初始焦点、`h1`；`src/style.css`：页脚对齐、固定对话框头部；对应的测试断言。
- [ ] **D-4 · D7 · Claude** — 等用户决定问题 1 后修改 `src/main.ts:304` 附近的触发条件；更新 `docs/ui-review.md` 中 U-R12 的状态。
- [ ] **D-5 · 复核 D-2 · Claude** — 读 diff，查有没有放宽断言；运行全部测试；截 `prefers-reduced-motion` 截图；录一段键盘打开的慢放视频，看操作栏是否与键盘同步。
- [ ] **D-6 · D1–D7 · Sonnet** — 用 W-1 的截图矩阵做前后对比，按 Emil 清单（按压、悬停、时长、缓动、减少动态）与 impeccable polish 清单逐项检查。
- [ ] **D-7 · 复核 D-6 · Claude** — 核实结论；不通过的项退回对应的 D 项。

### 阶段 S · 设计规范与令牌

- [x] **S-1 · S1 · Claude**（设计决策）— 确定间距、圆角、阴影、动效令牌的取值与命名，以及组件规则，写成决策清单附在本文件。**结果**：见下方决策清单；依据是对 `src/style.css` 现有取值的统计（间距 12 px 27 处、10 / 20 px 各 15 处、22 px 14 处；圆角 13 种取值；阴影 5 条）。

  **S-1 决策清单**
  - **间距**：`--space-N = N × 4px`，只定义用到的档位：1（4）、2（8）、3（12）、4（16）、5（20）、6（24）、7（28）、8（32）、10（40）。10 / 14 / 18 / 22 / 26 px 按上下文吸附到相邻档位，同一组件内保持原有的大小关系。
  - **圆角**：`--radius-xs 4px`（进度条、小装饰），`--radius-sm 8px`（键帽、小标签），`--radius-md 12px`（按钮、输入框、反馈框、提示面板；原 9–11 px），`--radius-lg 16px`（手机卡片、学习路径、对话框；原 14 / 17 px），`--radius-xl 20px`（桌面卡片），`--radius-full 999px`（圆形与胶囊）。
  - **阴影**：`--shadow-card`（原 `0 4px 24px`）、`--shadow-dialog`（原 `0 24px 90px`）、`--shadow-bar`（键盘上方操作栏，原 `0 -4px 16px`）；深色模式在深色令牌块中重新定义这三个值，不在组件里另写覆盖。
  - **动效**：采用 D3 的六个令牌，不增加别的档位。
  - **组件规则**：每个界面状态只有一个 `.button.primary`；禁用的控件不保留主按钮样式；可点控件最小 44 × 44 px（数学键盘键宽除外，见 K2）；焦点环统一为 3 px `--focus`、偏移 4 px（沿用现状）；图标一律用内联 SVG，不用 emoji。
- [ ] **S-2 · S1 · Luna max**（按决策清单写文档）— 撰写 `docs/design/DESIGN.md`：盘点 `src/style.css` 现有值并映射到令牌，每条规则注明对应的代码或测试位置。文件：只动这一个新文件。
- [ ] **S-3 · S2 · Luna max**（样式表重组，视觉零变化）— 把 `src/style.css` 中写死的值换成令牌。与 D-2 同一文件，**必须在 D-2 之前完成、串行执行**。
- [ ] **S-4 · 复核 S-2/S-3 · Claude** — 逐条对照 DESIGN.md 与代码；运行 S3 的截图矩阵，与改前逐像素对比，差异为 0。

### 阶段 W · 审核工作流

- [ ] **W-1 · S3 · Luna max**（扩展脚本，范围有限）— 把 `baseline` 截图脚本整理为 `scripts/design-capture.ts`，并在 `package.json` 加 `design:capture`。文件：这两个。由 Claude 运行验证。
- [ ] **W-2 · S4 · Claude**（流程设计）— 撰写 `docs/design/review-workflow.md`：触发条件、三套评审视角的固定提示词（以本次的 `reviews/context.md` 为底稿，并写明子代理只能以文字返回报告、不能写文件）、P0–P3 定级与阻塞规则、证据存放位置、负责人分工。
- [ ] **W-3 · S4 · Claude** — 在 `AGENTS.md` 的发布检查中加入设计审核一步，指向 W-2。
- [ ] **W-4 · 复核 W-1 · Claude** — 在干净的工作区运行 `npm run design:capture`，确认输出完整、可重复。

### 阶段 R · 发布（本身就是 S4 的第一次演练）

- [ ] **R-1 · Claude** — `package.json` 升到 1.2.0；`src/whats-new.ts` 新增条目；`README.md` 与 `help.html` 中键盘两页的描述改为 Main / More 的新布局（现有描述在 README 第 38 行和 help “Typing formulas”），并核对其他相关说法。
- [ ] **R-2 · Claude** — 完整单元测试、数学核验、构建、三引擎浏览器测试。
- [ ] **R-3 · S4 · Sonnet ×3 → Claude** — 按 W-2 流程做发布前设计审核，结论存到本目录 `release-review.md`；P0 / P1 清零。
- [ ] **R-4 · Claude** — 提交、推送、部署 Cloudflare Pages，确认线上 `/` 与 `/help` 已是新版；在本文件记录提交哈希、测试数量和线上核对结果。

### Spec → To Do 覆盖检查

| Spec | 实现 | 验证 |
|---|---|---|
| K1 | K-2 | K-4、K-5、K-7 |
| K2、K3、K5、K7 | K-1、K-3 | K-5、K-7 |
| K4 | K-2 | K-4 |
| K6 | K-2、K-3 | K-5、K-7 |
| D1 | D-1 | D-1 测试、D-6 |
| D2、D3 | D-2 | D-2 测试、D-5、D-6 |
| D4、D5、D6 | D-3 | D-3 测试、D-6 |
| D7 | D-4 | D-6 |
| S1 | S-1、S-2 | S-4 |
| S2 | S-3 | S-4 |
| S3 | W-1 | W-4 |
| S4 | W-2、W-3 | R-3 |

---

## 4. 需要用户决定的问题

1. **庆祝频率**（本文 U-R4 / D7，即 `docs/ui-review.md` 的 U-R12）：① 只在 10 / 25 / 50 / 100 连对时放满屏彩纸，其余答对只显示小的 ✓ 动画（推荐）；② 每 10 题一次；③ 保持现状，另加开关。
2. **Main 页布局**：采用 9 列推荐方案（常用键全部在主页，有一列计算器式运算列，键宽约 39 px），还是评审 A 的 8 列备选方案（键宽约 44 px，但 cot 和隐函数题的 y 要到 More 页）？
3. **撤销 / 重做**：同意整条工具栏去掉吗？（MathLive 只能整条保留或整条去掉，没法只留撤销 / 重做。）
4. **第三方设计技能**：是否正式安装 Emil 的两个技能和 impeccable（后者需要下载可执行文件）？不装的话，审核流程继续用本次的方式：读取公开的 SKILL.md 文本作为评审方法。

---

## 附录 · W0 流程记录（事后补记，与本目标无关）

本任务早期，我在本文件存在之前修改了 `~/.claude/CLAUDE.md`（To Do 加负责人字段），违反了“先文档后改动”。之后按用户要求补记，并在该文件中加强了规则措辞：任何文件改动都算动了目标；第一个文件就是带三段标题的任务文档；改前自查。两处改动都已完成并重新读取核对。
