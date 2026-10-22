# AP Calculus Practice 设计规范

本文件是练习网站界面的唯一设计依据：令牌、组件、数学键盘、动效、无障碍和文案都以这里为准。每条规则后面写明**落实位置**（代码或测试）；还没实现的写“**待实现：To Do ID**”，编号对应 [`docs/reviews/2026-09-26-design-system/plan.md`](../reviews/2026-09-26-design-system/plan.md)。发布前的设计审核流程见 [`review-workflow.md`](review-workflow.md)。

修改规则：改界面时先改本文件相应条目（或在任务文档里说明为什么不改），再改代码；本文件与代码不一致时，以任务文档的 Spec 裁决，并在同一轮把两者改到一致。

---

## 1. 产品与使用场景

- **用户**：备考 AP Calculus AB/BC 的高中生。主要设备是 iPhone Safari，其次是笔记本电脑。
- **场景**：课间、通勤、写作业间隙的短时练习；常常单手操作。每题要在数学键盘上点十几到几十次。
- **约束**：离线优先，本机浏览器是进度的主存储。账号可选（1.4.0 起）：学生用老师发的登录码登录后，进度另存一份在线上；不登录时一切照旧，没有任何上传。界面文字只用英文。
- **第二类用户**：老师，在电脑或手机上用 `/teacher` 查看全班掌握度（只读）。
- **设计取向**：安静、清楚、像 Apple 系统应用。品牌感只体现在细节（公式排版、f′ 图标），不靠装饰。

## 2. 设计原则

| # | 原则 | 含义 | 落实位置 |
|---|---|---|---|
| P1 | 每个状态只有一个主操作 | 任何时刻最多一个 `.button.primary`；禁用的控件不保留主按钮样式 | `src/main.ts:398` 的 `updateControls()`；`tests/app.spec.ts` 答对状态用例 |
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

### 3.3 间距（已实现，`src/style.css:40` 起）

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
| `--space-9` | 36px |
| `--space-10` | 40px |
| `--space-14` | 56px |

现有取值到令牌的对应（按 `src/style.css` 中 padding / margin / gap 的出现次数统计）：

| 原值（次数） | 目标 | 说明 |
|---|---|---|
| 4（5）、8（9）、12（27）、16（12）、20（15）、24（6）、28（7）、32（2） | 同值令牌 | 直接替换 |
| 5（4）、6（4）、7（5） | 视上下文取 4 或 8 | 同一组件内保持原来的大小关系 |
| 9（2）、11（5）、13（4） | 8 或 12 | 同上；按钮 `11px 17px` → `12px 16px` |
| 10（15）、14（12）、18（12）、22（14）、26（2） | 相邻两档之一 | 同一组件内保持原来的大小关系；每处变化 ≤ 2 px |
| 15（4）、17（2） | 16 | |
| 25（5）、27（2） | 24 或 28 | |
| 30（2） | 32 | |
| 35、37（欢迎卡片内边距） | 36（`--space-9`） | 上下左右内边距统一为 36 |
| 58 | 56（`--space-14`） | |
| 0、1–3 px、≥ 64 px 的布局尺寸 | 保留字面值 | 不属于间距节奏 |

验收（Spec S2）：每处数值变化 ≤ 2 px，超出的逐条说明理由；改前改后的截图矩阵由审核者比对，不允许破版、换行变化或裁切。

### 3.4 圆角（已实现，`src/style.css:51` 起）

| 令牌 | 值 | 用于 | 现值 |
|---|---|---|---|
| `--radius-xs` | 4px | 进度条、小装饰 | 2、3、4 |
| `--radius-sm` | 8px | 键帽、小标签、提示条 | 8 |
| `--radius-md` | 12px | 按钮、输入框、反馈框、提示面板 | 9、10、11、12 |
| `--radius-lg` | 16px | 手机卡片、学习路径、对话框 | 14、16、17 |
| `--radius-xl` | 20px | 桌面卡片 | 20 |
| `--radius-full` | 999px | 圆形与胶囊 | 50% |

例外：站点图标 `.brand-mark` 的圆角随图标大小按比例设置（11 px / 手机 9 px），不使用组件圆角令牌。

### 3.5 阴影（已实现，`src/style.css:57` 起，深色值在深色令牌块中）

| 令牌 | 浅色 | 用于 |
|---|---|---|
| `--shadow-card` | `0 4px 24px` `--label` 2% | 练习卡片 |
| `--shadow-dialog` | `0 24px 90px` `--label` 20% | 对话框 |

