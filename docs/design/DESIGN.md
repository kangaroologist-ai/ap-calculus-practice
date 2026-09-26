# AP Calculus Practice 设计规范

本文件是练习网站界面的唯一设计依据：令牌、组件、数学键盘、动效、无障碍和文案都以这里为准。每条规则后面写明**落实位置**（代码或测试）；还没实现的写“**待实现：To Do ID**”，编号对应 [`docs/reviews/2026-09-26-design-system/plan.md`](../reviews/2026-09-26-design-system/plan.md)。发布前的设计审核流程见 [`review-workflow.md`](review-workflow.md)。

修改规则：改界面时先改本文件相应条目（或在任务文档里说明为什么不改），再改代码；本文件与代码不一致时，以任务文档的 Spec 裁决，并在同一轮把两者改到一致。

---

## 1. 产品与使用场景

- **用户**：备考 AP Calculus AB/BC 的高中生。主要设备是 iPhone Safari，其次是笔记本电脑。
- **场景**：课间、通勤、写作业间隙的短时练习；常常单手操作。每题要在数学键盘上点十几到几十次。
- **约束**：离线优先，进度只存在本机浏览器，没有账号；界面文字只用英文。
- **设计取向**：安静、清楚、像 Apple 系统应用。品牌感只体现在细节（公式排版、f′ 图标），不靠装饰。

## 2. 设计原则

| # | 原则 | 含义 | 落实位置 |
|---|---|---|---|
| P1 | 每个状态只有一个主操作 | 任何时刻最多一个 `.button.primary`；禁用的控件不保留主按钮样式 | 欢迎页、题目页已满足；答对状态**待实现：D-1** |
| P2 | 高频操作不做动画 | 按键、输入、提交这类每次练习重复成百上千次的操作，反馈必须即时，不加过渡 | 第 7 节 |
| P3 | 位置稳定 | 同一个功能在不同页面、不同状态下出现在同一位置（例如键盘的导航键在两页位置相同） | 第 6 节；`tests/math-keyboard-layout.test.ts` |
| P4 | 触屏不依赖悬停 | 悬停只能增强，不能承载信息；触屏上不出现悬停气泡或残留的高亮 | 第 6、7 节 |
| P5 | 先数据后布局 | 键盘等高频组件的取舍依据题库统计，而不是感觉 | `scripts/key-usage.ts` |
| P6 | 规则可测 | 能自动检查的规则都有测试；不能自动检查的进入发布前审核清单 | 第 10 节 |

## 3. 令牌

所有令牌定义在 `src/style.css` 顶部的 `:root`，深色值在紧随其后的 `@media (prefers-color-scheme: dark)` 中重新定义。组件里不写原始颜色，也不单独写深色覆盖。

### 3.1 颜色（已实现，`src/style.css:4-56`）

| 令牌 | 浅色 | 深色 | 用于 |
|---|---|---|---|
| `--label` | `#1d1d1f` | `#f5f5f7` | 正文、标题 |
| `--label-2` | `#6c6c70` | `#a1a1a6` | 次要文字、说明 |
| `--separator` | `#d2d2d7` | `#38383a` | 分隔线、卡片描边；键盘按下态 |
| `--control-border` | `#86868b` | `#7c7c80` | 输入框和次要按钮的边框（≥ 3:1） |
| `--fill` | `#f0f0f3` | `#2c2c2e` | 次级背景、键盘底板 |
| `--bg` | `#f5f5f7` | `#000000` | 页面背景；主按钮文字 |
| `--surface` | `#ffffff` | `#1c1c1e` | 卡片、对话框、键帽 |
| `--tint` | `#0066cc` | `#2997ff` | 主按钮、链接、选中态 |
| `--focus` | `#0071e3` | `#409cff` | 焦点环 |
| `--success` | `#1f7a35` | `#30d158` | 答对 |
| `--warning` | `#a15c00` | `#ffb340` | 答错、提醒 |
| `--danger` | `#c4001a` | `#ff6961` | 重置等破坏性操作 |

对比度：全部文字与背景组合 ≥ 4.5:1，边框与控件 ≥ 3:1，由 `tests/contrast.test.ts` 检查。新增颜色令牌必须同时加进该测试。

### 3.2 字号（已实现，`src/style.css:23-39`）

rem 刻度，最小 12 px（`--t-caption`），由 `tests/visual-tokens.spec.ts` 检查。

