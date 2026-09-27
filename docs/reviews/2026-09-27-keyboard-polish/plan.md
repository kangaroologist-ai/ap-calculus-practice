---
task: keyboard-polish
phase: implement         # grill | research | spec | todo | implement | acceptance | done
scope: ap-calculus-practice / 数学键盘、答题框结果显示
branch: design-keyboard-1.2
version: 1.2.0 → 1.2.0（未发布，并入同一版本；见 D1）
commits: []
---

# 2026-09-27 键盘打磨：More 页排布、符号、字体、按键位置、桌面端结果显示

用户在第二个 v1.2.0 预览版（`ec8609e`）上提出六点，原话：

1. 现在键盘more这页的排布很难看，按钮大小不一样，pi是重复的
2. main这边乘号和x容易混，改成·吧。除号改成/；x^n别写n，留个框更好理解
3. 键盘的字体有serif有sans，是不是都用同一个数学字体，和题目一样的
4. 把常用的功能尽量放右手边？把pi去掉，左右括号放第三行左1左2，x、pi换成ex和ln；x和一个机动的放在现在括号的地方
5. 桌面端也把提交后的正确/错误提示和倒数进度放到答题框吧，和手机上一样
6. 文档写完给我讲讲再开工

## Grill (decision log)

Recon：读了 `src/math-keyboard.ts`（全部）、`src/main.ts` 的答题框结果、倒计时、键盘按键处理（55–172、345–410、590–700 行）、`src/style.css` 的答题框与键盘样式（600–670、1115–1200、1290–1350 行）、DESIGN.md 第 5.3、6 节、README 与 `help.html` 中键盘和判分的段落、`tests/math-keyboard-layout.test.ts`、上一份计划 `docs/reviews/2026-09-26-keyboard-followups/plan.md`，运行了 `scripts/key-usage.ts`。不需要问的事实：