深色模式在深色令牌块中重新定义这三个值（已移入深色令牌块）。一个元素只用阴影或描边中的一种表示层级。

### 3.6 动效（已实现，`src/style.css:57` 起）

| 令牌 | 值 | 用于 |
|---|---|---|
| `--dur-press` | 100ms | 按钮按下反馈 |
| `--dur-fast` | 150ms | 反馈框颜色切换 |
| `--dur-base` | 200ms | 对话框与遮罩进出 |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | 进入、按下回弹 |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | 屏幕内的位置移动 |

不新增其他档位；使用规则见第 7 节。

## 4. 布局与断点

- 断点：`max-width: 900px`、`700px`、`430px`、`320px`（`src/style.css` 末尾的 Responsive 部分）。
- 审查视口：390 × 844（iPhone，WebKit 仿真）和 1280 × 860（桌面，Chromium），浅色与深色各一套；320 px 只做溢出检查。
- 练习卡片桌面最宽 800 px；1280 px 下键盘打开时侧栏留空是有意为之。
- 安全区：页眉和页脚使用 `env(safe-area-inset-*)`。真机横屏仍需核对。

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
| 默认 | 最小高度 44 px；圆角 `--radius-md` | `src/style.css:464`；圆角 `var(--radius-md)` |
| 悬停 | 只在 `@media (hover: hover) and (pointer: fine)` 下生效 | `src/style.css:528`；`tests/motion.spec.ts` |
| 按下 | `transform: scale(0.97)`，`--dur-press`；图标按钮只变背景 | `src/style.css:521`；`tests/motion.spec.ts` |
| 焦点 | 3 px `--focus` 描边，偏移 4 px，只在 `:focus-visible` | `src/style.css:80-99` |
| 禁用 | 透明度 0.5；**不保留主按钮样式**（P1） | 透明度见 `src/style.css` 的 `button:disabled`；答对后 Check answer 直接隐藏、Next 成为主按钮（`src/main.ts:398`） |

### 5.2 答题框

MathLive `math-field`，边框 `--control-border`，聚焦时 3 px `--focus` 外框；手机字号 `--t-title-large`。多答案框题每个分量一个框。

### 5.3 结果显示

所有设备、键盘开或关，判分结果都显示在**答题框里**（2026-09-27 起；此前只在手机键盘打开时这样显示，见 `docs/reviews/2026-09-27-keyboard-polish/`）。只在第一个答题框显示：结果针对整道题，不针对单个分量。

| 判定 | 框内右侧文字 | 边框 | 框下小字 | 计入答错 |
|---|---|---|---|---|
| correct | “✓ Correct”，`--success` | `--success`；框底 3 px 倒计时线 | — | — |
| incorrect | “! Not quite”，`--warning` | `--warning` | —（说明句只给读屏） | 是 |
| invalid | “Check your input”，`--label-2` | 不变 | 具体原因，`--warning`、`--t-footnote`，不加符号 | 否 |
| inconclusive | 同 invalid | 不变 | 同 invalid | 否 |

- 颜色之外的区分（WCAG 1.4.1）：答对、答错靠 ✓ / ! 符号，无法判分的两种情况靠文字本身（“Check your input” 加框下原因）。
- 框内文字下垫一层 `--surface` 底色，向左约 32 px 渐变为透明，长答案的末尾淡出但仍可见。修改答案后，答错类标签和框下小字随即清除。
- 页面下方的反馈框 `#feedback` 与倒计时条 `#auto-next` 在所有情况下**视觉隐藏**：元素仍在页面中，`#feedback` 是 `aria-live` 区域，读屏软件照常读出结果和答错说明句。不能用 `display: none`。
- 键盘收起时（包括桌面），答题框下方是操作区：答对后 `Check answer` 与 `Need a hint?` 隐藏，`Next question →` 显示为主按钮并获得焦点；1.5 秒自动前进（2026-09-27 起，此前 3 秒）与 Enter 继续保持不变（`updateControls()`；`tests/app.spec.ts`）。
- **手机上键盘打开时**（宽度 ≤ 700 px）：操作区也视觉隐藏（答对后焦点要移到 Next 按钮，MathLive 才会释放旧答题框，所以同样不能用 `display: none`）；主操作在键盘里：确认键判分前显示 Check、答对后显示 Next；Hint?、Skip 在键盘顶栏左侧，收起键盘在右侧（见 6.1）。页面为键盘留出底部空间（键盘高度加 16 px）；答题框和框下小字保持在键盘上方；新出现的提示面板至少露出开头。
- 落实位置：`src/main.ts` 的 `renderAnswerVerdict`、`syncKeyboardControls`、`runKeyboardControl`、`keepAnswerVisible`、`revealNewHint`；`src/style.css` 的 `.answer-box`、`.answer-verdict`、`.answer-meter` 与 `.keyboard-open` 规则；`tests/app.spec.ts`、`tests/flow.spec.ts`。