| 令牌 | 值 | 用于 |
|---|---|---|
| `--t-large-title` | `clamp(2.125rem, 4.6vw, 3.5rem)` | 帮助页以外的大标题 |
| `--t-help-title` | `clamp(1.875rem, 5vw, 2.75rem)` | 帮助页标题 |
| `--t-error-title` | 2.1875rem | 启动错误页 |
| `--t-welcome` | 1.9375rem | 欢迎卡片标题 |
| `--t-title1` / `--t-title2` / `--t-title3` | 1.75 / 1.375 / 1.25rem | 各级标题；手机上的公式 |
| `--t-title-large` / `--t-title-small` | 1.5 / 1.3125rem | 连对数字、答题框（手机） |
| `--t-equation` / `--t-equation-large` | 1.5 / 1.625rem | 公式 |
| `--t-brand` | 1.1875rem | 站点名 |
| `--t-body` / `--t-callout` / `--t-subhead` | 1.0625 / 1 / 0.9375rem | 正文 |
| `--t-footnote` | 0.8125rem | 按钮、反馈 |
| `--t-caption` | 0.75rem | 说明文字、页脚链接（下限） |

字距：大标题用负字距（`h1` 为 −1.6 px），正文保持 0。

### 3.3 间距（**待实现：S-3**）

`--space-N = N × 4px`，只定义用到的档位：