- v1.2.0 还没有发布（F-8 在等 iPhone 确认，正式站点仍是旧版），所以这轮改动并入 1.2.0。
- 题目公式由 MathLive 的 `convertLatexToMarkup` 渲染，用的是 KaTeX 字体（衬线）；键盘上用 `label` 的键（数字、sin、+、( 等）是系统无衬线字体，用 `latex` 的键（x、π、eˣ、√、log▫）是 KaTeX 字体。这就是第 3 点看到的混用。
- 题库 4,040 题的答案里 π 出现 0 次；变量只有 x（3,400）、x 与 y（160）、t（320）、θ（160）。每道题只用自己的变量，所以 More 页的 y、t、θ 对作答没有用处（隐函数题的 y 已在 Main 页）。

Size class：medium，有六个相互独立的设计点，一轮问完，必要时再追问一轮。

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G1 | 第 4 点的 Main 页排布是否这样理解（见 R3 表格） | **按 R3 表格**（`( )` 放第 3 行第 1–2 列，eˣ、ln 放原来 x、π 的位置，x 和机动键放原来括号的位置）/ 另有调整 | 待答 | 2026-09-27 |
| G2 | 机动键在非隐函数题显示什么（隐函数题显示 y） | **² （平方，一键输入 ^2）** / π / 留空（不可按的空位）/ 本题变量以外的其他符号 | 待答 | 2026-09-27 |
| G3 | “/” 键按下后是什么 | **仍插入上下分式，只是标签改为 /**（与在键盘上打 `/` 的效果一致）/ 输入一条斜线（行内 a/b） | 待答 | 2026-09-27 |
| G4 | More 页放什么、怎么排 | **只放 6 个键，统一 3 格宽：arcsin arccos arctan / log▫ ∛ π；去掉 y、t、θ**；第 3、4 行只留 ⌫、← →、Check / 保留 y、t、θ，但所有键改为和 Main 一样的 1 格宽 | 待答 | 2026-09-27 |
| G5 | 哪些键用数学字体 | **所有数学内容键（数字、运算符、括号、函数名、变量）都用题目的 KaTeX 字体；Check / Next 和页签行（Main、More、Hint?、Skip）保持界面字体** / 连 Check / Next 也用数学字体 | 待答 | 2026-09-27 |
| G6 | 桌面端（以及手机不开键盘时）结果怎么显示 | **所有情况都在答题框里显示结果和倒计时线；答对时去掉下方的 “Correct.” 框和 “Next in 3s” 条（读屏仍会读出）；答错 / 无法判定时，下方只保留说明句（如 “Check the rule and the inner derivative.”），不再重复 “Not quite”**；Next question 按钮保留 / 下方的反馈框全部去掉 / 下方反馈框照旧，只是多加框内显示 | 待答 | 2026-09-27 |

第 1 轮回答（2026-09-27，原话要点）：
- G1、G2：没有直接确认；提出 e 的指数、幂、根号的键帽应该用空框而不是 x，问 “x^框” 和 “框^框” 是否都要，机动键怎么设计。→ 转为 G7、G8。
- G3：“/ 对应分式吧。如果加长按，就是单按出除号，长按出分式。”→ 转为 G9。
- G4：“more 页保留一些变量吧，后面可以改变量名考察对求导含义的理解。”→ 否决推荐，转为 G10。
- G5：“没问题”。→ **定案：推荐方案。**
- G6：“都放框里吧，但是答错了 retry 的 flow 是什么样的？”→ 转为 G11。
- 新需求：长按改变按键含义，像 iOS 键盘那样，长按时弹气泡；“长按其他按键安排什么功能也可以想”。→ G12。

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G7 | 键帽上的占位写法 | **凡是 “作用于前面内容” 或 “等你填” 的位置一律画空框：幂 ▫^▫、eˣ 改 e^▫、√▫、分式 ▫/▫（上下）；只有真的插入变量的键才写 x（如 x^▫）** / 维持现状 | 待答（loop-back） | 2026-09-27 |
| G8 | 机动键 | **非隐函数题为 [v]^▫（本题变量的幂，一键插入 x^▫）；隐函数题为 y，x^▫ 和 y^▫ 放在幂键的长按里** / ² / π | 待答（loop-back） | 2026-09-27 |
| G9 | 分式键单按与长按 | **单按上下分式，长按出 ÷**（理由见 R8）/ 单按 ÷，长按分式（负责人的提议） | 待答（loop-back） | 2026-09-27 |
| G10 | More 页排布（保留变量） | **两段：上两行函数，3 格宽（arcsin arccos arctan / log▫ ∛▫ \|▫\|）；下两行变量与常数，1 格宽，与 Main 同尺寸（x y z t u v w / θ r s π e）** / 全部 1 格宽 | 待答（loop-back） | 2026-09-27 |
| G11 | 答错后的流程与框内显示 | **框底加一条状态栏（在框线以内）：答对 “✓ Correct” + 倒计时线；答错 “! Not quite. ＜说明句＞”；无法判定 “i Couldn’t check. ＜原因＞”。答错后焦点留在框里，改答案时边框恢复、状态栏变灰但保留，下次 Check 时替换** / 维持右侧叠字，说明句只给读屏 / 右侧叠字 + 框下方说明句 | 待答（loop-back） | 2026-09-27 |
| G12 | 长按功能与提示 | **用 MathLive 自带的长按面板（按住 0.3 秒弹出，选项见 R7 表）；有长按的键在右上角画一个小角标；帮助页和 What's new 说明** / 不做长按 | 待答（loop-back） | 2026-09-27 |

第 2 轮回答（2026-09-27，原话要点）：
- G12 改为：“不用完全像 iOS 键盘那样，只有一个长按选项，就是长按弹出一个气泡提示变成了什么，然后松手就输入了，不需要滑过去。”→ **定案：每个键最多一个长按功能；按住弹出气泡显示将输入的内容，松手输入。**
- G9：“同意分式键反过来的设计。”→ 理解为 Claude 推荐的 “单按分式、长按 ÷”（与负责人最初的提议相反），在 G13 请负责人确认。
- 长按内容：“sin、cos、tan 长按是各自的 arc 就行”；“▫^▫ 和 √▫ 长按只留一个填入变量的单一选项”。→ **定案：sin/cos/tan → arcsin/arccos/arctan；▫^▫ → [v]^▫；√▫ → √[v]。** G7（空框占位）随之定案为推荐方案。
- G10 被取代：“more 页的键感觉可以完全去掉了，字母都放到数字的长按里……main/more 的标签都不用了，保留一个代表 shift 的上箭头按钮，点击它变激活，键盘切 alt，这时不用长按也能输入 alt 功能。”→ **定案：只有一页键盘；每个键的长按功能同时是它的 alt 功能；⇧ 键切换 alt 状态。** 细节见 G14–G17。

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G13 | 确认分式键 | **单按上下分式，长按 / alt 为 ÷** / 单按 ÷，长按分式 | 待答（loop-back） | 2026-09-27 |
| G14 | 机动键（▫^▫ 的长按已经是 [v]^▫） | **普通题为 ▫²（平方），隐函数题为 y** / 普通题仍为 [v]^▫ / π | 待答（loop-back） | 2026-09-27 |
| G15 | ⇧ 的行为 | **点一次只对下一个键生效，然后自动恢复；连点两次锁定，再点一次解除（MathLive 自带，与手机键盘相同）** / 一直保持到再点一次 | 待答（loop-back） | 2026-09-27 |
| G16 | 键上是否印出 alt 内容 | **每个有 alt 的键右上角用小灰字印出 alt 内容（像计算器的第二功能），不另画角标；⇧ 激活时主字与小字对调，没有 alt 的键变淡** / 只画角标 / 不标 | 待答（loop-back） | 2026-09-27 |
| G17 | 字母与数字的对应 | **7 8 9 → x y z，4 5 6 → u v w，1 2 3 → r s t，0 → θ，. → π；e^▫ 的 alt 为常数 e** / 其他排法 | 待答（loop-back） | 2026-09-27 |

第 3 轮回答（2026-09-27，原话要点）：
- “sec/csc 的 alt 是他们的平方。”→ **定案：sec → sec²，csc → csc²。**
- G14 被取代：“把 ⇧ 放机动吧，顶栏左边 hint、skip，右边收键盘。”→ **定案：⇧ 占第 1 行第 9 列（原机动键位置），没有机动键；顶栏左侧 Hint?、Skip，右侧收起键盘。** R9 的 “⇧ 放顶栏” 路线作废，⇧ 用 MathLive 自带的 `[shift]` 键。
- G16：“印个小 alt 吧，但是给我看看再彻底改，我不确定手机上能不能看清。”→ **定案：印小 alt，先做样机给负责人看，确认后再做完整实现（To Do T1 为关卡）。**
- “其他没问题”→ **G11、G13（单按分式、alt 为 ÷）、G15、G17 定案为推荐方案。**

第 4 轮回答（2026-09-27，看过 alt 小字样机后，原话要点）：
- “显示 alt 太挤了太丑了，不显示了。”→ **定案：键上不印 alt。** G16 改判；alt 只在长按气泡和 ⇧ 激活时出现。
- “arcsin 那些太长了，还是显示 -1 但是输入 arc 吧。”→ **定案：⇧ 激活时三角键显示 sin⁻¹、cos⁻¹、tan⁻¹，输入 `\arcsin` 等**（判分器认 arcsin，不认 `\sin^{-1}`，R8）。
- “那个 shift 图标好丑。”→ **定案：重画 ⇧ 图标**（样机 2：细线空心箭头，线宽 1.6，与收起键盘图标一致；激活为实心并着色，锁定时箭头下加一横）。
- “还需要找之前的三个 design skill 快速过一遍（sonnet medium），这次改进还是挺大的。”→ **定案：实现前先做一次三视角快速评审（T1b）**，评审对象为样机 2；发布前的完整审核（P4）照旧。

第 5 轮（2026-09-27，负责人看到样机 2 的状态栏后更正，原话）：“这个 correct 显示怎么跟之前说的不一样？应该和手机显示一样在答题框里。打错的也一样，不用补那句小字的话。”
→ **定案：G11 改判。所有设备都用手机现在的框内显示**（答题框右侧 “✓ Correct” / “! Not quite” / “i Couldn’t check”，答对时框底倒计时线，边框变色），**不加框底状态栏，不显示说明句**。说明：G11 的推荐是框底状态栏，与手机现有的框内叠字不是同一个设计；第 3 轮 “其他没问题” 被 Claude 当作同意了状态栏，样机 2 因此画成了状态栏。更正后状态栏作废。

第 5 轮补充（2026-09-27，原话）：“⇧ 的三种状态样式参考 iOS 键盘的 shift 吧。”→ **定案：⇧ 三态照 iOS 键盘的 shift**：关 = 灰色功能键底、空心箭头；一次性 = 白色（普通键）底、实心箭头；锁定 = 白色底、实心箭头加下方横线。取代综合表中 A3 / B3 的 “浅蓝底” 改法。

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G18 | 键上不印 alt，学生怎么发现长按和 ⇧（评审 A1、C-F1 定为 P1）；y 放在哪里 | **① y 同时作为 [v] 键和 8 的 alt（隐函数题最常用的 y 放在变量键上最好找，8 上保留是为了字母排列完整）；② 键盘第一次打开时，顶栏中间显示一行 “Hold a key or tap ⇧ for more”，第一次用过长按或 ⇧ 后不再显示（记在本机）；③ 帮助页与 What's new 说明** / 只靠帮助页和 What's new / 首次打开时弹一个说明气泡 | 待答（loop-back） | 2026-09-27 |
| G19 | “无法判定” 时是否显示原因（如 “Use only x and supported functions.”、括号不配对） | **显示：只在无法判定时，把原因放进框内右侧文字（“i Use only x”这类短句），不另加一行**；答错不显示说明句（负责人已定） / 同答错一样不显示原因 | 待答（loop-back） | 2026-09-27 |

第 6 轮回答（2026-09-27，原话）：
- “白底实心箭头是不是有点像其他按键？还能怎么区分？”→ 转为 G20，附对比样机。
- G18：“首次提示+文档吧”→ **定案：键盘第一次打开时顶栏中间显示一行提示，第一次用过长按或 ⇧ 后不再显示（记在本机）；帮助页与 What's new 说明。** 负责人没有选 “y 同时作为 [v] 键的 alt”，按默认处理为 **y 只在 8 的 alt 上**（D7 不变）。
- G19：“放在框下面或上面的小字吧，就像密码输入错误那样样式”→ **定案：无法判定时，答题框下方显示一行小字说明原因，样式同表单校验错误**（见 G21 的细节）；框内右侧仍显示 “i Couldn’t check”。

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G20 | ⇧ 激活时如何与普通白键区分 | **B：照 iOS 的形状（关 = 灰底空心，一次性 = 白底实心，锁定 = 白底实心加横线），但激活时箭头用 `--tint` 蓝色，与 ⇧ 状态下变蓝的 alt 字一致（“蓝 = alt 状态”）** / A：完全照 iOS，黑色实心箭头 / C：激活时蓝底白箭头（与 Check 键撞色，违反 “一个状态一个主按钮”） | 待答（loop-back），样机 `proto3-shift-*.png` | 2026-09-27 |
| G21 | 无法判定的小字：位置与颜色 | **框下方（表单校验错误的通行位置），小字号（`--t-footnote`），颜色 `--warning`，前面加 “i” 图标；改答案后消失**；手机键盘打开时算进 “保持可见” 的范围 / 框上方 | 待答（loop-back，随 G20 一起确认） | 2026-09-27 |

第 7 轮回答（2026-09-27，原话要点）：
- “skill 里再强调一下这种情况，每次 grill 都要同步更新后面的 RST，新提需求、跑 design skill 也都要跑一遍 GRST。”→ To Do T8。
- G20：“B”→ **定案：⇧ 三态照 iOS 形状，激活与锁定时箭头为 `--tint` 蓝色。**
- G21：“小字位置没问题。但是那个 i 没必要，有点迷惑。couldn't check 是不是换个学生视角的说法。”→ **定案：小字在框下方、`--warning` 色、`--t-footnote`，前面不加 “i”。** 框内文字换成学生视角的说法，见 G22。

| # | Question | Options (recommendation first) | Owner's answer | Date |
|---|---|---|---|---|
| G22 | 框内 “i Couldn’t check” 换成什么 | **按两种情况分开，不加符号：无效输入（括号、变量、空答案等，R10）显示 “Check your typing”；无法判定（判分器算不准，R10）显示 “Try another form”。** 框下小字照旧给出具体原因 / 两种情况都用 “Can’t read this” / 都用 “Not counted” | 待答（loop-back） | 2026-09-27 |

第 8 轮回答（2026-09-27，原话）：“Check your input 就行，开工，多安排 luna max 帮你。”
→ **G22 定案：无效输入与无法判定在框内都显示 “Check your input”（不加符号），框下小字给出具体原因。** Grill 结束；To Do 的负责人按 “多安排 Luna max” 调整（见 To Do 开头的步骤表）。

Shared understanding confirmed：2026-09-27，第 3 轮 “其他没问题”，并同意先做 alt 小字样机；第 4–8 轮的回头追问全部答完，第 8 轮 “开工”。

Default assumptions (not answered):
- D1：版本号保持 1.2.0，直接修改尚未发布的 1.2.0 What's new 条目（上一轮同样处理）。
- D2：t 题、θ 题中，Main 页 “x” 的位置显示本题变量（t 或 θ），与现在一样。
- D3：乘号 “·” 只改键帽；答题框里 MathLive 本来就把 `*` 显示为 `\cdot`（实施时核实，见 R2）。
- D4：幂键键帽为 ▫^▫（G7），按下的行为不变（`moveToSuperscript`，把光标前的内容作为底数）；alt 插入 `[v]^{▫}`。
- D6：cot 的 alt 与 sec、csc 一致，为 cot²（负责人只点名了 sec、csc）。
- D7：隐函数题没有单独的 y 键（机动键位置给了 ⇧），y 通过 8 的 alt 输入；[v] 键仍为 x。在样机里请负责人留意。
- D8：键盘只剩一页后，DESIGN.md 6.1 规则 4（两页不重复）改写为 “每个功能只出现一次：主字或 alt”。
- D5：常用键是否还要更多地移到右侧（第 4 点的问号）：本轮只做第 4 点里点名的移动；三角函数留在左侧三列。理由见 R3。


## Research

Labels: **[F]** fact (source), **[I]** inference, **[U]** unknown, **[P]** pre-existing issue.

截图来自 `npm run design:capture`（F-7，提交 `ec8609e` 之前一刻生成，`artifacts/design/1.2.0/`），复制到本目录作为改动前的证据。

### R1. More 页排布难看、π 重复（第 1 点）

- **[F]** More 页第 1、2 行是 3 个 3 格宽的键，第 3 行是 2、2、3 格加 2 格 ⌫，第 4 行中间是 5 格空白（`src/math-keyboard.ts:47-52`）。三种宽度混在一起，是 “大小不一样” 的来源。
- **[F]** π 在 Main 第 4 行第 3 列（非隐函数题）和 More 第 2 行第 3 列同时出现；隐函数题里 y 在 Main 和 More 都出现（`src/math-keyboard.ts:44, 49-50`）。DESIGN.md 6.1 规则 4 允许变量和常数重复，但用户认为这是重复。
- **[F]** 题库答案里 π 为 0%，More 页的 y、t、θ 对任何一题都不是必需的（Recon）。

![改动前，390 浅色，More 页](before-390-light-more.png)

### R2. Main 页符号（第 2、4 点）

- **[F]** 乘号键帽是 “×”，与斜体 x 在小键上容易看混（截图第 2 行第 7 列与第 3 行第 3 列）。
- **[F]** 分式键帽是 “÷”（上一轮按用户要求改的），按下插入 `\frac{#@}{#?}`；MathLive 中直接打 `/` 也生成上下分式，所以标签改为 “/” 与物理键盘一致。
- **[F]** 指数键用 `latex: 'x^{n}'`，显示 xⁿ；MathLive 支持 `\placeholder{}` 画出空框（More 页的 log▫ 已经这样用）。
- **[U]** 答题框里 `*` 是否已显示为 “·”：需要在浏览器里核实；如果显示为 “×”，要一起改（MathLive 的 `multiply` 相关设置）。

![改动前，390 浅色，Main 页](before-390-light-main.png)

### R3. Main 页按键位置（第 4 点）

按用户的描述，改动后（`[v]` 为本题变量，`[f]` 为机动键）：

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| 行 1 | sin | cos | tan | 7 | 8 | 9 | / | **[v]** | **[f]** |
| 行 2 | sec | csc | cot | 4 | 5 | 6 | **·** | x^▫ | √ |
| 行 3 | **(** | **)** | **eˣ** | 1 | 2 | 3 | − | ⌫ | ⌫ |
| 行 4 | ← | → | **ln** | 0 | 0 | . | + | Check | Check |

- **[I]** 本题变量（出现在几乎每个答案里）移到右上，右手拇指最顺手；eˣ（17%）和 ln（3%）移到左侧；括号放到左侧。三角函数（sin/cos 各约 23%）仍在左侧三列：把它们挪到右边会拆开计算器式的数字块和运算列，所以按 D5 不动。
- **[I]** 机动键：隐函数题为 y；其他题的选项见 G2。推荐 “²”：幂运算出现在 66% 的答案里，平方最常见，一键省去 “^、2、→” 三次点按。

### R4. 键盘字体混用（第 3 点）

- **[F]** 用 `label` 的键由 MathLive 以 `--keycap-font-family`（本站继承系统无衬线字体）绘制；用 `latex` 的键由 MathLive 转成 KaTeX 标记，字体是 KaTeX_Main / KaTeX_Math，与题目相同（`src/math-keyboard.ts:30-35`，截图中 sin 与 eˣ、ln 与 x 的差别）。
- **[I]** 路线：把所有数学键改为 `latex` 键帽（数字 `7`、`\sin`、`+`、`(` 等），由同一套 KaTeX 渲染，而不是给键盘设置一个 CSS 字体。好处是字形、斜体规则（变量斜体、函数名直立）和题目完全一致。
- **[U]** 函数名较长的键（arcsin 等）改为 KaTeX 后是否放得下 3 格宽或 1 格宽键，需要截图核对；读屏名称（`tooltip`）不受影响。

### R5. 桌面端结果显示（第 5 点）

- **[F]** 答题框内的结果（`.answer-verdict`）和倒计时线（`.answer-meter`）已经对所有设备渲染，只是被 `@media (max-width: 700px)` 里的 `.keyboard-open` 规则打开（`src/style.css:1337-1348`）；下方的 `#feedback` 与 `#auto-next` 在桌面上照常显示（截图）。
- **[F]** 答错时 `#feedback` 除了 “Not quite.” 还有一句说明（`src/feedback.ts`：“Check the rule and the inner derivative.” 等）；定义域错误和无效输入也有专门说明（`src/main.ts:347-358`）。
- **[P]** 手机打开键盘时，这句说明被视觉隐藏，只有读屏能读到，学生看不到。本轮不改手机键盘打开时的行为（空间不够），只记录。
- **[I]** 路线：把框内结果和倒计时线的显示规则移出手机媒体查询，对所有情况生效；`#feedback` 保留为读屏的 live region，答对时视觉隐藏，答错时只显示说明句；`#auto-next` 条视觉隐藏（计时逻辑不变，已同时驱动 `.answer-meter`）。

![改动前，1280 浅色，答对](before-1280-light-correct.png)

### R6. 测试与文档的影响面

- **[F]** `tests/math-keyboard-layout.test.ts` 固定了两页的键位、变量情形（`second: 'pi'` 等）和读屏名称；`tests/math-keyboard.spec.ts`、`tests/app.spec.ts:1191` 测 More 页的 y 和反三角。
- **[F]** 很多 e2e 用 `#feedback` 的文字断言 “Correct”；`#feedback` 若保留在 DOM 中（视觉隐藏），这些断言不受影响。
- **[F]** README 第 36、38 段、`help.html` 的 Correct 与 Typing formulas 段、DESIGN.md 5.3 与 6.1–6.4、What's new 1.2.0 条目都描述了现在的键位、÷ / ×、More 页内容和 “仅手机在框内显示结果”。

### R7. 长按（第 1 轮新需求）

- **[F]** MathLive 0.110 自带长按：键帽定义里的 `variants` 非空时，按住 300 ms 后在键的上方弹出一个面板，点面板里的项执行它的命令（`node_modules/mathlive/mathlive.mjs:28736-28751` 计时，`27679-27780` 面板）。本站现在给每个键都写了 `variants:[]`，所以长按没有反应（`src/math-keyboard.ts:35`）。
- **[F]** MathLive 不会标出哪些键有长按（样式里没有相应的类），需要本站自己加角标。
- **[F]** 本站在捕获阶段只拦截 Check / Next 和页签行按钮（`src/main.ts:655-700`），数学键的长按不受影响。
- **[U]** 在 iPhone Safari 上能否 “按住后滑到选项上松开” 就选中（像 iOS 键盘），还是必须松开后再点：代码里松手时面板已释放指针捕获，推测可以，需要真机确认。面板的颜色要按本站深浅色主题设置。
- 长按表（推荐）：

| 键（单按） | 长按选项 |
|---|---|
| ▫/▫ 分式 | ÷ |
| ▫^▫ 幂 | [v]^▫、▫²、▫³（隐函数题另加 y^▫） |
| √▫ | ∛▫、ⁿ√▫ |
| sin / cos / tan | sin²、arcsin / cos²、arccos / tan²、arctan |
| sec / csc / cot | sec² / csc² / cot² |
| ln | log▫ |
| ( | \|▫\|（绝对值） |

### R8. 判分器能接受哪些写法（为 G9、R7 核实）

- **[F]** 用本站的 Compute Engine（`form: "raw"`，与 `src/grading.ts:78` 相同）试解析：`6\div x` → Divide；`\sec^2x` → Power(Sec, 2)；`\left|x\right|` → Abs；`\sqrt[n]{x}` → Root（`grading.ts:57` 转成幂）；这些判分器都支持（`grading.ts:6-27` 的函数表）。
- **[F]** `\sin^{-1}x` 解析为 `Apply(InverseFunction(Sin))`，判分器不支持，所以反三角键帽和插入内容都用 arcsin，不用 sin⁻¹。
- **[F]** ÷ 有歧义：`1\div 2x` 解析为 1/(2x)，`1\div 2\cdot x` 解析为 (1/2)·x；`\sin x\div\cos x+1` 解析出错。上下分式没有这个问题，这是 G9 推荐 “单按分式” 的理由。
- **[F]** 判分器只接受本题的变量，用了别的变量会显示 “Use only x … and supported functions.”，按 “无法判定” 处理，不算答错（`grading.ts:42`）。所以 More 页多放变量不会让学生因为误点而被扣分。

### R9. 单页键盘 + ⇧ / 长按（第 2 轮新方案）

- **[F]** MathLive 自带 shift：键帽可以写 `shift`（alt 的显示和命令）；`[shift]` 键按一次 `shiftPressCount = 1`，下一个键按下后自动归零，连按两次为 2（锁定，键盘加 `is-caps-lock` 类）；shift 状态下松手执行 `keycap.shift`，并把所有键重绘成 shift 的样子（`mathlive.mjs:28785-28807`、`28946-28956`、`29140-29160`）。
- **[I]** 长按可以借用这套机制：按住 300 ms 时由本站把 `shiftPressCount` 设为 1 并弹出气泡，松手时 MathLive 自己执行 `keycap.shift` 并归零；手指移出键外时 MathLive 取消按下，什么也不输入。这样长按和 ⇧ 用的是同一份 alt 定义，不需要本站自己执行命令。**[U]** 设置 `shiftPressCount` 不会重绘键帽（只切换类），气泡期间是否需要重绘、iOS Safari 上按住是否会触发系统的文字选择或放大镜，需要实测。
- **[F]** 只有一个布局时，MathLive 不画页签；布局设了 `displayEditToolbar` 才保留这一行，右侧仍是本站放 Hint?、Skip、收起的位置（`mathlive.mjs:28067-28085`、`28276-28290`）。**[I]** ⇧ 放在这一行左侧（原来 Main / More 的位置），4 × 9 的键位不变。⇧ 由本站注入，不是 MathLive 的 `[shift]` 键，所以要自己调用重绘；**[U]** 重绘方法是否公开，需要在实现时确认，不行就退回到把 `[shift]` 放进键盘格子里。
- **[F]** 去掉 More 页后，∛ 没有位置（▫^▫、√▫ 的长按已定为填入变量）。题库答案里 ∛ 为 0%（Recon），学生仍可以输入 ^(1/3)。log▫ 放到 ln 的 alt，|▫| 放到 ( 的 alt。
- **[F]** MathLive 默认把 alt 小字画在键的右上角（`<span class="MLK__shift">`，`mathlive.mjs:28364`），但在 `max-width: 414px` 时**隐藏**它（`mathlive.mjs:14393`），也就是手机上默认看不到。本站要覆盖这条规则；小字能否看清正是 T1 样机要回答的问题。
- **[I]**（第 7 轮）G21、G22 的依据见 R10。
- **[I]** 新增了两个组件（⇧ 键、长按气泡），按 `review-workflow.md` 需要做**完整审核**，不能只做常规审核。

- **[I]**（第 3 轮后补）⇧ 改放键盘格子第 1 行第 9 列，直接用 MathLive 的 `[shift]` 键，上一条 “自己注入、自己重绘” 的 [U] 不再存在。顶栏只剩本站按钮：Hint?、Skip 注入到左侧空着的 `.left`，收起键盘留在右侧 `.ML__edit-toolbar`。

### R10. “无法判定” 的两类原因（为 G21、G22 核实）

- **[F]** 无效输入（`status: "invalid"`，不算答错）的原因都与学生的输入有关：“Enter an answer first.”、“Check the expression and its brackets.”、“Use only x and supported functions.”、“Check the expression spacing.”、“Enter a single expression.”、“Complete every answer field.”、表达式或数字太大等（`src/grading.ts:29-73、123、130`）。
- **[F]** 无法判定（`status: "inconclusive"`）的原因都是判分器的限制，提示学生换一种等价写法：“We could not verify this form reliably. Try an equivalent expression.”、“Not enough valid comparison points…”、“This form may add a domain restriction…”、“This calculation took too long…”、“The checker could not start…”（`src/grading.ts:186-225`、`src/grader-client.ts:18-52`、`src/grading.worker.ts:13`）。
- **[I]** 所以框内的短标签按两类分开最贴切：前者让学生检查输入，后者让学生换写法；具体原因交给框下小字。
- **[F]** DESIGN.md 的审核清单要求 “反馈框四种判定都有颜色以外的图标”（`review-workflow.md` 第 6 节）；去掉 “i” 后这两类靠文字区分，清单这一条要改为 “颜色以外的区分（符号或文字）”。

## Spec

保持不变：4 行 × 9 个单位；← → 在底行左侧，⌫ 在第 3 行右侧，Check / Next 在右下角；判分、进度、3 秒倒计时；手机上键盘打开时不显示页面下方的按钮栏。
修改：键盘从两页改为一页加 ⇧；键位、符号、字体；Hint? / Skip 在顶栏的位置；所有设备的结果都显示在答题框里。
删除：More 页和 Main / More 页签；立方根键；答题框右侧的叠字结果。

最终键位（主字 / alt；[v] 为本题变量：x、t 或 θ，隐函数题为 x）：

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | sin / arcsin | cos / arccos | tan / arctan | 7 / x | 8 / y | 9 / z | ▫/▫ / ÷ | [v] | ⇧ |
| 2 | sec / sec² | csc / csc² | cot / cot² | 4 / u | 5 / v | 6 / w | · | ▫^▫ / [v]^▫ | √▫ / √[v] |
| 3 | ( / \|▫\| | ) | e^▫ / e | 1 / r | 2 / s | 3 / t | − | ⌫ | ⌫ |
| 4 | ← | → | ln / log▫ | 0 / θ | 0 / θ | . / π | + | Check | Check |

- **S1 单页键位。** 键盘只有上表一页，没有页签；每个功能只出现一次（主字或 alt），变量除外（上表本身就让本题变量既有自己的键、又是某个数字的 alt；L1 复核时补写这条例外，两处用同一个命令）。*Accept:* 单元测试逐格核对 x、t、θ、隐函数四种情形的主字、alt 与宽度；390 截图。*From:* G1、G10→第 2 轮、第 3 轮、R3、R9
- **S2 占位与符号。** 等待输入的位置画空框（▫/▫、▫^▫、e^▫、√▫、log▫、\|▫\|）；乘号为 “·”；分式键单按插入上下分式，alt 为 ÷。答题框里乘号也显示为 “·”。*Accept:* 单元测试核对键帽 LaTeX；浏览器中按 · 后答题框的显示；截图。*From:* 第 2 点、G7、G13、R2、R8
- **S3 alt、⇧ 与长按。**（第 4–6 轮与 T1b 评审后）键上不印 alt。⇧ 点一次只对下一个键生效，连点两次锁定，再点解除；⇧ 三态照 iOS shift 的形状（关 = 灰色功能键底、空心箭头；一次性 = 白底实心箭头；锁定 = 白底实心箭头加下方横线），激活与锁定时箭头为 `--tint` 蓝色（G20）。⇧ 激活时有 alt 的键显示 alt 并变为 `--tint` 色，没有 alt 的键保持原样、不变淡（评审 A2）；三角键显示 sin⁻¹ 等、输入 arcsin 等。长按：只在有 alt 的键上计时（B5），按住 450 ms 且手指移动不超过 8 px 时弹出气泡显示 alt（B1），松手输入 alt 且气泡立即消失，手指移出键外取消（80 ms 淡出）；气泡出现 120 ms，透明度 0→1、缩放 0.95→1、ease-out，减少动态模式下只保留透明度（B4、B8）。键盘上禁用 iOS 的长按菜单与文字选择（B2）。读屏：⇧ 名为 shift，状态用 `aria-pressed`；⇧ 激活时键的读屏名称随 alt 更新（A6）。*Accept:* 浏览器测试（单按、⇧ 一次、⇧ 锁定、长按松手、长按移出、无 alt 键长按等同单按）逐项核对答题框内容；`tests/contrast.test.ts` 覆盖 ⇧ 状态下的蓝色字；iPhone 真机确认长按无系统菜单。*From:* G12→第 2 轮、G15、第 4–6 轮、R7、R9、`reviews/synthesis.md`
- **S4 字体。** 所有数学键帽由 KaTeX 渲染，与题目公式同一套字体；Check / Next 与顶栏按钮用界面字体。*Accept:* 单元测试：数学键都用 `latex` 键帽；浏览器中取 sin、7、+ 键的计算字体为 KaTeX_*。*From:* 第 3 点、G5、R4
- **S5 顶栏。** 左侧 Hint?、Skip，右侧收起键盘；显示规则不变（提示用完隐藏 Hint?，答对后隐藏 Hint? 与 Skip）；这些按钮触控高度 44 px（C-F6）。键盘第一次打开时，顶栏中间显示一行 “Hold a key or tap ⇧ for more”，学生第一次用过长按或 ⇧ 后不再显示，记在本机（G18）。*Accept:* 浏览器测试沿用并更新；截图。*From:* 第 3 轮
- **S6 答题框内的结果（所有设备）。**（第 5 轮更正后）桌面与手机、键盘开与关，一律使用手机现在的框内显示：答题框右侧显示 “✓ Correct” / “! Not quite” / “i Couldn’t check”，边框分别为 `--success` / `--warning`，答对时框底有倒计时线；修改答案后答错类标签清除（现有行为）。页面下方不再显示反馈框和 “Next in 3s” 条（`#feedback` 保留为读屏 live region）；答错说明句不显示（读屏仍读）。桌面上 Next question 按钮保留。无效输入或无法判定时，框内显示 “Check your input”（G22，不加符号），答题框下方另显示一行小字说明具体原因（G19、G21：`--warning` 色、`--t-footnote`，前面不加符号），修改答案后消失；手机键盘打开时这行也保持在键盘上方。*Accept:* e2e：1280 与 390（键盘开 / 关）三种结果的框内文字可见、`#feedback` 与 `#auto-next` 视觉隐藏且 `#feedback` 文字仍含结果；截图。*From:* 第 5 点、G6、第 5 轮、R5
- **S7 文档与版本。** README、`help.html`、DESIGN.md、What's new 1.2.0 与代码一致，并说明长按与 ⇧（G18）；DESIGN.md 6.5 写明 alt 只能靠触摸 / 鼠标长按或 ⇧ 取得，物理键盘直接输入是替代路径（A6）；检索不到 More 页、Main / More、÷ 分式、×、“仅手机在框内显示结果” 等旧说法。*Accept:* 逐段核对与检索。*From:* R6、AGENTS.md

## To Do

- [x] **T0** (—) `.claude/launch.json`（本地、不提交，加入 `.git/info/exclude`）：给浏览器面板启动 Vite 开发服务器（端口 5173）。*Verify:* 预览能打开。*Owner:* Claude - 本地工具
  **结果**：文件已建并加入 exclude；`preview_start` 报告 5173 已被本仓库的 Vite 进程占用（PID 43677，工作目录为本仓库），于是直接在浏览器面板打开该服务器，launch.json 实际没有用上。
- [x] **T1** (S3、S4) 样机关卡：在运行中的页面临时注入 CSS / JS（不改仓库代码），画出带右上角小字 alt 的键盘，KaTeX 字体，390 浅色 / 深色截图保存到本目录，给负责人看。负责人确认小字大小和位置后才开始 T2。*Verify:* 负责人确认。*Owner:* Claude - 设计决定，需要反复调
  **进展（未勾选，等负责人确认）**：样机用 Playwright WebKit、iPhone 13 尺寸（390 宽，3 倍像素）在运行中的页面里注入布局和 CSS 生成，没有改仓库代码。截图：`proto-alt11-light.png`（alt 小字 11 px）、`proto-alt13-light.png`（13 px）、`proto-alt11-dark.png`、`proto-shift-light.png`（⇧ 激活）。样机中发现、实现时要处理的问题：① MathLive 在 ≤414 px 时隐藏小字，需覆盖（R9）；② ← → ⌫ 自带 shift 功能（⇧ 下 ⌫ 变成红色的全部清除，← → 变成跳到开头 / 结尾），要给它们定义与单按相同的 shift 并隐藏小字；③ ⇧ 激活时 arcsin / arccos / arctan 超出 1 格宽，需要缩小字号；④ 空框键（▫/▫、▫^▫、√▫、e^▫）主字缩到 0.72 em 才不与小字重叠；⑤ `·` 需放大到 1.5 em 才看得清。13 px 小字的 arccos 已贴近键边，推荐 11 px。
  **结果**：负责人第 4 轮看过后否决键上印 alt（“太挤了太丑了”），关卡结论为 “不印 alt”，S3 已改。**事后记录**：做样机 2 时 Claude 误删了本目录的 `proto-alt*.png`，随即用同一脚本重新生成（内容同一设计，题目随机不同），T1 引用的文件仍在。
- [x] **T1b** (S1–S6) 三视角快速评审（负责人要求，Sonnet，中等深度，实现前）：以样机 2 截图（`proto2-*.png`）和本文 Spec 为对象，按 `review-workflow.md` 第 4 节的三个视角各派一个只读 Sonnet 代理；共同背景写在 `reviews/context.md`，报告原文存 `reviews/`；Claude 核实、定级、把采纳的结论写回 Spec。*Verify:* 三份报告与综合结论。*Owner:* Sonnet ×3 评审 + Claude 综合 - 负责人指定
  样机 2（`proto2-*.png`，脚本在会话 scratchpad，未改仓库代码）：键上无 alt；⇧ 新图标（空心 / 实心 / 锁定）；⇧ 激活时 sin⁻¹ 等、没有 alt 的键变淡、← → ⌫ 不变；答题框内状态栏（答错、答错后已修改、答对含倒计时线，390 与 1280）。
  **评审结果（T1b 未勾选，等负责人回答 G18、G19）**：三份报告已存 `reviews/`，综合见 `reviews/synthesis.md`。无 P0；P1 四项：发现方式与 y（→ G18）、⇧ 状态下变淡的键对比度约 2.5:1（→ 改为不变淡、有 alt 的键变蓝）、长按阈值 300 ms 太短（→ 450 ms，移动 8 px 取消）、iOS 系统长按菜单（→ 禁用 callout 与 contextmenu，真机确认）。状态栏相关意见因第 5 轮更正作废。采纳的结论已写回 S3、S5、S6、S7 与下面的 T3–T6（本次同步）。
- [x] **T1c** (S3、S6) 样机 3（第 6 轮负责人问 “⇧ 还能怎么区分”，**事后补记**：样机先做了、条目后补）：⇧ 三态 A（iOS 黑色）与 B（iOS 形状、蓝色箭头）对比 `proto3-shift-compare.png`，无法判定小字 `proto3-invalid-caption-light.png`。*Verify:* 负责人回答 G20、G21。*Owner:* Claude - 设计决定
  **结果**：负责人第 7 轮选 B；小字位置确认，去掉 “i”，框内文字另议（G22）。S3、S6 已同步。
Luna 步骤（第 8 轮后重排，负责人要求多交给 Luna max）：

| 步骤 | To Do | 文件 | 依赖 | 运行方式 |
|---|---|---|---|---|
| L1 | T2 | `src/math-keyboard.ts`、`tests/math-keyboard-layout.test.ts` | 无 | 主工作区 |
| L2 | T4、T5 | `src/main.ts`、`src/style.css`（结果显示、顶栏、首次提示部分） | 无 | 并行，另一个 git worktree |
| L3 | T3 | `src/main.ts`、`src/style.css`（长按、⇧ 样式部分） | L1、L2 合并后 | 主工作区 |
| L4 | T6 | `tests/*.spec.ts`、`tests/contrast.test.ts`、`scripts/design-capture.ts` | L3 合并后 | 主工作区 |

每一步回来后由 Claude 复核（T7 的做法，逐步进行）并在浏览器里验证，再提交；Playwright 与截图由 Claude 运行（Codex 沙箱不能开端口）。

- [x] **T2** (S1–S4) `src/math-keyboard.ts`：单页布局、`shift` alt 定义、`[shift]` 键、空框键帽、KaTeX 键帽、读屏名称（含 alt）；同时改写 `tests/math-keyboard-layout.test.ts`。*Verify:* 单元测试；Claude 在浏览器看 390 截图。*Owner:* Luna max（L1）- Spec 已定，键位与接口在步骤说明里写死，文件集独立
  **结果**：Luna 报告 tsc 通过、布局测试 29 项、全部单元测试 355 项通过。Claude 复核：读 diff；发现 Luna 为通过 “命令不重复” 测试，让数字 alt 的字母用 `insert`、变量键用 `typedText`（功能相同、写法不同，属于绕过测试）。Claude 改为两处同一命令，并在测试里明确写出 “变量除外” 的例外（S1、DESIGN.md 6.1 规则 4 同步补写）；重跑 tsc 与全部单元测试 355 项通过。WebKit 390 截图 `l1-390-normal.png`、`l1-390-shift.png`：一页 4×9、⇧ 下各键换成 alt、← → ⌫ Check 不变，无页面错误。留给 L3 的样式：⇧ 三个图标同时显示、函数名字号偏小（`small` 类）、`·` 太小、空框键大小。
- [ ] **T3** (S3) `src/main.ts`、`src/style.css`：长按（只对有 alt 的键；450 ms、移动 8 px 取消；到时设一次性 shift 并弹气泡，气泡动效与减少动态）、⇧ 三态样式（iOS 形状）、⇧ 状态下 alt 字变蓝、iOS 长按菜单与选择的禁用、⇧ 的 `aria-pressed` 与 alt 读屏名称、覆盖 MathLive 对 ← → ⌫ 的 shift 功能。*Verify:* Claude 在浏览器里逐项试（WebKit 390）；T6 浏览器测试。*Owner:* Luna max（L3）- 负责人要求多委派；Claude 在步骤说明里写明借用 MathLive shift 的机制与取消时必须复位 `shiftPressCount`，并亲自做浏览器验证
- [ ] **T4** (S5) `src/main.ts`、`src/style.css`：Hint?、Skip 注入顶栏左侧，收起留右侧，触控高度 44 px；首次提示（本机记录是否已用过长按 / ⇧）。*Verify:* 截图；T6。*Owner:* Luna max（L2）
- [ ] **T5** (S2、S6) `src/main.ts`、`src/style.css`：把框内显示（右侧文字、边框颜色、倒计时线）从 `@media (max-width: 700px)` 的 `.keyboard-open` 规则移出，对所有情况生效；`#feedback`、`#auto-next` 在所有情况下视觉隐藏；无效 / 无法判定的框内 “Check your input”（G22）与框下小字（G19、G21），小字纳入 `keepAnswerVisible`；核实答题框乘号显示为 “·”。（第 5 轮更正：不做框底状态栏）*Verify:* Claude 看 1280、390 键盘开 / 关截图，核对读屏 live region 与焦点；T6。*Owner:* Luna max（L2）- 与 T4 同一步
- [ ] **T6** (S1–S6) 测试：`tests/math-keyboard-layout.test.ts` 改为单页布局与 alt；`tests/math-keyboard.spec.ts`、`tests/app.spec.ts` 中 More 页、页签行、框内结果相关的测试改写；新增 ⇧ / 长按、框内结果（所有设备）、无法判定小字、首次提示的浏览器测试；`tests/contrast.test.ts` 加 ⇧ 状态的蓝色字。*Verify:* T7。*Owner:* Luna max - 按本文 Spec 改写测试，范围限定在 `tests/`，与 T2–T5 的文件不重叠（Playwright 由 Claude 运行）；另把 `scripts/design-capture.ts` 的 “键盘第二页” 改为 ⇧ 一次性、⇧ 锁定、长按气泡三个状态（L4）
- [ ] **T7** (S1–S6) 复核 T6：读 diff；运行 `npm test`、`npm run test:math`、`npm run build`、`npm run test:e2e`；新测试放到旧代码上确认失败；检查没有被放宽的断言。*Owner:* Claude - Luna 步骤之后的复核

- [x] **T8** (—) `~/.claude/skills/grsta/SKILL.md`（全局配置，负责人第 7 轮在本任务中提出）：写明每一轮 Grill（包括回头追问、中途新需求、设计评审）结束时都要先同步 Research、Spec、To Do，再做别的；只记在 Grill 表或旁边文件里的决定算作没有记录；新需求和设计评审都要走一遍 G-R-S-T。*Verify:* 读改后的段落；不与原有规则矛盾。*Owner:* Claude - 指令文件不委派
  **结果**：在 “The document” 一节新增 “Every round re-syncs R-S-T” 一条（每轮 Grill、回头追问、中途新需求、设计评审之后先同步 R、S、T 与 `phase`；只记在 Grill 表或旁边文件里的决定算没有记录；新需求和评审各走一遍 G-R-S-T）；Grill 第 6 步的 loop-back 说明指向这一条。与原有 “Before each edit…”、“New findings… before the related fix” 两条一致，是它们在多轮讨论时的具体要求。

Project obligations:
- [ ] **P1** README 与 `help.html` 同步：applies — README 第 36、38 段，`help.html` 的 Correct、Not quite 与 Typing formulas。*Owner:* Claude（文档不委派）
- [ ] **P2** 版本与 What's new：applies，不提升版本（D1）— 改写 `src/whats-new.ts` 的 1.2.0 条目（单页键盘、⇧ 与长按、框内结果）。*Owner:* Claude
- [ ] **P3** DESIGN.md：applies — 5.2 / 5.3（框内显示对所有设备生效、无效 / 无法判定的短标签与框下小字）、第 9 节文案；`review-workflow.md` 第 6 节 “颜色以外的图标” 改为 “颜色以外的区分（符号或文字）”（R10）、6.1（单页布局表、规则改写，D8）、6.3（字体、alt 小字、⇧、气泡）、6.4（读屏名称）、6.5（长按借用 shift 的注意事项）。*Owner:* Claude
  **进展（P1–P3，未勾选）**：Luna 跑 L1、L2 期间，Claude 按最终 Spec 起草了 README 第 36、38 段、`help.html` 的结果说明与 Typing formulas、`src/whats-new.ts` 1.2.0 条目（4 条，What's new 单元测试 6 项通过；日期在发布时更新）、DESIGN.md 5.3、6.1–6.5、7、8 与 `review-workflow.md` 的清单。实现完成后逐条对照代码核对（尤其气泡时长、44 px 顶栏是否增加键盘高度、`w30` 是否删除），再勾选。
- [ ] **P4** 设计审核：applies，**完整审核**（新增 ⇧ 键与长按气泡两个组件，R9）— 按 `review-workflow.md` 运行 `npm run design:capture` 并调用三套评审技能；P0 / P1 清零，结论写进本文。*Owner:* Claude（截图评审可交给 Sonnet 只读代理，设计决定由 Claude 做）
- [ ] **P5** iPhone 真机确认：applies — 键盘排布、长按（含没有系统菜单）、⇧ 三态、首次提示。*Owner:* 负责人
- [ ] **P6** 部署与线上核对：applies — 重新部署预览 → 负责人 iPhone 确认 → 合并 `main` → 部署 → 确认线上 `/` 与 `/help` 为新版（接续 `2026-09-26-keyboard-followups` 的 F-8）。*Owner:* Claude + 负责人

## Acceptance

| Spec | To Do | Evidence | Result |
|---|---|---|---|
| S1 | T2、T6、T7 | | |
| S2 | T2、T5、T6 | | |
| S3 | T1、T3、T6、P5 | | |
| S4 | T1、T2、T6 | | |
| S5 | T4、T6 | | |
| S6 | T5、T6、T7 | | |
| S7 | P1–P3 | | |

Open / deferred / owner checks：R5 的 [P]（手机键盘打开时看不到答错说明句）由 S6 一并解决；P5 iPhone 确认。