### 5.4 对话框

原生 `<dialog>`，圆角 `--radius-lg`，阴影 `--shadow-dialog`，遮罩为 `--label` 32% 加 3 px 模糊（`src/style.css:939-956`）。

- 打开时焦点落在标题（`tabindex="-1"`），不自动聚焦 ×；Tab 可到达 ×（Safari 为 Option+Tab）。落实位置：`src/main.ts:565` 的 `modal()`；`tests/app.spec.ts` “opens with heading focus”。
- 长内容时，头部（标题与 ×）固定，内容区滚动（`.modal-heading` 为 `position: sticky`）。
- 标题与触发按钮用同一个动词：Move progress 对话框的标题为 “Move your progress”。
- 进出动画见第 7 节。

### 5.5 学习路径

`<details>` 列表，每个等级一行，展开和收起即时完成、不做动画（`src/style.css:687-856`）。

技能状态文字（2026-10-21 起，掌握度模型）：Locked、Not started、Learning · NN%、Basic ✓ · NN%、Ready、Rebuilding；NN 为掌握度估计的百分比。教师设置关闭的等级显示 “Not included”（当前第 6 级），这一行不可展开、没有箭头（审核 F4）。“1 skill ready” 用单数。

### 5.6 图标

一律使用内联 SVG，与文字同色（`currentColor`），不用 emoji 充当图标。“Math keyboard” 按钮使用内联 SVG 键盘图标（`src/main.ts` 的 `questionView()`）。

### 5.7 账号（登录、保存状态、两份副本）

- **页眉，未登录**：保留 “On your device” 标签（≤ 700 px 时隐藏），在 Move progress 前加次要按钮 **Sign in**。≤ 430 px 时品牌名先让出空间（f′ 图标不缩），Move progress 缩成 Move（读屏名不变），这样 200% 页面缩放时一行也放得下（媒体查询看不到页面缩放，WCAG 1.4.10；`tests/app.spec.ts` 的 200% zoom 检查）。
- **页眉，已登录**：状态标签（状态点加文字：Saved online／Saving…／Offline: saved on this device／同步停止时的说明）和账号按钮 “Signed in as <姓名>”（次要按钮）。状态点颜色：已保存 `--success`，保存中 `--tint`，离线 `--warning`，停止 `--danger`；文字始终可见，颜色只是辅助。状态变化用 `role="status"` 礼貌播报。
- **窄屏（≤ 700 px）已登录**：页面不横向滚动。保存状态是必须读到的文字：最多折成两行，**从不截断**（2026-10-22 设计审核 R6）。让出空间的是品牌名（只在已登录时隐藏，只留 f′ 图标；未登录照常显示）、Move progress（缩成 Move，读屏名仍是 Move progress）和账号按钮的 “Signed in as” 前缀（只显示姓名，最宽 8.5rem 截断；读屏名仍是完整的 “Signed in as <姓名>”）。按钮在页眉里用 caption 字号；≤ 430 px 时页眉左右边距与正文一致（16 px）。
- **页脚**：未登录 “No account. No uploaded answers.”；已登录 “Signed in as <姓名>”。页脚不写保存状态，保存状态只在页眉（R6：页脚只在 `render()` 时写入，会和离线状态矛盾）。
- **登录后的文案**：欢迎卡片写 “Your work is saved on this device and online.”；Move progress 窗口去掉 “No account needed.”。未登录时保持原文。
- **登录窗口**（`modal("Sign in")`）：标签 “Login code” 的单行输入框（等宽感的大写输入，`autocomplete="off"`、`autocapitalize="characters"`、`spellcheck="false"`、`enterkeyhint="go"`），批准过的隐私短句，主按钮 **Sign in**，下方一行 “You can also practice without signing in.”。错误紧贴输入框下方（预留一行高度，窗口不跳动；输入框 `aria-describedby` 指向它，出错时 `aria-invalid="true"`），这样 iPhone 键盘弹起时也看得到。请求进行中按钮显示 “Signing in…” 并禁用。
- **账号窗口**（`modal("Your account")`）：定义列表列出姓名、班级、状态、最后一次在线保存时间（还没保存过时写 “Nothing to save yet”）；说明句 “Signing out saves your progress online, then removes it from this device.” 和次要按钮 **Sign out**（不用危险按钮：退出先保存，不丢数据）。退出过程中按钮禁用，练习也暂停（`replacing`），直到保存并清除完成。老师换码后有未保存的进度时，按钮变成危险按钮 **Remove progress and sign out**：这是会删数据的确认步骤，符合 5.1。
- **两份副本窗口**（“Two copies of your progress”）：两块并排（窄屏上下排）的摘要，“This device” 与 “Online copy”，各列最后练习时间、已解锁等级、已开始的技能数；主按钮 **Use the online copy**，次要按钮 **Keep this device's copy**；底部小字 “The other copy is kept as a local backup. Restore backup brings it back.”。标题与按钮都用学生的话，不出现 revision 等术语。
- 落实位置：`src/main.ts` 的 `headerTools`、`openSignIn`、`openAccountSheet`、`openConflict`；`src/account.ts`（状态文字、错误文字）；`src/style.css` 的 `.header-tools`、`.account-status`、`.account-button`、`.login-input`、`.account-facts`、`.conflict-copies`；`tests/accounts/account.spec.ts`（含 390 px 页眉）。