| 令牌 | 值 |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-7` | 28px |
| `--space-8` | 32px |
| `--space-10` | 40px |

现有取值到令牌的对应（按 `src/style.css` 中 padding / margin / gap 的出现次数统计）：

| 现值（次数） | 目标 | 说明 |
|---|---|---|
| 4（5）、8（9）、12（27）、16（12）、20（15）、24（6）、28（7）、32（2） | 同值令牌 | 直接替换 |
| 5（4）、6（4）、7（5） | 视上下文取 4 或 8 | 同一组件内保持原来的大小关系 |
| 9（2）、11（5）、13（4） | 8 或 12 | 同上；按钮 `11px 17px` → `12px 16px` |
| 10（15）、14（12）、18（12）、22（14）、26（2） | 相邻两档之一 | 同一组件内保持原来的大小关系；每处变化 ≤ 2 px |
| 15（4）、17（2） | 16 | |
| 25（5）、27（2） | 24 或 28 | |
| 30（2） | 32 | |
| 0、1–3 px、≥ 64 px 的布局尺寸 | 保留字面值 | 不属于间距节奏 |

验收（Spec S2）：每处数值变化 ≤ 2 px，超出的逐条说明理由；改前改后的截图矩阵由审核者比对，不允许破版、换行变化或裁切。

### 3.4 圆角（**待实现：S-3**）

| 令牌 | 值 | 用于 | 现值 |
|---|---|---|---|
| `--radius-xs` | 4px | 进度条、小装饰 | 2、3、4 |
| `--radius-sm` | 8px | 键帽、小标签、提示条 | 8 |
| `--radius-md` | 12px | 按钮、输入框、反馈框、提示面板 | 9、10、11、12 |
| `--radius-lg` | 16px | 手机卡片、学习路径、对话框 | 14、16、17 |
| `--radius-xl` | 20px | 桌面卡片 | 20 |
| `--radius-full` | 999px | 圆形与胶囊 | 50% |

### 3.5 阴影（**待实现：S-3**）

| 令牌 | 浅色 | 用于 |
|---|---|---|
| `--shadow-card` | `0 4px 24px` `--label` 2% | 练习卡片 |
| `--shadow-dialog` | `0 24px 90px` `--label` 20% | 对话框 |
| `--shadow-bar` | `0 −4px 16px` `--label` 3% | 键盘上方的操作栏 |

深色模式在深色令牌块中重新定义这三个值（现有的深色覆盖写在 `src/style.css` 的 `@media (prefers-color-scheme: dark)` 组件块里，届时移入令牌块）。一个元素只用阴影或描边中的一种表示层级。

### 3.6 动效（**待实现：D-2**）

| 令牌 | 值 | 用于 |
|---|---|---|
| `--dur-press` | 100ms | 按钮按下反馈 |
| `--dur-fast` | 150ms | 反馈框颜色切换 |
| `--dur-base` | 200ms | 对话框与遮罩进出 |
| `--dur-chrome` | 220ms | 键盘打开时操作栏跟随上移 |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | 进入、按下回弹 |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | 屏幕内的位置移动 |

不新增其他档位；使用规则见第 7 节。

## 4. 布局与断点

- 断点：`max-width: 900px`、`700px`、`430px`、`320px`（`src/style.css` 末尾的 Responsive 部分）。
- 审查视口：390 × 844（iPhone，WebKit 仿真）和 1280 × 860（桌面，Chromium），浅色与深色各一套；320 px 只做溢出检查。
- 练习卡片桌面最宽 800 px；1280 px 下键盘打开时侧栏留空是有意为之。
- 安全区：页眉、页脚和键盘上方的操作栏使用 `env(safe-area-inset-*)`。真机横屏仍需核对。

## 5. 组件

### 5.1 按钮

| 类型 | 类名 | 外观 | 何时用 |
|---|---|---|---|
| 主按钮 | `.button.primary` | `--tint` 底，`--bg` 字 | 当前状态唯一的主操作（P1） |
| 次要按钮 | `.button.subtle` | 透明底，`--control-border` 描边 | 并列的次要操作（Need a hint?） |
| 危险按钮 | `.button.danger` | `--danger` 底 | 不可撤销的操作，且只在确认对话框里 |
| 文字按钮 | `.text-button` | `--tint` 文字，caption 字号 | 低权重操作（Skip、页脚链接） |
| 图标按钮 | `.icon-button` | 44 × 44 px，透明 | 关闭等 |

状态：

| 状态 | 规则 | 落实位置 |
|---|---|---|
| 默认 | 最小高度 44 px；圆角 `--radius-md` | `src/style.css:464`；圆角**待实现：S-3** |
| 悬停 | 只在 `@media (hover: hover) and (pointer: fine)` 下生效 | **待实现：D-2**（现为无条件 `:hover`，`src/style.css:446、484、487`） |
| 按下 | `transform: scale(0.97)`，`--dur-press`；< 32 px 的图标按钮只变背景 | **待实现：D-2** |
| 焦点 | 3 px `--focus` 描边，偏移 4 px，只在 `:focus-visible` | `src/style.css:80-99` |
| 禁用 | 透明度 0.5；**不保留主按钮样式**（P1） | 透明度见 `src/style.css:76`；样式规则**待实现：D-1** |

### 5.2 答题框

MathLive `math-field`，边框 `--control-border`，聚焦时 3 px `--focus` 外框；手机字号 `--t-title-large`。多答案框题每个分量一个框。

### 5.3 反馈框

| 判定 | 背景 | 文字 | 图标 | 计入答错 |
|---|---|---|---|---|
| correct | `--success` 9% 混合 `--surface` | `--success` | ✓ | — |
| incorrect | `--warning` 9% 混合 `--surface` | `--warning` | ! | 是 |
| invalid | `--fill` | `--label-2` | i | 否 |
| inconclusive | `--fill` | `--label-2` | i | 否 |

颜色之外必有图标（不单靠颜色区分，WCAG 1.4.1）。落实位置：`src/style.css:631-676`。颜色切换过渡**待实现：D-2**。

答对之后：`Check answer` 与 `Need a hint?` 隐藏，`Next question →` 显示为主按钮并获得焦点；3 秒自动前进与 Enter 继续保持不变（**待实现：D-1**）。

### 5.4 对话框

原生 `<dialog>`，圆角 `--radius-lg`，阴影 `--shadow-dialog`，遮罩为 `--label` 32% 加 3 px 模糊（`src/style.css:939-956`）。

- 打开时焦点落在标题（`tabindex="-1"`），不自动聚焦 ×；Tab 可到达 ×（**待实现：D-3**）。
- 长内容时，头部（标题与 ×）固定，内容区滚动（**待实现：D-2**）。
- 标题与触发按钮用同一个动词：Move progress 对话框的标题为 “Move your progress”（**待实现：D-3**）。
- 进出动画见第 7 节。

### 5.5 学习路径

`<details>` 列表，每个等级一行，展开和收起即时完成、不做动画（`src/style.css:687-856`）。

### 5.6 图标

一律使用内联 SVG，与文字同色（`currentColor`），不用 emoji 充当图标。“Math keyboard” 按钮目前仍是 emoji ⌨（**待实现：D-3**）。

## 6. 数学键盘

实现：`src/math-keyboard.ts`（布局数据）、`src/main.ts` 中 `layoutsFor(...)` 的调用、`src/style.css` 中 `/* Components — keyboard */` 一节。

### 6.1 布局

两页，**每页 4 行 × 9 个单位**，两页高度相同。`[v]` 是本题变量（x、t 或 θ；隐函数题为 x），`[v2]` 在隐函数题为 y，否则为 π。

Main 页：

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| 行 1 | sin | cos | tan | 7 | 8 | 9 | a/b | ( | ) |
| 行 2 | sec | csc | cot | 4 | 5 | 6 | × | xⁿ | √ |
| 行 3 | eˣ | ln | [v] | 1 | 2 | 3 | − | ← | → |
| 行 4 | ⌨↓（2 格） | | [v2] | 0（2 格） | | . | + | ⌫（2 格） | |

More 页：

| | 1–3 | 4–6 | 7–9 |
|---|---|---|---|
| 行 1 | arcsin | arccos | arctan |
| 行 2 | log▫ | ∛ | π |
| 行 3 | y（2 格）、t（2 格）、θ（3 格） | | ← 在第 8 列，→ 在第 9 列 |
| 行 4 | ⌨↓（第 1–2 列）、空白 5 格、⌫（第 8–9 列） | | |

规则（由 `tests/math-keyboard-layout.test.ts` 检查）：

1. 每行合计 9 个单位；数字 1–9 在第 4–6 列，组成 3 × 3 块，0 在底行第 4–5 列，小数点在第 6 列。
2. 第 7 列是运算列：分式、×、−、+（与计算器和 Desmos 的顺序一致）。
3. 导航键（← → ⌫ ⌨↓）在两页的行、列、宽度都相同。
4. 除导航键和变量 / 常数键（x、y、t、θ、π）外，任何命令不在两页同时出现。
5. 题库答案里出现的每种运算都能在 Main 页找到对应的键。
6. 只有一个分式键；在 MathLive 中输入 `/` 本身就生成分式，所以不另设除号。

取舍依据：题库 4,040 题的答案中，sin / cos 各约 23%、eˣ 17%、√ 13%、sec / csc 8–9%、tan / cot 4–5%、ln 3%；反三角、log、∛、π 为 0%（`scripts/key-usage.ts`）。

### 6.2 尺寸

| 项 | 值 | 落实位置 |
|---|---|---|
| 左右内边距、键间距 | 4px | `src/style.css` `.ML__keyboard` |
| 单位宽度 | `min(calc((100cqw + 4px) / 9), 84px)` | 同上 |
| 键高 | 44px | 同上 |
| 390 px 下 | 键宽 39 px，9 列从 4 px 排到 386 px | 实测，见审查记录 `after/` |
| 1280 px 下 | 键宽 80 px，整块 752 px，居中 | 同上 |
| n 格键 | n × 单位 − 间距 | MathLive 规则 |

MathLive 只提供 0.5、1.5、2、5 格的宽度类；3 格键在布局数据里写 `w30` 类，样式表补上 `.w30` 的宽度规则。

键宽 39 px 低于本站其他控件的 44 px，但高于 WCAG 2.5.8（AA）要求的 24 px；这是为了让常用键全部放在 Main 页而做的有意取舍（审查记录第 4 节问题 2，用户选定 9 列）。

### 6.3 外观与反馈

- 键帽 `--surface`，底板 `--fill`，功能键使用 MathLive 的次级样式。
- 按下时背景变为 `--separator`，不缩放、不加过渡（P2）。
- 触屏上关闭悬停高亮（`@media (hover: none)`），避免点过的键留着高亮。
- **不显示悬停气泡**：`.ML__keyboard [data-tooltip]::after { display: none }`。
- 功能键图标居中（偏移 ≤ 1 px）。MathLive 给退格键加了 `bottom right` 类，把图标推到角落，样式表把功能键统一改为居中。
- 没有撤销 / 重做 / 剪贴板工具栏（`editToolbar = "none"`）。
- 变量键使用数学斜体，与答题框一致；减号显示 `−`（U+2212）。

### 6.4 读屏名称

MathLive 把键帽的 `tooltip` 优先用作 `aria-label`，所以 `tooltip` 只写读音名称，不再写 “Type …”：

| 键 | 名称 | 键 | 名称 |
|---|---|---|---|
| 0–9 | 数字本身 | sin / cos / tan | sine / cosine / tangent |
| + / − / × | plus / minus / times | sec / csc / cot | secant / cosecant / cotangent |
| ( / ) | left parenthesis / right parenthesis | ln / log▫ | natural log / log base |
| . | decimal point | arcsin / arccos / arctan | inverse sine / inverse cosine / inverse tangent |
| a/b | fraction | x / y / t / θ / π | x / y / t / theta / pi |
| xⁿ | power | ← / → | move left / move right |
| √ / ∛ | square root / cube root | ⌫ | delete |
| eˣ | e to the power | ⌨↓ | hide keyboard |

### 6.5 已知限制

- MathLive 的页签是普通 `<div>`，没有 `role="tab"`，键盘和读屏都无法切换页签（上游问题，暂不处理）。
- iOS Safari 不支持 `navigator.vibrate()`，网页无法触发触觉反馈。
- WebKit 仿真不能完全复现 iOS 点按后的悬停残留；与键盘有关的改动需要真机确认。

## 7. 动效

**待实现：D-2**（现状：只有连对跳动和彩纸两处动画，其余状态切换都是瞬变）。

| 频率 | 例子 | 规则 |
|---|---|---|
| 每次练习数百次 | 键盘按键、输入、光标移动 | 不做动画 |
| 每题一次 | 反馈框出现、按钮状态变化 | 只做颜色 / 背景过渡，`--dur-fast` |
| 偶尔 | 对话框、键盘打开时的操作栏 | `@starting-style` 从 `scale(0.95)` 加透明度进入，`--dur-base`；操作栏用 `--dur-chrome` 跟随键盘；退出不慢于进入 |
| 少见 | 连对庆祝 | 见下文 |

- 进入和按下一律 `--ease-out`；不用 ease-in；不从 `scale(0)` 开始。
- 只对 `transform`、`opacity`、颜色类属性做动画，写明属性名，不用 `transition: all`。
- 不做动画：连对数字本身（不做滚动计数）、学习路径的展开收起、自动前进进度条（已经是每 50 ms 线性更新）。
- 连对庆祝：连对达到 10 以后，每答对一题放一次满屏彩纸（1.6 秒）；连对数字跳动加火花。这是用户明确保留的设计（2026-09-26）。
- **减少动态**（`prefers-reduced-motion: reduce`）：去掉位移、缩放和彩纸，保留颜色和透明度过渡；不再使用“所有 transition 一律关闭”的通配规则（**待实现：D-2**，现为 `src/style.css` 末尾的通配规则）。

## 8. 无障碍底线

目标 WCAG 2.1 AA。

| 项 | 规则 | 落实位置 |
|---|---|---|
| 对比度 | 文字 ≥ 4.5:1，控件边框 ≥ 3:1 | `tests/contrast.test.ts` |
| 字号 | ≥ 12 px，使用 rem | `tests/visual-tokens.spec.ts` |
| 触控目标 | ≥ 44 × 44 px；键盘键宽例外，见 6.2 | `src/style.css` 按钮规则 |
| 焦点 | `:focus-visible` 下 3 px `--focus` 描边 | `src/style.css:80-99` |
| 公式 | `role="math"`，`aria-label` 为 MathLive 的朗读文本，不暴露 LaTeX | `src/main.ts` 的 `math()` |
| 反馈 | `aria-live="polite"`，颜色之外有图标 | `src/main.ts`、5.3 |
| 标题层级 | 每页一个 `h1` | 帮助页已满足；练习页**待实现：D-3** |
| 键盘读屏 | 每个键有读音名称 | 6.4；`tests/math-keyboard-layout.test.ts` |

## 9. 文案

- 只用英文；句子用句号结尾，按钮不用句号。
- 按钮写动作（“Check answer”、“Move progress”），确认对话框的按钮写出具体后果（“Reset this device”）。
- 错误信息说明发生了什么、下一步怎么做，不出现内部代码或 LaTeX。
- 同一件事全站用同一个词：对话框标题与触发按钮的动词一致。
- 学习进度术语固定：Basic、Mixed、Ready；不另造同义词。
- 用户可见的文案或行为变化，同一轮同步 `README.md`、`help.html` 和 What's new（见 `AGENTS.md`）。

## 10. 发布前审核

凡是版本号要提升的改动，发布前按 [`review-workflow.md`](review-workflow.md) 做设计审核：用 `npm run design:capture` 生成截图矩阵，三套视角独立评审，Claude 综合并定级，P0 / P1 阻塞发布。审核清单逐条对应本文件第 2–9 节。