### 5.8 教师页面（`/teacher`）

独立页面 `teacher.html`，沿用帮助页的头部和令牌；样式在 `src/teacher.css`，网格 HTML 由纯函数 `src/teacher-grid.ts` 生成（教师脚本的离线报告也用它）。

- **入口**：一个卡片，标签 “Teacher code” 的输入框和主按钮 **Open**。错误信息显示在卡片里：401 “This teacher code doesn't work.”，429 “Too many attempts. Wait 10 minutes, then try again.”，其他 “Class progress is unavailable. Try again later.”。
- **工具栏**：班级筛选、排序（姓名／最后练习）、学生人数和加载时间、次要按钮 **Refresh** 与 **Close**。
- **网格**：`<table>` 放在横向滚动容器里，页面本身不横向滚动。两行表头：等级分组（Level 1 …）在上，技能名在下；表头行在纵向滚动时固定在顶部，姓名列在横向滚动时固定在左侧。前三列是姓名、最后练习、等级。全部班级时每个班一个 `<tbody>`，班名行用 `scope="rowgroup"`。
- **单元格**：百分比文字（`--label` 色），背景按掌握度分四档，用 `color-mix` 把语义色混入 `--surface`：低于 60% `--danger` 12%；低于 80% `--warning` 13%；低于 85% `--tint` 10%；85% 及以上 `--success` 16%。颜色只是辅助，数字始终可读（WCAG 1.4.1）。没开始的技能留空。
- **行状态**：没有在线副本的学生只显示姓名；副本来自更新版本时整行显示 “Reload the page to update”；读不出时显示 “Can't read”，只影响该行。
- **层级与手机**：姓名表头在左上角，横向和纵向滚动时都盖在其他表头之上（选择器优先级要高于 `thead th` 的 `z-index`，R6）。≤ 430 px 时姓名列约 7rem，长名字换行。
- **下拉框**：`appearance: none` 加 `--label-2` 的箭头，高度 44 px（WebKit 默认的原生下拉框只有 23 px 高，R6）。
- **无障碍**：`<caption>`（视觉隐藏）、列头 `scope="col"`、姓名 `scope="row"`；尊重减少动态效果。
- 落实位置：`src/teacher.ts`、`src/teacher-grid.ts`、`src/teacher.css`；`tests/teacher-grid.test.ts`、`tests/accounts/teacher.spec.ts`。

## 6. 数学键盘

实现：`src/math-keyboard.ts`（布局数据）、`src/main.ts` 中 `layoutsFor(...)` 的调用、`src/style.css` 中 `/* Components — keyboard */` 一节。

### 6.1 布局

**一页，4 行 × 9 个单位**，没有页签（2026-09-27 起；此前为 Main / More 两页）。每个键最多有一个 **alt**（第二功能）。`[v]` 是本题变量（x、t 或 θ；隐函数题为 x）。表中 “主 / alt”：

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| 行 1 | sin / sin⁻¹ | cos / cos⁻¹ | tan / tan⁻¹ | 7 / x | 8 / y | 9 / z | ▫/▫ / ÷ | [v] | ⇧ |
| 行 2 | sec / sec² | csc / csc² | cot / cot² | 4 / u | 5 / v | 6 / w | · | ▫^▫ / [v]^▫ | √▫ / √[v] |
| 行 3 | ( / \|▫\| | ) | e^▫ / e | 1 / r | 2 / s | 3 / t | − | ⌫（2 格） | |
| 行 4 | ← | → | ln / log▫ | 0 / θ（2 格） | | . / π | + | Check / Next（2 格，蓝底） | |

- sin⁻¹、cos⁻¹、tan⁻¹ 只是键帽，输入的是 `\arcsin` 等：判分器接受 arcsin，不接受 `\sin^{-1}`。
- **抽象函数题**（题目的 `domain.functions` 非空，2026-10-21 起）：行 1 第 3 列 tan 换成 `g(▫)`，行 2 第 1–3 列 sec、csc、cot 换成 `f(▫)`、`f′(▫)`、`g′(▫)`；这四个键没有 alt，其他键与位置不变。这类题用不到 tan、sec、csc、cot；f 与 f′ 左右相邻，g 在 g′ 正上方（`layoutsFor(vars, functions)`，任务文档 `2026-10-21-practice-quality` S6）。键帽画空框，单按插入 `f\left(▫\right)` 等并选中空框；打字等价检查（`tests/math-keyboard.spec.ts`）跳过这四个模板键。四个键帽用同一个缩小字号（类 `practice-key-template`），390 px 与 320 px 下键面宽度不超过键宽减 4 px（2026-10-22 设计审核 F1，`tests/math-keyboard.spec.ts` 实测）。首次提示 “Hold a key or tap ⇧ for more” 在这类题里照常显示，这四个键按住或点 ⇧ 都不变（审核 F2，接受）。
- **取得 alt 的两种方式**：① 按住有 alt 的键 450 ms，键上方弹出气泡显示将输入的内容，松手输入；手指移动超过约 8 px 或移出键外则取消。② 点 ⇧：点一次只对下一个键生效，然后自动恢复；连点两次锁定，再点一次解除。⇧ 打开时，有 alt 的键换成 alt 并变为 `--tint` 色，没有 alt 的键保持原样（不变淡：它们仍然可以按，变淡会低于 4.5:1）。
- **手机上键上不印 alt**（负责人试过角标小字后否决：太挤）；**宽度 ≥ 700 px 时在键的右上角印淡蓝小字**（11 px、`--tint`、60% 不透明；← → ⌫ 与确认键不印），此时键宽约 60 px 以上，放得下（2026-09-27 第 14 轮）。发现方式：键盘第一次打开时，顶栏中间显示一行 “Hold a key or tap ⇧ for more”，第一次用过长按或 ⇧ 后不再显示（本机记录 `apcalc.keyboardAltTipSeen`）；帮助页与 What's new 说明。
- **顶栏**（原页签行）：左侧 **Hint?**、**Skip**，右侧收起键盘图标按钮，触控高度 44 px。提示用完时隐藏 Hint?；答对后隐藏 Hint? 与 Skip。MathLive 每次重建键盘都会清空这一行，由 `src/main.ts` 用 `MutationObserver` 自动补回。

规则（由 `tests/math-keyboard-layout.test.ts` 检查）：

1. 每行合计 9 个单位；数字 1–9 在第 4–6 列，组成 3 × 3 块，0 在底行第 4–5 列，小数点在第 6 列。
2. 第 7 列是运算列：分式、·、−、+。
3. ← → ⌫ 和确认键的 alt 与自身相同，⇧ 不改变它们（MathLive 默认给 ⌫ 的 shift 是全部清除，给 ← → 的是选择）；键盘上没有收起键。
4. 每个功能只出现一次：要么是某个键的主功能，要么是某个键的 alt。唯一的例外是变量：本题变量有自己的键，同一个字母也是某个数字的 alt（这样每个字母在任何题里都在同一个位置）；两处输入的命令相同。
5. 题库答案里出现的每种运算都能从键盘取得（主功能或 alt）。
6. 只有一个分式键，单按插入上下分式，alt 为 ÷（÷ 有优先级歧义：`1÷2x` 与 `1÷2·x` 的解析不同，见该任务文档 R8）。
7. 等待输入的位置在键帽上画空框（▫/▫、▫^▫、e^▫、√▫、log▫、\|▫\|）；只有真的插入变量的键帽才写变量。
8. 确认键在 MathLive 里不做任何事（一个空插入命令；MathLive 中没有命令的键会把标签当文字输入），由 app 处理：判分前等同 Check，答对后等同 Next，与按 Enter 相同。

取舍依据：题库 4,040 题的答案中，乘 94%、幂 66%、除 53%、sin / cos 各约 23%、eˣ 17%、√ 13%、sec / csc 8–9%、tan / cot 4–5%、ln 3%；反三角、log、∛、π 为 0%（`scripts/key-usage.ts`）。立方根键已去掉（需要时输入 ^(1/3)）。

### 6.2 尺寸

| 项 | 值 | 落实位置 |
|---|---|---|
| 左右内边距、键间距 | 4px | `src/style.css` `.ML__keyboard` |
| 单位宽度 | `min(calc((100cqw + 4px) / 9), 84px)` | 同上 |
| 键高 | 44px | 同上 |
| 390 px 下 | 键宽 39 px，9 列从 4 px 排到 386 px | 实测，见审查记录 `after/` |
| 1280 px 下 | 键宽 80 px，整块 752 px，居中 | 同上 |
| n 格键 | n × 单位 − 间距 | MathLive 规则 |

键宽 39 px 低于本站其他控件的 44 px，但高于 WCAG 2.5.8（AA）要求的 24 px；这是为了让常用键放在一页而做的有意取舍（审查记录第 4 节问题 2，用户选定 9 列）。

### 6.3 外观与反馈

- 键帽 `--surface`，底板 `--fill`，功能键使用 MathLive 的次级样式。
- **alt 角标只在 ≥ 700 px 显示**：MathLive 默认在键的右上角画 alt 小字，只在宽度 ≤ 414 px 时隐藏，所以样式表先在所有宽度隐藏 `.MLK__shift`，再在 `min-width: 700px` 下对没有 `hide-shift` 类的键按上面的样式显示（任务文档 R18 与第 14 轮；只按手机宽度检查时，桌面上漏掉过）。由 `tests/math-keyboard.spec.ts` 在 390 / 600 / 700 / 1280 px 检查。
- **字体**：所有数学键帽用 LaTeX 键面，由 MathLive 以 KaTeX 字体绘制，与题目公式同一套字形（变量斜体、函数名直立）；确认键与顶栏按钮用界面字体。乘号显示 `·`，减号显示 `−`。
- 按下时背景变为 `--separator`，不缩放、不加过渡（P2）。确认键与顶栏按钮由 app 自己处理点按（MathLive 在键盘里取消了 pointerdown，触屏上不会产生 click），按下状态由 `.is-pressed` 类绘制。
- **⇧ 三态**照 iOS 键盘的 shift：关 = 功能键灰底、空心箭头；一次性 = 白底（`--surface`）、实心箭头；锁定 = 白底、实心箭头加下方横线。打开与锁定时箭头为 `--tint`，与变蓝的 alt 键帽一致。
- **长按气泡**：在键的上方显示 alt 的键面；出现用 `--dur-fast`，透明度 0→1 加缩放 0.95→1，`--ease-out`，以下沿为原点；松手输入时立即消失，不做动画；取消时用 `--dur-press` 淡出。没有 alt 的键不启动长按计时，按住等同单按。
- 键盘上关闭 iOS 的长按菜单与文字选择（`-webkit-touch-callout: none`、`user-select: none`，并阻止 `contextmenu`），否则系统菜单会与气泡同时出现。
- 触屏上关闭悬停高亮（`@media (hover: none)`），避免点过的键留着高亮。
- **不显示悬停气泡**：`.ML__keyboard [data-tooltip]::after { display: none }`。长按气泡是本站自己画的元素，不受这条规则影响。
- 功能键图标居中（偏移 ≤ 1 px）。MathLive 给退格键加了 `bottom right` 类，把图标推到角落，样式表把功能键统一改为居中。
- 没有撤销 / 重做 / 剪贴板工具栏（`editToolbar = "none"`）。

### 6.4 读屏名称

MathLive 把键帽的 `tooltip` 优先用作 `aria-label`，所以 `tooltip` 只写读音名称，不写 “Type …”。⇧ 打开时，MathLive 换用 alt 的 `tooltip`：

| 键 | 名称 | alt 的名称 |
|---|---|---|
| 0–9 | 数字本身 | 字母本身；0 为 theta |
| + / − / · | plus / minus / times | — |
| ( / ) | left parenthesis / right parenthesis | absolute value / — |
| . | decimal point | pi |
| sin / cos / tan | sine / cosine / tangent | inverse sine / inverse cosine / inverse tangent |
| sec / csc / cot | secant / cosecant / cotangent | secant squared / cosecant squared / cotangent squared |
| f(▫) / f′(▫) / g(▫) / g′(▫)（仅抽象函数题） | f of / f prime of / g of / g prime of | — |
| ln | natural log | log base |
| ▫/▫ | fraction | divide |
| ▫^▫ | power | [v] to the power |
| √▫ | square root | square root of [v] |
| e^▫ | e to the power | e |
| [v] | x / t / theta | — |
| ⇧ | shift（状态用 `aria-pressed`） | — |
| ← / → / ⌫ | move left / move right / delete | 同左 |
| Check / Next | check answer / next question | 同左 |

顶栏按钮使用普通 `<button>`：Hint?、Skip 读出按钮文字，收起按钮的名称为 “Hide keyboard”。首次提示是装饰性文字（`aria-hidden`），功能说明在帮助页。

### 6.5 已知限制

- alt 只能靠触摸 / 鼠标长按或 ⇧ 取得；MathLive 的虚拟键盘本身没有键盘焦点顺序，读屏或开关控制用户无法从虚拟键盘取得 alt。替代路径是用实体键盘直接输入（`arcsin`、`/`、`^`、`sqrt` 等，见帮助页的 Typing formulas）。
- **长按借用 MathLive 的内部字段**：长按到时直接写 `_shiftPressCount = 1`，因为公开的 `shiftPressCount` setter 会调用 `render()`，清掉被按住键的按下状态，松手就不会输入 alt。这依赖 MathLive 0.110 的内部实现；升级 MathLive 时，守护测试会失败，需要重新检查（任务文档 `2026-09-27-keyboard-polish` R12）。
- **iPhone 上键盘层的高度**：MathLive 把键盘层设为固定定位、`height: 100%`。iOS Safari 带底部浮动地址栏时，这个 100% 按 “大视口” 计算，比可见高度多约 13 px，键盘最后一行被挤出屏幕（2026-09-27 真机读数：可见 714 px，键盘底边 727 px）。`src/main.ts` 把 `window.innerHeight` 写进 `--practice-viewport-height`（`resize` 与 `visualViewport` 的 `resize` 时更新），`body > .ML__keyboard` 用它作高度。仿真无法复现这个差值，改动键盘定位时需要真机确认（任务文档 `2026-09-27-iphone-viewport-storage`）。
- **输入时的页面滚动**：MathLive 每按一个键都会滚动页面（`scrollIntoView` 加一次按键盘顶边计算的 `scrollBy`），iPhone 上输入幂、根号时页面会跳一下。答题框设置了 `onScrollIntoView`：手机键盘打开时交给 `keepAnswerVisible()`，只在答题框确实被键盘挡住时滚动；其他情况保持 MathLive 的 `scrollIntoView({ block: "nearest" })`。MathLive 在答题框内部按光标滚动的逻辑不受这个选项影响（任务文档 `2026-09-27-iphone-viewport-storage` R5）。另外，分式、幂、根号之后 MathLive 会把选中的占位框写进它的隐藏输入元素并选中这段文字，iOS Safari 随即滚动页面去 “露出” 选区，看起来就是跳一下（R8）。屏幕键盘打开时跳过这一步（`quietKeyboardSink()`，借用 MathLive 0.110 的内部字段 `_mathfield.keyboardDelegate`，升级 MathLive 时守护测试会失败）；这段文字只给系统的复制 / 文字服务用，屏幕键盘用不到。兜底：按下编辑键后 500 ms 内，页面若被移动且不是 `keepAnswerVisible()` 滚的，就滚回原位（`heldScroll`，R6）；Check / Next 键与键盘顶栏按钮不受此限制，因为它们可能换题。
- **iPhone 上本地存储打开不正常**：真机上 IndexedDB 偶尔打开无响应或失败（2026-09-27）。启动时最多等 5 秒，超时或失败都显示 “We couldn’t open your saved progress.”，主按钮 Reload，次要的 Continue without saving 进入临时模式（`src/main.ts` 的 `loadStateWithin`、`chooseAfterStorageFailure`；`tests/app.spec.ts` 用真实的卡住与失败模拟）。
- iOS Safari 不支持 `navigator.vibrate()`，网页无法触发触觉反馈。
- WebKit 仿真不能完全复现 iOS 点按后的悬停残留；与键盘有关的改动需要真机确认。
- **MathLive 的焦点记录**：MathLive 另外记着“当前在输入的答题框”，只有浏览器焦点真正移到别的元素上才会清除，它自己的 `blur()` 不会清除。如果一个仍被记为聚焦的答题框被删掉，下一个答题框获得焦点时就会报错。因此换题前要把焦点移到 Next 按钮上（`next()` 中已处理）。另外，答题框有焦点且键盘打开时，把它设为只读会让 MathLive 收起键盘，所以这种情况下改用 `beforeinput` 拦截编辑。

## 7. 动效

已实现：`src/style.css:57`（令牌）、`989`（对话框）、`1373`（减少动态）；`tests/motion.spec.ts`。

| 频率 | 例子 | 规则 |
|---|---|---|
| 每次练习数百次 | 键盘按键、输入、光标移动 | 不做动画 |
| 每题一次 | 框内结果出现、按钮状态变化、⇧ 打开时键帽变色 | 只做颜色 / 背景过渡，`--dur-fast` |
| 按需 | 长按气泡 | 出现 `--dur-fast`（透明度加 0.95→1 缩放），输入时立即消失，取消时 `--dur-press` 淡出；见 6.3 |
| 偶尔 | 对话框 | `@starting-style` 从 `scale(0.95)` 加透明度进入，`--dur-base`；退出不慢于进入 |
| 少见 | 连对庆祝 | 见下文 |

- 进入和按下一律 `--ease-out`；不用 ease-in；不从 `scale(0)` 开始。
- 只对 `transform`、`opacity`、颜色类属性做动画，写明属性名，不用 `transition: all`。
- 不做动画：连对数字本身（不做滚动计数）、学习路径的展开收起、自动前进进度条（已经是每 50 ms 线性更新）。
- 连对庆祝：连对达到 10 以后，每答对一题放一次满屏彩纸（1.6 秒）；连对数字跳动加火花。这是用户明确保留的设计（2026-09-26）。
- **减少动态**（`prefers-reduced-motion: reduce`）：去掉位移、缩放和彩纸（包括长按气泡的缩放），保留颜色和透明度过渡；不再使用“所有 transition 一律关闭”的通配规则。MathLive 不检查这项设置，所以另有一条规则关闭键盘的滑入动画（`src/style.css:1373` 起）。

## 8. 无障碍底线

目标 WCAG 2.1 AA。

| 项 | 规则 | 落实位置 |
|---|---|---|
| 对比度 | 文字 ≥ 4.5:1，控件边框 ≥ 3:1 | `tests/contrast.test.ts` |
| 字号 | ≥ 12 px，使用 rem | `tests/visual-tokens.spec.ts` |
| 触控目标 | ≥ 44 × 44 px；键盘键宽例外，见 6.2。原生 `<select>` 也算：用 `appearance: none` 才能在 WebKit 里得到 44 px（5.8） | `src/style.css` 按钮规则；`src/teacher.css` 的 `.teacher-select` |
| 焦点 | `:focus-visible` 下 3 px `--focus` 描边 | `src/style.css:80-99` |
| 公式 | `role="math"`，`aria-label` 为 MathLive 的朗读文本，不暴露 LaTeX | `src/main.ts` 的 `math()` |
| 反馈 | `aria-live="polite"`，颜色之外有符号或文字区分 | `src/main.ts`、5.3 |
| 标题层级 | 每页一个 `h1` | 练习页为页眉中的站点标题 `h1.brand-heading`；帮助页为页面标题；`tests/app.spec.ts`、`tests/motion.spec.ts` |
| 键盘读屏 | 每个键有读音名称 | 6.4；`tests/math-keyboard-layout.test.ts` |

## 9. 文案

- 只用英文；句子用句号结尾，按钮不用句号。
- 按钮写动作（“Check answer”、“Move progress”），确认对话框的按钮写出具体后果（“Reset this device”）。
- 错误信息说明发生了什么、下一步怎么做，不出现内部代码或 LaTeX。
- 同一件事全站用同一个词：对话框标题与触发按钮的动词一致。
- 学习进度术语固定：Basic、Mixed、Ready；不另造同义词。
- 用户可见的文案或行为变化，同一轮同步 `README.md`、`help.html` 和 What's new（见 `AGENTS.md`）。

## 10. 发布前审核

凡是版本号要提升的改动，发布前按 [`review-workflow.md`](review-workflow.md) 做设计审核，分两级。**常规审核**每次都做：用 `npm run design:capture` 截图，只比对受本次改动影响的界面状态，对照本文件的相关规则，不调用评审技能。**完整审核**只在新增界面或组件、修改本文件的原则或令牌、较大改版或用户要求时做：派全局子代理 `design-reviewer`（Sonnet、medium，运行全局技能 `design-review`）一次完成三个视角，Claude 核实定级；与任务 Spec 冲突的结论先回到 Grill 问负责人。两级都是 P0 / P1 阻塞发布。审核清单逐条对应本文件第 2–9 节。
